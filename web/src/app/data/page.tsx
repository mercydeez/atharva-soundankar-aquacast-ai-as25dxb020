"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, RotateCcw, Download } from "lucide-react";
import { useData } from "@/components/data-provider";
import { MiniTable, Note, PageHeader, Panel } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { fmtUnits, monthLabel } from "@/lib/demo";
import { parseSalesCsv } from "@/lib/parse";
import { MIN_MONTHS } from "@/lib/engine";

export default function DataWorkspace() {
  const { analytics: a, uploadSeries, resetDemo, busy, error } = useData();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [year, setYear] = useState<string>("All");
  const input = useRef<HTMLInputElement>(null);
  const years = useMemo(() => ["All", ...Array.from(new Set(a.monthly.map((m) => m.month.slice(0, 4))))], [a]);
  const rows = a.monthly.filter((m) => year === "All" || m.month.startsWith(year)).slice().reverse();
  const meta = a.meta as Record<string, unknown>;

  async function onFile(f: File) {
    setMsg(null);
    try {
      const parsed = parseSalesCsv(await f.text());
      if (parsed.points.length < MIN_MONTHS) throw new Error(`Only ${parsed.points.length} complete months found; at least ${MIN_MONTHS} are needed.`);
      await uploadSeries(parsed.points, `Uploaded: ${f.name} (${parsed.granularity}, ${parsed.points.length} months)`, parsed.notes);
      setMsg({ ok: true, text: `Loaded ${parsed.points.length} complete months from ${f.name}. All models were retrained. ${parsed.notes.join(" ")}` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <PageHeader eyebrow="Data Workspace" title="Dataset, validation and uploads" description="Inspect the source data, check how it was validated, or upload your own monthly or weekly sales to retrain every model." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Source">
          {a.source === "demo" ? (
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Dataset</dt>
              <dd>{String(meta.source_name)}</dd>
              <dt className="text-muted-foreground">Series</dt>
              <dd>{String(meta.series)}</dd>
              <dt className="text-muted-foreground">Publisher</dt>
              <dd>{String(meta.publisher)}</dd>
              <dt className="text-muted-foreground">Source page</dt>
              <dd>
                <a className="text-[var(--teal)] underline-offset-2 hover:underline" href={String(meta.source_page)} target="_blank" rel="noreferrer">
                  ers.usda.gov/data-products/weekly-retail-food-sales
                </a>
              </dd>
              <dt className="text-muted-foreground">Downloaded</dt>
              <dd>{String(meta.download_date)}</dd>
              <dt className="text-muted-foreground">Weekly coverage</dt>
              <dd>Week ending {String(meta.first_week_ending)} to {String(meta.last_week_ending)}</dd>
            </dl>
          ) : (
            <p className="text-sm">{a.sourceLabel}</p>
          )}
          <div className="mt-4">
            <Note tone="amber">
              {a.source === "demo"
                ? String(meta.proxy_note)
                : "This is your uploaded data. Models were trained by the AQUACAST TypeScript engine on the server just now; the notebook's SARIMA and Random Forest are used only for the USDA demo data."}
            </Note>
          </div>
        </Panel>
        <Panel title="Validation summary">
          <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Complete months</dt>
            <dd>
              {a.meta.n_months} ({monthLabel(a.meta.first_month)} to {monthLabel(a.meta.last_month)})
            </dd>
            <dt className="text-muted-foreground">Partial months dropped</dt>
            <dd>{Array.isArray(meta.dropped_partial_months) ? (meta.dropped_partial_months as string[]).join(", ") || "None" : "See notes"}</dd>
            <dt className="text-muted-foreground">Missing / negative values</dt>
            <dd>None (rejected on load)</dd>
            <dt className="text-muted-foreground">Weekly to monthly rule</dt>
            <dd>Week ending D covers D-6 to D; split by day</dd>
            <dt className="text-muted-foreground">Mode</dt>
            <dd>{a.source === "demo" ? "Notebook results (Python)" : "Computed now (server engine)"}</dd>
          </dl>
          {a.warnings && a.warnings.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{a.warnings.join(" ")}</p>}
        </Panel>
      </div>

      <Panel className="mt-5" title="Upload your own sales data" description={`CSV with a date column (month, date or week) and a sales column (units or sales). Monthly rows like 2024-01, or weekly week-ending dates. At least ${MIN_MONTHS} complete months. The file is processed for this session only and is not stored on a server.`}>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Button onClick={() => input.current?.click()} disabled={busy}>
            <Upload className="size-4" /> {busy ? "Training models..." : "Upload CSV"}
          </Button>
          <Button variant="outline" onClick={() => { resetDemo(); setMsg({ ok: true, text: "Restored the USDA demo dataset and notebook results." }); }} disabled={busy || a.source === "demo"}>
            <RotateCcw className="size-4" /> Reset to demo data
          </Button>
          <a href="/downloads/processed_monthly_sales.csv" download className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--teal)] hover:underline">
            <Download className="size-4" /> Example file (demo monthly CSV)
          </a>
        </div>
        {(msg || error) && (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg?.ok ? "bg-accent text-accent-foreground" : "bg-red-50 text-red-800"}`}>{msg?.text ?? error}</p>
        )}
      </Panel>

      <Panel className="mt-5" title="Monthly data" description="Newest first." action={
        <div className="flex flex-wrap gap-1">
          {years.map((y) => (
            <button key={y} onClick={() => setYear(y)} className={`rounded-md px-2.5 py-1 text-xs ${y === year ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{y}</button>
          ))}
        </div>
      }>
        <div className="max-h-[440px] overflow-y-auto">
          <MiniTable head={["Month", "Units", "Dollars", "Avg price"]} rows={rows.map((m) => [monthLabel(m.month), m.units.toLocaleString("en-US"), m.dollars ? `$${fmtUnits(m.dollars, 1)}` : "n/a", m.dollars ? `$${(m.dollars / m.units).toFixed(2)}` : "n/a"])} />
        </div>
      </Panel>
    </>
  );
}
