"use client";

import { useState } from "react";
import { useData } from "@/components/data-provider";
import { MiniTable, Note, PageHeader, Panel } from "@/components/blocks";
import { ActualVsPredictedChart, MetricBarChart } from "@/components/charts";
import { fmtPct, fmtUnits, monthLabel } from "@/lib/demo";
import { cn } from "@/lib/utils";

export default function Models() {
  const { analytics: a } = useData();
  const [sel, setSel] = useState<string | null>(null);
  const key = sel && a.models.some((m) => m.key === sel) ? sel : a.best_model;
  const model = a.models.find((m) => m.key === key)!;
  const sorted = [...a.models].sort((x, y) => (x.cv_wape ?? 1e9) - (y.cv_wape ?? 1e9));
  const holdout = model.folds[model.folds.length - 1];
  return (
    <>
      <PageHeader eyebrow="Model Comparison" title="Evidence-based model selection" description="Every model is scored on months it never saw: a chronological 3-month holdout, plus rolling-origin validation over consecutive 3-month windows (refit before each window)." />
      <Panel title="Accuracy on unseen months" description="Lower is better. MAPE = mean of |error| / actual (zero actuals excluded). WAPE = 100 × Σ|error| / Σ|actual|.">
        <MiniTable
          head={["Model", "Holdout MAPE", "Holdout WAPE", "Rolling MAPE", "Rolling WAPE"]}
          highlight={sorted.findIndex((m) => m.key === a.best_model)}
          rows={sorted.map((m) => [
            <span key="n" className="font-medium">{m.name}{m.key === a.best_model && <span className="ml-2 rounded bg-[var(--teal)] px-1.5 py-0.5 text-[10px] font-semibold text-white">SELECTED</span>}</span>,
            fmtPct(m.holdout_mape), fmtPct(m.holdout_wape), fmtPct(m.cv_mape), <b key="w">{fmtPct(m.cv_wape)}</b>,
          ])}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Holdout window: {holdout.test_months.map(monthLabel).join(", ")} (training ends {monthLabel(holdout.train_end)}). {a.selection_reason}. Engine: {a.engine}.
        </p>
      </Panel>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Rolling-origin WAPE"><MetricBarChart models={a.models} best={a.best_model} metric="cv_wape" /></Panel>
        <Panel title="Rolling-origin MAPE"><MetricBarChart models={a.models} best={a.best_model} metric="cv_mape" /></Panel>
      </div>
      <Panel className="mt-5" title="Actual vs predicted" description="Actual monthly sales against the model's predictions in each test window." action={
        <div className="flex flex-wrap gap-1">
          {a.models.map((m) => (
            <button key={m.key} onClick={() => setSel(m.key)} className={cn("rounded-md px-2.5 py-1 text-xs", m.key === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{m.name}</button>
          ))}
        </div>
      }>
        <ActualVsPredictedChart a={a} model={model} />
      </Panel>
      <Panel className="mt-5" title={`${model.name}: window by window`}>
        <MiniTable
          head={["Test window", "Actual", "Predicted", "MAPE", "WAPE"]}
          rows={model.folds.map((f) => [
            `${monthLabel(f.test_months[0])} to ${monthLabel(f.test_months[f.test_months.length - 1])}`,
            fmtUnits(f.actual.reduce((s, v) => s + v, 0), 1),
            fmtUnits(f.pred.reduce((s, v) => s + v, 0), 1),
            fmtPct(f.mape), fmtPct(f.wape),
          ])}
        />
      </Panel>
      <div className="mt-5">
        <Note>
          Why {a.models.find((m) => m.key === a.best_model)!.name} wins: it has the lowest error across all test windows, not just one lucky window. The Naive baseline shows the cost of ignoring seasonality: it carries the last month forward, so it misses every seasonal turn.
        </Note>
      </div>
    </>
  );
}
