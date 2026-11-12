import { describe, expect, it } from "vitest";
import results from "../data/results.json";
import { mape, wape } from "./metrics";
import { evaluate, naive, seasonalNaive, runEngine, addMonths, holtWinters } from "./engine";
import { parseSalesCsv } from "./parse";

const months = results.monthly.map((m) => m.month);
const y = results.monthly.map((m) => m.units);

describe("metrics", () => {
  it("computes MAPE and WAPE by hand", () => {
    expect(mape([100, 200], [110, 180]).value).toBeCloseTo(10, 10);
    expect(wape([100, 200], [110, 180])).toBeCloseTo((30 / 300) * 100, 10);
  });
  it("excludes zero actuals from MAPE and handles zero denominators", () => {
    const r = mape([0, 100], [5, 90]);
    expect(r.value).toBeCloseTo(10, 10);
    expect(r.excluded).toBe(1);
    expect(wape([0, 0], [1, 2])).toBeNull();
  });
});

describe("parity with the Python notebook (results.json)", () => {
  for (const [key, fn] of [["naive", naive], ["snaive", seasonalNaive]] as const) {
    it(`${key}: same fold predictions, MAPE and WAPE`, () => {
      const py = results.models.find((m) => m.key === key)!;
      const ts = evaluate(y, months, fn, results.meta.n_folds);
      ts.folds.forEach((f, i) => {
        expect(f.test_months).toEqual(py.folds[i].test_months);
        expect(f.pred).toEqual(py.folds[i].pred);
      });
      expect(ts.cv_wape!).toBeCloseTo(py.cv_wape!, 3);
      expect(ts.cv_mape!).toBeCloseTo(py.cv_mape!, 3);
    });
  }
});

describe("engine", () => {
  it("adds months across year boundaries", () => {
    expect(addMonths("2023-11", 3)).toBe("2024-02");
  });
  it("forecasts exactly three months after the last observation", () => {
    const a = runEngine(results.monthly.map((m) => ({ month: m.month, units: m.units })), "test");
    expect(a.forecast.months).toEqual(["2023-05", "2023-06", "2023-07"]);
    expect(a.forecast.point).toHaveLength(3);
    expect(a.models.every((m) => m.folds.length === 4)).toBe(true);
  });
  it("Holt-Winters reproduces a clean seasonal pattern", () => {
    const pattern = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2].map((v) => v * 10 + 100);
    const s = [...pattern, ...pattern, ...pattern];
    const f = holtWinters(s, [], 3);
    f.forEach((v, i) => expect(Math.abs(v - pattern[i])).toBeLessThan(3));
  });
  it("rejects series that are too short", () => {
    expect(() => runEngine([{ month: "2024-01", units: 1 }], "x")).toThrow(/At least/);
  });
});

describe("CSV parsing", () => {
  it("reads monthly CSVs and rejects gaps", () => {
    expect(parseSalesCsv("month,sales\n2024-01,10\n2024-02,12").points).toHaveLength(2);
    expect(() => parseSalesCsv("month,sales\n2024-01,10\n2024-03,12")).toThrow(/gap/);
  });
  it("splits weekly rows across months by day and drops partial months", () => {
    // week ending 2024-02-04 covers Jan 29 to Feb 4; Jan is partial in this file
    const rows = ["date,units"];
    let d = new Date(Date.UTC(2024, 1, 4));
    for (let i = 0; i < 6; i++) {
      rows.push(`${d.toISOString().slice(0, 10)},70`);
      d = new Date(d.getTime() + 7 * 86400000);
    }
    const r = parseSalesCsv(rows.join("\n"));
    expect(r.granularity).toBe("weekly");
    expect(r.points).toEqual([{ month: "2024-02", units: 290 }]);
  });
  it("rejects negative and non-numeric values", () => {
    expect(() => parseSalesCsv("month,sales\n2024-01,-1")).toThrow(/negative/);
    expect(() => parseSalesCsv("month,sales\n2024-01,abc")).toThrow(/not a number/);
  });
});
