import type { BookingStatus } from "@/lib/types";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ["PENDING_PAYMENT", "MATCHING", "ASSIGNED", "CANCELLED", "DISPUTED"],
  PENDING_PAYMENT: ["PAID", "MATCHING", "CANCELLED", "DISPUTED"],
  PAID: ["MATCHING", "ASSIGNED", "CANCELLED", "DISPUTED", "REFUNDED"],
  MATCHING: ["ASSIGNED", "CANCELLED", "DISPUTED"],
  ASSIGNED: ["CONFIRMED", "MATCHING", "CANCELLED", "DISPUTED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  COMPLETED: ["DISPUTED"],
  CANCELLED: ["REFUNDED"],
  DISPUTED: ["REFUNDED", "COMPLETED", "CANCELLED"],
  REFUNDED: []
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return from === to || ALLOWED_TRANSITIONS[from]?.includes(to) === true;
}
