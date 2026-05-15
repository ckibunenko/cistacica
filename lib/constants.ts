import type {
  BookingStatus,
  IncidentSeverity,
  IncidentStatus,
  PaymentStatus,
  RecurrencePreference,
  Role,
  VerificationStatus
} from "@/lib/types";

export const BRAND_NAME = "CistoDom";

export const ACTIVE_CITY = "Beograd";

export const CITIES = [
  { name: "Beograd", isActive: true, label: "Beograd" },
  { name: "Novi Sad", isActive: false, label: "Novi Sad uskoro" }
] as const;

export const BELGRADE_ZONES = [
  { name: "Vračar", isActive: true },
  { name: "Stari grad", isActive: true },
  { name: "Savski venac", isActive: true },
  { name: "Novi Beograd", isActive: true },
  { name: "Zemun", isActive: false },
  { name: "Voždovac", isActive: false },
  { name: "Palilula", isActive: false },
  { name: "Čukarica", isActive: false }
] as const;

export const ACTIVE_BELGRADE_ZONES: string[] = BELGRADE_ZONES.filter((zone) => zone.isActive).map((zone) => zone.name);

export const STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: "Zahtev",
  PENDING_PAYMENT: "Čeka uplatu",
  PAID: "Plaćeno",
  MATCHING: "Dodela",
  ASSIGNED: "Dodeljeno",
  CONFIRMED: "Potvrđeno",
  IN_PROGRESS: "U toku",
  COMPLETED: "Završeno",
  CANCELLED: "Otkazano",
  DISPUTED: "Reklamacija",
  REFUNDED: "Refundirano"
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Nije plaćeno",
  MANUAL_PENDING: "Ručna provera",
  PAID: "Plaćeno",
  REFUND_PENDING: "Refundacija u toku",
  REFUNDED: "Refundirano"
};

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Korisnik",
  CLEANER: "Pružalac usluge",
  ADMIN: "Admin"
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Na proveri",
  VERIFIED: "Verifikovan",
  REJECTED: "Odbijen"
};

export function verificationLabel(value: string) {
  return VERIFICATION_LABELS[value as VerificationStatus] ?? value;
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: "Otvoreno",
  IN_REVIEW: "U obradi",
  RESOLVED: "Rešeno",
  REJECTED: "Odbijeno"
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: "Nisko",
  MEDIUM: "Srednje",
  HIGH: "Visoko",
  CRITICAL: "Kritično"
};

export const RECURRENCE_LABELS: Record<RecurrencePreference, string> = {
  ONE_TIME: "Jednokratno",
  WEEKLY: "Nedeljno",
  EVERY_TWO_WEEKS: "Na dve nedelje",
  MONTHLY: "Mesečno"
};

export function recurrenceLabel(value: string) {
  return RECURRENCE_LABELS[value as RecurrencePreference] ?? value;
}

export function isActiveZone(city: string, zone: string) {
  return city === ACTIVE_CITY && ACTIVE_BELGRADE_ZONES.includes(zone);
}
