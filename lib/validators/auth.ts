import { z } from "zod";

export const emailSchema = z.string().email("Unesite ispravan email.").trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Lozinka mora imati najmanje 8 karaktera.")
  .regex(/[A-Z]/, "Lozinka mora imati bar jedno veliko slovo.")
  .regex(/[0-9]/, "Lozinka mora imati bar jedan broj.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Unesite lozinku.")
});

export const registerSchema = z.object({
  name: z.string().min(2, "Unesite ime i prezime.").max(120),
  email: emailSchema,
  phone: z.string().min(6, "Unesite broj telefona.").max(40).optional().or(z.literal("")),
  password: passwordSchema,
  role: z.enum(["CUSTOMER", "CLEANER"]).default("CUSTOMER")
});
