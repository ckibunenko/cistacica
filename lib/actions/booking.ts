"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/services/audit";
import { canAccessBooking, canMessageInBooking } from "@/lib/services/access-control";
import { calculatePrice } from "@/lib/services/pricing";
import {
  notifyBookingCompleted,
  notifyBookingRequested,
  notifyIncidentOpened
} from "@/lib/services/notifications";
import {
  bookingWizardSchema,
  cancelBookingSchema,
  incidentSchema,
  messageSchema,
  reviewSchema
} from "@/lib/validators/booking";

type BookingWizardInput = z.infer<typeof bookingWizardSchema>;

function bookingCode() {
  return `CD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function getOrCreateBookingUser(data: BookingWizardInput) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    if (currentUser.role !== "CUSTOMER") {
      throw new Error("Samo korisnički nalozi mogu kreirati rezervaciju.");
    }
    return currentUser;
  }

  if (data.accountMode === "login") {
    const user = await prisma.user.findUnique({ where: { email: data.loginEmail || "" } });
    if (!user || user.status !== "ACTIVE" || user.role !== "CUSTOMER") {
      throw new Error("Neispravni podaci za prijavu.");
    }
    const ok = await bcrypt.compare(data.loginPassword || "", user.passwordHash);
    if (!ok) throw new Error("Neispravni podaci za prijavu.");
    await createSession(user.id);
    return user;
  }

  if (data.accountMode === "register") {
    const existing = await prisma.user.findUnique({ where: { email: data.registerEmail || "" } });
    if (existing) throw new Error("Nalog sa tim emailom već postoji.");
    const passwordHash = await bcrypt.hash(data.registerPassword || "", 12);
    const user = await prisma.user.create({
      data: {
        name: data.registerName || "Korisnik",
        email: data.registerEmail || "",
        phone: data.registerPhone || null,
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
        customerProfile: {
          create: {
            defaultAddress: data.address,
            city: data.city,
            zone: data.zone
          }
        }
      }
    });
    await auditLog({
      actorUserId: user.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { source: "booking_wizard" }
    });
    await createSession(user.id);
    return user;
  }

  throw new Error("Prijavite se ili napravite nalog da biste poslali zahtev.");
}

export async function createBookingAction(input: unknown) {
  try {
    const data = bookingWizardSchema.parse(input);
    const user = await getOrCreateBookingUser(data);

    const serviceType = await prisma.serviceType.findUnique({
      where: { code: data.serviceCode }
    });
    if (!serviceType || !serviceType.isActive) {
      return { error: "Izabrani tip čišćenja nije dostupan." };
    }

    const addOnCodes = data.addOns.map((addOn) => addOn.code);
    const addOns = await prisma.addOn.findMany({
      where: {
        code: { in: addOnCodes },
        isActive: true
      }
    });
    const selectedAddOns = addOns.map((addOn) => {
      const selected = data.addOns.find((item) => item.code === addOn.code);
      return {
        code: addOn.code,
        priceRsd: addOn.priceRsd,
        quantity: selected?.quantity ?? 1,
        id: addOn.id
      };
    });

    const price = calculatePrice({
      squareMeters: data.squareMeters,
      serviceType,
      addOns: selectedAddOns
    });

    const booking = await prisma.booking.create({
      data: {
        bookingCode: bookingCode(),
        customerId: user.id,
        serviceTypeId: serviceType.id,
        city: data.city,
        zone: data.zone,
        address: data.address,
        squareMeters: data.squareMeters,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        preferredDate: new Date(`${data.preferredDate}T00:00:00`),
        preferredStartTime: data.preferredStartTime,
        estimatedHours: price.estimatedHours,
        customerNotes: data.customerNotes || null,
        accessNotes: data.accessNotes || null,
        suppliesIncluded: data.suppliesIncluded,
        recurrencePreference: data.recurrencePreference,
        requiresAdminConfirmation: price.requiresAdminConfirmation,
        status: "REQUESTED",
        paymentStatus: "UNPAID",
        subtotalRsd: price.subtotalRsd,
        bookingFeeRsd: price.bookingFeeRsd,
        totalPriceRsd: price.totalPriceRsd,
        cleanerPayoutRsd: price.cleanerPayoutRsd,
        platformRevenueRsd: price.platformRevenueRsd,
        addOns: {
          create: selectedAddOns.map((addOn) => ({
            addOnId: addOn.id,
            quantity: addOn.quantity,
            priceRsd: addOn.priceRsd
          }))
        }
      }
    });

    await prisma.customerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        defaultAddress: data.address,
        city: data.city,
        zone: data.zone
      },
      update: {
        defaultAddress: data.address,
        city: data.city,
        zone: data.zone
      }
    });

    await auditLog({
      actorUserId: user.id,
      action: "BOOKING_CREATED",
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingCode: booking.bookingCode, totalPriceRsd: booking.totalPriceRsd }
    });
    await notifyBookingRequested(user.id, booking.bookingCode);
    redirect(`/customer/bookings/${booking.id}`);
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw error;
    return { error: error instanceof Error ? error.message : "Rezervacija nije kreirana." };
  }
}

export async function sendBookingMessageAction(formData: FormData) {
  const actor = await requireUser();
  const parsed = messageSchema.safeParse({
    bookingId: formData.get("bookingId"),
    body: formData.get("body")
  });

  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: { id: true, customerId: true, cleanerId: true }
  });
  if (!booking || !canMessageInBooking(actor, booking)) {
    return;
  }

  await prisma.message.create({
    data: {
      bookingId: booking.id,
      senderId: actor.id,
      body: parsed.data.body
    }
  });
  revalidatePath(`/customer/bookings/${booking.id}`);
  revalidatePath(`/cleaner/bookings/${booking.id}`);
  revalidatePath(`/admin/bookings/${booking.id}`);
  return;
}

export async function cancelBookingAction(formData: FormData) {
  const actor = await requireUser();
  const parsed = cancelBookingSchema.safeParse({
    bookingId: formData.get("bookingId"),
    reason: formData.get("reason")
  });
  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || !canAccessBooking(actor, booking)) return;
  if (["COMPLETED", "REFUNDED"].includes(booking.status)) return;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancellationReason: parsed.data.reason
    }
  });
  await auditLog({
    actorUserId: actor.id,
    action: "BOOKING_STATUS_CHANGED",
    entityType: "Booking",
    entityId: booking.id,
    metadata: { from: booking.status, to: "CANCELLED", reason: parsed.data.reason }
  });
  revalidatePath("/customer");
  revalidatePath(`/customer/bookings/${booking.id}`);
  return;
}

export async function leaveReviewAction(formData: FormData) {
  const actor = await requireUser();
  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment")
  });
  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.customerId !== actor.id || booking.status !== "COMPLETED" || !booking.cleanerId) {
    return;
  }

  await prisma.review.upsert({
    where: {
      bookingId_customerId: {
        bookingId: booking.id,
        customerId: actor.id
      }
    },
    create: {
      bookingId: booking.id,
      customerId: actor.id,
      cleanerId: booking.cleanerId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment || null
    }
  });

  const aggregate = await prisma.review.aggregate({
    where: { cleanerId: booking.cleanerId },
    _avg: { rating: true },
    _count: { rating: true }
  });
  await prisma.cleanerProfile.update({
    where: { userId: booking.cleanerId },
    data: {
      ratingAverage: Number((aggregate._avg.rating ?? 0).toFixed(2)),
      ratingCount: aggregate._count.rating
    }
  });

  revalidatePath(`/customer/bookings/${booking.id}`);
  return;
}

export async function reportIncidentAction(formData: FormData) {
  const actor = await requireUser();
  const parsed = incidentSchema.safeParse({
    bookingId: formData.get("bookingId"),
    type: formData.get("type"),
    severity: formData.get("severity"),
    description: formData.get("description")
  });
  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || !canAccessBooking(actor, booking)) return;

  const incident = await prisma.incidentReport.create({
    data: {
      bookingId: booking.id,
      reportedByUserId: actor.id,
      type: parsed.data.type,
      severity: parsed.data.severity,
      description: parsed.data.description,
      status: "OPEN"
    }
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "DISPUTED" }
  });
  await auditLog({
    actorUserId: actor.id,
    action: "INCIDENT_OPENED",
    entityType: "IncidentReport",
    entityId: incident.id,
    metadata: { bookingId: booking.id, severity: incident.severity }
  });
  await notifyIncidentOpened(booking.customerId, booking.bookingCode);
  revalidatePath(`/customer/bookings/${booking.id}`);
  revalidatePath(`/admin/incidents/${incident.id}`);
  return;
}

export async function customerRecurringPreferenceAction(formData: FormData) {
  const actor = await requireUser();
  const bookingId = String(formData.get("bookingId") ?? "");
  const recurrencePreference = String(formData.get("recurrencePreference") ?? "ONE_TIME") as
    | "ONE_TIME"
    | "WEEKLY"
    | "EVERY_TWO_WEEKS"
    | "MONTHLY";

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerId !== actor.id) return;

  await prisma.booking.update({
    where: { id: booking.id },
    data: { recurrencePreference }
  });

  revalidatePath(`/customer/bookings/${booking.id}`);
  return;
}
