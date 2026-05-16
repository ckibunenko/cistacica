import { z } from "zod";

export const adminBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum([
    "REQUESTED",
    "PENDING_PAYMENT",
    "PAID",
    "MATCHING",
    "ASSIGNED",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
    "REFUNDED"
  ])
});

export const adminPaymentStatusSchema = z.object({
  bookingId: z.string().min(1),
  paymentStatus: z.enum(["UNPAID", "MANUAL_PENDING", "PAID", "REFUND_PENDING", "REFUNDED"])
});

export const assignCleanerSchema = z.object({
  bookingId: z.string().min(1),
  cleanerId: z.string().min(1)
});

export const adminNoteSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  note: z.string().min(2).max(2000)
});

export const cleanerAdminSchema = z.object({
  cleanerProfileId: z.string().min(1),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
  isActive: z.coerce.boolean(),
  identityVerified: z.coerce.boolean().default(false),
  phoneVerified: z.coerce.boolean().default(false),
  backgroundCheckStatus: z.enum(["PENDING", "PASSED", "FAILED"]).default("PENDING"),
  internalRiskNote: z.string().max(2000).optional().or(z.literal("")),
  zones: z.array(z.string()).default([])
});

export const incidentUpdateSchema = z.object({
  incidentId: z.string().min(1),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
  resolutionNote: z.string().max(2000).optional().or(z.literal("")),
  refundAmountRsd: z.coerce.number().int().min(0).optional()
});

export const suspendUserSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"])
});
