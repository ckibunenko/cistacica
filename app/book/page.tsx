import { BookingWizard } from "@/components/booking/booking-wizard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const [user, serviceTypes, addOns] = await Promise.all([
    getCurrentUser(),
    prisma.serviceType.findMany({ orderBy: { hourlyRateRsd: "asc" } }),
    prisma.addOn.findMany({ where: { isActive: true }, orderBy: { priceRsd: "asc" } })
  ]);

  return (
    <main className="container-page py-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-black text-ink">Zakaži čišćenje</h1>
        <p className="mt-2 text-muted">Popunite zahtev. Admin tim potvrđuje dodelu i ručno vodi status plaćanja u MVP-u.</p>
      </div>
      <BookingWizard
        isAuthenticated={Boolean(user)}
        serviceTypes={serviceTypes.map((service) => ({
          code: service.code,
          name: service.name,
          description: service.description,
          hourlyRateRsd: service.hourlyRateRsd,
          minHours: service.minHours,
          isActive: service.isActive
        }))}
        addOns={addOns.map((addOn) => ({
          code: addOn.code,
          name: addOn.name,
          description: addOn.description,
          priceRsd: addOn.priceRsd,
          isActive: addOn.isActive
        }))}
      />
    </main>
  );
}
