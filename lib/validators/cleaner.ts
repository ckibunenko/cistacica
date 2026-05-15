import { z } from "zod";

export const cleanerProfileSchema = z.object({
  bio: z.string().max(1200).optional().or(z.literal("")),
  payoutMethodNote: z.string().max(600).optional().or(z.literal("")),
  zones: z.array(z.string()).default([]),
  availability: z
    .array(
      z.object({
        dayOfWeek: z.coerce.number().int().min(1).max(7),
        startTime: z.string().min(1),
        endTime: z.string().min(1)
      })
    )
    .default([])
});

export const cleanerBookingDecisionSchema = z.object({
  bookingId: z.string().min(1),
  decision: z.enum(["confirm", "decline", "start", "complete"])
});
