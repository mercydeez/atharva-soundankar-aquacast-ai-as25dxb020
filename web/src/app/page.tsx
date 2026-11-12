"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useData } from "@/components/data-provider";
import { Kpi, MiniTable, Note, PageHeader, Panel } from "@/components/blocks";
import { HistoryForecastChart } from "@/components/charts";
import { fmtPct, fmtUnits, monthLabel } from "@/lib/demo";
import { deterministicInsights } from "@/lib/insights";

export default function Dashboard() {
  const { analytics: a } = useData();
  const best = a.models.find((m) => m.key === a.best_model)!;
  const ins = deterministicInsights(a);
  const latest = a.monthly[a.monthly.length - 1];
  const prevYear = a.monthly.find((m) => m.month === `${Number(latest.month.slice(0, 4)) - 1}${latest.month.slice(4)}`);
  const fc = a.forecast;
  return (
    <>
      <PageHeader
        eyebrow="Executive Dashboard"
        title="Forecast Better. Produce Smarter. Distribute with Confidence."
        description={
          <>
            Monthly demand outlook for a new flavoured-water launch. {a.source === "demo" ? "Built on US national retail water unit sales (USDA ERS, Circana scanner data) as a category proxy. The data is historical and ends in 2023; it is not live sales of the new product." : a.sourceLabel}
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={`Latest month: ${monthLabel(latest.month)}`} value={fmtUnits(latest.units)} note={prevYear ? `${((latest.units / prevYear.units - 1) * 100).toFixed(1)}% vs ${monthLabel(prevYear.month)}` : "units sold"} />
        <Kpi label="Next 3 months forecast" value={fmtUnits(ins.total)} tone="teal" note={`${monthLabel(fc.months[0])} to ${monthLabel(fc.months[2])}${ins.vsLy != null ? `, ${ins.vsLy >= 0 ? "+" : ""}${ins.vsLy.toFixed(1)}% vs last year` : ""}`} />
        <Kpi label="Selected model" value={best.name} note={a.selection_reason} />
        <Kpi label="Rolling-origin accuracy" value={`${fmtPct(best.cv_wape)} WAPE`} tone="teal" note={`MAPE ${fmtPct(best.cv_mape)} · holdout WAPE ${fmtPct(best.holdout_wape)}`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Historical sales and 3-month forecast" description={`${a.seriesName}. Shaded bands are the 80% and 95% prediction intervals.`}>
          <HistoryForecastChart a={a} forecast={fc} lastN={36} />
        </Panel>
        <Panel title="Forecast table" description={fc.interval_method}>
          <MiniTable
            head={["Month", "Forecast", "80% range"]}
            rows={fc.months.map((m, i) => [monthLabel(m), <b key="p">{fmtUnits(fc.point[i], 1)}</b>, `${fmtUnits(fc.lo80[i], 0)} to ${fmtUnits(fc.hi80[i], 0)}`])}
          />
          <Link href="/forecast" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--teal)] hover:underline">
            Open Forecasting Lab <ArrowRight className="size-4" />
          </Link>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Executive insights" description="Computed rules on the active data. For a natural-language analysis, ask the AI Copilot.">
          <div className="space-y-3">
            <Note>{ins.seasonality}</Note>
            <Note>{ins.bestModel}</Note>
          </div>
        </Panel>
        <Panel title="Recommended actions">
          <ol className="space-y-2.5 text-sm leading-relaxed">
            {ins.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
          <Link href="/assistant" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--teal)] hover:underline">
            Ask the AI Copilot <ArrowRight className="size-4" />
          </Link>
        </Panel>
      </div>
    </>
  );
}
