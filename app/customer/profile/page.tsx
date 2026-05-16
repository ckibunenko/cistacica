import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { updateCustomerProfileAction } from "@/lib/actions/profile";
import { requireRole } from "@/lib/auth";
import { BELGRADE_ZONES, RECURRENCE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage() {
  const user = await requireRole("CUSTOMER");
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });

  const [fallbackFirstName, ...fallbackLastNameParts] = (profile?.user.name ?? user.name).split(" ");
  const firstName = profile?.user.firstName || fallbackFirstName || "";
  const lastName = profile?.user.lastName || fallbackLastNameParts.join(" ") || "";

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Moj profil</h1>
          <p className="mt-1 text-muted">Podaci za zahtev, pristup stanu i preferirani termini.</p>
        </div>
        <Link href="/customer" className="button-secondary">
          Nazad na panel
        </Link>
      </div>

      <form action={updateCustomerProfileAction} className="panel grid gap-6 p-5 sm:p-6">
        <section>
          <h2 className="text-xl font-black text-ink">Osnovni podaci</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label">Ime</span>
              <input className="field" name="firstName" defaultValue={firstName} required />
            </label>
            <label className="grid gap-1">
              <span className="label">Prezime</span>
              <input className="field" name="lastName" defaultValue={lastName} required />
            </label>
            <label className="grid gap-1">
              <span className="label">Email</span>
              <input className="field" name="email" type="email" defaultValue={profile?.user.email ?? ""} required />
            </label>
            <label className="grid gap-1">
              <span className="label">Telefon</span>
              <input className="field" name="phone" type="tel" defaultValue={profile?.user.phone ?? ""} required />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">Dom i pristup</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              <span className="label">Adresa</span>
              <input className="field" name="defaultAddress" defaultValue={profile?.defaultAddress ?? ""} />
            </label>
            <label className="grid gap-1">
              <span className="label">Grad</span>
              <input className="field" name="city" defaultValue={profile?.city ?? "Beograd"} />
            </label>
            <label className="grid gap-1">
              <span className="label">Zona</span>
              <select className="field" name="zone" defaultValue={profile?.zone ?? "Vračar"}>
                {BELGRADE_ZONES.map((zone) => (
                  <option key={zone.name} value={zone.name}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Sprat</span>
              <input className="field" name="floor" defaultValue={profile?.floor ?? ""} />
            </label>
            <label className="grid gap-1">
              <span className="label">Stan</span>
              <input className="field" name="apartment" defaultValue={profile?.apartment ?? ""} />
            </label>
            <label className="grid gap-1">
              <span className="label">Interfon</span>
              <input className="field" name="intercom" defaultValue={profile?.intercom ?? ""} />
            </label>
            <label className="grid gap-1">
              <span className="label">Tip prostora</span>
              <select className="field" name="propertyType" defaultValue={profile?.propertyType ?? "Stan"}>
                <option value="Stan">Stan</option>
                <option value="Kuća">Kuća</option>
                <option value="Lokal">Lokal</option>
                <option value="Drugo">Drugo</option>
              </select>
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className="label">Napomene za pristup</span>
              <textarea className="field min-h-20" name="accessNotes" defaultValue={profile?.accessNotes ?? ""} />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">Preferencije</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label">Učestalost</span>
              <select className="field" name="preferredFrequency" defaultValue={profile?.preferredFrequency ?? "ONE_TIME"}>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Ljubimci</span>
              <select className="field" name="hasPets" defaultValue={String(profile?.hasPets ?? false)}>
                <option value="false">Ne</option>
                <option value="true">Da</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Preferirani termini</span>
              <input className="field" name="preferredTimeWindows" defaultValue={profile?.preferredTimeWindows ?? ""} />
            </label>
            <label className="grid gap-1">
              <span className="label">Napomena o ljubimcima</span>
              <input className="field" name="petNotes" defaultValue={profile?.petNotes ?? ""} />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className="label">Opšte napomene</span>
              <textarea className="field min-h-24" name="notes" defaultValue={profile?.notes ?? ""} />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <SubmitButton>Sačuvaj profil</SubmitButton>
        </div>
      </form>
    </main>
  );
}
