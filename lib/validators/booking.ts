import { z } from "zod";
import { ACTIVE_BELGRADE_ZONES, isActiveZone } from "@/lib/constants";

const optionalInt = z
  .union([z.number(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  });

export const bookingWizardSchema = z
  .object({
    city: z.string().min(1),
    zone: z.string().min(1),
    address: z.string().min(5, "Unesite adresu."),
    squareMeters: z.coerce.number().int().min(20).max(240),
    rooms: optionalInt,
    bathrooms: optionalInt,
    suppliesIncluded: z.coerce.boolean().default(false),
    customerNotes: z.string().max(1000).optional().or(z.literal("")),
    accessNotes: z.string().max(1000).optional().or(z.literal("")),
    serviceCode: z.enum(["regular", "standard", "deep"]),
    addOns: z
      .array(
        z.object({
          code: z.string(),
          quantity: z.coerce.number().int().min(1).max(8).default(1)
        })
      )
      .default([]),
    preferredDate: z.string().min(1, "Izaberite datum."),
    preferredStartTime: z.string().min(1, "Izaberite vreme."),
    recurrencePreference: z
      .enum(["ONE_TIME", "WEEKLY", "EVERY_TWO_WEEKS", "MONTHLY"])
      .default("ONE_TIME"),
    accountMode: z.enum(["current", "login", "register"]).default("current"),
    loginEmail: z.string().email().optional().or(z.literal("")),
    loginPassword: z.string().optional().or(z.literal("")),
    registerName: z.string().optional().or(z.literal("")),
    registerEmail: z.string().email().optional().or(z.literal("")),
    registerPhone: z.string().optional().or(z.literal("")),
    registerPassword: z.string().optional().or(z.literal(""))
  })
  .superRefine((data, ctx) => {
    if (!isActiveZone(data.city, data.zone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zone"],
        message:
          data.city === "Novi Sad"
            ? "Novi Sad uskoro. Za sada primamo zahteve samo u aktivnim zonama Beograda."
            : `Zona nije aktivna za MVP. Aktivne zone: ${ACTIVE_BELGRADE_ZONES.join(", ")}.`
      });
    }

    if (data.serviceCode === "deep") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["serviceCode"],
        message: "Dubinsko čišćenje je uskoro dostupno."
      });
    }

    if (data.accountMode === "login" && (!data.loginEmail || !data.loginPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["loginEmail"],
        message: "Unesite email i lozinku za prijavu."
      });
    }

    if (data.accountMode === "register") {
      if (!data.registerName || !data.registerEmail || !data.registerPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["registerEmail"],
          message: "Unesite podatke za registraciju."
        });
      }
      if (data.registerPassword && data.registerPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["registerPassword"],
          message: "Lozinka mora imati najmanje 8 karaktera."
        });
      }
    }
  });

export const messageSchema = z.object({
  bookingId: z.string().min(1),
  body: z.string().min(1, "Poruka ne može biti prazna.").max(1200)
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().min(3, "Unesite razlog.").max(600)
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal(""))
});

export const incidentSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(["LATE_ARRIVAL", "NO_SHOW", "QUALITY_ISSUE", "DAMAGE", "SAFETY", "PAYMENT", "OTHER"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(10, "Opišite problem malo detaljnije.").max(2000)
});
