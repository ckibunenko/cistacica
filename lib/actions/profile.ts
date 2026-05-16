"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/services/audit";
import { customerProfileSchema } from "@/lib/validators/profile";

export async function updateCustomerProfileAction(formData: FormData) {
  const actor = await requireRole("CUSTOMER");
  const parsed = customerProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: normalizePhone(formData.get("phone")),
    defaultAddress: formData.get("defaultAddress"),
    city: formData.get("city"),
    zone: formData.get("zone"),
    floor: formData.get("floor"),
    apartment: formData.get("apartment"),
    intercom: formData.get("intercom"),
    propertyType: formData.get("propertyType"),
    hasPets: formData.get("hasPets") === "true",
    petNotes: formData.get("petNotes"),
    preferredTimeWindows: formData.get("preferredTimeWindows"),
    preferredFrequency: formData.get("preferredFrequency") || "ONE_TIME",
    accessNotes: formData.get("accessNotes"),
    notes: formData.get("notes")
  });

  if (!parsed.success) return;

  const [emailOwner, phoneOwner] = await Promise.all([
    prisma.user.findUnique({ where: { email: parsed.data.email } }),
    prisma.user.findUnique({ where: { phone: parsed.data.phone } })
  ]);

  if ((emailOwner && emailOwner.id !== actor.id) || (phoneOwner && phoneOwner.id !== actor.id)) {
    return;
  }

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  await prisma.user.update({
    where: { id: actor.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      name,
      email: parsed.data.email,
      phone: parsed.data.phone
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: actor.id },
    create: {
      userId: actor.id,
      defaultAddress: parsed.data.defaultAddress || null,
      city: parsed.data.city || null,
      zone: parsed.data.zone || null,
      floor: parsed.data.floor || null,
      apartment: parsed.data.apartment || null,
      intercom: parsed.data.intercom || null,
      propertyType: parsed.data.propertyType || null,
      hasPets: parsed.data.hasPets,
      petNotes: parsed.data.petNotes || null,
      preferredTimeWindows: parsed.data.preferredTimeWindows || null,
      preferredFrequency: parsed.data.preferredFrequency,
      accessNotes: parsed.data.accessNotes || null,
      notes: parsed.data.notes || null
    },
    update: {
      defaultAddress: parsed.data.defaultAddress || null,
      city: parsed.data.city || null,
      zone: parsed.data.zone || null,
      floor: parsed.data.floor || null,
      apartment: parsed.data.apartment || null,
      intercom: parsed.data.intercom || null,
      propertyType: parsed.data.propertyType || null,
      hasPets: parsed.data.hasPets,
      petNotes: parsed.data.petNotes || null,
      preferredTimeWindows: parsed.data.preferredTimeWindows || null,
      preferredFrequency: parsed.data.preferredFrequency,
      accessNotes: parsed.data.accessNotes || null,
      notes: parsed.data.notes || null
    }
  });

  await auditLog({
    actorUserId: actor.id,
    action: "CUSTOMER_PROFILE_UPDATED",
    entityType: "User",
    entityId: actor.id
  });

  revalidatePath("/customer");
  revalidatePath("/customer/profile");
}
