"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useData } from "@/components/data-provider";
import { MiniTable, Note, PageHeader, Panel } from "@/components/blocks";
import { HistoryForecastChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { fmtPct, fmtUnits, monthLabel } from "@/lib/demo";
import { cn } from "@/lib/utils";

export default function ForecastLab() {
  const { analytics: a, uploadSeries, busy } = useData();
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const key = sel && a.all_forecasts[sel] ? sel : a.best_model;
  const fc = a.all_forecasts[key];
  const res = a.models.find((m) => m.key === key)!;

  async function retrain() {
    setStatus(null);
    const t0 = performance.now();
    try {
      await uploadSeries(a.monthly.map((m) => ({ month: m.month, units: m.units, dollars: m.dollars ?? null })), `${a.source === "demo" ? "USDA demo series" : a.sourceLabel}, retrained in the browser session`, ["Series retrained on request by the server engine."]);
      setSel(null);
      setStatus(`Retrained 4 models with rolling-origin validation in ${Math.round(performance.now() - t0)} ms.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Forecasting Lab"
        title="Three-month forecast"
        description="Pick any model to see its forecast. The recommended model is the one with the lowest rolling-origin WAPE."
        actions={
          <Button onClick={retrain} disabled={busy}>
            <Play className="size-4" /> {busy ? "Training..." : "Retrain on current data"}
          </Button>
        }
      />
      {status && <p className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{status}</p>}
      <div className="mb-5 flex flex-wrap gap-2">
        {a.models.map((m) => (
          <button
            key={m.key}
            onClick={() => setSel(m.key)}
            className={cn("rounded-xl border px-4 py-2.5 text-left text-sm transition-colors", m.key === key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30")}
          >
            <span className="block font-medium">
              {m.name} {m.key === a.best_model && <span className={cn("ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold", m.key === key ? "bg-white/20" : "bg-accent text-accent-foreground")}>RECOMMENDED</span>}
            </span>
            <span className={cn("tabular text-xs", m.key === key ? "text-primary-foreground/75" : "text-muted-foreground")}>WAPE {fmtPct(m.cv_wape)} · MAPE {fmtPct(m.cv_mape)}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Panel title={`${fc.name}: history and forecast`} description="Historical actuals (navy) and future forecast (teal) are drawn separately; test-window predictions are on the Model Comparison page.">
          <HistoryForecastChart a={a} forecast={fc} lastN={30} height={360} />
        </Panel>
        <Panel title="Forecast values" description={fc.interval_method}>
          <MiniTable
            head={["Month", "Forecast", "80%", "95%"]}
            rows={fc.months.map((m, i) => [monthLabel(m), <b key="b">{fmtUnits(fc.point[i], 1)}</b>, `${fmtUnits(fc.lo80[i], 0)} to ${fmtUnits(fc.hi80[i], 0)}`, `${fmtUnits(fc.lo95[i], 0)} to ${fmtUnits(fc.hi95[i], 0)}`])}
          />
          <p className="tabular mt-3 text-sm">
            Three-month total: <b>{fmtUnits(fc.point.reduce((s, v) => s + v, 0), 2)}</b> units
          </p>
          <div className="mt-4">
            <Note tone="amber">
              {a.source === "demo"
                ? `Forecasts start the month after the last complete actual month (${monthLabel(a.meta.last_month)}). They are produced by the Python notebook; "Retrain" reruns the separate server engine on the same series.`
                : "Computed just now by the AQUACAST server engine on your data."}
            </Note>
          </div>
          {res.params && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">{JSON.stringify(res.params, null, 1)}</pre>
          )}
        </Panel>
      </div>
    </>
  );
}
