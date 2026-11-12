/** MAPE in percent. Zero actuals are excluded (undefined percentage) and counted. */
export function mape(actual: number[], pred: number[]): { value: number | null; excluded: number } {
  let sum = 0;
  let n = 0;
  let excluded = 0;
  actual.forEach((a, i) => {
    if (a === 0) {
      excluded++;
      return;
    }
    sum += Math.abs((a - pred[i]) / a);
    n++;
  });
  return { value: n ? (sum / n) * 100 : null, excluded };
}

/** WAPE = 100 * sum|actual - pred| / sum|actual|. Null when the denominator is zero. */
export function wape(actual: number[], pred: number[]): number | null {
  const denom = actual.reduce((s, a) => s + Math.abs(a), 0);
  if (denom === 0) return null;
  return (actual.reduce((s, a, i) => s + Math.abs(a - pred[i]), 0) / denom) * 100;
}

export function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
