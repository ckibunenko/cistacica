import { notFound } from "next/navigation";
import { cleanerBookingDecisionAction } from "@/lib/actions/cleaner";
import { sendBookingMessageAction } from "@/lib/actions/booking";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { canAccessBooking, canCleanerSeeAddress } from "@/lib/services/access-control";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function CleanerBookingDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("CLEANER");
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      serviceType: true,
      customer: { select: { name: true } },
      addOns: { include: { addOn: true } },
      messages: { include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
      reviews: true
    }
  });
  if (!booking || !canAccessBooking(user, booking)) notFound();
  const showAddress = canCleanerSeeAddress(user, booking);

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
        <StatusBadge value={booking.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="grid gap-6">
          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Detalji termina</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Korisnik" value={booking.customer.name} />
              <Info label="Adresa" value={showAddress ? booking.address : "Vidljivo nakon dodele/potvrde"} />
              <Info label="Kvadratura" value={`${booking.squareMeters} m2`} />
              <Info label="Procena" value={`${booking.estimatedHours} h`} />
              <Info label="Isplata" value={formatRsd(booking.cleanerPayoutRsd)} />
              <Info label="Sredstva" value={booking.suppliesIncluded ? "Korisnik ima svoja sredstva" : "Dogovor kroz poruke"} />
            </dl>
            {booking.customerNotes ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-muted">{booking.customerNotes}</p> : null}
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
              {booking.messages.length ? (
                booking.messages.map((message) => (
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
              <input type="hidden" name="bookingId" value={booking.id} />
              <input className="field" name="body" placeholder="Poruka u okviru termina" required />
              <SubmitButton>Pošalji</SubmitButton>
            </form>
          </div>
        </section>

        <aside className="panel h-fit p-5">
          <h2 className="text-lg font-black text-ink">Akcije</h2>
          <form action={cleanerBookingDecisionAction} className="mt-4 grid gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            {booking.status === "ASSIGNED" ? (
              <>
                <button className="button-primary" name="decision" value="confirm" type="submit">
                  Potvrdi
                </button>
                <button className="button-secondary" name="decision" value="decline" type="submit">
                  Odbij
                </button>
              </>
            ) : null}
            {booking.status === "CONFIRMED" ? (
              <button className="button-primary" name="decision" value="start" type="submit">
                Počni
              </button>
            ) : null}
            {booking.status === "IN_PROGRESS" ? (
              <button className="button-primary" name="decision" value="complete" type="submit">
                Završi
              </button>
            ) : null}
            {!["ASSIGNED", "CONFIRMED", "IN_PROGRESS"].includes(booking.status) ? (
              <p className="text-sm text-muted">Nema dostupnih akcija za trenutni status.</p>
            ) : null}
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
