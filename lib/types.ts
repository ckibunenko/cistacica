export const ROLE_VALUES = ["CUSTOMER", "CLEANER", "ADMIN"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const USER_STATUS_VALUES = ["ACTIVE", "SUSPENDED", "PENDING"] as const;
export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export const VERIFICATION_STATUS_VALUES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS_VALUES)[number];

export const BOOKING_STATUS_VALUES = [
  "REQUESTED",
  "PENDING_PAYMENT",
  "PAID",
  "MATCHING",
  "ASSIGNED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "REFUNDED"
] as const;
export type BookingStatus = (typeof BOOKING_STATUS_VALUES)[number];

export const PAYMENT_STATUS_VALUES = ["UNPAID", "MANUAL_PENDING", "PAID", "REFUND_PENDING", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const INCIDENT_TYPE_VALUES = [
  "LATE_ARRIVAL",
  "NO_SHOW",
  "QUALITY_ISSUE",
  "DAMAGE",
  "SAFETY",
  "PAYMENT",
  "OTHER"
] as const;
export type IncidentType = (typeof INCIDENT_TYPE_VALUES)[number];

export const INCIDENT_SEVERITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITY_VALUES)[number];

export const INCIDENT_STATUS_VALUES = ["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUS_VALUES)[number];

export const RECURRENCE_VALUES = ["ONE_TIME", "WEEKLY", "EVERY_TWO_WEEKS", "MONTHLY"] as const;
export type RecurrencePreference = (typeof RECURRENCE_VALUES)[number];
