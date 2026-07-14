export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDateIso(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function inDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
