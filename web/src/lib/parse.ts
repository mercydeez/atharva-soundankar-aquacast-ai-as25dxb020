import Papa from "papaparse";
import type { MonthPoint } from "./types";

export type ParseResult = { points: MonthPoint[]; granularity: "monthly" | "weekly"; notes: string[] };

const DATE_KEYS = ["month", "date", "week", "period", "week_ending"];
const VALUE_KEYS = ["units", "sales", "unit_sales", "quantity", "value", "demand"];

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Parse a CSV of monthly or weekly sales into complete calendar months.
 * Weekly rows are treated as week-ending dates covering the 7 days up to that date and split
 * across months by day (same rule as the notebook). Months not fully covered are dropped.
 */
export function parseSalesCsv(text: string): ParseResult {
  const { data, errors } = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  if (errors.length && !data.length) throw new Error(`Could not read CSV: ${errors[0].message}`);
  const cols = Object.keys(data[0] ?? {});
  const dateKey = DATE_KEYS.find((k) => cols.includes(k));
  const valueKey = VALUE_KEYS.find((k) => cols.includes(k));
  if (!dateKey || !valueKey) throw new Error(`Need a date column (${DATE_KEYS.join(", ")}) and a sales column (${VALUE_KEYS.join(", ")}). Found: ${cols.join(", ") || "none"}.`);
  const notes: string[] = [];
  const rows: { date: Date; value: number }[] = [];
  data.forEach((r, i) => {
    const raw = String(r[dateKey] ?? "").trim();
    const date = new Date(/^\d{4}-\d{2}$/.test(raw) ? `${raw}-01T00:00:00Z` : `${raw.slice(0, 10)}T00:00:00Z`);
    const value = Number(String(r[valueKey]).replace(/,/g, ""));
    if (isNaN(date.getTime())) throw new Error(`Row ${i + 2}: invalid date "${raw}".`);
    if (!isFinite(value)) throw new Error(`Row ${i + 2}: sales value "${r[valueKey]}" is not a number.`);
    if (value < 0) throw new Error(`Row ${i + 2}: negative sales are not allowed.`);
    rows.push({ date, value });
  });
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  const dedup = new Map(rows.map((r) => [ymd(r.date), r]));
  if (dedup.size < rows.length) notes.push(`${rows.length - dedup.size} duplicate date(s) removed (last value kept).`);
  const clean = [...dedup.values()];
  const gaps = clean.slice(1).map((r, i) => (r.date.getTime() - clean[i].date.getTime()) / 86400000);
  const medianGap = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 30;
  const weekly = medianGap <= 8;

  if (!weekly) {
    const points = clean.map((r) => ({ month: ymd(r.date).slice(0, 7), units: r.value }));
    const missing = points.slice(1).filter((p, i) => monthsBetween(points[i].month, p.month) !== 1).length;
    if (missing) throw new Error(`${missing} gap(s) in the monthly series. Months must be consecutive.`);
    return { points, granularity: "monthly", notes };
  }
  if (gaps.some((g) => g !== 7)) throw new Error("Weekly data must have one row every 7 days with no gaps.");
  const byMonth = new Map<string, { units: number; days: number }>();
  for (const r of clean) {
    for (let k = 6; k >= 0; k--) {
      const d = new Date(r.date.getTime() - k * 86400000);
      const key = ymd(d).slice(0, 7);
      const cur = byMonth.get(key) ?? { units: 0, days: 0 };
      cur.units += r.value / 7;
      cur.days += 1;
      byMonth.set(key, cur);
    }
  }
  const points: MonthPoint[] = [];
  const dropped: string[] = [];
  for (const [month, v] of [...byMonth.entries()].sort()) {
    const [y, m] = month.split("-").map(Number);
    const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (v.days === dim) points.push({ month, units: Math.round(v.units) });
    else dropped.push(month);
  }
  if (dropped.length) notes.push(`Partial months dropped: ${dropped.join(", ")}.`);
  notes.push("Weekly rows split across months by day (week ending date covers the previous 7 days).");
  return { points, granularity: "weekly", notes };
}

function monthsBetween(a: string, b: string) {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}
