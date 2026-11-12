/**
 * Server-side forecasting engine for user-uploaded monthly data.
 * Models: Naive, Seasonal Naive, Holt-Winters (additive) and a lag regression (ridge OLS).
 * The notebook's SARIMA / Random Forest results are used for the demo dataset; this engine
 * retrains from scratch on whatever series is uploaded, with the same validation design.
 */
import { mape, wape, mean } from "./metrics";
import type { Analytics, Eda, Forecast, ModelResult, MonthPoint } from "./types";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const HORIZON = 3;
export const MIN_MONTHS = 24;

type Fn = (train: number[], months: string[], h: number) => number[];

export function addMonths(ym: string, k: number): string {
  const [y, m] = ym.split("-").map(Number);
  const idx = y * 12 + (m - 1) + k;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}
const monthNum = (ym: string) => Number(ym.slice(5, 7));

export const naive: Fn = (train, _m, h) => Array(h).fill(train[train.length - 1]);

export const seasonalNaive: Fn = (train, _m, h) =>
  Array.from({ length: h }, (_, i) => train[train.length - 12 + (i % 12)]);

/** Additive Holt-Winters, smoothing parameters chosen by grid search on in-sample one-step SSE. */
export const holtWinters: Fn = (train, _m, h) => {
  const s = 12;
  const n = train.length;
  const initLevel = mean(train.slice(0, s));
  const initTrend = (mean(train.slice(s, 2 * s)) - initLevel) / s;
  const initSeason = train.slice(0, s).map((v) => v - initLevel);
  let best: { sse: number; a: number; b: number; g: number } | null = null;
  const run = (a: number, b: number, g: number, keep: boolean) => {
    let L = initLevel;
    let T = initTrend;
    const S = [...initSeason];
    let sse = 0;
    for (let t = s; t < n; t++) {
      const f = L + T + S[t % s];
      sse += (train[t] - f) ** 2;
      const prevL = L;
      L = a * (train[t] - S[t % s]) + (1 - a) * (L + T);
      T = b * (L - prevL) + (1 - b) * T;
      S[t % s] = g * (train[t] - L) + (1 - g) * S[t % s];
    }
    return keep ? { L, T, S } : { sse };
  };
  for (const a of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
    for (const b of [0, 0.05, 0.1, 0.2])
      for (const g of [0.05, 0.1, 0.2, 0.3, 0.4, 0.5]) {
        const { sse } = run(a, b, g, false) as { sse: number };
        if (!best || sse < best.sse) best = { sse, a, b, g };
      }
  const { L, T, S } = run(best!.a, best!.b, best!.g, true) as { L: number; T: number; S: number[] };
  return Array.from({ length: h }, (_, i) => L + (i + 1) * T + S[(n + i) % s]);
};

function ridgeSolve(X: number[][], y: number[], lambda = 1e-6): number[] {
  const p = X[0].length;
  const A = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j && i > 0 ? lambda : 0)));
  const bvec = Array.from({ length: p }, (_, i) => X.reduce((s, r, k) => s + r[i] * y[k], 0));
  // Gauss-Jordan elimination with partial pivoting
  const M = A.map((r, i) => [...r, bvec[i]]);
  for (let c = 0; c < p; c++) {
    let piv = c;
    for (let r = c + 1; r < p; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c] || 1e-12;
    for (let k = c; k <= p; k++) M[c][k] /= d;
    for (let r = 0; r < p; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let k = c; k <= p; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r) => r[p]);
}

/** Lag regression: y_t on lag1, lag2, lag3, lag12, month sin/cos and trend, forecast recursively. */
export const lagRegression: Fn = (train, months, h) => {
  const sd = Math.sqrt(mean(train.map((v) => (v - mean(train)) ** 2))) || 1;
  const mu = mean(train);
  const z = train.map((v) => (v - mu) / sd);
  const feats = (series: number[], t: number, ym: string) => {
    const m = monthNum(ym);
    return [1, series[t - 1], series[t - 2], series[t - 3], series[t - 12], Math.sin((2 * Math.PI * m) / 12), Math.cos((2 * Math.PI * m) / 12), t / series.length];
  };
  const X: number[][] = [];
  const Y: number[] = [];
  for (let t = 12; t < z.length; t++) {
    X.push(feats(z, t, months[t]));
    Y.push(z[t]);
  }
  const beta = ridgeSolve(X, Y, 0.5);
  const ext = [...z];
  const out: number[] = [];
  for (let i = 0; i < h; i++) {
    const t = ext.length;
    const f = feats(ext, t, addMonths(months[months.length - 1], i + 1));
    const p = f.reduce((s, x, k) => s + x * beta[k], 0);
    ext.push(p);
    out.push(p * sd + mu);
  }
  return out;
};

export const ENGINE_MODELS: { key: string; name: string; fn: Fn }[] = [
  { key: "naive", name: "Naive", fn: naive },
  { key: "snaive", name: "Seasonal Naive", fn: seasonalNaive },
  { key: "hw", name: "Holt-Winters", fn: holtWinters },
  { key: "lagreg", name: "Lag Regression", fn: lagRegression },
];

/** Rolling-origin evaluation: N consecutive 3-month windows at the end of the series, refit before each. */
export function evaluate(y: number[], months: string[], fn: Fn, nFolds: number) {
  const n = y.length;
  const folds = [];
  for (let k = nFolds; k >= 1; k--) {
    const o = n - HORIZON * k;
    const pred = fn(y.slice(0, o), months.slice(0, o), HORIZON).map(Math.round);
    const actual = y.slice(o, o + HORIZON);
    const m = mape(actual, pred);
    folds.push({ train_end: months[o - 1], test_months: months.slice(o, o + HORIZON), actual, pred, mape: m.value, wape: wape(actual, pred), zero_actuals: m.excluded });
  }
  const A = folds.flatMap((f) => f.actual);
  const P = folds.flatMap((f) => f.pred);
  return { folds, cv_mape: mape(A, P).value, cv_wape: wape(A, P), holdout_mape: folds[folds.length - 1].mape, holdout_wape: folds[folds.length - 1].wape };
}

