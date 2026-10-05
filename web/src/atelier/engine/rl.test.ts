import { expect, it } from 'vitest';
import { runEmt } from './emt';
import { rlSeries, vsource, waves } from './elements';

it('series RL branch: current rises as (V/R)(1 − e^{−tR/L})', () => {
  const R = 2, L = 0.02, T = 0.05, nOut = 500, sub = 20, h = T / (nOut * sub);
  const r = runEmt(2, [vsource('V', 1, 0, waves.dc(10)), rlSeries('RL', 1, 0, R, L, h)], T, nOut, sub);
  for (const k of [50, 100, 250, 500]) expect(r.i.RL[k]).toBeCloseTo(5 * (1 - Math.exp((-r.t[k] * R) / L)), 2);
});
