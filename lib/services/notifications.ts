import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
}) {
  return prisma.notification.create({
    data: params
  });
}

export async function notifyBookingRequested(userId: string, bookingCode: string) {
  return createNotification({
    userId,
    type: "BOOKING_REQUESTED",
    title: "Zahtev je poslat",
    body: `Primili smo zahtev ${bookingCode}. Admin tim proverava detalje i dodeljuje osobu.`
  });
}

export async function notifyCleanerAssigned(userId: string, bookingCode: string) {
  return createNotification({
    userId,
    type: "CLEANER_ASSIGNED",
    title: "Dodeljena je osoba",
    body: `Za termin ${bookingCode} je dodeljen pružalac usluge.`
  });
}

export async function notifyBookingConfirmed(userId: string, bookingCode: string) {
  return createNotification({
    userId,
    type: "BOOKING_CONFIRMED",
    title: "Termin je potvrđen",
    body: `Termin ${bookingCode} je potvrđen.`
  });
}

export async function notifyBookingCompleted(userId: string, bookingCode: string) {
  return createNotification({
    userId,
    type: "BOOKING_COMPLETED",
    title: "Čišćenje je završeno",
    body: `Termin ${bookingCode} je označen kao završen.`
  });
}

export async function notifyIncidentOpened(userId: string, bookingCode: string) {
  return createNotification({
    userId,
    type: "INCIDENT_OPENED",
    title: "Reklamacija je otvorena",
    body: `Otvorena je reklamacija za termin ${bookingCode}.`
  });
}

export async function notifyPaymentMarkedPaid(userId: string, bookingCode: string) {
  return createNotification({
    userId,
    type: "PAYMENT_PAID",
    title: "Uplata je potvrđena",
    body: `Uplata za termin ${bookingCode} je potvrđena.`
  });
}
