"use client";

import { cn } from "@/lib/utils";
import { DataStatus } from "./app-shell";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--teal)]">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
          {description && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <DataStatus />
    </div>
  );
}

export function Panel({ title, description, children, className, action }: { title?: string; description?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,31,61,0.04)] sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, note, tone = "default" }: { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: "default" | "teal" | "amber" | "risk" }) {
  const color = { default: "text-foreground", teal: "text-[var(--teal)]", amber: "text-[var(--amber)]", risk: "text-[var(--risk)]" }[tone];
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,31,61,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-2 text-[26px] font-semibold leading-none tracking-tight", color)}>{value}</p>
      {note && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  );
}

export function Note({ children, tone = "teal" }: { children: React.ReactNode; tone?: "teal" | "amber" }) {
  return (
    <div className={cn("rounded-xl border-l-[3px] bg-card px-4 py-3 text-sm leading-relaxed text-foreground/85 border", tone === "teal" ? "border-l-[var(--teal)]" : "border-l-[var(--amber)]")}>
      {children}
    </div>
  );
}

export function MiniTable({ head, rows, highlight }: { head: string[]; rows: React.ReactNode[][]; highlight?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabular w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} className={cn("py-2 pr-4 font-semibold", i > 0 && "text-right")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn("border-b last:border-0", highlight === i && "bg-accent/60")}>
              {r.map((c, j) => (
                <td key={j} className={cn("py-2.5 pr-4", j > 0 && "text-right")}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
