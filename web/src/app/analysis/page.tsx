"use client";

import { useData } from "@/components/data-provider";
import { Kpi, Note, PageHeader, Panel } from "@/components/blocks";
import { AnnualChart, GrowthChart, HistoryForecastChart, SeasonalityChart } from "@/components/charts";
import { fmtUnits, monthLabel } from "@/lib/demo";
import { deterministicInsights } from "@/lib/insights";

export default function Analysis() {
  const { analytics: a } = useData();
  const ys = a.monthly.map((m) => m.units);
  const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
  const sd = Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / ys.length);
  const max = a.monthly.reduce((x, y) => (y.units > x.units ? y : x));
  const min = a.monthly.reduce((x, y) => (y.units < x.units ? y : x));
  return (
    <>
      <PageHeader eyebrow="Sales Analysis" title="Trend, growth and seasonality" description="The patterns the models need to capture before they can forecast well." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Average month" value={fmtUnits(mean)} note={`Coefficient of variation ${((sd / mean) * 100).toFixed(1)}%`} />
        <Kpi label="Highest month" value={fmtUnits(max.units)} note={monthLabel(max.month)} />
        <Kpi label="Lowest month" value={fmtUnits(min.units)} note={monthLabel(min.month)} />
        <Kpi label="Seasonal strength" value={a.eda.seasonal_strength.toFixed(2)} tone="teal" note={`Trend strength ${a.eda.trend_strength.toFixed(2)} (0 = none, 1 = dominant)`} />
      </div>
      <Panel className="mt-5" title="Full monthly history">
        <HistoryForecastChart a={a} forecast={a.forecast} height={320} />
      </Panel>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Seasonal index" description="Average sales in each calendar month, as a percentage of the overall monthly average.">
          <SeasonalityChart a={a} />
        </Panel>
        <Panel title="Year-over-year growth" description="Each month versus the same month one year earlier.">
          <GrowthChart a={a} />
        </Panel>
        <Panel title="Full calendar-year totals" description="Only years with all 12 months.">
          <AnnualChart a={a} />
        </Panel>
        <Panel title="What it means">
          <Note>{deterministicInsights(a).seasonality}</Note>
          {a.source === "demo" && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The March 2020 spike is the pandemic stock-up week (the only weekly outlier, kept because it is real demand). It is one reason seasonal models are judged on the most recent 12 months.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
