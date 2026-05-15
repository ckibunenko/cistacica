import Link from "next/link";
import { cleanerBookingDecisionAction, updateCleanerProfileAction } from "@/lib/actions/cleaner";
import { requireRole } from "@/lib/auth";
import { ACTIVE_BELGRADE_ZONES, verificationLabel } from "@/lib/constants";
import { formatDate, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function CleanerDashboardPage() {
  const user = await requireRole("CLEANER");
  const profile = await prisma.cleanerProfile.findUnique({
    where: { userId: user.id },
    include: {
      zones: true,
      availability: true
    }
  });
  const bookings = await prisma.booking.findMany({
    where: { cleanerId: user.id },
    include: {
      serviceType: true,
      customer: { select: { name: true } }
    },
    orderBy: { preferredDate: "asc" }
  });
  const completedPayout = bookings
    .filter((booking) => booking.status === "COMPLETED")
    .reduce((sum, booking) => sum + booking.cleanerPayoutRsd, 0);

  return (
    <main className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-ink">Panel pružaoca usluge</h1>
        <p className="mt-1 text-muted">Dodeljeni termini, profil, zone, raspoloživost i procena isplate.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="grid h-fit gap-6">
          <div className="panel p-5">
            <h2 className="text-lg font-black text-ink">Status profila</h2>
            <div className="mt-4 grid gap-3">
              <StatusBadge value={profile?.verificationStatus ?? "PENDING"} />
              <p className="text-sm text-muted">
                {profile ? verificationLabel(profile.verificationStatus) : "Profil još nije popunjen."}
              </p>
              <p className="font-semibold text-ink">
                Ocena: {profile?.ratingAverage.toFixed(1) ?? "0.0"} ({profile?.ratingCount ?? 0})
              </p>
              <p className="font-semibold text-ink">Procena isplate: {formatRsd(completedPayout)}</p>
            </div>
          </div>

          <form action={updateCleanerProfileAction} className="panel grid gap-4 p-5">
            <h2 className="text-lg font-black text-ink">Profil i zone</h2>
            <label className="grid gap-1">
              <span className="label">Bio</span>
              <textarea className="field min-h-24" name="bio" defaultValue={profile?.bio ?? ""} />
            </label>
            <div>
              <p className="label">Zone</p>
              <div className="mt-2 grid gap-2">
                {ACTIVE_BELGRADE_ZONES.map((zone) => (
                  <label key={zone} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="zones" value={zone} defaultChecked={profile?.zones.some((item) => item.zone === zone)} />
                    {zone}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Raspoloživost</p>
              <div className="mt-2 grid gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const slot = profile?.availability.find((item) => item.dayOfWeek === day);
                  return (
                    <div key={day} className="grid grid-cols-[42px_1fr_1fr] items-center gap-2">
                      <span className="text-sm font-semibold text-muted">{day}.</span>
                      <input className="field" name={`start-${day}`} type="time" defaultValue={slot?.startTime ?? ""} />
                      <input className="field" name={`end-${day}`} type="time" defaultValue={slot?.endTime ?? ""} />
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="grid gap-1">
              <span className="label">Napomena za isplatu</span>
              <input className="field" name="payoutMethodNote" defaultValue={profile?.payoutMethodNote ?? ""} />
            </label>
            <SubmitButton>Sačuvaj profil</SubmitButton>
          </form>
        </aside>

        <section className="panel p-5">
          <h2 className="text-xl font-black text-ink">Dodeljeni termini</h2>
          <div className="mt-4 grid gap-3">
            {bookings.length ? (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
                      <h3 className="font-black text-ink">{booking.serviceType.name}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {booking.zone} - {formatDate(booking.preferredDate)} u {booking.preferredStartTime}
                      </p>
                      <p className="mt-1 text-sm text-muted">Adresa je vidljiva na detalju dodeljenog termina.</p>
                    </div>
                    <div className="grid gap-2 sm:justify-items-end">
                      <StatusBadge value={booking.status} />
                      <p className="text-sm font-bold text-ink">{formatRsd(booking.cleanerPayoutRsd)}</p>
                      <Link href={`/cleaner/bookings/${booking.id}`} className="button-secondary">
                        Otvori
                      </Link>
                    </div>
                  </div>
                  {["ASSIGNED", "CONFIRMED", "IN_PROGRESS"].includes(booking.status) ? (
                    <form action={cleanerBookingDecisionAction} className="mt-4 flex flex-wrap gap-2">
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
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-md bg-white p-4 text-sm text-muted">Još nema dodeljenih termina.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
