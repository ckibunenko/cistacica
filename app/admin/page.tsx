import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    requestedBookings,
    needingAssignment,
    confirmedBookings,
    completedThisMonth,
    openIncidents,
    unpaidBookings,
    revenue,
    payout
  ] = await Promise.all([
    prisma.booking.count({ where: { status: "REQUESTED" } }),
    prisma.booking.count({ where: { cleanerId: null, status: { in: ["REQUESTED", "MATCHING", "PAID"] } } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED", updatedAt: { gte: monthStart } } }),
    prisma.incidentReport.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.booking.count({ where: { paymentStatus: { in: ["UNPAID", "MANUAL_PENDING"] } } }),
    prisma.booking.aggregate({ _sum: { platformRevenueRsd: true }, where: { status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    prisma.booking.aggregate({ _sum: { cleanerPayoutRsd: true }, where: { status: "COMPLETED" } })
  ]);

  return (
    <main className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-ink">Admin operacije</h1>
        <p className="mt-1 text-muted">Dodela, statusi, ručna plaćanja, incidenti i poverenje tržišta.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Zahtevi" value={requestedBookings} />
        <StatCard label="Za dodelu" value={needingAssignment} />
        <StatCard label="Potvrđeno" value={confirmedBookings} />
        <StatCard label="Završeno ovog meseca" value={completedThisMonth} />
        <StatCard label="Otvorene reklamacije" value={openIncidents} />
        <StatCard label="Neplaćeno / provera" value={unpaidBookings} />
        <StatCard label="Prihod platforme" value={revenue._sum.platformRevenueRsd ?? 0} money />
        <StatCard label="Isplate čistačima" value={payout._sum.cleanerPayoutRsd ?? 0} money />
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["/admin/bookings", "Rezervacije", "Filteri, dodela, statusi i plaćanja."],
          ["/admin/cleaners", "Pružaoci usluge", "Verifikacija, zone, rizik i aktivacija."],
          ["/admin/customers", "Korisnici", "Profili, rezervacije i suspenzija."],
          ["/admin/incidents", "Reklamacije", "Obrada, refundacije i sporovi."]
        ].map(([href, title, body]) => (
          <Link key={href} href={href} className="panel p-5 transition hover:border-brand">
            <h2 className="text-xl font-black text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
