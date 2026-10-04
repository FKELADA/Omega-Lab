// Models for Module 3 (signals and control).

import { eigenvalues, type Complex, type Mat } from '../core/linalg';
import { simulate } from '../core/lti';
import { rk4 } from '../core/ode';
import type { Model, Params, Run } from './types';

const deg = 180 / Math.PI;

/** A window that shows a response settling, oscillating, or growing — without the plot exploding. */
function windowFor(poles: Complex[], cap = 20): number {
  const maxRe = Math.max(...poles.map((p) => p.re));
  if (maxRe > 1e-6) return Math.min(cap, Math.log(40) / maxRe);
  const slow = Math.min(...poles.map((p) => -p.re).filter((v) => v > 1e-9), Infinity);
  const wmax = Math.max(...poles.map((p) => Math.abs(p.im)), 0);
  let t = isFinite(slow) ? 7 / slow : cap;
  if (wmax > 0) t = Math.max(t, (2.5 * 2 * Math.PI) / wmax);
  return Math.min(cap, Math.max(0.05, t));
}

/** Overshoot, undershoot and 2 % settling time measured on a unit-step response. */
export function stepMetrics(t: Float64Array, y: Float64Array, final = 1) {
  let max = -Infinity, min = Infinity, ts = 0;
  for (let k = 0; k < y.length; k++) {
    max = Math.max(max, y[k]);
    min = Math.min(min, y[k]);
    if (Math.abs(y[k] - final) > 0.02 * Math.abs(final)) ts = t[k];
  }
  return { overshoot: Math.max(0, (max - final) / final), undershoot: Math.max(0, -min / final), ts };
}

// ── 3.1 Second-order system with an optional zero ─────────────────────────────
//   H(s) = ωn² (1 − s/z) / (s² − 2σ s + ωn²),  poles σ ± jωd,  ωn² = σ² + ωd²,  H(0) = 1.

export interface PzInfo {
  p1: Complex;
  p2: Complex;
  wn: number;
  zeta: number;
  z: number | null;
  stable: boolean;
  /** Textbook values (no zero, underdamped). */
  osTheory: number;
  tsTheory: number;
  tpTheory: number;
  /** Measured on the simulated response. */
  os: number;
  us: number;
  ts: number;
}

function pzSystem({ sigma, wd, hasZero, z }: Params) {
  const a0 = Math.max(1e-4, sigma * sigma + wd * wd);
  const a1 = -2 * sigma;
  const zz = hasZero ? (Math.abs(z) < 0.5 ? 0.5 * Math.sign(z || 1) : z) : null;
  return {
    sys: { A: [[0, 1], [-a0, -a1]] as Mat, B: [[0], [1]] as Mat },
    c: [a0, zz === null ? 0 : -a0 / zz],
    zz,
  };
}

export const secondOrder: Model = {
  id: 'second-order',
  poles: ({ sigma, wd }) => [{ re: sigma, im: wd }, { re: sigma, im: -wd }],
  window(p) {
    return windowFor(this.poles(p), 12);
  },
  simulate(p, tEnd, n = 1500): Run {
    const { sys, c } = pzSystem(p);
    const { t, x } = simulate(sys, [0, 0], () => [1], tEnd, n);
    const y = x[0].map((v, k) => c[0] * v + c[1] * x[1][k]);
    return { t, s: { y, u: new Float64Array(n).fill(1) } };
  },
};

export function pzInfo(p: Params): PzInfo {
  const { sigma, wd } = p;
  const wn = Math.hypot(sigma, wd);
  const zeta = wn > 0 ? -sigma / wn : 1;
  const stable = sigma < 0;
  const run = secondOrder.simulate(p, secondOrder.window(p), 3000);
  const m = stepMetrics(run.t, run.s.y);
  const und = zeta > 0 && zeta < 1;
  return {
    p1: { re: sigma, im: wd },
    p2: { re: sigma, im: -wd },
    wn,
    zeta,
    z: pzSystem(p).zz,
    stable,
    osTheory: und ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0,
    tsTheory: stable ? 4 / -sigma : Infinity,
    tpTheory: wd > 0 ? Math.PI / wd : Infinity,
    os: stable ? m.overshoot : NaN,
    us: m.undershoot,
    ts: stable ? m.ts : Infinity,
  };
}

// ── 3.2 Unity feedback around K / ((1 + s/a)(1 + s/b)(1 + s/c)) ──────────────

export interface LoopInfo {
  wc: number | null; // gain crossover
  pm: number | null; // phase margin, degrees
  w180: number; // phase crossover
  gm: number; // gain margin (ratio)
  kCrit: number; // gain at which the loop becomes unstable (Routh)
  poles: Complex[];
  stable: boolean;
  ess: number; // steady-state error to a step
}