export function edaOf(y: number[], months: string[]): Eda {
  const n = y.length;
  const trend: (number | null)[] = y.map((_, t) => {
    if (t < 6 || t + 6 >= n) return null;
    let s = 0;
    for (let k = -6; k <= 6; k++) s += (k === -6 || k === 6 ? 0.5 : 1) * y[t + k];
    return s / 12;
  });
  const byMonth: number[][] = Array.from({ length: 12 }, () => []);
  trend.forEach((tr, t) => tr !== null && byMonth[monthNum(months[t]) - 1].push(y[t] - tr));
  const raw = byMonth.map((v) => (v.length ? mean(v) : 0));
  const adj = mean(raw);
  const seas = raw.map((v) => v - adj);
  const resid: number[] = [];
  const tPlusR: number[] = [];
  const sPlusR: number[] = [];
  trend.forEach((tr, t) => {
    if (tr === null) return;
    const s = seas[monthNum(months[t]) - 1];
    const r = y[t] - tr - s;
    resid.push(r);
    tPlusR.push(tr + r);
    sPlusR.push(s + r);
  });
  const variance = (xs: number[]) => {
    const m = mean(xs);
    return mean(xs.map((x) => (x - m) ** 2));
  };
  const avg = mean(y);
  const idx: Record<string, number> = {};
  MONTHS.forEach((name, i) => {
    const vals = y.filter((_, t) => monthNum(months[t]) === i + 1);
    if (vals.length) idx[name] = Math.round((mean(vals) / avg) * 1000) / 10;
  });
  const entries = Object.entries(idx);
  const annual: Record<string, number> = {};
  const counts: Record<string, number> = {};
  y.forEach((v, t) => {
    const yr = months[t].slice(0, 4);
    annual[yr] = (annual[yr] ?? 0) + v;
    counts[yr] = (counts[yr] ?? 0) + 1;
  });
  Object.keys(annual).forEach((k) => counts[k] !== 12 && delete annual[k]);
  const last12 = y.slice(-12).reduce((s, v) => s + v, 0);
  const prev12 = n >= 24 ? y.slice(-24, -12).reduce((s, v) => s + v, 0) : null;
  return {
    trend_strength: resid.length ? Math.max(0, 1 - variance(resid) / variance(tPlusR)) : 0,
    seasonal_strength: resid.length ? Math.max(0, 1 - variance(resid) / variance(sPlusR)) : 0,
    seasonal_index: idx,
    peak_month: entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0],
    trough_month: entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0],
    annual_totals: annual,
    last12_vs_prev12_pct: prev12 ? (last12 / prev12 - 1) * 100 : null,
  };
}

/** Train every engine model on the uploaded series and assemble a full Analytics bundle. */
export function runEngine(points: MonthPoint[], label: string): Analytics {
  const y = points.map((p) => p.units);
  const months = points.map((p) => p.month);
  if (y.length < MIN_MONTHS) throw new Error(`At least ${MIN_MONTHS} months are needed (got ${y.length}).`);
  const nFolds = Math.max(1, Math.min(4, Math.floor((y.length - 21) / HORIZON)));
  const models: ModelResult[] = ENGINE_MODELS.map((m) => ({ key: m.key, name: m.name, ...evaluate(y, months, m.fn, nFolds) }));
  const best = models.reduce((a, b) => ((b.cv_wape ?? Infinity) < (a.cv_wape ?? Infinity) ? b : a));
  const future = Array.from({ length: HORIZON }, (_, i) => addMonths(months[months.length - 1], i + 1));
  const all: Record<string, Forecast> = {};
  for (const m of ENGINE_MODELS) {
    const res = models.find((r) => r.key === m.key)!;
    const point = m.fn(y, months, HORIZON).map((v) => Math.round(Math.max(0, v)));
    const rmse = Array.from({ length: HORIZON }, (_, step) => Math.sqrt(mean(res.folds.map((f) => (f.actual[step] - f.pred[step]) ** 2))));
    all[m.key] = {
      model: m.key,
      name: m.name,
      months: future,
      point,
      lo80: point.map((p, i) => Math.round(Math.max(0, p - 1.2816 * rmse[i]))),
      hi80: point.map((p, i) => Math.round(p + 1.2816 * rmse[i])),
      lo95: point.map((p, i) => Math.round(Math.max(0, p - 1.96 * rmse[i]))),
      hi95: point.map((p, i) => Math.round(p + 1.96 * rmse[i])),
      interval_method: "Point ± z × rolling-origin RMSE at each forecast step",
    };
  }
  return {
    source: "upload",
    sourceLabel: label,
    engine: "AQUACAST TypeScript engine (Naive, Seasonal Naive, Holt-Winters, Lag Regression), trained on request",
    loadedAt: new Date().toISOString(),
    seriesName: "Uploaded monthly sales",
    meta: { first_month: months[0], last_month: months[months.length - 1], n_months: y.length, n_folds: nFolds, horizon: HORIZON },
    monthly: points,
    eda: edaOf(y, months),
    models,
    best_model: best.key,
    selection_reason: `Lowest rolling-origin WAPE over ${nFolds} consecutive 3-month window${nFolds > 1 ? "s" : ""}`,
    forecast: all[best.key],
    all_forecasts: all,
  };
}
