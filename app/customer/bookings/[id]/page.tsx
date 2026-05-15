import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import {
  cancelBookingAction,
  customerRecurringPreferenceAction,
  leaveReviewAction,
  reportIncidentAction,
  sendBookingMessageAction
} from "@/lib/actions/booking";
import { requireRole } from "@/lib/auth";
import { RECURRENCE_LABELS, recurrenceLabel } from "@/lib/constants";
import { formatDate, formatDateTime, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { canAccessBooking } from "@/lib/services/access-control";

export const dynamic = "force-dynamic";

export default async function CustomerBookingDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("CUSTOMER");
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      serviceType: true,
      cleaner: { select: { id: true, name: true } },
      addOns: { include: { addOn: true } },
      messages: { include: { sender: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
      incidents: { orderBy: { createdAt: "desc" } },
      reviews: true
    }
  });

  if (!booking || !canAccessBooking(user, booking)) notFound();
  const canReview = booking.status === "COMPLETED" && booking.cleanerId && booking.reviews.length === 0;
  const canCancel = !["COMPLETED", "CANCELLED", "REFUNDED"].includes(booking.status);

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
          <h1 className="text-3xl font-black text-ink">{booking.serviceType.name}</h1>
          <p className="mt-1 text-muted">
            {booking.zone} - {formatDate(booking.preferredDate)} u {booking.preferredStartTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-6">
          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Detalji</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Adresa" value={booking.address} />
              <Info label="Pružalac" value={booking.cleaner?.name ?? "Admin dodeljuje"} />
              <Info label="Kvadratura" value={`${booking.squareMeters} m2`} />
              <Info label="Procena" value={`${booking.estimatedHours} h`} />
              <Info label="Učestalost" value={recurrenceLabel(booking.recurrencePreference)} />
              <Info label="Ukupno" value={formatRsd(booking.totalPriceRsd)} />
            </dl>
            {booking.requiresAdminConfirmation ? (
              <p className="mt-4 rounded-md bg-amber/20 px-3 py-2 text-sm font-medium text-ink">Ovaj zahtev zahteva admin potvrdu zbog kvadrature ili posebnih uslova.</p>
            ) : null}
            {booking.addOns.length ? (
              <div className="mt-4">
                <p className="label">Dodaci</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.addOns.map((item) => (
                    <span key={item.id} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-muted">
                      {item.addOn.name} x {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Messages bookingId={booking.id} messages={booking.messages} />

          <div className="grid gap-6 md:grid-cols-2">
            <form action={customerRecurringPreferenceAction} className="panel grid gap-3 p-5">
              <h2 className="text-lg font-black text-ink">Ponavljanje</h2>
              <input type="hidden" name="bookingId" value={booking.id} />
              <select className="field" name="recurrencePreference" defaultValue={booking.recurrencePreference}>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <SubmitButton variant="secondary">Sačuvaj</SubmitButton>
            </form>

            {canCancel ? (
              <form action={cancelBookingAction} className="panel grid gap-3 p-5">
                <h2 className="text-lg font-black text-ink">Otkazivanje</h2>
                <input type="hidden" name="bookingId" value={booking.id} />
                <textarea className="field min-h-20" name="reason" placeholder="Razlog otkazivanja" required />
                <SubmitButton variant="danger">Otkaži termin</SubmitButton>
              </form>
            ) : null}
          </div>
        </section>

        <aside className="grid h-fit gap-6">
          {canReview ? (
            <form action={leaveReviewAction} className="panel grid gap-3 p-5">
              <h2 className="text-lg font-black text-ink">Oceni uslugu</h2>
              <input type="hidden" name="bookingId" value={booking.id} />
              <select className="field" name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
              <textarea className="field min-h-20" name="comment" placeholder="Komentar" />
              <SubmitButton>Pošalji ocenu</SubmitButton>
            </form>
          ) : null}

          <form action={reportIncidentAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Prijavi problem</h2>
            <input type="hidden" name="bookingId" value={booking.id} />
            <select className="field" name="type" defaultValue="QUALITY_ISSUE">
              <option value="LATE_ARRIVAL">Kašnjenje</option>
              <option value="NO_SHOW">Nedolazak</option>
              <option value="QUALITY_ISSUE">Kvalitet</option>
              <option value="DAMAGE">Šteta</option>
              <option value="SAFETY">Bezbednost</option>
              <option value="PAYMENT">Plaćanje</option>
              <option value="OTHER">Drugo</option>
            </select>
            <select className="field" name="severity" defaultValue="MEDIUM">
              <option value="LOW">Nisko</option>
              <option value="MEDIUM">Srednje</option>
              <option value="HIGH">Visoko</option>
              <option value="CRITICAL">Kritično</option>
            </select>
            <textarea className="field min-h-24" name="description" placeholder="Opišite problem" required />
            <SubmitButton variant="secondary">Otvori reklamaciju</SubmitButton>
          </form>

          <div className="panel p-5">
            <h2 className="text-lg font-black text-ink">Reklamacije</h2>
            <div className="mt-3 grid gap-3">
              {booking.incidents.length ? (
                booking.incidents.map((incident) => (
                  <div key={incident.id} className="rounded-md border border-line bg-white p-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={incident.status} />
                      <StatusBadge value={incident.severity} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{incident.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Nema otvorenih reklamacija.</p>
              )}
            </div>
          </div>
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

function Messages({
  bookingId,
  messages
}: {
  bookingId: string;
  messages: Array<{ id: string; body: string; createdAt: Date; sender: { name: string; role: string } }>;
}) {
  return (
    <div className="panel p-5">
      <h2 className="text-xl font-black text-ink">Poruke</h2>
      <div className="mt-4 grid gap-3">
        {messages.length ? (
          messages.map((message) => (
            <div key={message.id} className="rounded-lg border border-line bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{message.sender.name}</p>
                <p className="text-xs text-muted">{formatDateTime(message.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{message.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Još nema poruka.</p>
        )}
      </div>
      <form action={sendBookingMessageAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input className="field" name="body" placeholder="Napišite poruku vezanu za rezervaciju" required />
        <SubmitButton>Pošalji</SubmitButton>
      </form>
    </div>
  );
}
