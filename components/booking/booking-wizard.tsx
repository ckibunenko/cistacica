"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { ACTIVE_BELGRADE_ZONES, BELGRADE_ZONES, CITIES, RECURRENCE_LABELS } from "@/lib/constants";
import { createBookingAction } from "@/lib/actions/booking";
import { calculatePrice } from "@/lib/services/pricing";
import { formatRsd } from "@/lib/format";

type ServiceTypeOption = {
  code: string;
  name: string;
  description: string | null;
  hourlyRateRsd: number;
  minHours: number;
  isActive: boolean;
};

type AddOnOption = {
  code: string;
  name: string;
  description: string | null;
  priceRsd: number;
  isActive: boolean;
};

type BookingWizardValues = {
  city: string;
  zone: string;
  address: string;
  squareMeters: number;
  rooms?: number;
  bathrooms?: number;
  suppliesIncluded: boolean;
  customerNotes?: string;
  accessNotes?: string;
  serviceCode: "regular" | "standard" | "deep";
  addOns: Array<{ code: string; quantity: number }>;
  preferredDate: string;
  preferredStartTime: string;
  recurrencePreference: "ONE_TIME" | "WEEKLY" | "EVERY_TWO_WEEKS" | "MONTHLY";
  accountMode: "current" | "login" | "register";
  loginMethod: "email" | "phone";
  loginEmail?: string;
  loginPhone?: string;
  loginPassword?: string;
  registerFirstName?: string;
  registerLastName?: string;
  registerEmail?: string;
  registerPhone?: string;
  registerPassword?: string;
};

const stepLabels = ["Lokacija", "Stan", "Usluga", "Termin", "Cena", "Nalog", "Slanje"];

