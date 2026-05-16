import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import {
  addAdminNoteAction,
  assignCleanerAction,
  updateBookingStatusAction,
  updatePaymentStatusAction
} from "@/lib/actions/admin";
import { sendBookingMessageAction } from "@/lib/actions/booking";
import { requireRole } from "@/lib/auth";
import { PAYMENT_LABELS, recurrenceLabel, STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const [booking, cleaners, notes, auditLogs] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        serviceType: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        cleaner: { select: { id: true, name: true, email: true } },
        addOns: { include: { addOn: true } },
        messages: { include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
        incidents: { orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.user.findMany({
      where: {
        role: "CLEANER",
        status: "ACTIVE",
        cleanerProfile: {
          verificationStatus: "VERIFIED",
          isActive: true
        }
      },
      include: {
        cleanerProfile: { include: { zones: true } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.adminNote.findMany({
      where: { entityType: "Booking", entityId: params.id },
      include: { admin: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.auditLog.findMany({
      where: { entityType: "Booking", entityId: params.id },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  if (!booking) notFound();
  const zoneCleaners = cleaners.filter((cleaner) => cleaner.cleanerProfile?.zones.some((zone) => zone.zone === booking.zone));
  const candidateCleaners = zoneCleaners.length ? zoneCleaners : cleaners;

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
          <h1 className="text-3xl font-black text-ink">{booking.serviceType.name}</h1>
          <p className="mt-1 text-muted">
            {booking.customer.name} - {booking.zone} - {formatDate(booking.preferredDate)} u {booking.preferredStartTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Detalji rezervacije</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Adresa" value={booking.address} />
              <Info label="Korisnik" value={`${booking.customer.name} (${booking.customer.email ?? "bez emaila"})`} />
              <Info label="Telefon korisnika" value={booking.customer.phone ?? "Nije unet"} />
              <Info label="Pružalac" value={booking.cleaner?.name ?? "Nije dodeljen"} />
              <Info label="Kvadratura" value={`${booking.squareMeters} m2`} />
              <Info label="Procena" value={`${booking.estimatedHours} h`} />
              <Info label="Ponavljanje" value={recurrenceLabel(booking.recurrencePreference)} />
              <Info label="Ukupno" value={formatRsd(booking.totalPriceRsd)} />
              <Info label="Isplata" value={formatRsd(booking.cleanerPayoutRsd)} />
              <Info label="Prihod platforme" value={formatRsd(booking.platformRevenueRsd)} />
            </dl>
            {booking.requiresAdminConfirmation ? (
              <p className="mt-4 rounded-md bg-amber/20 px-3 py-2 text-sm font-medium text-ink">Zahteva admin potvrdu.</p>
            ) : null}
            {booking.addOns.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {booking.addOns.map((item) => (
                  <span key={item.id} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-muted">
                    {item.addOn.name} x {item.quantity}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Poruke</h2>
            <div className="mt-4 grid gap-3">
              {booking.messages.map((message) => (
                <div key={message.id} className="rounded-lg border border-line bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{message.sender.name}</p>
                    <p className="text-xs text-muted">{formatDateTime(message.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{message.body}</p>
                </div>
              ))}
              {booking.messages.length === 0 ? <p className="text-sm text-muted">Nema poruka.</p> : null}
            </div>
            <form action={sendBookingMessageAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="bookingId" value={booking.id} />
              <input className="field" name="body" placeholder="Admin poruka u okviru rezervacije" required />
              <SubmitButton>Pošalji</SubmitButton>
            </form>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Timeline title="Reklamacije">
              {booking.incidents.length ? (
                booking.incidents.map((incident) => (
                  <a key={incident.id} href={`/admin/incidents/${incident.id}`} className="block rounded-md border border-line bg-white p-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={incident.status} />
                      <StatusBadge value={incident.severity} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{incident.description}</p>
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted">Nema reklamacija.</p>
              )}
            </Timeline>
            <Timeline title="Audit trail">
              {auditLogs.length ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border border-line bg-white p-3">
                    <p className="font-semibold text-ink">{log.action}</p>
                    <p className="text-xs text-muted">
                      {log.actor?.name ?? "Sistem"} - {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Nema audit zapisa.</p>
              )}
            </Timeline>
          </div>
        </section>

        <aside className="grid h-fit gap-6">
          <form action={assignCleanerAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Dodeli pružaoca</h2>
            <input type="hidden" name="bookingId" value={booking.id} />
            <select className="field" name="cleanerId" defaultValue={booking.cleanerId ?? ""}>
              <option value="">Izaberi</option>
              {candidateCleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name} - {cleaner.cleanerProfile?.ratingAverage.toFixed(1)}
                </option>
              ))}
            </select>
            <SubmitButton>Dodeli</SubmitButton>
          </form>

          <form action={updateBookingStatusAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Status termina</h2>
            <input type="hidden" name="bookingId" value={booking.id} />
            <select className="field" name="status" defaultValue={booking.status}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <SubmitButton variant="secondary">Promeni status</SubmitButton>
          </form>

          <form action={updatePaymentStatusAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Plaćanje</h2>
            <input type="hidden" name="bookingId" value={booking.id} />
            <select className="field" name="paymentStatus" defaultValue={booking.paymentStatus}>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <SubmitButton variant="secondary">Sačuvaj plaćanje</SubmitButton>
          </form>

          <form action={addAdminNoteAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Admin beleška</h2>
            <input type="hidden" name="entityType" value="Booking" />
            <input type="hidden" name="entityId" value={booking.id} />
            <textarea className="field min-h-24" name="note" placeholder="Interna beleška" required />
            <SubmitButton variant="secondary">Dodaj belešku</SubmitButton>
            <div className="grid gap-2">
              {notes.map((note) => (
                <div key={note.id} className="rounded-md border border-line bg-white p-3">
                  <p className="text-sm text-muted">{note.note}</p>
                  <p className="mt-1 text-xs text-muted">{note.admin.name}</p>
                </div>
              ))}
            </div>
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

function Timeline({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}
