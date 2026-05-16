import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireRole("ADMIN");
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      customerProfile: true,
      _count: { select: { customerBookings: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Korisnici</h1>
          <p className="mt-1 text-muted">Profili, rezervacije, beleške i status naloga.</p>
        </div>
        <Link href="/admin" className="button-secondary">
          Admin početna
        </Link>
      </div>

      <section className="panel overflow-hidden">
        {customers.map((customer) => (
          <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="block border-b border-line p-4 last:border-b-0 hover:bg-leaf/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-ink">{customer.name}</h2>
                <p className="text-sm text-muted">{customer.email ?? customer.phone}</p>
                <p className="mt-1 text-sm text-muted">
                  {customer.customerProfile?.city ?? "nema grada"} - {customer.customerProfile?.zone ?? "nema zone"}
                </p>
              </div>
              <div className="grid gap-2 sm:justify-items-end">
                <StatusBadge value={customer.status} />
                <p className="text-sm font-semibold text-ink">{customer._count.customerBookings} rezervacija</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