export function BookingWizard({
  serviceTypes,
  addOns,
  isAuthenticated
}: {
  serviceTypes: ServiceTypeOption[];
  addOns: AddOnOption[];
  isAuthenticated: boolean;
}) {
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<BookingWizardValues>({
    defaultValues: {
      city: "Beograd",
      zone: "Vračar",
      address: "",
      squareMeters: 45,
      rooms: 2,
      bathrooms: 1,
      suppliesIncluded: false,
      customerNotes: "",
      accessNotes: "",
      serviceCode: "regular",
      addOns: [],
      preferredDate: today,
      preferredStartTime: "10:00",
      recurrencePreference: "ONE_TIME",
      accountMode: isAuthenticated ? "current" : "register",
      loginMethod: "email"
    }
  });

  const values = form.watch();
  const selectedService = serviceTypes.find((service) => service.code === values.serviceCode);
  const selectedAddOns = values.addOns ?? [];
  const price = useMemo(() => {
    if (!selectedService) return null;
    return calculatePrice({
      squareMeters: Number(values.squareMeters || 0),
      serviceType: selectedService,
      addOns: addOns
        .filter((addOn) => selectedAddOns.some((selected) => selected.code === addOn.code))
        .map((addOn) => ({
          code: addOn.code,
          priceRsd: addOn.priceRsd,
          quantity: selectedAddOns.find((selected) => selected.code === addOn.code)?.quantity ?? 1
        }))
    });
  }, [addOns, selectedAddOns, selectedService, values.squareMeters]);

  const city = form.watch("city");
  const accountMode = form.watch("accountMode");

  function selectedAddOn(code: string) {
    return selectedAddOns.find((addOn) => addOn.code === code);
  }

  function toggleAddOn(code: string, checked: boolean) {
    const next = checked
      ? [...selectedAddOns.filter((addOn) => addOn.code !== code), { code, quantity: 1 }]
      : selectedAddOns.filter((addOn) => addOn.code !== code);
    form.setValue("addOns", next, { shouldDirty: true });
  }

  function setAddOnQuantity(code: string, quantity: number) {
    form.setValue(
      "addOns",
      selectedAddOns.map((addOn) => (addOn.code === code ? { ...addOn, quantity } : addOn)),
      { shouldDirty: true }
    );
  }

  async function next() {
    setServerError(null);
    const fieldsByStep: Array<Array<keyof BookingWizardValues>> = [
      ["city", "zone", "address"],
      ["squareMeters"],
      ["serviceCode"],
      ["preferredDate", "preferredStartTime"],
      [],
      accountMode === "login" && values.loginMethod === "email"
        ? ["loginEmail", "loginPassword"]
        : accountMode === "login"
          ? ["loginPhone", "loginPassword"]
        : accountMode === "register"
          ? ["registerFirstName", "registerLastName", "registerEmail", "registerPhone", "registerPassword"]
          : [],
      []
    ];
    const ok = await form.trigger(fieldsByStep[step]);
    if (ok) setStep((current) => Math.min(current + 1, stepLabels.length - 1));
  }

  function submit() {
    setServerError(null);
    startTransition(async () => {
      const result = await createBookingAction(form.getValues());
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="panel p-5 sm:p-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {stepLabels.map((label, index) => (
            <button
              type="button"
              key={label}
              onClick={() => setStep(index)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                index === step ? "border-brand bg-brand text-white" : "border-line bg-white text-muted"
              }`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Gde je potrebno čišćenje?</h1>
            <label className="grid gap-1">
              <span className="label">Grad</span>
              <select className="field" {...form.register("city")}>
                {CITIES.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {city === "Novi Sad" ? (
              <p className="rounded-md bg-amber/20 px-3 py-2 text-sm font-medium text-ink">Novi Sad uskoro.</p>
            ) : null}
            <label className="grid gap-1">
              <span className="label">Zona</span>
              <select className="field" {...form.register("zone")}>
                {BELGRADE_ZONES.map((zone) => (
                  <option key={zone.name} value={zone.name} disabled={!zone.isActive}>
                    {zone.name} {zone.isActive ? "" : "uskoro"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">Adresa</span>
              <input className="field" placeholder="Ulica i broj" {...form.register("address", { required: true })} />
            </label>
            <p className="text-sm text-muted">Aktivne zone: {ACTIVE_BELGRADE_ZONES.join(", ")}.</p>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Detalji doma</h1>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1">
                <span className="label">Kvadratura</span>
                <input className="field" type="number" min={20} max={240} {...form.register("squareMeters", { valueAsNumber: true })} />
              </label>
              <label className="grid gap-1">
                <span className="label">Sobe</span>
                <input className="field" type="number" min={1} {...form.register("rooms", { valueAsNumber: true })} />
              </label>
              <label className="grid gap-1">
                <span className="label">Kupatila</span>
                <input className="field" type="number" min={1} {...form.register("bathrooms", { valueAsNumber: true })} />
              </label>
            </div>
            <label className="flex items-center gap-2 rounded-md border border-line bg-white p-3 text-sm font-medium">
              <input type="checkbox" {...form.register("suppliesIncluded")} />
              Imam svoja sredstva za čišćenje
            </label>
            <label className="grid gap-1">
              <span className="label">Napomena za čišćenje</span>
              <textarea className="field min-h-24" {...form.register("customerNotes")} />
            </label>
            <label className="grid gap-1">
              <span className="label">Napomena za ulazak</span>
              <textarea className="field min-h-20" {...form.register("accessNotes")} />
            </label>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Tip čišćenja i dodaci</h1>
            <div className="grid gap-3">
              {serviceTypes.map((service) => (
                <label
                  key={service.code}
                  className={`rounded-lg border p-4 ${service.isActive ? "cursor-pointer border-line bg-white" : "border-line bg-gray-50 text-muted"}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      value={service.code}
                      disabled={!service.isActive || service.code === "deep"}
                      {...form.register("serviceCode")}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{service.name}</p>
                        <p className="font-black text-brand">
                          {formatRsd(service.hourlyRateRsd)}/h {service.code === "deep" ? "uskoro" : ""}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted">{service.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {addOns.map((addOn) => {
                const selected = selectedAddOn(addOn.code);
                return (
                  <div key={addOn.code} className="rounded-lg border border-line bg-white p-4">
                    <label className="flex items-start gap-3">
                      <input type="checkbox" checked={Boolean(selected)} onChange={(event) => toggleAddOn(addOn.code, event.target.checked)} />
                      <span>
                        <span className="block font-bold text-ink">{addOn.name}</span>
                        <span className="block text-sm text-muted">
                          {formatRsd(addOn.priceRsd)}
                          {addOn.code === "ironing" ? " / sat" : ""}
                        </span>
                      </span>
                    </label>
                    {selected && addOn.code === "ironing" ? (
                      <label className="mt-3 grid gap-1">
                        <span className="text-xs font-semibold text-muted">Broj sati peglanja</span>
                        <input
                          className="field"
                          type="number"
                          min={1}
                          max={8}
                          value={selected.quantity}
                          onChange={(event) => setAddOnQuantity(addOn.code, Number(event.target.value))}
                        />
                      </label>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Termin</h1>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="label">Datum</span>
                <input className="field" type="date" min={today} {...form.register("preferredDate", { required: true })} />
              </label>
              <label className="grid gap-1">
                <span className="label">Početak</span>
                <input className="field" type="time" {...form.register("preferredStartTime", { required: true })} />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="label">Željena učestalost</span>
              <select className="field" {...form.register("recurrencePreference")}>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Pregled cene</h1>
            {price ? <PriceBreakdown price={price} /> : null}
            <p className="rounded-md bg-amber/20 px-3 py-2 text-sm text-ink">
              Ekstremna zaprljanost ili posebni zahtevi mogu zahtevati dodatnu admin potvrdu.
            </p>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Nalog</h1>
            {isAuthenticated ? (
              <p className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-brand">Prijavljeni ste. Rezervacija će biti vezana za vaš nalog.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="rounded-lg border border-line bg-white p-4">
                    <input type="radio" value="register" {...form.register("accountMode")} />{" "}
                    <span className="font-semibold">Napravi nalog</span>
                  </label>
                  <label className="rounded-lg border border-line bg-white p-4">
                    <input type="radio" value="login" {...form.register("accountMode")} />{" "}
                    <span className="font-semibold">Već imam nalog</span>
                  </label>
                </div>
                {accountMode === "register" ? (
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="field" placeholder="Ime" {...form.register("registerFirstName")} />
                      <input className="field" placeholder="Prezime" {...form.register("registerLastName")} />
                    </div>
                    <input className="field" type="email" placeholder="Email" {...form.register("registerEmail")} />
                    <input className="field" placeholder="Telefon" {...form.register("registerPhone")} />
                    <input className="field" type="password" placeholder="Lozinka" {...form.register("registerPassword")} />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-gray-50 p-1">
                      <label className="button-secondary cursor-pointer">
                        <input className="sr-only" type="radio" value="email" {...form.register("loginMethod")} />
                        Email
                      </label>
                      <label className="button-secondary cursor-pointer">
                        <input className="sr-only" type="radio" value="phone" {...form.register("loginMethod")} />
                        Telefon
                      </label>
                    </div>
                    {values.loginMethod === "phone" ? (
                      <input className="field" type="tel" placeholder="Telefon" {...form.register("loginPhone")} />
                    ) : (
                      <input className="field" type="email" placeholder="Email" {...form.register("loginEmail")} />
                    )}
                    <input className="field" type="password" placeholder="Lozinka" {...form.register("loginPassword")} />
                  </div>
                )}
              </>
            )}
          </section>
        ) : null}

        {step === 6 ? (
          <section className="grid gap-4">
            <h1 className="text-2xl font-black text-ink">Pošalji zahtev</h1>
            <div className="rounded-lg border border-line bg-white p-4 text-sm leading-6 text-muted">
              <p>
                Zahtev ide admin timu. Plaćanje je ručno u MVP-u, a status se vodi kroz korisnički panel.
              </p>
              <p className="mt-2 font-semibold text-ink">
                {values.address}, {values.zone} - {values.preferredDate} u {values.preferredStartTime}
              </p>
            </div>
            {serverError ? <p className="rounded-md bg-coral/10 px-3 py-2 text-sm font-medium text-coral">{serverError}</p> : null}
            <button type="button" className="button-primary" onClick={submit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Pošalji zahtev
            </button>
          </section>
        ) : null}

        <div className="mt-8 flex justify-between gap-3 border-t border-line pt-5">
          <button type="button" className="button-secondary" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" />
            Nazad
          </button>
          {step < stepLabels.length - 1 ? (
            <button type="button" className="button-primary" onClick={next}>
              Dalje
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <aside className="panel h-fit p-5">
        <h2 className="text-lg font-black text-ink">Procena</h2>
        {price ? <PriceBreakdown price={price} compact /> : null}
        {price?.requiresAdminConfirmation ? (
          <p className="mt-3 rounded-md bg-amber/20 px-3 py-2 text-sm font-medium text-ink">Preko 120 m2 zahteva admin potvrdu.</p>
        ) : null}
      </aside>
    </div>
  );
}

function PriceBreakdown({
  price,
  compact = false
}: {
  price: ReturnType<typeof calculatePrice>;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-4 grid gap-2 text-sm" : "grid gap-3"}>
      <Line label="Procena trajanja" value={`${price.estimatedHours} h`} />
      <Line label="Osnovica" value={formatRsd(price.basePriceRsd)} />
      <Line label="Dodaci" value={formatRsd(price.addOnsTotalRsd)} />
      <Line label="Međuzbir" value={formatRsd(price.subtotalRsd)} />
      <Line label="Naknada za rezervaciju" value={formatRsd(price.bookingFeeRsd)} />
      <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-lg font-black">
        <span>Ukupno</span>
        <span className="text-brand">{formatRsd(price.totalPriceRsd)}</span>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