export const loopL = ({ K, a, b, c }: Params, w: number): Complex => {
  // K / Π(1 + jω/p)
  let re = K, im = 0;
  for (const p of [a, b, c]) {
    const dr = 1, di = w / p, d = dr * dr + di * di;
    [re, im] = [(re * dr + im * di) / d, (im * dr - re * di) / d];
  }
  return { re, im };
};

function loopCoeffs({ K, a, b, c }: Params) {
  // (s+a)(s+b)(s+c) + K·abc
  return { d2: a + b + c, d1: a * b + b * c + c * a, d0: a * b * c * (1 + K), num: K * a * b * c };
}

export const feedbackLoop: Model = {
  id: 'feedback-loop',
  poles(p) {
    const { d2, d1, d0 } = loopCoeffs(p);
    return eigenvalues([
      [0, 1, 0],
      [0, 0, 1],
      [-d0, -d1, -d2],
    ]);
  },
  window(p) {
    return windowFor(this.poles(p), 30);
  },
  simulate(p, tEnd, n = 2000): Run {
    const { d2, d1, d0, num } = loopCoeffs(p);
    const A = [
      [0, 1, 0],
      [0, 0, 1],
      [-d0, -d1, -d2],
    ];
    const { t, x } = simulate({ A, B: [[0], [0], [1]] }, [0, 0, 0], () => [1], tEnd, n);
    const y = x[0].map((v) => num * v);
    return { t, s: { y, r: new Float64Array(n).fill(1), e: y.map((v) => 1 - v) } };
  },
};

export function loopInfo(p: Params): LoopInfo {
  const mag = (w: number) => Math.hypot(loopL(p, w).re, loopL(p, w).im);
  const phase = (w: number) => -[p.a, p.b, p.c].reduce((s, q) => s + Math.atan(w / q), 0) * deg;
  // Both are monotonic in ω for this loop, so bisection on log ω is enough.
  const bisect = (g: (w: number) => number) => {
    let lo = Math.log(1e-4), hi = Math.log(1e6);
    if (g(Math.exp(lo)) * g(Math.exp(hi)) > 0) return null;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (g(Math.exp(lo)) * g(Math.exp(mid)) <= 0) hi = mid;
      else lo = mid;
    }
    return Math.exp((lo + hi) / 2);
  };
  const wc = bisect((w) => mag(w) - 1);
  const w180 = bisect((w) => phase(w) + 180)!;
  const { d2, d1 } = loopCoeffs(p);
  const abc = p.a * p.b * p.c;
  const poles = feedbackLoop.poles(p);
  return {
    wc,
    pm: wc === null ? null : 180 + phase(wc),
    w180,
    gm: 1 / mag(w180),
    kCrit: (d2 * d1) / abc - 1,
    poles,
    stable: poles.every((q) => q.re < 0),
    ess: 1 / (1 + p.K),
  };
}

// ── 3.3 Single machine, infinite bus: the swing equation ─────────────────────
//   dδ/dt = ωb Δω,   2H dΔω/dt = Pm − Pmax sin δ − D Δω     (pu, ωb = 2π·50)

export const WB = 2 * Math.PI * 50;
export const T_STEP = 0.2;

export interface SmibInfo {
  delta0: number; // rad
  deltaU: number; // unstable equilibrium, rad
  Ks: number; // synchronising coefficient Pmax cos δ0
  wn: number;
  fn: number;
  zeta: number;
  poles: Complex[];
  A: Mat;
  /** Measured on the nonlinear run. */
  deltaMax: number; // rad
  lostSync: boolean;
  pmClamped: boolean;
}

function smibLinear({ Pm0, Pmax, H, D }: Params) {
  const pm = Math.min(Pm0, 0.98 * Pmax);
  const delta0 = Math.asin(pm / Pmax);
  const Ks = Pmax * Math.cos(delta0);
  const A: Mat = [
    [0, WB],
    [-Ks / (2 * H), -D / (2 * H)],
  ];
  return { pm, delta0, Ks, A, B: [[0], [1 / (2 * H)]] as Mat };
}

export const smib: Model = {
  id: 'smib',
  poles: (p) => eigenvalues(smibLinear(p).A),
  window: () => 4,
  simulate(p, tEnd, n = 1600): Run {
    const { Pmax, H, D, dP } = p;
    const L = smibLinear(p);
    const pmAt = (t: number) => L.pm + (t >= T_STEP ? dP : 0);
    const nl = rk4((t, [d, w]) => [WB * w, (pmAt(t) - Pmax * Math.sin(d) - D * w) / (2 * H)], [L.delta0, 0], tEnd, n, 4);
    const lin = simulate({ A: L.A, B: L.B }, [0, 0], (t) => [t >= T_STEP - 1e-12 ? dP : 0], tEnd, n);
    const [d, w] = nl.x;
    return {
      t: nl.t,
      s: {
        delta: d.map((v) => v * deg),
        deltaLin: lin.x[0].map((v) => (v + L.delta0) * deg),
        df: w.map((v) => v * 50),
        dfLin: lin.x[1].map((v) => v * 50),
        pe: d.map((v) => Pmax * Math.sin(v)),
        pm: nl.t.map(pmAt),
      },
    };
  },
};

