"use client";

import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Analytics, Forecast, ModelResult } from "@/lib/types";
import { fmtUnits, monthLabel } from "@/lib/demo";

export const C = { navy: "#0f1f3d", teal: "#0e8f8a", amber: "#c98a0a", red: "#c8402f", grey: "#a9b4c4", blue: "#3b6fd4", grid: "#e8ecf2" };
const axis = { fontSize: 11, fill: "#5b6b82" };
const tip = { contentStyle: { borderRadius: 10, border: "1px solid #e3e7ee", fontSize: 12 }, formatter: (v: unknown) => (Array.isArray(v) ? `${fmtUnits(v[0] as number)} to ${fmtUnits(v[1] as number)}` : fmtUnits(v as number, 2)) };
const short = (ym: string) => monthLabel(ym).replace(" 20", " '");

/** Full history plus the selected 3-month forecast with 80% and 95% bands. */
export function HistoryForecastChart({ a, forecast, height = 340, lastN }: { a: Analytics; forecast: Forecast; height?: number; lastN?: number }) {
  const hist = lastN ? a.monthly.slice(-lastN) : a.monthly;
  const last = hist[hist.length - 1];
  const data = [
    ...hist.map((m) => ({ month: m.month, actual: m.units })),
    ...forecast.months.map((m, i) => ({ month: m, forecast: forecast.point[i], b80: [forecast.lo80[i], forecast.hi80[i]], b95: [forecast.lo95[i], forecast.hi95[i]] })),
  ];
  const join = data.find((d) => d.month === last.month) as Record<string, unknown>;
  join.forecast = last.units;
  join.b80 = [last.units, last.units];
  join.b95 = [last.units, last.units];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="month" tickFormatter={short} tick={axis} minTickGap={24} />
        <YAxis tickFormatter={(v) => fmtUnits(v, 0)} tick={axis} width={52} domain={["auto", "auto"]} />
        <Tooltip {...tip} labelFormatter={(l) => monthLabel(String(l))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area dataKey="b95" name="95% interval" stroke="none" fill={C.teal} fillOpacity={0.1} isAnimationActive={false} />
        <Area dataKey="b80" name="80% interval" stroke="none" fill={C.teal} fillOpacity={0.2} isAnimationActive={false} />
        <Line dataKey="actual" name="Actual" stroke={C.navy} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line dataKey="forecast" name={`Forecast (${forecast.name})`} stroke={C.teal} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        <ReferenceLine x={last.month} stroke={C.grey} strokeDasharray="4 4" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Actual series against a model's predictions in each rolling-origin test window. */
export function ActualVsPredictedChart({ a, model, lastN = 24, height = 300 }: { a: Analytics; model: ModelResult; lastN?: number; height?: number }) {
  const preds = new Map<string, number>();
  model.folds.forEach((f) => f.test_months.forEach((m, i) => preds.set(m, f.pred[i])));
  const data = a.monthly.slice(-lastN).map((m) => ({ month: m.month, actual: m.units, predicted: preds.get(m.month) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="month" tickFormatter={short} tick={axis} minTickGap={20} />
        <YAxis tickFormatter={(v) => fmtUnits(v, 0)} tick={axis} width={52} domain={["auto", "auto"]} />
        <Tooltip {...tip} labelFormatter={(l) => monthLabel(String(l))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line dataKey="actual" name="Actual" stroke={C.navy} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line dataKey="predicted" name={`${model.name} (test windows)`} stroke={C.teal} strokeWidth={2.5} dot={{ r: 3.5 }} connectNulls={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function SeasonalityChart({ a, height = 260 }: { a: Analytics; height?: number }) {
  const data = Object.entries(a.eda.seasonal_index).map(([m, v]) => ({ m, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="m" tick={axis} />
        <YAxis tick={axis} width={40} domain={[60, "auto"]} />
        <Tooltip contentStyle={tip.contentStyle} formatter={(v) => [`${v} (100 = average)`, "Seasonal index"]} />
        <ReferenceLine y={100} stroke={C.navy} />
        <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.m} fill={d.v >= 100 ? C.teal : C.grey} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MetricBarChart({ models, best, metric, height = 240 }: { models: ModelResult[]; best: string; metric: "cv_wape" | "cv_mape" | "holdout_wape" | "holdout_mape"; height?: number }) {
  const data = models.map((m) => ({ name: m.name, v: m[metric] ?? 0, key: m.key }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" tick={axis} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={axis} width={110} />
        <Tooltip contentStyle={tip.contentStyle} formatter={(v) => [`${Number(v).toFixed(2)}%`, metric.toUpperCase().replace("CV_", "Rolling ").replace("_", " ")]} />
        <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: "right", fontSize: 11, formatter: (v: unknown) => `${Number(v).toFixed(2)}%` }}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.key === best ? C.teal : C.grey} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnnualChart({ a, height = 240 }: { a: Analytics; height?: number }) {
  const data = Object.entries(a.eda.annual_totals).map(([y, v]) => ({ y, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="y" tick={axis} />
        <YAxis tickFormatter={(v) => fmtUnits(v, 0)} tick={axis} width={52} />
        <Tooltip contentStyle={tip.contentStyle} formatter={(v) => [fmtUnits(Number(v), 2), "Units"]} />
        <Bar dataKey="v" fill={C.navy} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Year-over-year growth for each month where the same month a year earlier exists. */
export function GrowthChart({ a, height = 240 }: { a: Analytics; height?: number }) {
  const byMonth = new Map(a.monthly.map((m) => [m.month, m.units]));
  const data = a.monthly
    .map((m) => {
      const [y, mo] = m.month.split("-");
      const prev = byMonth.get(`${Number(y) - 1}-${mo}`);
      return prev ? { month: m.month, g: (m.units / prev - 1) * 100 } : null;
    })
    .filter(Boolean) as { month: string; g: number }[];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="month" tickFormatter={short} tick={axis} minTickGap={24} />
        <YAxis tick={axis} width={44} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={tip.contentStyle} labelFormatter={(l) => monthLabel(String(l))} formatter={(v) => [`${Number(v).toFixed(1)}%`, "YoY growth"]} />
        <ReferenceLine y={0} stroke={C.navy} />
        <Bar dataKey="g" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.month} fill={d.g >= 0 ? C.teal : C.red} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
