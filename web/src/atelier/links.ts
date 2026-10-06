// Lessons ↔ Atelier: the bench that reproduces a lesson, and how the lesson's
// parameters carry over to it.

import type { Params } from '../lib/models/types';
import type { BenchDoc } from './doc';
import { TEMPLATES } from './templates';
import { weakGrid } from './templates-a5';

export interface LessonLink {
  template: string;
  /** Lesson parameters → "element.param" values on the bench. */
  map?: (p: Params) => Record<string, number>;
}

const Q400 = (CuF: number) => 2 * Math.PI * 50 * CuF * 1e-6 * 400 * 400;

export const LINKS: Record<string, LessonLink> = {
  '1.2': { template: 'rlc-step', map: (p) => ({ 'R1.R': p.R, 'L1.L': p.L, 'C1.C': p.C, 'V1.V': p.V }) },
  '1.4': { template: 'rlc-ac', map: (p) => ({ 'V1.f': p.f, 'R1.R': p.R, 'L1.L': p.L, 'C1.C': p.C, 'V1.Vpk': p.V }) },
  '2.7': { template: 'lc-filter' },
  '4.1': { template: 'line-wave', map: (p) => ({ 'LG1.len': p.km }) },
  // Lesson 4.2 closes at the angle θ0 of a sine; the bench's source is a cosine.
  '4.2': { template: 'inrush', map: (p) => ({ 'TR1.psiR': p.psiR, 'TR1.psiK': p.psiSat, 'TR1.r': p.r, 'V1.ph': p.theta0 - 90 }) },
  '4.8': { template: 'motor', map: (p) => ({ 'M1.T0': p.T0, 'M1.fan': p.type ? 0 : 1, 'M1.rr': p.Rr, 'M1.H': p.H }) },
  '5.1': { template: 'pf-grid' },
  '6.1': { template: 'buck', map: (p): Record<string, number> => (p.type ? {} : { 'Q1.D': p.D, 'Q1.fs': p.fs * 1e3, 'L1.L': p.L * 1e-6, 'C1.C': p.C * 1e-6, 'R1.R': p.R }) },
  '6.2': { template: 'rectifier', map: (p) => ({ 'PD1.alpha': p.alpha, 'G1.L': Math.max(p.Ls, 0.001) * 1e-3 }) },
  '6.3': { template: 'inverter', map: (p) => ({ 'OND1.m': p.m, 'OND1.fs': p.mf * 50 }) },
  '6.4': { template: 'lcl3', map: (p) => ({ 'Z1.L': p.L1 * 1e-3, 'Z2.L': p.L2 * 1e-3, 'OND1.fs': p.fs * 1e3, 'BC1.Q': Math.max(Q400(p.Cf), 1) }) },
  '7.1': { template: 'gfl-weak', map: (p) => ({ 'GFL1.fpll': p.fpll, 'GFL1.fc': p.fc, 'GFL1.Pset': p.Pset, 'GFL1.Qset': p.Qset, ...prefix('G1', weakGrid(p.SCR, 100e3, 400)) }) },
  '7.2': { template: 'gfm-gfl', map: (p) => ({ 'GFM1.H': p.H, 'GFL1.fpll': p.fpll, ...prefix('G1', weakGrid(p.SCR, 200e3, 400)) }) },
  '7.3': { template: 'pv-mppt', map: (p) => ({ 'PV1.G1': p.G, 'PV1.T': p.T }) },
  '7.4': { template: 'wind', map: (p) => ({ 'EOL1.v': p.v, 'EOL1.dv': p.gust }) },
  '7.5': { template: 'bess-ffr', map: (p) => ({ 'BAT1.ffr': p.mode }) },
  '7.6': { template: 'hvdc', map: (p) => ({ 'MMC2.Pset': Math.min(1.1, p.P / 500) }) },
  '8.1': { template: 'smib', map: (p) => ({ 'F1.toff': 1 + p.tc / 1000, 'SM1.P0': p.Pm, 'SM1.H': p.H }) },
  '8.4': { template: 'bess-ffr' },
  '10.1': { template: 'mv-loop' },
  // The bench earths the neutral through a resistor: isolated → a very large one; the lesson's
  // compensated case keeps the resistor of the same current limit (swap in a coil on the bench).
  '10.3': {
    template: 'mv-neutral',
    map: (p) => ({
      'RN.R': p.regime === 0 ? 1e6 : 20e3 / Math.sqrt(3) / p.In,
      'LG1.len': p.Lc / 3,
      'LG2.len': (2 * p.Lc) / 3,
      'F1.Rf': Math.min(p.Rf, 1e3),
      'P1.Is0': p.Is0,
      'P2.Is0': p.Is0,
    }),
  },
  '10.4': {
    template: 'mv-protection',
    map: (p) => ({ 'P1.Is': p.Is, 'P1.td': p.td, 'LG1.len': p.d, 'F1.toff': p.type ? 10 : 0.8, 'P1.reclose': p.reclose ? 2 : 0 }),
  },
  '8.5': { template: 'gfl-weak', map: (p) => ({ 'GFL1.fpll': p.fpll, 'GFL1.Pset': p.P, ...prefix('G1', weakGrid(p.SCR, 100e3, 400)) }) },
};

function prefix(id: string, o: Record<string, number>) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [`${id}.${k}`, v]));
}

/** The bench of a lesson, with the lesson's current parameters applied. */
export function docForLesson(lessonId: string, p: Params): BenchDoc | null {
  const link = LINKS[lessonId];
  const tpl = link && TEMPLATES.find((t) => t.id === link.template);
  if (!tpl) return null;
  const doc = tpl.doc();
  const over = link.map?.(p) ?? {};
  for (const [k, v] of Object.entries(over)) {
    const [elId, param] = k.split('.');
    const el = doc.elements.find((e) => e.id === elId);
    if (el && Number.isFinite(v)) el.params[param] = v;
  }
  doc.name = `${doc.name} (${lessonId})`;
  return doc;
}

/** Lessons that a template reproduces (for the link back from the Atelier). */
export const lessonsOf = (templateId: string) => Object.entries(LINKS).filter(([, l]) => l.template === templateId).map(([id]) => id);
