export function normalizePhone(value: FormDataEntryValue | string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const compact = raw.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) return compact;
  if (compact.startsWith("00")) return `+${compact.slice(2)}`;
  if (compact.startsWith("0")) return `+381${compact.slice(1)}`;
  if (compact.startsWith("381")) return `+${compact}`;
  return compact;
}
