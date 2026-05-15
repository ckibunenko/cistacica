"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auditLog } from "@/lib/services/audit";
import { createSession, destroySession } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/services/access-control";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { Role } from "@/lib/types";

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravni podaci." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Neispravan email ili lozinka." };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "Neispravan email ili lozinka." };
  }

  await createSession(user.id);
  redirect(dashboardPathForRole(user.role as Role));
}

export async function registerAction(_: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role") || "CUSTOMER"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravni podaci." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Nalog sa tim emailom već postoji." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      status: parsed.data.role === "CLEANER" ? "PENDING" : "ACTIVE",
      customerProfile:
        parsed.data.role === "CUSTOMER"
          ? {
              create: {}
            }
          : undefined,
      cleanerProfile:
        parsed.data.role === "CLEANER"
          ? {
              create: {
                verificationStatus: "PENDING",
                isActive: false
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
    metadata: { role: user.role }
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
