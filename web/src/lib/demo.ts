import results from "@/data/results.json";
import type { Analytics } from "./types";

type Raw = typeof results;

/** The notebook's exported results, wrapped as the demo Analytics bundle. No figures are typed in by hand. */
export function demoAnalytics(): Analytics {
  const r = results as unknown as Raw & Analytics;
  return {
    ...r,
    source: "demo",
    sourceLabel: "USDA ERS Weekly Retail Food Sales: US water unit sales (category proxy)",
    engine: "Python notebook (Naive, Seasonal Naive, SARIMA, Random Forest)",
    loadedAt: String(r.meta.generated_at),
    seriesName: "US retail water unit sales (monthly)",
  } as Analytics;
}

export const fmtUnits = (v: number | null | undefined, digits = 1) =>
  v == null ? "n/a" : Math.abs(v) >= 1e9 ? `${(v / 1e9).toFixed(digits + 1)}B` : Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(digits)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(digits)}K` : v.toFixed(0);

export const fmtPct = (v: number | null | undefined, digits = 2) => (v == null ? "n/a" : `${v.toFixed(digits)}%`);

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** Compact, number-only context sent to the LLM. Built from whichever dataset is active. */
export function llmContext(a: Analytics) {
  const best = a.models.find((m) => m.key === a.best_model);
  return {
    dataset: a.sourceLabel,
    data_source_type: a.source === "demo" ? "Notebook results on USDA ERS data (historical, ends 2023)" : "User-uploaded data, models trained on upload",
    loaded_at: a.loadedAt,
    engine: a.engine,
    history: `${a.meta.first_month} to ${a.meta.last_month} (${a.meta.n_months} months)`,
    latest_month: a.monthly[a.monthly.length - 1],
    recent_12_months: a.monthly.slice(-12),
    eda: a.eda,
    models: a.models.map((m) => ({ name: m.name, rolling_wape: m.cv_wape, rolling_mape: m.cv_mape, holdout_wape: m.holdout_wape, holdout_mape: m.holdout_mape })),
    best_model: best?.name,
    selection_reason: a.selection_reason,
    forecast: a.forecast,
    notes: a.source === "demo" ? String(a.meta.proxy_note ?? "") : (a.warnings ?? []).join(" "),
  };
}
