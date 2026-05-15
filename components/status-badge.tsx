import type { BookingStatus, IncidentSeverity, IncidentStatus, PaymentStatus, UserStatus, VerificationStatus } from "@/lib/types";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS, PAYMENT_LABELS, STATUS_LABELS, VERIFICATION_LABELS } from "@/lib/constants";
import { cx } from "@/lib/format";

type BadgeValue = BookingStatus | PaymentStatus | VerificationStatus | IncidentStatus | IncidentSeverity | UserStatus | string;

const styles: Record<string, string> = {
  REQUESTED: "bg-sky text-ink border-sky",
  PENDING_PAYMENT: "bg-amber/20 text-ink border-amber",
  PAID: "bg-leaf text-brand border-leaf",
  MATCHING: "bg-sky text-ink border-sky",
  ASSIGNED: "bg-leaf text-brand border-leaf",
  CONFIRMED: "bg-leaf text-brand border-leaf",
  IN_PROGRESS: "bg-amber/20 text-ink border-amber",
  COMPLETED: "bg-brand text-white border-brand",
  CANCELLED: "bg-gray-100 text-muted border-line",
  DISPUTED: "bg-coral/15 text-coral border-coral/30",
  REFUNDED: "bg-gray-100 text-muted border-line",
  UNPAID: "bg-coral/15 text-coral border-coral/30",
  MANUAL_PENDING: "bg-amber/20 text-ink border-amber",
  REFUND_PENDING: "bg-amber/20 text-ink border-amber",
  VERIFIED: "bg-leaf text-brand border-leaf",
  PENDING: "bg-amber/20 text-ink border-amber",
  REJECTED: "bg-coral/15 text-coral border-coral/30",
  OPEN: "bg-coral/15 text-coral border-coral/30",
  IN_REVIEW: "bg-amber/20 text-ink border-amber",
  RESOLVED: "bg-leaf text-brand border-leaf",
  LOW: "bg-gray-100 text-muted border-line",
  MEDIUM: "bg-amber/20 text-ink border-amber",
  HIGH: "bg-coral/15 text-coral border-coral/30",
  CRITICAL: "bg-coral text-white border-coral",
  ACTIVE: "bg-leaf text-brand border-leaf",
  SUSPENDED: "bg-coral/15 text-coral border-coral/30"
};

export function statusLabel(value: BadgeValue) {
  return (
    STATUS_LABELS[value as BookingStatus] ??
    PAYMENT_LABELS[value as PaymentStatus] ??
    VERIFICATION_LABELS[value as VerificationStatus] ??
    INCIDENT_STATUS_LABELS[value as IncidentStatus] ??
    INCIDENT_SEVERITY_LABELS[value as IncidentSeverity] ??
    (value === "ACTIVE" ? "Aktivan" : value === "SUSPENDED" ? "Suspendovan" : value)
  );
}

export function StatusBadge({ value }: { value: BadgeValue }) {
  return (
    <span className={cx("inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", styles[value] ?? "bg-white text-muted border-line")}>
      {statusLabel(value)}
    </span>
  );
}
