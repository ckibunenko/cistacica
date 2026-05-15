import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { VERIFICATION_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminCleanersPage({ searchParams }: { searchParams: { verificationStatus?: string } }) {
  await requireRole("ADMIN");
  const where: Prisma.CleanerProfileWhereInput = {};
  if (searchParams.verificationStatus) where.verificationStatus = searchParams.verificationStatus;

  const cleaners = await prisma.cleanerProfile.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, status: true } },
      zones: true,
      _count: { select: { availability: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Pružaoci usluge</h1>
          <p className="mt-1 text-muted">Verifikacija, zone, aktivacija i interne beleške.</p>
        </div>
        <Link href="/admin" className="button-secondary">
          Admin početna
        </Link>
      </div>

      <form className="panel mb-6 flex flex-col gap-3 p-4 sm:flex-row">
        <select className="field" name="verificationStatus" defaultValue={searchParams.verificationStatus ?? ""}>
          <option value="">Svi statusi</option>
          {Object.entries(VERIFICATION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="button-primary" type="submit">
          Filtriraj
        </button>
      </form>

      <section className="panel overflow-hidden">
        {cleaners.map((profile) => (
          <Link key={profile.id} href={`/admin/cleaners/${profile.id}`} className="block border-b border-line p-4 last:border-b-0 hover:bg-leaf/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-ink">{profile.user.name}</h2>
                <p className="text-sm text-muted">{profile.user.email}</p>
                <p className="mt-1 text-sm text-muted">Zone: {profile.zones.map((zone) => zone.zone).join(", ") || "nema"}</p>
              </div>
              <div className="grid gap-2 sm:justify-items-end">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={profile.verificationStatus} />
                  <StatusBadge value={profile.user.status} />
                </div>
                <p className="text-sm font-semibold text-ink">
                  {profile.ratingAverage.toFixed(1)} / {profile.ratingCount} ocena
                </p>
              </div>
            </div>
          </Link>
        ))}
        {cleaners.length === 0 ? <p className="p-5 text-sm text-muted">Nema rezultata.</p> : null}
      </section>
    </main>
  );
}
