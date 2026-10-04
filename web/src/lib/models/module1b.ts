// Models for lessons 1.1 (R, L, C as energy elements) and 1.5 (DC versus AC).

import { linspace } from '../core/lti';
import type { Model, Params, Run } from './types';

// ── 1.1 One element, driven by a chosen waveform ──────────────────────────────
// R and L are driven by a current source i(t); C by a voltage source v(t). The
// other quantity follows from the element law, using the analytic derivative of
// the drive, so square edges in v_L = L di/dt are exact.

export const ELEMENTS = { R: 0, L: 1, C: 2 } as const;
export const DRIVES = { triangle: 0, sine: 1, trapezoid: 2 } as const;

/** Drive x(t) and its derivative, for amplitude A and frequency f. `rise` is the trapezoid edge time. */
export function drive(kind: number, A: number, f: number, rise: number, t: number): [number, number] {
  const T = 1 / f;
  const w = 2 * Math.PI * f;
  const ph = (((t % T) + T) % T) / T; // 0..1
  switch (kind) {
    case DRIVES.sine:
      return [A * Math.sin(w * t), A * w * Math.cos(w * t)];
    case DRIVES.triangle: {
      // 0 → A at ¼, → −A at ¾, → 0 at 1
      const s = 4 * A * f;
      if (ph < 0.25) return [s * ph * T, s];
      if (ph < 0.75) return [A - s * (ph - 0.25) * T, -s];
      return [-A + s * (ph - 0.75) * T, s];
    }
    default: {
      // Trapezoid: rise to A over `rise`, hold, fall to −A over 2·rise, hold, back to 0.
      const tt = ph * T;
      const r = Math.min(rise, T / 8);
      const s = A / r;
      if (tt < r) return [s * tt, s];
      if (tt < T / 2 - r) return [A, 0];
      if (tt < T / 2 + r) return [A - s * (tt - (T / 2 - r)), -s];
      if (tt < T - r) return [-A, 0];
      return [-A + s * (tt - (T - r)), s];
    }
  }
}

export interface ElementInfo {
  driven: 'i' | 'v';
  wMax: number; // peak stored energy (L, C) or energy per period (R)
  vPeak: number;
  iPeak: number;
}

export const element: Model = {
  id: 'element',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd, n = 1600): Run {
    const { el, wave, A, f, R, L, C, rise } = p;
    const t = linspace(0, tEnd, n);
    const v = new Float64Array(n), i = new Float64Array(n), w = new Float64Array(n), pw = new Float64Array(n);
    let wR = 0;
    t.forEach((tt, k) => {
      const [x, dx] = drive(wave, A, f, rise, tt);
      if (el === ELEMENTS.C) {
        v[k] = x;
        i[k] = C * dx;
      } else {
        i[k] = x;
        v[k] = el === ELEMENTS.L ? L * dx : R * x;
      }
      pw[k] = v[k] * i[k];
      if (el === ELEMENTS.R) {
        if (k) wR += 0.5 * (pw[k] + pw[k - 1]) * (t[k] - t[k - 1]);
        w[k] = wR;
      } else {
        w[k] = el === ELEMENTS.L ? 0.5 * L * i[k] * i[k] : 0.5 * C * v[k] * v[k];
      }
    });
    return { t, s: { v, i, p: pw, w } };
  },
};

export function elementInfo(p: Params): ElementInfo {
  const run = element.simulate(p, element.window(p), 1600);
  return {
    driven: p.el === ELEMENTS.C ? 'v' : 'i',
    wMax: Math.max(...run.s.w),
    vPeak: Math.max(...run.s.v.map(Math.abs)),
    iPeak: Math.max(...run.s.i.map(Math.abs)),
  };
}

// ── 1.5 DC versus AC ──────────────────────────────────────────────────────────
// Illustrative relative costs (per GW of transfer) and textbook line constants.
// The shapes (fixed terminal cost, cost per km, break-even distance) are the point,
// not the absolute numbers.

export const MEDIA = { overhead: 0, cable: 1 } as const;
export const COST = {
  [MEDIA.overhead]: { ac: { terminal: 50, perKm: 1.0 }, dc: { terminal: 250, perKm: 0.6 } },
  [MEDIA.cable]: { ac: { terminal: 50, perKm: 4.0 }, dc: { terminal: 250, perKm: 2.0 } },
} as const;
/** Shunt capacitance per km and per phase, F/km. */
export const CAP_PER_KM = { [MEDIA.overhead]: 0.012e-6, [MEDIA.cable]: 0.2e-6 } as const;
export const I_RATED = 1500; // A, thermal rating of one AC circuit

export interface DcAcInfo {
  costAC: number;
  costDC: number;
  breakEven: number; // km
  chargingPerKm: number; // A/km
  criticalKm: number; // AC length at which charging current reaches the rating
  usableAC: number; // fraction of the rating left for real power at the receiving end
  dcWins: boolean;
  powerRatio: number; // P_DC / P_AC for the same insulation (peak voltage) and RMS current
}

export function dcAcInfo({ km, medium, kV }: Params): DcAcInfo {
  const c = COST[medium as 0 | 1];
  const costAC = c.ac.terminal + c.ac.perKm * km;
  const costDC = c.dc.terminal + c.dc.perKm * km;
  const breakEven = (c.dc.terminal - c.ac.terminal) / (c.ac.perKm - c.dc.perKm);
  const Vph = (kV * 1e3) / Math.sqrt(3);
  const chargingPerKm = 2 * Math.PI * 50 * CAP_PER_KM[medium as 0 | 1] * Vph;
  const criticalKm = I_RATED / chargingPerKm;
  // Charging current adds in quadrature with the load current: I_load = √(I² − I_c²).
  const Ic = Math.min(I_RATED, chargingPerKm * km);
  return {
    costAC,
    costDC,
    breakEven,
    chargingPerKm,
    criticalKm,
    usableAC: Math.sqrt(Math.max(0, 1 - (Ic / I_RATED) ** 2)),
    dcWins: costDC < costAC || km > criticalKm,
    powerRatio: Math.SQRT2,
  };
}

export const dcAc: Model = {
  id: 'dc-ac',
  poles: () => [],
  window: () => 0.04,
  simulate(p, tEnd, n = 800): Run {
    // Same insulation: both voltages peak at the line's insulation level.
    const Vp = p.kV * 1e3;
    const t = linspace(0, tEnd, n);
    return {
      t,
      s: {
        vac: t.map((tt) => Vp * Math.sin(2 * Math.PI * 50 * tt)),
        vacRms: new Float64Array(n).fill(Vp / Math.SQRT2),
        vdc: new Float64Array(n).fill(Vp),
      },
    };
  },
};
