export type MonthPoint = { month: string; units: number; dollars?: number | null };

export type Fold = {
  train_end: string;
  test_months: string[];
  actual: number[];
  pred: number[];
  mape: number | null;
  wape: number | null;
  zero_actuals?: number;
};

export type ModelResult = {
  key: string;
  name: string;
  cv_mape: number | null;
  cv_wape: number | null;
  holdout_mape: number | null;
  holdout_wape: number | null;
  folds: Fold[];
  params?: Record<string, unknown>;
};

export type Forecast = {
  model: string;
  name: string;
  months: string[];
  point: number[];
  lo80: number[];
  hi80: number[];
  lo95: number[];
  hi95: number[];
  interval_method: string;
};

export type Eda = {
  trend_strength: number;
  seasonal_strength: number;
  seasonal_index: Record<string, number>;
  peak_month: string;
  trough_month: string;
  annual_totals: Record<string, number>;
  last12_vs_prev12_pct: number | null;
};

/** One analytics bundle drives every page, whether it came from the notebook or a fresh upload. */
export type Analytics = {
  source: "demo" | "upload";
  sourceLabel: string;
  engine: string;
  loadedAt: string;
  seriesName: string;
  meta: Record<string, unknown> & { first_month: string; last_month: string; n_months: number };
  monthly: MonthPoint[];
  eda: Eda;
  models: ModelResult[];
  best_model: string;
  selection_reason: string;
  forecast: Forecast;
  all_forecasts: Record<string, Forecast>;
  interpretation?: { seasonality_trend: string; best_model: string; recommendations: string[] };
  llm?: { provider: string; model: string; status: string; text: string };
  warnings?: string[];
};
