"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Database, LineChart, FlaskConical, Scale, Lightbulb, Bot, Factory, FileText, Droplets, Menu, X,
} from "lucide-react";
import { useData } from "./data-provider";
import { monthLabel } from "@/lib/demo";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "Executive Dashboard", icon: LayoutDashboard },
  { href: "/data", label: "Data Workspace", icon: Database },
  { href: "/analysis", label: "Sales Analysis", icon: LineChart },
  { href: "/forecast", label: "Forecasting Lab", icon: FlaskConical },
  { href: "/models", label: "Model Comparison", icon: Scale },
  { href: "/insights", label: "Forecast Insights", icon: Lightbulb },
  { href: "/assistant", label: "AI Copilot", icon: Bot },
  { href: "/planner", label: "Business Planner", icon: Factory },
  { href: "/reports", label: "Reports & Methodology", icon: FileText },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--teal)] text-white shadow-sm">
        <Droplets className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">AQUACAST AI</span>
        <span className="block text-[11px] text-muted-foreground">Beverage demand intelligence</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DataStatus() {
  const { analytics: a } = useData();
  const demo = a.source === "demo";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium", demo ? "bg-accent text-accent-foreground" : "bg-amber-50 text-amber-800")}>
        <span className={cn("size-1.5 rounded-full", demo ? "bg-[var(--teal)]" : "bg-amber-500")} />
        {demo ? "Demo: USDA ERS data, notebook results" : "Uploaded data: computed now"}
      </span>
      <span className="text-muted-foreground">
        Latest observation <b className="text-foreground">{monthLabel(a.meta.last_month)}</b> · loaded{" "}
        {new Date(a.loadedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-white lg:flex lg:flex-col lg:gap-6 lg:p-5 sticky top-0 h-screen">
        <Brand />
        <NavLinks />
        <div className="mt-auto rounded-xl border bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <b className="text-foreground">Atharva Soundankar</b> · AS25DXB020
          <br />
          MAIB, September 2025 · SP Jain School of Global Management
          <br />
          AI in Operations · Dr. Sandip Kumar Roy
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <button aria-label="Open navigation" onClick={() => setOpen((v) => !v)} className="rounded-lg border p-2">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>
        {open && (
          <div className="border-b bg-white p-3 lg:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        )}
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
        <footer className="mx-auto max-w-[1240px] px-4 pb-8 text-xs text-muted-foreground sm:px-6 lg:px-10">
          AQUACAST AI · Forecast Better. Produce Smarter. Distribute with Confidence. · Atharva Soundankar (AS25DXB020) · Data: USDA ERS Weekly
          Retail Food Sales (Circana), used as a category proxy.
        </footer>
      </div>
    </div>
  );
}
