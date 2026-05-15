import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminIncidentsPage({ searchParams }: { searchParams: { status?: string; severity?: string } }) {
  await requireRole("ADMIN");
  const where: Prisma.IncidentReportWhereInput = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.severity) where.severity = searchParams.severity;

  const incidents = await prisma.incidentReport.findMany({
    where,
    include: {
      booking: {
        include: {
          customer: { select: { name: true } }
        }
      },
      reportedBy: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Reklamacije</h1>
          <p className="mt-1 text-muted">Incidenti, status obrade i refundacije.</p>
        </div>
        <Link href="/admin" className="button-secondary">
          Admin početna
        </Link>
      </div>

      <form className="panel mb-6 grid gap-3 p-4 sm:grid-cols-3">
        <select className="field" name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">Svi statusi</option>
          {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="field" name="severity" defaultValue={searchParams.severity ?? ""}>
          <option value="">Sve ozbiljnosti</option>
          {Object.entries(INCIDENT_SEVERITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="button-primary" type="submit">
          Filtriraj
        </button>
      </form>

      <section className="panel overflow-hidden">
        {incidents.map((incident) => (
          <Link key={incident.id} href={`/admin/incidents/${incident.id}`} className="block border-b border-line p-4 last:border-b-0 hover:bg-leaf/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand">{incident.booking.bookingCode}</p>
                <h2 className="font-black text-ink">{incident.type}</h2>
                <p className="mt-1 text-sm text-muted">
                  {incident.booking.customer.name} - prijavio/la {incident.reportedBy.name} - {formatDate(incident.createdAt)}
                </p>
                <p className="mt-1 text-sm text-muted">{incident.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={incident.status} />
                <StatusBadge value={incident.severity} />
              </div>
            </div>
          </Link>
        ))}
        {incidents.length === 0 ? <p className="p-5 text-sm text-muted">Nema rezultata.</p> : null}
      </section>
    </main>
  );
}
