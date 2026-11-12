import type { Analytics } from "./types";
import { fmtPct, fmtUnits, monthLabel } from "./demo";

const MONTH_FULL: Record<string, string> = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June", Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December" };

/**
 * Rule-based answers to the lecturer's three questions, computed from whichever dataset is active.
 * These are deterministic text, not LLM output; the AI Copilot page is where the LLM speaks.
 */
export function deterministicInsights(a: Analytics) {
  const ranked = [...a.models].sort((x, y) => (x.cv_wape ?? 1e9) - (y.cv_wape ?? 1e9));
  const best = a.models.find((m) => m.key === a.best_model)!;
  const naive = a.models.find((m) => m.key === "naive");
  const fc = a.forecast;
  const total = fc.point.reduce((s, v) => s + v, 0);
  const lyMap = new Map(a.monthly.map((m) => [m.month, m.units]));
  const ly = fc.months.map((m) => lyMap.get(`${Number(m.slice(0, 4)) - 1}${m.slice(4)}`));
  const lyTotal = ly.every((v) => v != null) ? (ly as number[]).reduce((s, v) => s + v, 0) : null;
  const vsLy = lyTotal ? (total / lyTotal - 1) * 100 : null;
  const buffer = fc.hi80.reduce((s, v, i) => s + v - fc.point[i], 0);
  const width = fc.point.map((p, i) => ((fc.hi95[i] - fc.lo95[i]) / 2 / p) * 100);
  const e = a.eda;
  const sStrength = e.seasonal_strength >= 0.6 ? "strong" : e.seasonal_strength >= 0.3 ? "moderate" : "weak";

  return {
    seasonality: `Seasonality is ${sStrength} (strength ${e.seasonal_strength.toFixed(2)} on a 0 to 1 scale): demand peaks in ${MONTH_FULL[e.peak_month]} (index ${e.seasonal_index[e.peak_month]}) and is lowest in ${MONTH_FULL[e.trough_month]} (index ${e.seasonal_index[e.trough_month]}). Trend strength is ${e.trend_strength.toFixed(2)}${e.last12_vs_prev12_pct != null ? `, and the last 12 months are ${e.last12_vs_prev12_pct >= 0 ? "+" : ""}${e.last12_vs_prev12_pct.toFixed(1)}% versus the previous 12` : ""}. Models that encode the 12-month cycle track this shape; the Naive model cannot, because it repeats the last month.`,
    bestModel: `${best.name} performed best with rolling-origin WAPE ${fmtPct(best.cv_wape)} and MAPE ${fmtPct(best.cv_mape)}${naive && naive.key !== best.key ? `, versus ${fmtPct(naive.cv_wape)} WAPE for the Naive baseline` : ""}. Ranking by WAPE: ${ranked.map((m) => `${m.name} ${fmtPct(m.cv_wape)}`).join(", ")}. ${a.selection_reason}.`,
    recommendations: [
      `Plan production for ${monthLabel(fc.months[0])} to ${monthLabel(fc.months[fc.months.length - 1])} at about ${fmtUnits(total)} units in total${vsLy != null ? ` (${vsLy >= 0 ? "+" : ""}${vsLy.toFixed(1)}% versus the same months last year)` : ""}.`,
      `Hold a safety buffer of about ${fmtUnits(buffer)} units across the three months, the gap to the 80% upper bound.`,
      `Build distribution capacity ahead of ${MONTH_FULL[e.peak_month]}, and use ${MONTH_FULL[e.trough_month]} for promotions or maintenance.`,
      "Refresh the forecast each month as new sell-through data arrives.",
    ],
    uncertainty: `The 95% interval is about ±${(width.reduce((s, v) => s + v, 0) / width.length).toFixed(1)}% of the forecast on average, and it widens with each month ahead. Interval method: ${fc.interval_method}.`,
    vsLy,
    total,
    buffer,
  };
}
