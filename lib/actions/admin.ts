"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { ACTIVE_BELGRADE_ZONES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/services/audit";
import { paymentProvider } from "@/lib/services/payment";
import {
  notifyCleanerAssigned,
  notifyPaymentMarkedPaid
} from "@/lib/services/notifications";
import {
  adminBookingStatusSchema,
  adminNoteSchema,
  adminPaymentStatusSchema,
  assignCleanerSchema,
  cleanerAdminSchema,
  incidentUpdateSchema,
  suspendUserSchema
} from "@/lib/validators/admin";

export async function assignCleanerAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = assignCleanerSchema.safeParse({
    bookingId: formData.get("bookingId"),
    cleanerId: formData.get("cleanerId")
  });
  if (!parsed.success) return;

  const cleaner = await prisma.user.findFirst({
    where: {
      id: parsed.data.cleanerId,
      role: "CLEANER",
      status: "ACTIVE",
      cleanerProfile: {
        isActive: true,
        verificationStatus: "VERIFIED"
      }
    },
    include: { cleanerProfile: true }
  });
  if (!cleaner) return;

  const booking = await prisma.booking.update({
    where: { id: parsed.data.bookingId },
    data: {
      cleanerId: cleaner.id,
      status: "ASSIGNED"
    }
  });

  await auditLog({
    actorUserId: admin.id,
    action: "CLEANER_ASSIGNED",
    entityType: "Booking",
    entityId: booking.id,
    metadata: { cleanerId: cleaner.id }
  });
  await notifyCleanerAssigned(booking.customerId, booking.bookingCode);
  await notifyCleanerAssigned(cleaner.id, booking.bookingCode);
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}`);
  return;
}

export async function updateBookingStatusAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = adminBookingStatusSchema.safeParse({
    bookingId: formData.get("bookingId"),
    status: formData.get("status")
  });
  if (!parsed.success) return;

  const current = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!current) return;

  await prisma.booking.update({
    where: { id: current.id },
    data: { status: parsed.data.status }
  });
  await auditLog({
    actorUserId: admin.id,
    action: "BOOKING_STATUS_CHANGED",
    entityType: "Booking",
    entityId: current.id,
    metadata: { from: current.status, to: parsed.data.status }
  });
  revalidatePath(`/admin/bookings/${current.id}`);
  revalidatePath("/admin/bookings");
  return;
}

export async function updatePaymentStatusAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = adminPaymentStatusSchema.safeParse({
    bookingId: formData.get("bookingId"),
    paymentStatus: formData.get("paymentStatus")
  });
  if (!parsed.success) return;

  const current = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!current) return;

  if (parsed.data.paymentStatus === "PAID") {
    await paymentProvider.markPaid(current.bookingCode);
  }

  await prisma.booking.update({
    where: { id: current.id },
    data: { paymentStatus: parsed.data.paymentStatus }
  });
  await auditLog({
    actorUserId: admin.id,
    action: "PAYMENT_STATUS_CHANGED",
    entityType: "Booking",
    entityId: current.id,
    metadata: { from: current.paymentStatus, to: parsed.data.paymentStatus }
  });
  if (parsed.data.paymentStatus === "PAID") {
    await notifyPaymentMarkedPaid(current.customerId, current.bookingCode);
  }
  revalidatePath(`/admin/bookings/${current.id}`);
  revalidatePath("/admin/bookings");
  return;
}

export async function addAdminNoteAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = adminNoteSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    note: formData.get("note")
  });
  if (!parsed.success) return;

  await prisma.adminNote.create({
    data: {
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      note: parsed.data.note,
      adminId: admin.id
    }
  });
  await auditLog({
    actorUserId: admin.id,
    action: "ADMIN_NOTE_CREATED",
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId
  });
  revalidatePath(`/admin/bookings/${parsed.data.entityId}`);
  revalidatePath(`/admin/cleaners/${parsed.data.entityId}`);
  revalidatePath(`/admin/customers/${parsed.data.entityId}`);
  return;
}

export async function updateCleanerAdminAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = cleanerAdminSchema.safeParse({
    cleanerProfileId: formData.get("cleanerProfileId"),
    verificationStatus: formData.get("verificationStatus"),
    isActive: formData.get("isActive") === "true",
    internalRiskNote: formData.get("internalRiskNote"),
    zones: formData.getAll("zones").map(String).filter((zone) => ACTIVE_BELGRADE_ZONES.includes(zone))
  });
  if (!parsed.success) return;

  const profile = await prisma.cleanerProfile.update({
    where: { id: parsed.data.cleanerProfileId },
    data: {
      verificationStatus: parsed.data.verificationStatus,
      isActive: parsed.data.isActive,
      internalRiskNote: parsed.data.internalRiskNote || null,
      user: {
        update: {
          status: parsed.data.verificationStatus === "REJECTED" ? "SUSPENDED" : "ACTIVE"
        }
      }
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
  await auditLog({
    actorUserId: admin.id,
    action: parsed.data.verificationStatus === "VERIFIED" ? "CLEANER_VERIFIED" : "CLEANER_REVIEW_UPDATED",
    entityType: "CleanerProfile",
    entityId: profile.id,
    metadata: { verificationStatus: parsed.data.verificationStatus, isActive: parsed.data.isActive }
  });
  revalidatePath("/admin/cleaners");
  revalidatePath(`/admin/cleaners/${profile.id}`);
  return;
}

export async function updateIncidentAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = incidentUpdateSchema.safeParse({
    incidentId: formData.get("incidentId"),
    status: formData.get("status"),
    resolutionNote: formData.get("resolutionNote"),
    refundAmountRsd: formData.get("refundAmountRsd") || undefined
  });
  if (!parsed.success) return;

  const incident = await prisma.incidentReport.update({
    where: { id: parsed.data.incidentId },
    data: {
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote || null,
      refundAmountRsd: parsed.data.refundAmountRsd ?? null
    },
    include: { booking: true }
  });
  if (parsed.data.status === "IN_REVIEW") {
    await prisma.booking.update({
      where: { id: incident.bookingId },
      data: { status: "DISPUTED" }
    });
  }
  await auditLog({
    actorUserId: admin.id,
    action: "INCIDENT_STATUS_CHANGED",
    entityType: "IncidentReport",
    entityId: incident.id,
    metadata: { status: parsed.data.status, refundAmountRsd: parsed.data.refundAmountRsd }
  });
  revalidatePath("/admin/incidents");
  revalidatePath(`/admin/incidents/${incident.id}`);
  revalidatePath(`/admin/bookings/${incident.bookingId}`);
  return;
}

export async function suspendUserAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = suspendUserSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status")
  });
  if (!parsed.success) return;

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status }
  });
  await auditLog({
    actorUserId: admin.id,
    action: "USER_STATUS_CHANGED",
    entityType: "User",
    entityId: user.id,
    metadata: { status: user.status }
  });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${user.id}`);
  return;
}
