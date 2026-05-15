import Link from "next/link";
import { CheckCircle2, ClipboardCheck, CreditCard, HeartHandshake, ShieldCheck, type LucideIcon } from "lucide-react";
import { ACTIVE_BELGRADE_ZONES, BELGRADE_ZONES, BRAND_NAME } from "@/lib/constants";
import { formatRsd } from "@/lib/format";

const trust = [
  ["Proverene osobe", "Verifikacija, interne beleške i admin kontrola dodele."],
  ["Jasna cena", "Cena je vidljiva pre slanja zahteva, bez direktnog dogovaranja sa strane."],
  ["Podrška i reklamacije", "Incidenti se vode kroz platformu, sa statusom i beleškama."],
  ["Redovni termini", "Nedeljno, na dve nedelje ili mesečno za ručno planiranje."]
];

const steps = [
  "Uneseš adresu i veličinu stana",
  "Izabereš termin i tip čišćenja",
  "Platforma dodeljuje proverenu osobu",
  "Oceniš uslugu nakon završetka"
];

const opsCards: Array<[string, string, LucideIcon]> = [
  ["Status", "Dodela u toku", ClipboardCheck],
  ["Plaćanje", "Ručna provera", CreditCard],
  ["Poverenje", "Verifikovana osoba", ShieldCheck],
  ["Podrška", "Reklamacije kroz platformu", HeartHandshake]
];

export default function HomePage() {
  return (
    <main>
      <section className="container-page grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-brand">
            Beograd pilot: {ACTIVE_BELGRADE_ZONES.join(", ")}
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-normal text-ink sm:text-5xl">
            Provereno čišćenje doma, bez cimanja
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            {BRAND_NAME} povezuje korisnike sa verifikovanim pružaocima usluge u odabranim beogradskim zonama.
            Platforma vodi rezervaciju, dodelu, status plaćanja, reklamacije i ocene.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/book" className="button-primary">
              Zakaži čišćenje
            </Link>
            <Link href="/register" className="button-secondary">
              Prijavi se kao pružalac usluge
            </Link>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-line bg-leaf p-5">
            <p className="text-sm font-semibold text-brand">Operativni pregled</p>
            <p className="mt-1 text-2xl font-black text-ink">Managed marketplace, ne oglasnik</p>
          </div>
          <div className="grid gap-3 p-5">
            {opsCards.map(([label, value, Icon]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-md border border-line bg-white p-3">
                <Icon className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-xs uppercase text-muted">{String(label)}</p>
                  <p className="font-semibold text-ink">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-10">
        <div className="container-page grid gap-4 md:grid-cols-4">
          {trust.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-line p-4">
              <CheckCircle2 className="h-5 w-5 text-brand" />
              <h2 className="mt-3 font-bold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-8 py-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black text-ink">Kako funkcioniše</h2>
          <div className="mt-5 grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-lg border border-line bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="font-semibold text-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-ink">Cena za MVP pilot</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Redovno čišćenje", "od 3h", 1100],
              ["Standardno čišćenje", "od 3h", 1300],
              ["Dubinsko čišćenje", "uskoro", 1600]
            ].map(([name, note, rate]) => (
              <div key={String(name)} className="flex items-center justify-between rounded-lg border border-line bg-white p-4">
                <div>
                  <p className="font-bold text-ink">{name}</p>
                  <p className="text-sm text-muted">{note}</p>
                </div>
                <p className="font-black text-brand">{formatRsd(Number(rate))}/h</p>
              </div>
            ))}
            <p className="text-sm leading-6 text-muted">
              Naknada za rezervaciju je 190 RSD. Posebno zaprljanje ili zahtevi preko 120 m2 mogu tražiti admin potvrdu.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white py-12">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black text-ink">Pokrivene zone</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {BELGRADE_ZONES.map((zone) => (
                <span
                  key={zone.name}
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                    zone.isActive ? "border-leaf bg-leaf text-brand" : "border-line bg-gray-50 text-muted"
                  }`}
                >
                  {zone.name} {zone.isActive ? "" : "uskoro"}
                </span>
              ))}
              <span className="rounded-full border border-line bg-gray-50 px-3 py-1 text-sm font-semibold text-muted">
                Novi Sad uskoro
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-leaf p-6">
            <h2 className="text-2xl font-black text-ink">Radiš kvalitetno i pouzdano?</h2>
            <p className="mt-3 leading-7 text-muted">
              Prijavi se za proveru. U MVP-u admin ručno verifikuje profile, zone i raspoloživost pre dodele poslova.
            </p>
            <Link href="/register" className="button-primary mt-5">
              Prijavi se kao pružalac usluge
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
