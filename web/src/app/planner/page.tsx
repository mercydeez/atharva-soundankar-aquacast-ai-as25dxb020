"use client";

import { useState } from "react";
import { useData } from "@/components/data-provider";
import { Kpi, MiniTable, Note, PageHeader, Panel } from "@/components/blocks";
import { fmtUnits, monthLabel } from "@/lib/demo";

function Field({ label, value, onChange, step, suffix }: { label: string; value: number; onChange: (v: number) => void; step: number; suffix: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center rounded-xl border bg-white px-3 focus-within:ring-2 focus-within:ring-[var(--teal)]/30">
        <input type="number" value={value} step={step} min={0} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} className="tabular w-full bg-transparent py-2 outline-none" />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </span>
    </label>
  );
}

export default function Planner() {
  const { analytics: a } = useData();
  const fc = a.forecast;
  const [share, setShare] = useState(1.5);
  const [cover, setCover] = useState<"80" | "95">("80");
  const [stock, setStock] = useState(0);
  const [regions, setRegions] = useState(4);
  const hi = cover === "80" ? fc.hi80 : fc.hi95;
  const plan = fc.months.reduce<{ m: string; demand: number; buffer: number; produce: number; after: number }[]>((acc, m, i) => {
    const onHand = i === 0 ? stock : acc[i - 1].after;
    const demand = (fc.point[i] * share) / 100;
    const buffer = ((hi[i] - fc.point[i]) * share) / 100;
    const produce = Math.max(0, demand + buffer - onHand);
    // the buffer is carried forward if demand comes in at the forecast
    return [...acc, { m, demand, buffer, produce, after: Math.max(0, onHand + produce - demand) }];
  }, []);
  const total = plan.reduce((s, p) => s + p.produce, 0);
  const peak = plan.reduce((x, y) => (y.demand > x.demand ? y : x));
  return (
    <>
      <PageHeader eyebrow="Business Planner" title="Production and distribution plan" description="Translate the category forecast into a plan for the new flavoured water. Market share, service cover and stock are your assumptions; the demand and uncertainty come from the selected model." />
      <Panel title="Assumptions">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Expected share of category" value={share} onChange={setShare} step={0.1} suffix="%" />
          <Field label="Opening stock (product units)" value={stock} onChange={setStock} step={1000} suffix="units" />
          <Field label="Regional markets" value={regions} onChange={(v) => setRegions(Math.max(1, Math.round(v)))} step={1} suffix="regions" />
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Service cover</span>
            <span className="flex gap-1 rounded-xl border bg-white p-1">
              {(["80", "95"] as const).map((c) => (
                <button key={c} onClick={() => setCover(c)} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${cover === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{c}% upper bound</button>
              ))}
            </span>
          </label>
        </div>
      </Panel>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Kpi label="Total production, 3 months" value={fmtUnits(total)} tone="teal" note={`At ${share}% of a ${fmtUnits(fc.point.reduce((s, v) => s + v, 0))}-unit category forecast`} />
        <Kpi label="Peak month" value={monthLabel(peak.m)} note={`${fmtUnits(peak.demand)} expected product demand`} />
        <Kpi label="Per region, peak month" value={fmtUnits((peak.demand + peak.buffer) / regions)} note={`Demand plus buffer, split evenly across ${regions} regions`} />
      </div>
      <Panel className="mt-5" title="Monthly plan" description={`Production = expected demand + safety buffer (gap to the ${cover}% upper bound) - stock on hand. Model: ${fc.name}.`}>
        <MiniTable
          head={["Month", "Expected demand", "Safety buffer", "Produce", "Ship per region"]}
          rows={plan.map((p) => [monthLabel(p.m), fmtUnits(p.demand, 1), fmtUnits(p.buffer, 1), <b key="p">{fmtUnits(p.produce, 1)}</b>, fmtUnits((p.demand + p.buffer) / regions, 1)])}
        />
      </Panel>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Note>Distribution: move stock into regions about a month before {a.eda.peak_month}, the seasonal peak (index {a.eda.seasonal_index[a.eda.peak_month]}). Around {a.eda.trough_month} (index {a.eda.seasonal_index[a.eda.trough_month]}), run promotions or schedule line maintenance.</Note>
        <Note tone="amber">Planning assumption: the new product follows the category&apos;s seasonal shape at a fixed share. Replace the share with real sell-through as soon as the product has its own history, then re-run the forecast.</Note>
      </div>
    </>
  );
}
