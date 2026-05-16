"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { dashboardPathForRole } from "@/lib/services/access-control";
import { auditLog } from "@/lib/services/audit";
import type { Role } from "@/lib/types";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    loginMethod: formData.get("loginMethod") || "email",
    email: formData.get("email") ?? "",
    phone: normalizePhone(formData.get("phone")),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravni podaci." };
  }

  const user =
    parsed.data.loginMethod === "phone"
      ? await prisma.user.findUnique({ where: { phone: normalizePhone(parsed.data.phone) } })
      : await prisma.user.findUnique({ where: { email: parsed.data.email || "" } });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Neispravan identifikator ili lozinka." };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "Neispravan identifikator ili lozinka." };
  }

  await createSession(user.id);
  redirect(dashboardPathForRole(user.role as Role));
}

export async function registerAction(_: unknown, formData: FormData) {
  const phone = normalizePhone(formData.get("phone"));
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") ?? "",
    phone,
    password: formData.get("password"),
    role: formData.get("role") || "CUSTOMER"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravni podaci." };
  }

  if (parsed.data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existingEmail) {
      return { error: "Nalog sa tim emailom već postoji." };
    }
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
  if (existingPhone) {
    return { error: "Nalog sa tim telefonom već postoji." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email ?? null,
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      name,
      phone: parsed.data.phone,
      role: parsed.data.role,
      status: parsed.data.role === "CLEANER" ? "PENDING" : "ACTIVE",
      customerProfile:
        parsed.data.role === "CUSTOMER"
          ? {
              create: {
                preferredFrequency: "ONE_TIME"
              }
            }
          : undefined,
      cleanerProfile:
        parsed.data.role === "CLEANER"
          ? {
              create: {
                verificationStatus: "PENDING",
                isActive: false,
                minHours: 3,
                backgroundCheckStatus: "PENDING"
              }
            }
          : undefined
    }
  });

  await auditLog({
    actorUserId: user.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { role: user.role, registration: parsed.data.email ? "email" : "phone" }
  });

  if (user.status === "ACTIVE") {
    await createSession(user.id);
    redirect(dashboardPathForRole(user.role as Role));
  }

  redirect("/login?registered=cleaner");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
