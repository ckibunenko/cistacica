import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import { updateIncidentAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { INCIDENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminIncidentDetailPage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const incident = await prisma.incidentReport.findUnique({
    where: { id: params.id },
    include: {
      booking: {
        include: {
          customer: { select: { name: true, email: true } },
          cleaner: { select: { name: true, email: true } }
        }
      },
      reportedBy: { select: { name: true, role: true } }
    }
  });
  if (!incident) notFound();

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">{incident.booking.bookingCode}</p>
          <h1 className="text-3xl font-black text-ink">{incident.type}</h1>
          <p className="mt-1 text-muted">
            Prijavio/la {incident.reportedBy.name} - {formatDateTime(incident.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={incident.status} />
          <StatusBadge value={incident.severity} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-6">
          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Opis</h2>
            <p className="mt-3 leading-7 text-muted">{incident.description}</p>
            {incident.resolutionNote ? (
              <p className="mt-4 rounded-md bg-leaf px-3 py-2 text-sm text-brand">{incident.resolutionNote}</p>
            ) : null}
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Rezervacija</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Korisnik" value={`${incident.booking.customer.name} (${incident.booking.customer.email ?? "bez emaila"})`} />
              <Info label="Pružalac" value={incident.booking.cleaner ? `${incident.booking.cleaner.name} (${incident.booking.cleaner.email ?? "bez emaila"})` : "Nije dodeljen"} />
              <Info label="Status" value={incident.booking.status} />
              <Info label="Plaćanje" value={incident.booking.paymentStatus} />
              <Info label="Ukupno" value={formatRsd(incident.booking.totalPriceRsd)} />
              <Info label="Refundacija" value={incident.refundAmountRsd ? formatRsd(incident.refundAmountRsd) : "nema"} />
            </dl>
            <Link href={`/admin/bookings/${incident.bookingId}`} className="button-secondary mt-4">
              Otvori rezervaciju
            </Link>
          </div>
        </section>

        <aside className="panel h-fit p-5">
          <h2 className="text-lg font-black text-ink">Obrada</h2>
          <form action={updateIncidentAction} className="mt-4 grid gap-3">
            <input type="hidden" name="incidentId" value={incident.id} />
            <label className="grid gap-1">
              <span className="label">Status</span>
              <select className="field" name="status" defaultValue={incident.status}>
                {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Refundacija RSD</span>
              <input className="field" name="refundAmountRsd" type="number" min={0} defaultValue={incident.refundAmountRsd ?? 0} />
            </label>
            <label className="grid gap-1">
              <span className="label">Napomena rešenja</span>
              <textarea className="field min-h-28" name="resolutionNote" defaultValue={incident.resolutionNote ?? ""} />
            </label>
            <SubmitButton>Sačuvaj incident</SubmitButton>
          </form>
        </aside>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
