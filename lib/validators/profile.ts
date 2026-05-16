import { z } from "zod";

export const customerProfileSchema = z.object({
  firstName: z.string().min(2, "Unesite ime.").max(80),
  lastName: z.string().min(2, "Unesite prezime.").max(80),
  email: z.string().email("Unesite ispravan email."),
  phone: z.string().min(6, "Unesite telefon.").max(40),
  defaultAddress: z.string().min(3, "Unesite adresu.").max(180).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  zone: z.string().max(80).optional().or(z.literal("")),
  floor: z.string().max(30).optional().or(z.literal("")),
  apartment: z.string().max(30).optional().or(z.literal("")),
  intercom: z.string().max(80).optional().or(z.literal("")),
  propertyType: z.string().max(80).optional().or(z.literal("")),
  hasPets: z.coerce.boolean().default(false),
  petNotes: z.string().max(400).optional().or(z.literal("")),
  preferredTimeWindows: z.string().max(400).optional().or(z.literal("")),
  preferredFrequency: z.enum(["ONE_TIME", "WEEKLY", "EVERY_TWO_WEEKS", "MONTHLY"]).default("ONE_TIME"),
  accessNotes: z.string().max(700).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal(""))
});

export const cleanerOperationalProfileSchema = z.object({
  firstName: z.string().min(2, "Unesite ime.").max(80),
  lastName: z.string().min(2, "Unesite prezime.").max(80),
  email: z.string().email("Unesite ispravan email.").optional().or(z.literal("")),
  phone: z.string().min(6, "Unesite telefon.").max(40),
  bio: z.string().max(1200).optional().or(z.literal("")),
  city: z.string().max(80).default("Beograd"),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  offeredServices: z.array(z.string()).default([]),
  bringsSupplies: z.coerce.boolean().default(false),
  bringsEquipment: z.coerce.boolean().default(false),
  equipmentNote: z.string().max(700).optional().or(z.literal("")),
  minHours: z.coerce.number().int().min(1).max(12).default(3),
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
