# AQUACAST AI

**Forecast Better. Produce Smarter. Distribute with Confidence.**

Monthly demand forecasting and AI business intelligence for a new flavoured-water product. It compares Naive, Seasonal Naive, SARIMA and Random Forest models with MAPE and WAPE on chronological holdouts, produces a three-month forecast with prediction intervals, and adds a Google Gemini copilot that interprets the data currently loaded in the app.

> **Assignment:** AI in Operations, Session II Lab Activity: Forecasting Monthly Sales for a New Beverage Product
> **Student:** Atharva Soundankar · **Roll number:** AS25DXB020 · **Programme:** MAIB, September 2025 · SP Jain School of Global Management · **Instructor:** Dr. Sandip Kumar Roy

- **Live app:** https://atharva-aquacast-ai.vercel.app
- **GitHub:** https://github.com/mercydeez/atharva-soundankar-aquacast-ai-as25dxb020
- **Google Colab notebook:** [Open in Colab](https://colab.research.google.com/github/mercydeez/atharva-soundankar-aquacast-ai-as25dxb020/blob/main/notebook/Atharva_Soundankar_AS25DXB020_Beverage_Forecasting.ipynb)
- **One-page report:** [`report/Atharva_Soundankar_AS25DXB020_Report.pdf`](report/Atharva_Soundankar_AS25DXB020_Report.pdf)

## Results (from the executed notebook)

| Model | Holdout MAPE | Holdout WAPE | Rolling-origin MAPE | Rolling-origin WAPE |
|---|---|---|---|---|
| **SARIMA (1,1,0)x(1,0,0,12)** | **2.65%** | **2.75%** | **2.29%** | **2.34%** |
| Random Forest | 8.04% | 8.00% | 5.50% | 5.21% |
| Seasonal Naive | 5.03% | 5.00% | 5.58% | 5.54% |
| Naive (baseline) | 8.02% | 8.10% | 11.93% | 12.04% |

The holdout is Feb to Apr 2023. Rolling-origin validation uses 4 consecutive 3-month windows (May 2022 to Apr 2023), with each model refit before every window.

**Three-month forecast (SARIMA, US water category units):**

| Month | Forecast | 80% interval |
|---|---|---|
| May 2023 | 747.8M | 650.2M to 845.5M |
| Jun 2023 | 766.5M | 647.3M to 885.7M |
| Jul 2023 | 787.5M | 645.5M to 929.5M |

Demand is strongly seasonal (seasonal strength 0.91): it peaks in July and is lowest in February.

## Dataset

**USDA ERS Weekly Retail Food Sales**, national file, Beverages / Water unit sales (Circana scanner data). The weekly series runs from the week ending 2018-10-07 to 2023-05-07 and is aggregated to 55 complete months (Oct 2018 to Apr 2023). See [`data/DATA_SOURCE.md`](data/DATA_SOURCE.md) for the source URLs, processing steps and the weekly-to-monthly rule.

**Important:** this is category-level national data, used as a **proxy** for the new product. It is historical (it ends in 2023), not live sales.

## Repository layout

```
notebook/   Colab notebook: the authoritative Python workflow (download, preprocessing, models, metrics, forecast, Gemini, export)
data/       processed_monthly_sales.csv (derived) and DATA_SOURCE.md
results/    results.json, the single source of truth for the web app and the PDF
scripts/    download_data.py: fetch the raw USDA file
report/     one-page PDF report
web/        Next.js app (App Router, TypeScript, Tailwind, shadcn/ui, Recharts, Vercel AI SDK)
```

## How the web app works

- **Demo data** comes from `web/src/data/results.json`, a copy of the notebook's export, so the dashboard shows exactly the notebook's numbers.
- **Uploads:** an uploaded CSV of monthly or weekly sales is validated in the browser. It is then retrained on the server (`/api/forecast`) by a TypeScript engine (Naive, Seasonal Naive, Holt-Winters, Lag Regression) using the same rolling-origin MAPE and WAPE. The app labels clearly whether you are seeing notebook results or results computed just now.
- **AI Copilot** (`/api/chat`): Gemini (`gemini-3.5-flash-lite`, overridable with `GEMINI_MODEL`) via `@ai-sdk/google`. Every question is sent with the computed analytics JSON of the active dataset, and the model is told to use only those numbers. Without `GOOGLE_GENERATIVE_AI_API_KEY`, the app shows a labelled rule-based fallback.
- **Pages:** Executive Dashboard, Data Workspace, Sales Analysis, Forecasting Lab, Model Comparison, Forecast Insights, AI Copilot, Business Planner, Reports & Methodology.

## Run locally

**Notebook** (Python 3.10+):
```bash
pip install pandas numpy scikit-learn statsmodels matplotlib requests google-genai jupyter
jupyter nbconvert --to notebook --execute notebook/Atharva_Soundankar_AS25DXB020_Beverage_Forecasting.ipynb
```
In Colab, add `GEMINI_API_KEY` under Secrets (the key icon) to enable the LLM cell, then run **Runtime > Run all**.

**Web app** (Node 20+):
```bash
cd web
cp .env.example .env.local   # then paste your Gemini key into .env.local
npm ci
npm test        # Vitest: metrics, CSV parsing, engine, parity with the notebook
npm run lint && npm run typecheck
npm run dev     # http://localhost:3000
```

## Deploy (Vercel)

Import the repository in Vercel and set **Root Directory** to `web`. Add `GOOGLE_GENERATIVE_AI_API_KEY` as an environment variable, then deploy. The Next.js framework preset is detected automatically.

## Limitations

- The data is a national category proxy, not the new product's regional sales, and it ends in May 2023.
- Weeks that cross a month boundary are split by day, which assumes sales are spread evenly within a week.
- There are no price, promotion or weather drivers, and 55 months is a small sample.
- The upload engine is a separate TypeScript implementation and does not rerun the notebook's SARIMA and Random Forest. Its Naive and Seasonal Naive results are tested for exact parity with the notebook.
