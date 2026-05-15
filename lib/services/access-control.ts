import type { Role, UserStatus } from "@/lib/types";

type Actor = { id: string; role: Role; status: UserStatus | string };
type BookingAccess = { customerId: string; cleanerId: string | null };

export function dashboardPathForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "CLEANER") return "/cleaner";
  return "/customer";
}

export function canAccessDashboard(actor: Actor, role: Role) {
  return actor.status === "ACTIVE" && actor.role === role;
}

export function canAccessBooking(actor: Actor, booking: BookingAccess) {
  if (actor.status !== "ACTIVE") return false;
  if (actor.role === "ADMIN") return true;
  if (actor.role === "CUSTOMER") return booking.customerId === actor.id;
  if (actor.role === "CLEANER") return booking.cleanerId === actor.id;
  return false;
}

export function canMessageInBooking(actor: Actor, booking: BookingAccess) {
  return canAccessBooking(actor, booking);
}

export function canCleanerSeeAddress(actor: Actor, booking: BookingAccess & { status?: string }) {
  if (actor.role !== "CLEANER") return false;
  if (booking.cleanerId !== actor.id) return false;
  return ["ASSIGNED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status ?? "");
}
