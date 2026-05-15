import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRsd } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { recurrenceLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await requireRole("CUSTOMER");
  const [bookings, notifications] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: user.id },
      include: {
        serviceType: true,
        cleaner: { select: { name: true } }
      },
      orderBy: { preferredDate: "desc" }
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const upcoming = bookings.filter((booking) => !["COMPLETED", "CANCELLED", "REFUNDED"].includes(booking.status));
  const past = bookings.filter((booking) => ["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(booking.status));

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Moj panel</h1>
          <p className="mt-1 text-muted">Rezervacije, poruke, reklamacije i ponovljeni termini.</p>
        </div>
        <Link href="/book" className="button-primary">
          Nova rezervacija
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="grid gap-6">
          <BookingSection title="Aktuelni termini" bookings={upcoming} />
          <BookingSection title="Prethodni termini" bookings={past} />
        </section>
        <aside className="panel h-fit p-5">
          <h2 className="text-lg font-black text-ink">Obaveštenja</h2>
          <div className="mt-4 grid gap-3">
            {notifications.length ? (
              notifications.map((notification) => (
                <div key={notification.id} className="rounded-md border border-line bg-white p-3">
                  <p className="font-semibold text-ink">{notification.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{notification.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Nema obaveštenja.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function BookingSection({
  title,
  bookings
}: {
  title: string;
  bookings: Array<{
    id: string;
    bookingCode: string;
    status: string;
    paymentStatus: string;
    preferredDate: Date;
    preferredStartTime: string;
    zone: string;
    totalPriceRsd: number;
    recurrencePreference: string;
    serviceType: { name: string };
    cleaner: { name: string } | null;
  }>;
}) {
  return (
    <section className="panel p-5">
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">
        {bookings.length ? (
          bookings.map((booking) => (
            <Link key={booking.id} href={`/customer/bookings/${booking.id}`} className="rounded-lg border border-line bg-white p-4 transition hover:border-brand">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
                  <h3 className="font-black text-ink">{booking.serviceType.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {booking.zone} - {formatDate(booking.preferredDate)} u {booking.preferredStartTime}
                  </p>
                  <p className="mt-1 text-sm text-muted">Pružalac: {booking.cleaner?.name ?? "Admin dodeljuje"}</p>
                </div>
                <div className="grid justify-items-start gap-2 sm:justify-items-end">
                  <StatusBadge value={booking.status} />
                  <StatusBadge value={booking.paymentStatus} />
                  <p className="text-sm font-bold text-ink">{formatRsd(booking.totalPriceRsd)}</p>
                  <p className="text-xs text-muted">{recurrenceLabel(booking.recurrencePreference)}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-md bg-white p-4 text-sm text-muted">Nema termina u ovoj grupi.</p>
        )}
      </div>
    </section>
  );
}
