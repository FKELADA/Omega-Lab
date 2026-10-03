// A periodic voltage source across a resistor: the setting for RMS and AC power.
// Purely algebraic — no states — but it runs through the same Model interface so
// the oscilloscope, prediction and equations work unchanged.

import type { Model, Params, Run } from './types';
import { linspace } from '../core/lti';

export const SHAPES = { sine: 0, square: 1, triangle: 2, dc: 3 } as const;

/** v(t)/V̂ for each shape. */
export function shapeValue(shape: number, theta: number): number {
  switch (shape) {
    case SHAPES.square:
      return Math.sin(theta) >= 0 ? 1 : -1;
    case SHAPES.triangle:
      return (2 / Math.PI) * Math.asin(Math.sin(theta));
    case SHAPES.dc:
      return 1;
    default:
      return Math.sin(theta);
  }
}

export interface WaveformInfo {
  rms: number; // V_rms
  meanAbs: number; // mean of |v|
  crest: number; // V̂ / V_rms
  form: number; // V_rms / mean|v|
  P: number; // average power in R
  /** What an average-responding meter calibrated for sine waves would display. */
  avgMeter: number;
}

/** Exact RMS and rectified-mean factors (multiples of V̂). */
const FACTORS: Record<number, { rms: number; meanAbs: number }> = {
  [SHAPES.sine]: { rms: Math.SQRT1_2, meanAbs: 2 / Math.PI },
  [SHAPES.square]: { rms: 1, meanAbs: 1 },
  [SHAPES.triangle]: { rms: 1 / Math.sqrt(3), meanAbs: 0.5 },
  [SHAPES.dc]: { rms: 1, meanAbs: 1 },
};

/** Sine form factor π/(2√2): the scale an average-responding meter applies. */
export const SINE_FORM_FACTOR = Math.PI / (2 * Math.SQRT2);

export function waveformInfo({ shape, V, R }: Params): WaveformInfo {
  const f = FACTORS[shape] ?? FACTORS[SHAPES.sine];
  const rms = f.rms * V;
  const meanAbs = f.meanAbs * V;
  return {
    rms,
    meanAbs,
    crest: V / rms,
    form: rms / meanAbs,
    P: (rms * rms) / R,
    avgMeter: SINE_FORM_FACTOR * meanAbs,
  };
}

export const waveform: Model = {
  id: 'waveform',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd, n = 1600): Run {
    const { shape, V, R, f } = p;
    const t = linspace(0, tEnd, n);
    const v = t.map((tt) => V * shapeValue(shape, 2 * Math.PI * f * tt));
    const i = v.map((x) => x / R);
    const k = waveformInfo(p);
    return {
      t,
      s: {
        v,
        i,
        p: v.map((x) => (x * x) / R),
        P: new Float64Array(n).fill(k.P),
        vrms: new Float64Array(n).fill(k.rms),
      },
    };
  },
};
