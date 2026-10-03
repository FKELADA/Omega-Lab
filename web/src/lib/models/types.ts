import type { Complex } from '../core/linalg';

export type Params = Record<string, number>;

/** One simulation: a shared time grid and named signals sampled on it. */
export interface Run {
  t: Float64Array;
  s: Record<string, Float64Array>;
}

/**
 * A model the lab can drive. Every lesson experiment points at one model;
 * later modules add models backed by the G2ELin API behind the same interface.
 */
export interface Model {
  id: string;
  simulate(p: Params, tEnd: number, n?: number): Run;
  poles(p: Params): Complex[];
  /** A time window that shows the whole transient. */
  window(p: Params): number;
}
