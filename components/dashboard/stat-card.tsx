import { formatRsd } from "@/lib/format";

export function StatCard({
  label,
  value,
  money = false
}: {
  label: string;
  value: number | string;
  money?: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{typeof value === "number" && money ? formatRsd(value) : value}</p>
    </div>
  );
}
