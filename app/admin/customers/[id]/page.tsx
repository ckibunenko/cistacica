import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import { addAdminNoteAction, suspendUserAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { formatDate, formatRsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const [customer, notes, bookings] = await Promise.all([
    prisma.user.findFirst({
      where: { id: params.id, role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        customerProfile: true,
        createdAt: true
      }
    }),
    prisma.adminNote.findMany({
      where: { entityType: "User", entityId: params.id },
      include: { admin: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.booking.findMany({
      where: { customerId: params.id },
      include: { serviceType: true, cleaner: { select: { name: true } } },
      orderBy: { preferredDate: "desc" }
    })
  ]);
  if (!customer) notFound();

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">{customer.name}</h1>
          <p className="mt-1 text-muted">
            {customer.email} - {customer.phone ?? "bez telefona"}
          </p>
        </div>
        <StatusBadge value={customer.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="grid h-fit gap-6">
          <form action={suspendUserAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Status naloga</h2>
            <input type="hidden" name="userId" value={customer.id} />
            <select className="field" name="status" defaultValue={customer.status}>
              <option value="ACTIVE">Aktivan</option>
              <option value="SUSPENDED">Suspendovan</option>
              <option value="PENDING">Na čekanju</option>
            </select>
            <SubmitButton variant="secondary">Sačuvaj status</SubmitButton>
          </form>

          <form action={addAdminNoteAction} className="panel grid gap-3 p-5">
            <h2 className="text-lg font-black text-ink">Admin beleške</h2>
            <input type="hidden" name="entityType" value="User" />
            <input type="hidden" name="entityId" value={customer.id} />
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
              <Info label="Adresa" value={customer.customerProfile?.defaultAddress ?? "nema"} />
              <Info label="Grad" value={customer.customerProfile?.city ?? "nema"} />
              <Info label="Zona" value={customer.customerProfile?.zone ?? "nema"} />
              <Info label="Kreiran" value={formatDate(customer.createdAt)} />
            </dl>
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-black text-ink">Rezervacije</h2>
            <div className="mt-4 grid gap-3">
              {bookings.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="rounded-lg border border-line bg-white p-4 hover:border-brand">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand">{booking.bookingCode}</p>
                      <p className="font-black text-ink">{booking.serviceType.name}</p>
                      <p className="text-sm text-muted">
                        {booking.zone} - {formatDate(booking.preferredDate)}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:justify-items-end">
                      <StatusBadge value={booking.status} />
                      <p className="text-sm font-bold text-ink">{formatRsd(booking.totalPriceRsd)}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {bookings.length === 0 ? <p className="text-sm text-muted">Nema rezervacija.</p> : null}
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
