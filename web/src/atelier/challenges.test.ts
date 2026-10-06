import { describe, expect, it } from 'vitest';
import { CHALLENGES } from './challenges';
import { circuitEquations } from './circuitEqs';
import { compile } from './compile';

const ui = () => ({ selected: () => null, bodeIn: () => null, zAt: () => null });
const goal = (id: string, over: Record<string, number> = {}) => {
  const c = CHALLENGES.find((x) => x.id === id)!;
  const { exp, net } = compile(c.doc(), ui(), circuitEquations);
  const p = { ...Object.fromEntries(exp.params.map((q) => [q.id, q.default])), ...over };
  return c.goal({ run: exp.model.simulate(p, p.T), p, net });
};

/** A known solution for each challenge (only editable parameters). */
const SOLUTIONS: Record<string, Record<string, number>> = {
  'ch-critical': { 'R1.R': 20 },
  'ch-thd': { 'L1.L': 0.05, 'C1.C': 2e-4 },
  'ch-buck': { 'Q1.D': 0.25 },
  'ch-var': { 'BC1.Q': 11e6 },
  'ch-fault': { 'SM1.E0': 1.5 },
  'ch-bess': { 'BAT1.ffr': 1 },
  'ch-petersen': { 'LN.L': 0.225 },
  'ch-grading': { 'P1.td': 0.4, 'P1.reclose': 1 },
};

describe('Atelier challenges', () => {
  for (const c of CHALLENGES)
    it(`${c.id}: not met at the start, met by a known solution`, () => {
      expect(goal(c.id).ok).toBe(false);
      const sol = SOLUTIONS[c.id];
      expect(sol, 'every challenge needs a solution in this test').toBeDefined();
      for (const k of Object.keys(sol)) {
        const [el, q] = k.split('.');
        expect(c.editable[el]?.includes(q), `${k} must be editable`).toBe(true);
      }
      const g = goal(c.id, sol);
      expect(g.ok, g.status.fr).toBe(true);
    });

  it('every locked element exists in its starting bench', () => {
    for (const c of CHALLENGES) {
      const ids = c.doc().elements.map((e) => e.id);
      for (const id of c.locked) expect(ids, c.id).toContain(id);
    }
  });
});
