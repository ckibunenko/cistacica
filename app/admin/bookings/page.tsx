import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { BELGRADE_ZONES, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams
}: {
  searchParams: { status?: string; paymentStatus?: string; zone?: string; date?: string };
}) {
  await requireRole("ADMIN");
  const where: Prisma.BookingWhereInput = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.paymentStatus) where.paymentStatus = searchParams.paymentStatus;
  if (searchParams.zone) where.zone = searchParams.zone;
  if (searchParams.date) {
    const start = new Date(`${searchParams.date}T00:00:00`);
    const end = new Date(`${searchParams.date}T23:59:59`);
    where.preferredDate = { gte: start, lte: end };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: { select: { name: true } },
      cleaner: { select: { name: true } },
      serviceType: true
    },
    orderBy: [{ preferredDate: "desc" }, { createdAt: "desc" }]
  });

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Rezervacije</h1>
          <p className="mt-1 text-muted">Operativni pregled svih zahteva i termina.</p>
        </div>
        <Link href="/admin" className="button-secondary">
          Admin početna
        </Link>
      </div>

      <form className="panel mb-6 grid gap-3 p-4 md:grid-cols-5">
        <select className="field" name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">Svi statusi</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="field" name="paymentStatus" defaultValue={searchParams.paymentStatus ?? ""}>
          <option value="">Sva plaćanja</option>
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="field" name="zone" defaultValue={searchParams.zone ?? ""}>
          <option value="">Sve zone</option>
          {BELGRADE_ZONES.map((zone) => (
            <option key={zone.name} value={zone.name}>
              {zone.name}
            </option>
          ))}
        </select>
        <input className="field" name="date" type="date" defaultValue={searchParams.date ?? ""} />
        <button className="button-primary" type="submit">
          Filtriraj
        </button>
      </form>

      <section className="panel overflow-hidden">
        <div className="grid gap-0">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="border-b border-line p-4 transition last:border-b-0 hover:bg-leaf/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
                  <h2 className="font-black text-ink">{booking.serviceType.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {booking.customer.name} - {booking.zone} - {formatDate(booking.preferredDate)} u {booking.preferredStartTime}
                  </p>
                  <p className="mt-1 text-sm text-muted">Pružalac: {booking.cleaner?.name ?? "nije dodeljen"}</p>
                </div>
                <div className="grid gap-2 sm:justify-items-end">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={booking.status} />
                    <StatusBadge value={booking.paymentStatus} />
                  </div>
                  <p className="text-sm font-bold text-ink">{formatRsd(booking.totalPriceRsd)}</p>
                </div>
              </div>
            </Link>
          ))}
          {bookings.length === 0 ? <p className="p-5 text-sm text-muted">Nema rezultata za izabrane filtere.</p> : null}
        </div>
      </section>
    </main>
  );
}
