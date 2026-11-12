"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { demoAnalytics } from "@/lib/demo";
import type { Analytics, MonthPoint } from "@/lib/types";

type Ctx = {
  analytics: Analytics;
  busy: boolean;
  error: string | null;
  uploadSeries: (points: MonthPoint[], label: string, notes: string[]) => Promise<void>;
  resetDemo: () => void;
};

const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const demo = useMemo(() => demoAnalytics(), []);
  const [analytics, setAnalytics] = useState<Analytics>(demo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadSeries = useCallback(async (points: MonthPoint[], label: string, notes: string[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points, label }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Forecast failed");
      const a: Analytics = { ...body, warnings: notes };
      setAnalytics(a); // held in memory for this browser session only
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const resetDemo = useCallback(() => {
    setAnalytics(demo);
    setError(null);
  }, [demo]);

  return <DataContext.Provider value={{ analytics, busy, error, uploadSeries, resetDemo }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
