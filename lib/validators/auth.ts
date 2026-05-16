import { z } from "zod";

export const emailSchema = z.string().email("Unesite ispravan email.").trim().toLowerCase();
export const optionalEmailSchema = z
  .union([emailSchema, z.literal("")])
  .optional()
  .transform((value) => value || undefined);

export const phoneSchema = z
  .string()
  .min(6, "Unesite broj telefona.")
  .max(40, "Broj telefona je predugačak.");

export const passwordSchema = z
  .string()
  .min(8, "Lozinka mora imati najmanje 8 karaktera.")
  .regex(/[A-Z]/, "Lozinka mora imati bar jedno veliko slovo.")
  .regex(/[0-9]/, "Lozinka mora imati bar jedan broj.");

export const loginSchema = z
  .object({
    loginMethod: z.enum(["email", "phone"]).default("email"),
    email: z.union([emailSchema, z.literal("")]).optional(),
    phone: phoneSchema.optional().or(z.literal("")),
    password: z.string().min(1, "Unesite lozinku.")
  })
  .superRefine((data, ctx) => {
    if (data.loginMethod === "email" && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Unesite email."
      });
    }
    if (data.loginMethod === "phone" && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Unesite telefon."
      });
    }
  });

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "Unesite ime.").max(80),
    lastName: z.string().min(2, "Unesite prezime.").max(80),
    email: optionalEmailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    role: z.enum(["CUSTOMER", "CLEANER"]).default("CUSTOMER")
  })
  .superRefine((data, ctx) => {
    if (data.role === "CUSTOMER" && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email je obavezan za korisnički nalog."
      });
    }
  });
