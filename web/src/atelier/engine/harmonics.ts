// Measurements on a simulated signal over whole periods of the fundamental:
// mean, RMS, peak, harmonic spectrum and THD, as a power analyser does.

export interface Window {
  /** First and last sample index (inclusive) of the analysed window. */
  k0: number;
  k1: number;
  periods: number;
}

/** The last whole periods of f1 in the record (at most half of it, at least one period). */
export function lastPeriods(t: Float64Array, f1: number): Window | null {
  const T = t[t.length - 1];
  if (!(f1 > 0) || T * f1 < 1) return null;
  const periods = Math.max(1, Math.floor((T * f1) / 2));
  const tStart = T - periods / f1;
  let k0 = 0;
  while (k0 < t.length - 1 && t[k0] < tStart - 1e-12) k0++;
  return { k0, k1: t.length - 1, periods };
}

export interface Stats {
  mean: number;
  rms: number;
  peak: number;
  pp: number;
}

/** Trapezoidal averages over [k0, k1]. */
export function stats(t: Float64Array, y: Float64Array, w: { k0: number; k1: number }): Stats {
  let s1 = 0, s2 = 0, peak = 0, lo = Infinity, hi = -Infinity;
  for (let k = w.k0; k <= w.k1; k++) {
    if (k > w.k0) {
      const dt = t[k] - t[k - 1];
      s1 += 0.5 * (y[k] + y[k - 1]) * dt;
      s2 += 0.5 * (y[k] ** 2 + y[k - 1] ** 2) * dt;
    }
    peak = Math.max(peak, Math.abs(y[k]));
    lo = Math.min(lo, y[k]);
    hi = Math.max(hi, y[k]);
  }
  const D = t[w.k1] - t[w.k0] || 1;
  return { mean: s1 / D, rms: Math.sqrt(Math.max(0, s2 / D)), peak, pp: hi - lo };
}

/** Mean of a product (active power from v and i). */
export function meanProduct(t: Float64Array, a: Float64Array, b: Float64Array, w: { k0: number; k1: number }): number {
  let s = 0;
  for (let k = w.k0 + 1; k <= w.k1; k++) s += 0.5 * (a[k] * b[k] + a[k - 1] * b[k - 1]) * (t[k] - t[k - 1]);
  return s / (t[w.k1] - t[w.k0] || 1);
}

export interface Spectrum {
  /** Amplitude (peak) of harmonic n, n = 0 (DC) … N. */
  amp: number[];
  /** Phase (degrees, cosine reference) of harmonic n. */
  phase: number[];
  /** Total harmonic distortion relative to the fundamental. */
  thd: number;
}

/** Fourier coefficients of y at n·f1 over a whole number of periods. */
export function spectrum(t: Float64Array, y: Float64Array, f1: number, w: Window, N = 40): Spectrum {
  const amp: number[] = [], phase: number[] = [];
  const D = t[w.k1] - t[w.k0];
  for (let n = 0; n <= N; n++) {
    const wn = 2 * Math.PI * n * f1;
    let a = 0, b = 0;
    for (let k = w.k0 + 1; k <= w.k1; k++) {
      const dt = t[k] - t[k - 1];
      a += 0.5 * (y[k] * Math.cos(wn * t[k]) + y[k - 1] * Math.cos(wn * t[k - 1])) * dt;
      b += 0.5 * (y[k] * Math.sin(wn * t[k]) + y[k - 1] * Math.sin(wn * t[k - 1])) * dt;
    }
    const scale = n === 0 ? 1 / D : 2 / D;
    amp.push(Math.hypot(a, b) * scale);
    phase.push((Math.atan2(-b, a) * 180) / Math.PI);
  }
  const h2 = amp.slice(2).reduce((s, x) => s + x * x, 0);
  return { amp, phase, thd: amp[1] > 0 ? Math.sqrt(h2) / amp[1] : NaN };
}
