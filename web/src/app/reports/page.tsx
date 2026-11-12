"use client";

import { Download, ExternalLink } from "lucide-react";
import { useData } from "@/components/data-provider";
import { PageHeader, Panel } from "@/components/blocks";

const REPO = "https://github.com/mercydeez/atharva-soundankar-aquacast-ai-as25dxb020";
const NB = "notebook/Atharva_Soundankar_AS25DXB020_Beverage_Forecasting.ipynb";

const FILES = [
  { href: "/downloads/Atharva_Soundankar_AS25DXB020_Report.pdf", label: "One-page PDF report", note: "Methodology, metrics, forecast and recommendations" },
  { href: "/downloads/results.json", label: "results.json", note: "All notebook outputs: metrics per model and window, forecasts, metadata" },
  { href: "/downloads/processed_monthly_sales.csv", label: "processed_monthly_sales.csv", note: "Monthly water unit and dollar sales after aggregation" },
  { href: `/downloads/Atharva_Soundankar_AS25DXB020_Beverage_Forecasting.ipynb`, label: "Notebook (.ipynb)", note: "The full Python workflow, executed" },
];

const METHOD = [
  ["Data", "USDA ERS Weekly Retail Food Sales, national file, Beverages / Water, unit sales. Weekly from the week ending 7 Oct 2018 (using USDA's published 'last year' and '3 years ago' columns, cross-checked within 0.03%) to 7 May 2023."],
  ["Monthly aggregation", "A week ending on D covers D-6 to D; each day gets one seventh of the week's sales and days are summed by calendar month. Months not fully covered are dropped (May 2023)."],
  ["Features", "lag 1, 2, 3 and 12 months, 3-month rolling mean of past values, month sine and cosine, trend index. All built from past values only, so there is no leakage."],
  ["Models", "Naive (last value), Seasonal Naive (same month last year), SARIMA with order chosen by AIC on training data only, Random Forest (500 trees, seed 42, recursive 3-step forecast)."],
  ["Validation", "Chronological only. 3-month holdout (Feb to Apr 2023) plus rolling-origin validation over 4 consecutive 3-month windows, with each model refit before every window."],
  ["Metrics", "MAPE = mean(|A-F|/A) × 100, excluding zero actuals. WAPE = 100 × Σ|A-F| / Σ|A|. The best model has the lowest pooled rolling-origin WAPE."],
  ["Forecast", "The selected model is refit on all 55 months and forecasts exactly the next 3 months. SARIMA intervals are model-based; the other models use ± z × rolling-origin RMSE at each forecast step."],
  ["Uploads", "Uploaded CSVs are validated and then retrained on the server by a TypeScript engine (Naive, Seasonal Naive, Holt-Winters, Lag Regression) with the same validation and metrics. Unit tests check its parity with the notebook for Naive and Seasonal Naive."],
  ["LLM", "Google Gemini via the Vercel AI SDK. It receives the computed analytics JSON of the active dataset and is instructed not to invent numbers. If no key is set, the app shows a labelled rule-based fallback."],
];

export default function Reports() {
  const { analytics: a } = useData();
  return (
    <>
      <PageHeader eyebrow="Reports & Methodology" title="Downloads, methods and attribution" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Downloads" description="Notebook outputs for the USDA demo dataset.">
          <div className="space-y-2">
            {FILES.map((f) => (
              <a key={f.href} href={f.href} download className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 hover:border-[var(--teal)]">
                <span>
                  <span className="block text-sm font-medium">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{f.note}</span>
                </span>
                <Download className="size-4 shrink-0 text-[var(--teal)]" />
              </a>
            ))}
            {a.source === "upload" && (
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(a, null, 1)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const el = document.createElement("a");
                  el.href = url;
                  el.download = "aquacast_uploaded_results.json";
                  el.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium"
              >
                Results for your uploaded data (JSON) <Download className="size-4" />
              </button>
            )}
          </div>
        </Panel>
        <Panel title="Project links">
          <div className="space-y-2 text-sm">
            {[
              ["Open the notebook in Google Colab", `https://colab.research.google.com/github/mercydeez/atharva-soundankar-aquacast-ai-as25dxb020/blob/main/${NB}`],
              ["GitHub repository", REPO],
              ["Dataset source (USDA ERS)", "https://www.ers.usda.gov/data-products/weekly-retail-food-sales"],
              ["Dataset documentation", "https://www.ers.usda.gov/data-products/weekly-retail-food-sales/documentation"],
            ].map(([l, h]) => (
              <a key={h} href={h} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 hover:border-[var(--teal)]">
                {l} <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Atharva Soundankar · AS25DXB020 · Master of Artificial Intelligence in Business (MAIB), September 2025 · SP Jain School of Global Management · AI in Operations, Session II Lab Activity · Instructor: Dr. Sandip Kumar Roy.
          </p>
        </Panel>
      </div>
      <Panel className="mt-5" title="Methodology">
        <dl className="divide-y">
          {METHOD.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm font-semibold">{k}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel className="mt-5" title="Data attribution">
        <p className="text-sm leading-relaxed text-muted-foreground">
          USDA Economic Research Service (ERS), Weekly Retail Food Sales, based on Circana retail scanner data. The data product is discontinued (files last updated 7 July 2023). The series is category-level national water sales, used here as a proxy for a new flavoured-water product. It is not that product&apos;s sales, and it is not live data. Only derived monthly totals are redistributed in this project; the raw file is downloaded from USDA at run time.
        </p>
      </Panel>
    </>
  );
}