export function smibInfo(p: Params): SmibInfo {
  const L = smibLinear(p);
  const wn = Math.sqrt((WB * L.Ks) / (2 * p.H));
  const run = smib.simulate(p, 4, 1600);
  const deltaMax = Math.max(...run.s.delta) / deg;
  return {
    delta0: L.delta0,
    deltaU: Math.PI - L.delta0,
    Ks: L.Ks,
    wn,
    fn: wn / (2 * Math.PI),
    zeta: p.D / (4 * p.H * wn),
    poles: eigenvalues(L.A),
    A: L.A,
    deltaMax,
    lostSync: deltaMax > Math.PI,
    pmClamped: p.Pm0 > 0.98 * p.Pmax,
  };
}

// ── 3.4 Synchronous-reference-frame PLL ───────────────────────────────────────
//   v_q = V sin(φg − φ̂),   Δω̂ = Kp v_q + x_I (limited),   dx_I/dt = Ki v_q,   dφ̂/dt = Δω̂
//   Phases are relative to the nominal 50 Hz frame.

export const T_JUMP = 0.05;
export const T_FSTEP = 0.25;

export interface PllInfo {
  wn: number;
  Kp: number;
  Ki: number;
  poles: Complex[];
  /** Steady-state phase error after the frequency step, degrees. */
  essFreq: number;
}

export function pllGains({ fn, zeta, type }: Params) {
  const wn = 2 * Math.PI * fn;
  // V = 1 pu. PI: s² + Kp s + Ki = s² + 2ζωn s + ωn².  P only: first order at the same bandwidth.
  return type === 1 ? { wn, Kp: 2 * zeta * wn, Ki: wn * wn } : { wn, Kp: wn, Ki: 0 };
}

/** Grid phase relative to the nominal frame: a jump of Δφ at T_JUMP, then a frequency step Δf at T_FSTEP. */
export const phiGrid = ({ dphi, df }: Params, t: number) =>
  (t >= T_JUMP ? dphi / deg : 0) + (t >= T_FSTEP ? 2 * Math.PI * df * (t - T_FSTEP) : 0);

export const pll: Model = {
  id: 'pll',
  poles(p) {
    const { Kp, Ki } = pllGains(p);
    if (!Ki) return [{ re: -Kp, im: 0 }];
    return eigenvalues([
      [0, 1],
      [-Ki, -Kp],
    ]);
  },
  window: () => 0.5,
  simulate(p, tEnd, n = 2000): Run {
    const { df, lim, antiwindup } = p;
    const { Kp, Ki } = pllGains(p);
    const wmax = 2 * Math.PI * lim;
    const phiG = (t: number) => phiGrid(p, t);
    const out = (t: number, x: number[]) => {
      const vq = Math.sin(phiG(t) - x[0]);
      const raw = Kp * vq + x[1];
      const w = Math.max(-wmax, Math.min(wmax, raw));
      return { vq, raw, w };
    };
    const sol = rk4(
      (t, x) => {
        const { vq, raw, w } = out(t, x);
        const saturated = raw !== w;
        // Conditional integration: stop integrating when it would push further into the limit.
        const hold = antiwindup && saturated && Math.sign(Ki * vq) === Math.sign(raw);
        return [w, hold ? 0 : Ki * vq];
      },
      [0, 0],
      tEnd,
      n,
      5,
    );
    const err = new Float64Array(n), fhat = new Float64Array(n), vq = new Float64Array(n), fg = new Float64Array(n);
    sol.t.forEach((t, k) => {
      const x = [sol.x[0][k], sol.x[1][k]];
      const o = out(t, x);
      err[k] = (phiG(t) - x[0]) * deg;
      fhat[k] = o.w / (2 * Math.PI);
      vq[k] = o.vq;
      fg[k] = t >= T_FSTEP ? df : 0;
    });
    return { t: sol.t, s: { err, fhat, fg, vq } };
  },
};

export function pllInfo(p: Params): PllInfo {
  const g = pllGains(p);
  return {
    ...g,
    poles: pll.poles(p),
    // P only: phase error settles at Δω / Kp (type-1 loop); with PI it goes to zero.
    essFreq: g.Ki ? 0 : ((2 * Math.PI * p.df) / g.Kp) * deg,
  };
}
