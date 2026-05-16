import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import { addAdminNoteAction, updateCleanerAdminAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { ACTIVE_BELGRADE_ZONES, VERIFICATION_LABELS } from "@/lib/constants";
import { formatDate, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCleanerDetailPage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const profile = await prisma.cleanerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, name: true, email: true, phone: true, status: true } },
      zones: true,
      availability: true
    }
  });
  if (!profile) notFound();

  const [notes, bookings] = await Promise.all([
    prisma.adminNote.findMany({
      where: { entityType: "CleanerProfile", entityId: params.id },
      include: { admin: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.booking.findMany({
      where: { cleanerId: profile.user.id },
      include: { customer: { select: { name: true } }, serviceType: true },
      orderBy: { preferredDate: "desc" },
      take: 20
    })
  ]);

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">{profile.user.name}</h1>
          <p className="mt-1 text-muted">
            {profile.user.email ?? "bez emaila"} - {profile.user.phone ?? "bez telefona"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={profile.verificationStatus} />
          <StatusBadge value={profile.user.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="grid h-fit gap-6">
          <form action={updateCleanerAdminAction} className="panel grid gap-4 p-5">
            <h2 className="text-lg font-black text-ink">Uredi proveru</h2>
            <input type="hidden" name="cleanerProfileId" value={profile.id} />
            <label className="grid gap-1">
              <span className="label">Verifikacija</span>
              <select className="field" name="verificationStatus" defaultValue={profile.verificationStatus}>
                {Object.entries(VERIFICATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Aktivan za dodelu</span>
              <select className="field" name="isActive" defaultValue={String(profile.isActive)}>
                <option value="true">Da</option>
                <option value="false">Ne</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Identitet proveren</span>
              <select className="field" name="identityVerified" defaultValue={String(profile.identityVerified)}>
                <option value="true">Da</option>
                <option value="false">Ne</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Telefon proveren</span>
              <select className="field" name="phoneVerified" defaultValue={String(profile.phoneVerified)}>
                <option value="true">Da</option>
                <option value="false">Ne</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Background check</span>
              <select className="field" name="backgroundCheckStatus" defaultValue={profile.backgroundCheckStatus}>
                <option value="PENDING">Na čekanju</option>
                <option value="PASSED">Prošao</option>
                <option value="FAILED">Nije prošao</option>
              </select>
            </label>
            <div>
              <p className="label">Zone</p>
              <div className="mt-2 grid gap-2">
                {ACTIVE_BELGRADE_ZONES.map((zone) => (
                  <label key={zone} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="zones" value={zone} defaultChecked={profile.zones.some((item) => item.zone === zone)} />
                    {zone}
                  </label>
                ))}
              </div>
            </div>
            <label className="grid gap-1">
              <span className="label">Interna risk napomena</span>
              <textarea className="field min-h-24" name="internalRiskNote" defaultValue={profile.internalRiskNote ?? ""} />
            </label>
            <SubmitButton>Sačuvaj</SubmitButton>
          </form>

          <form action={addAdminNoteAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Admin beleške</h2>
            <input type="hidden" name="entityType" value="CleanerProfile" />
            <input type="hidden" name="entityId" value={profile.id} />
            <textarea className="field min-h-20" name="note" required />
            <SubmitButton variant="secondary">Dodaj belešku</SubmitButton>
            {notes.map((note) => (
              <div key={note.id} className="rounded-md border border-line bg-white p-3">
                <p className="text-sm text-muted">{note.note}</p>
                <p className="mt-1 text-xs text-muted">{note.admin.name}</p>
              </div>
            ))}
          </form>
        </aside>

        <section className="grid gap-6">
          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Profil</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Ime" value={profile.user.firstName || "nema"} />
              <Info label="Prezime" value={profile.user.lastName || "nema"} />
              <Info label="Email" value={profile.user.email ?? "nema"} />
              <Info label="Telefon" value={profile.user.phone ?? "nema"} />
              <Info label="Ocena" value={`${profile.ratingAverage.toFixed(1)} (${profile.ratingCount})`} />
              <Info label="Grad" value={profile.city} />
              <Info label="Zone" value={profile.zones.map((zone) => zone.zone).join(", ") || "nema"} />
              <Info label="Usluge" value={profile.offeredServices ?? "nema"} />
              <Info label="Iskustvo" value={profile.yearsExperience === null ? "nema" : `${profile.yearsExperience} god.`} />
              <Info label="Minimum sati" value={`${profile.minHours} h`} />
              <Info label="Donosi sredstva" value={profile.bringsSupplies ? "Da" : "Ne"} />
              <Info label="Donosi opremu" value={profile.bringsEquipment ? "Da" : "Ne"} />
              <Info label="Oprema" value={profile.equipmentNote ?? "nema"} />
              <Info label="Identitet" value={profile.identityVerified ? "Verifikovan" : "Nije verifikovan"} />
              <Info label="Telefon verifikovan" value={profile.phoneVerified ? "Da" : "Ne"} />
              <Info label="Background check" value={profile.backgroundCheckStatus} />
              <Info label="Isplata" value={profile.payoutMethodNote ?? "nema"} />
              <Info label="Interni rizik" value={profile.internalRiskNote ?? "nema"} />
            </dl>
            {profile.bio ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-muted">{profile.bio}</p> : null}
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Termini</h2>
            <div className="mt-4 grid gap-3">
              {bookings.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="rounded-lg border border-line bg-white p-4 hover:border-brand">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
                      <p className="font-black text-ink">{booking.serviceType.name}</p>
                      <p className="text-sm text-muted">
                        {booking.customer.name} - {formatDate(booking.preferredDate)}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:justify-items-end">
                      <StatusBadge value={booking.status} />
                      <p className="text-sm font-bold text-ink">{formatRsd(booking.cleanerPayoutRsd)}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {bookings.length === 0 ? <p className="text-sm text-muted">Nema termina.</p> : null}
            </div>
          </div>
        </section>
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
