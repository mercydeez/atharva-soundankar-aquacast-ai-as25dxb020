"use client";

import { useData } from "@/components/data-provider";
import { Note, PageHeader, Panel } from "@/components/blocks";
import { deterministicInsights } from "@/lib/insights";

const LIMITS_DEMO = [
  "Proxy data: national category sales for all water products, not the new flavoured water and not regional markets. A launch curve (trial, repeat, distribution build-up) is not modelled.",
  "The USDA series is discontinued and ends with the week of 7 May 2023, so the forecast covers May to July 2023. It demonstrates the method; it is not a 2026 plan.",
  "Weeks crossing a month boundary are split by day, assuming sales are spread evenly within a week.",
  "History before October 2019 comes from USDA's published 'last year' and '3 years ago' columns, verified to match the series within 0.03%.",
  "55 months is a small sample. The 2020 pandemic stock-up affects early seasonal estimates, and model rankings can shift with more data.",
  "No price, promotion or weather drivers are available at product level.",
];

export default function Insights() {
  const { analytics: a } = useData();
  const ins = deterministicInsights(a);
  return (
    <>
      <PageHeader eyebrow="Forecast Insights" title="Interpreting the results" description="Answers to the three interpretation questions from the lab brief, computed from the active dataset." />
      <div className="grid gap-5">
        <Panel title="1. How well did the model capture seasonality or trends?"><Note>{ins.seasonality}</Note></Panel>
        <Panel title="2. Which model performed best and why?"><Note>{ins.bestModel}</Note></Panel>
        <Panel title="3. What recommendations would you give the company?">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{ins.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
        </Panel>
        <Panel title="Forecast uncertainty"><Note tone="amber">{ins.uncertainty}</Note></Panel>
        {a.source === "demo" && a.llm && (
          <Panel title="Notebook LLM interpretation" description={`${a.llm.provider} (${a.llm.model}). Status in the exported results: ${a.llm.status}.`}>
            <p className="whitespace-pre-line text-sm leading-relaxed">{a.llm.text}</p>
            {a.llm.status !== "generated" && (
              <p className="mt-3 text-xs text-muted-foreground">
                The exported notebook run had no API key, so this is the notebook&apos;s labelled fallback. A live Gemini interpretation of the loaded data is on the AI Copilot page.
              </p>
            )}
          </Panel>
        )}
        <Panel title="Limitations">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {(a.source === "demo" ? LIMITS_DEMO : ["Uploaded data is used as provided after validation; quality and representativeness are the uploader's responsibility.", "The server engine uses Naive, Seasonal Naive, Holt-Winters and lag regression; the notebook's SARIMA and Random Forest are not rerun on uploads.", "Short series give unstable model rankings; prefer at least 36 months."]).map((l) => <li key={l}>{l}</li>)}
          </ul>
        </Panel>
      </div>
    </>
  );
}
