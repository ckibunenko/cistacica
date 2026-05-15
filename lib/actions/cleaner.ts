"use server";

import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/services/audit";
import { notifyBookingCompleted, notifyBookingConfirmed } from "@/lib/services/notifications";
import { cleanerBookingDecisionSchema, cleanerProfileSchema } from "@/lib/validators/cleaner";

export async function updateCleanerProfileAction(formData: FormData) {
  const actor = await requireRole("CLEANER");
  const zones = formData.getAll("zones").map(String);
  const availability = [1, 2, 3, 4, 5, 6, 7]
    .map((day) => ({
      dayOfWeek: day,
      startTime: String(formData.get(`start-${day}`) || ""),
      endTime: String(formData.get(`end-${day}`) || "")
    }))
    .filter((slot) => slot.startTime && slot.endTime);

  const parsed = cleanerProfileSchema.safeParse({
    bio: formData.get("bio"),
    payoutMethodNote: formData.get("payoutMethodNote"),
    zones,
    availability
  });

  if (!parsed.success) return;

  const profile = await prisma.cleanerProfile.upsert({
    where: { userId: actor.id },
    create: {
      userId: actor.id,
      bio: parsed.data.bio || null,
      payoutMethodNote: parsed.data.payoutMethodNote || null,
      verificationStatus: "PENDING",
      isActive: false
    },
    update: {
      bio: parsed.data.bio || null,
      payoutMethodNote: parsed.data.payoutMethodNote || null
    }
  });

  await prisma.cleanerZone.deleteMany({ where: { cleanerId: profile.id } });
  await prisma.cleanerZone.createMany({
    data: parsed.data.zones.map((zone) => ({
      cleanerId: profile.id,
      city: "Beograd",
      zone,
      isActive: true
    }))
  });

  await prisma.cleanerAvailability.deleteMany({ where: { cleanerId: profile.id } });
  await prisma.cleanerAvailability.createMany({
    data: parsed.data.availability.map((slot) => ({
      cleanerId: profile.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: true
    }))
  });

  revalidatePath("/cleaner");
  return;
}

export async function cleanerBookingDecisionAction(formData: FormData) {
  const actor = await requireRole("CLEANER");
  const parsed = cleanerBookingDecisionSchema.safeParse({
    bookingId: formData.get("bookingId"),
    decision: formData.get("decision")
  });

  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.cleanerId !== actor.id) return;

  let nextStatus: BookingStatus = booking.status as BookingStatus;
  const update: { status?: BookingStatus; cleanerId?: string | null } = {};
  if (parsed.data.decision === "confirm") {
    nextStatus = "CONFIRMED";
    update.status = nextStatus;
  }
  if (parsed.data.decision === "decline") {
    nextStatus = "MATCHING";
    update.status = nextStatus;
    update.cleanerId = null;
  }
  if (parsed.data.decision === "start") {
    nextStatus = "IN_PROGRESS";
    update.status = nextStatus;
  }
  if (parsed.data.decision === "complete") {
    nextStatus = "COMPLETED";
    update.status = nextStatus;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: update
  });

  await auditLog({
    actorUserId: actor.id,
    action: "BOOKING_STATUS_CHANGED",
    entityType: "Booking",
    entityId: booking.id,
    metadata: { from: booking.status, to: nextStatus, cleanerAction: parsed.data.decision }
  });

  if (nextStatus === "CONFIRMED") await notifyBookingConfirmed(booking.customerId, booking.bookingCode);
  if (nextStatus === "COMPLETED") await notifyBookingCompleted(booking.customerId, booking.bookingCode);

  revalidatePath("/cleaner");
  revalidatePath(`/cleaner/bookings/${booking.id}`);
  return;
}
