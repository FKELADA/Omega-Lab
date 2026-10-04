// Module 6 — Power electronics at switching level: DC–DC choppers (switched,
// CCM and DCM), the six-pulse thyristor bridge with commutation overlap,
// carrier-based PWM (sine, third-harmonic, space-vector), and a grid inverter
// with an LCL filter (switched against averaged).

import type { Complex } from '../core/linalg';
import { cabs, cdiv, cmul, cx } from '../core/linalg';
import { linspace, simulate } from '../core/lti';
import type { Model, Params, Run } from './types';

const deg = Math.PI / 180;
const W50 = 2 * Math.PI * 50;

/** Amplitude and phase of harmonic h of a signal sampled over a whole number of fundamental periods. */
export function harmonic(y: ArrayLike<number>, t: ArrayLike<number>, f1: number, h: number): { amp: number; phase: number } {
  let a = 0, b = 0;
  const n = y.length;
  for (let k = 0; k < n - 1; k++) {
    const dt = t[k + 1] - t[k];
    const w = 2 * Math.PI * f1 * h * t[k];
    a += y[k] * Math.cos(w) * dt;
    b += y[k] * Math.sin(w) * dt;
  }
  const T = t[n - 1] - t[0];
  return { amp: (2 / T) * Math.hypot(a, b), phase: Math.atan2(a, b) };
}

// ── 6.1 Choppers ─────────────────────────────────────────────────────────────

export const CHOPPER = { Vin: 48, periods: 10, perPeriod: 120 };
export const CONVERTERS = { buck: 0, boost: 1, buckboost: 2 } as const;

/** Ideal CCM conversion ratio Vout/Vin. */
export const idealRatio = (type: number, D: number) => (type === CONVERTERS.buck ? D : type === CONVERTERS.boost ? 1 / (1 - D) : D / (1 - D));

/** Critical inductance at the CCM/DCM boundary. */
export const Lcrit = (type: number, D: number, R: number, fs: number) =>
  ((type === CONVERTERS.buck ? 1 - D : type === CONVERTERS.boost ? D * (1 - D) ** 2 : (1 - D) ** 2) * R) / (2 * fs);

export interface ChopperInfo {
  Vout: number;
  Iout: number;
  IL: number;
  dIL: number; // peak-to-peak inductor ripple
  dV: number; // peak-to-peak output ripple
  dcm: boolean;
  ratio: number; // measured Vout/Vin
  ideal: number;
  Lcrit: number;
}

/** States [iL, vC] over one switching step; q = 1 while the switch is on. DCM clamps iL at 0. */
function chopperDeriv(type: number, q: number, iL: number, vC: number, p: { L: number; C: number; R: number; Vin: number }): [number, number] {
  const { L, C, R, Vin } = p;
  if (q) {
    if (type === CONVERTERS.buck) return [(Vin - vC) / L, (iL - vC / R) / C];
    return [Vin / L, -vC / (R * C)];
  }
  if (iL <= 0) return [0, (type === CONVERTERS.buck ? 0 : 0) - vC / (R * C)];
  if (type === CONVERTERS.boost) return [(Vin - vC) / L, (iL - vC / R) / C];
  return [-vC / L, (iL - vC / R) / C];
}

function chopperRun(p: Params) {
  const type = p.type, D = p.D, fs = p.fs * 1e3, L = p.L * 1e-6, C = p.C * 1e-6, R = p.R;
  const prm = { L, C, R, Vin: CHOPPER.Vin };
  const Ts = 1 / fs, N = CHOPPER.perPeriod, dt = Ts / N;
  const on = Math.round(D * N);
  // Start near the CCM operating point, then let it settle before recording.
  const M = idealRatio(type, D);
  let vC = CHOPPER.Vin * M;
  let iL = type === CONVERTERS.buck ? vC / R : (vC / R) * (1 + M);
  const settle = Math.min(4000, Math.max(200, Math.ceil((12 * Math.max(R * C, Math.sqrt(L * C))) / Ts)));
  const total = settle + CHOPPER.periods;
  const rec = { t: [] as number[], iL: [] as number[], v: [] as number[], q: [] as number[], vL: [] as number[] };
  for (let k = 0; k < total; k++) {
    for (let j = 0; j < N; j++) {
      const q = j < on ? 1 : 0;
      // Midpoint step, adequate at 120 steps per period.
      const [a1, b1] = chopperDeriv(type, q, iL, vC, prm);
      const [a2, b2] = chopperDeriv(type, q, iL + (a1 * dt) / 2, vC + (b1 * dt) / 2, prm);
      iL += a2 * dt;
      vC += b2 * dt;
      if (iL < 0) iL = 0; // the diode blocks reverse current
      if (k >= settle) {
        const t = (k - settle) * Ts + (j + 1) * dt;
        rec.t.push(t);
        rec.iL.push(iL);
        rec.v.push(vC);
        rec.q.push(q);
        const vL = q ? (type === CONVERTERS.buck ? CHOPPER.Vin - vC : CHOPPER.Vin) : iL > 0 ? (type === CONVERTERS.boost ? CHOPPER.Vin - vC : -vC) : 0;
        rec.vL.push(vL);
      }
    }
  }
  return rec;
}

export function chopperInfo(p: Params): ChopperInfo {
  const r = chopperRun(p);
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const Vout = avg(r.v);
  const minIL = Math.min(...r.iL);
  return {
    Vout,
    Iout: Vout / p.R,
    IL: avg(r.iL),
    dIL: Math.max(...r.iL) - minIL,
    dV: Math.max(...r.v) - Math.min(...r.v),
    dcm: minIL < 1e-6,
    ratio: Vout / CHOPPER.Vin,
    ideal: idealRatio(p.type, p.D),
    Lcrit: Lcrit(p.type, p.D, p.R, p.fs * 1e3),
  };
}

export const chopper: Model = {
  id: 'chopper',
  poles: () => [],
  window: (p) => CHOPPER.periods / (p.fs * 1e3),
  simulate(p): Run {
    const r = chopperRun(p);
    const f = (a: number[]) => Float64Array.from(a);
    return { t: f(r.t), s: { iL: f(r.iL), vout: f(r.v), q: f(r.q), vL: f(r.vL) } };
  },
};

// ── 6.2 Six-pulse thyristor bridge ───────────────────────────────────────────

export const BRIDGE = { VLL: 400, f: 50 };

/** Overlap angle (rad) from cos α − cos(α + μ) = 2ωLs·Id / (√2 VLL); null = commutation failure. */
export function overlap(alphaDeg: number, LsmH: number, Id: number): number | null {
  const a = alphaDeg * deg;
  const c = Math.cos(a) - (2 * W50 * LsmH * 1e-3 * Id) / (Math.SQRT2 * BRIDGE.VLL);
  if (c < -1) return null;
  return Math.acos(c) - a;
}

export interface BridgeInfo {
  Vd: number; // average DC voltage
  Vd0: number; // 1.35 VLL
  mu: number; // overlap, degrees
  failed: boolean;
  P: number; // DC power, kW
  h: { h: number; pct: number }[]; // phase-current harmonics, % of fundamental
  thd: number;
  dpf: number; // displacement power factor
  pf: number;
}

/** Phase voltages, DC voltage and phase currents at one angle θ (rad) of va = √2·Vph·sin θ. */
export function bridgeAt(theta: number, alpha: number, mu: number, Id: number) {
  const Vm = (Math.SQRT2 * BRIDGE.VLL) / Math.sqrt(3);
  const v = [Vm * Math.sin(theta), Vm * Math.sin(theta - 120 * deg), Vm * Math.sin(theta + 120 * deg)];
  const group = (events: [number, number, number][]) => {
    let best = events[0], phi = Infinity;
    for (const e of events) {
      const ph = (((theta - e[0] * deg - alpha) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (ph < phi) [phi, best] = [ph, e];
    }
    const [, from, to] = best;
    const i = [0, 0, 0];
    if (phi < mu) {
      const s = (Math.cos(alpha) - Math.cos(alpha + phi)) / (Math.cos(alpha) - Math.cos(alpha + mu) || 1e-9);
      i[to] = Id * s;
      i[from] = Id * (1 - s);
      return { v: (v[from] + v[to]) / 2, i };
    }
    i[to] = Id;
    return { v: v[to], i };
  };
  // Positive group (highest phase): c→a at 30°, a→b at 150°, b→c at 270°.
  const pos = group([[30, 2, 0], [150, 0, 1], [270, 1, 2]]);
  // Negative group (lowest phase): b→c at 90°, c→a at 210°, a→b at 330°.
  const neg = group([[90, 1, 2], [210, 2, 0], [330, 0, 1]]);
  return { va: v[0], vd: pos.v - neg.v, ia: pos.i[0] - neg.i[0], top: pos.i, bottom: neg.i, v };
}

function bridgeRun(p: Params, n = 2400, cycles = 2) {
  const alpha = p.alpha * deg;
  const mu0 = overlap(p.alpha, p.Ls, p.Id);
  const mu = mu0 ?? 60 * deg;
  const t = linspace(0, cycles / BRIDGE.f, n);
  const vd = new Float64Array(n), ia = new Float64Array(n), va = new Float64Array(n);
  t.forEach((tt, k) => {
    const r = bridgeAt(W50 * tt, alpha, mu, p.Id);
    vd[k] = r.vd;
    ia[k] = r.ia;
    va[k] = r.va;
  });
  return { t, vd, ia, va, mu: mu0 };
}

export function bridgeInfo(p: Params): BridgeInfo {
  const r = bridgeRun(p, 3600, 1);
  const Vd0 = (3 * Math.SQRT2 * BRIDGE.VLL) / Math.PI;
  const Vd = r.vd.reduce((s, v) => s + v, 0) / r.vd.length;
  const f1 = harmonic(r.ia, r.t, BRIDGE.f, 1);
  const hs = [5, 7, 11, 13, 17, 19, 23, 25].map((h) => ({ h, pct: (100 * harmonic(r.ia, r.t, BRIDGE.f, h).amp) / f1.amp }));
  const thd = Math.sqrt(hs.reduce((s, x) => s + x.pct ** 2, 0)) / 100;
  const v1 = harmonic(r.va, r.t, BRIDGE.f, 1);
  const dpf = Math.cos(v1.phase - f1.phase);
  return {
    Vd,
    Vd0,
    mu: r.mu === null ? NaN : r.mu / deg,
    failed: r.mu === null,
    P: (Vd * p.Id) / 1000,
    h: hs,
    thd,
    dpf,
    pf: dpf / Math.sqrt(1 + thd * thd),
  };
}

export const bridge: Model = {
  id: 'bridge',
  poles: () => [],
  window: () => 2 / BRIDGE.f,
  simulate(p): Run {
    const r = bridgeRun(p);
    const Vd = r.vd.reduce((s, v) => s + v, 0) / r.vd.length;
    return { t: r.t, s: { vd: r.vd, ia: r.ia, va: r.va, vdAvg: r.vd.map(() => Vd) } };
  },
};

// ── 6.3 PWM ──────────────────────────────────────────────────────────────────

export const PWM = { Vdc: 700, f1: 50 };
export const PWM_METHODS = { sine: 0, third: 1, sv: 2 } as const;

/** Modulating signal of phase k (0, 1, 2) at angle θ, in carrier units (±1 is the carrier peak). */
export function modulating(m: number, method: number, theta: number, k: number): number {
  const s = (j: number) => m * Math.sin(theta - (j * 2 * Math.PI) / 3);
  const base = s(k);
  if (method === PWM_METHODS.third) return base + (m / 6) * Math.sin(3 * theta);
  if (method === PWM_METHODS.sv) {
    const v = [s(0), s(1), s(2)];
    return base - (Math.max(...v) + Math.min(...v)) / 2; // min–max zero-sequence injection ≡ SVPWM
  }
  return base;
}

/** Triangular carrier between −1 and 1 at mf times the fundamental. */
export const carrier = (theta: number, mf: number) => {
  const x = ((((theta * mf) / (2 * Math.PI)) % 1) + 1) % 1;
  return x < 0.5 ? 4 * x - 1 : 3 - 4 * x;
};

function pwmRun(p: Params, n = 6000) {
  const t = linspace(0, 1 / PWM.f1, n);
  const ref = new Float64Array(n), car = new Float64Array(n), vaN = new Float64Array(n), vab = new Float64Array(n);
  const h = PWM.Vdc / 2;
  t.forEach((tt, k) => {
    const th = W50 * tt;
    const c = carrier(th, p.mf);
    const leg = (j: number) => (modulating(p.m, p.method, th, j) >= c ? h : -h);
    ref[k] = modulating(p.m, p.method, th, 0);
    car[k] = c;
    vaN[k] = leg(0);
    vab[k] = leg(0) - leg(1);
  });
  return { t, ref, car, vaN, vab };
}

export interface PwmInfo {
  V1ab: number; // fundamental amplitude of the line voltage
  V1ideal: number; // m·(√3/2)·Vdc in the linear range
  thd: number;
  spectrum: [number, number][]; // [h, % of fundamental] of vab
  linear: boolean;
}

export function pwmInfo(p: Params): PwmInfo {
  const r = pwmRun(p, 8000);
  const V1ab = harmonic(r.vab, r.t, PWM.f1, 1).amp;
  const spectrum: [number, number][] = [];
  let sum = 0;
  for (let h = 2; h <= 120; h++) {
    const a = harmonic(r.vab, r.t, PWM.f1, h).amp;
    sum += a * a;
    spectrum.push([h, (100 * a) / V1ab]);
  }
  return {
    V1ab,
    V1ideal: (p.m * Math.sqrt(3) * PWM.Vdc) / 2,
    thd: Math.sqrt(sum) / V1ab,
    spectrum,
    linear: p.m <= (p.method === PWM_METHODS.sine ? 1 : 2 / Math.sqrt(3)) + 1e-9,
  };
}

/** Fundamental of the line voltage against m, for the chart (one coarse run per point). */
export function pwmGainCurve(method: number, mf: number): [number, number][] {
  const out: [number, number][] = [];
  for (let m = 0; m <= 2.0001; m += 0.1) {
    const r = pwmRun({ m, mf, method }, 1500);
    out.push([m, harmonic(r.vab, r.t, PWM.f1, 1).amp / PWM.Vdc]);
  }
  return out;
}

export const pwm: Model = {
  id: 'pwm',
  poles: () => [],
  window: () => 1 / PWM.f1,
  simulate(p): Run {
    const r = pwmRun(p);
    const V1 = harmonic(r.vab, r.t, PWM.f1, 1);
    return {
      t: r.t,
      s: { ref: r.ref, car: r.car, vaN: r.vaN, vab: r.vab, v1: r.t.map((tt) => V1.amp * Math.sin(W50 * tt + V1.phase)) },
    };
  },
};

/** Space vector of the reference at angle θ, and the dwell times of SVPWM (fractions of Ts). */
export function svDwell(m: number, theta: number) {
  // Amplitude-invariant αβ: |v| = m·Vdc/2; active vectors have length 2/3·Vdc.
  const mag = (m * PWM.Vdc) / 2;
  const ang = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const sector = Math.floor(ang / (Math.PI / 3));
  const a = ang - (sector * Math.PI) / 3;
  const Vk = (2 / 3) * PWM.Vdc;
  const d1 = (mag * Math.sin(Math.PI / 3 - a)) / (Vk * Math.sin(Math.PI / 3));
  const d2 = (mag * Math.sin(a)) / (Vk * Math.sin(Math.PI / 3));
  return { sector, mag, d1, d2, d0: 1 - d1 - d2 };
}

// ── 6.4 Grid inverter with an LCL filter ─────────────────────────────────────

export const LCL = { Vg: 230, Vdc: 400, r: 0.05, Iref: 10, window: 0.04 };

/** Grid current per volt of inverter voltage: Ig/Vinv at frequency f (grid shorted). */
export function lclGain(p: Params, f: number, filter = p.Cf > 0 ? 'lcl' : 'l', Rd = p.Rd): Complex {
  const s = cx(0, 2 * Math.PI * f);
  const L1 = p.L1 * 1e-3, L2 = p.L2 * 1e-3, C = p.Cf * 1e-6;
  const Z1 = cx(LCL.r, s.im * L1), Z2 = cx(LCL.r, s.im * L2);
  if (filter === 'l' || C <= 0) return cdiv(cx(1), cx(Z1.re + Z2.re, Z1.im + Z2.im));
  const Zc = cx(Rd, -1 / (s.im * C));
  // Vinv → Z1 → node (Zc ∥ Z2) → Ig through Z2.
  const par = cdiv(cmul(Zc, Z2), cx(Zc.re + Z2.re, Zc.im + Z2.im));
  const I1 = cdiv(cx(1), cx(Z1.re + par.re, Z1.im + par.im));
  return cdiv(cmul(I1, Zc), cx(Zc.re + Z2.re, Zc.im + Z2.im));
}

export const fRes = (p: Params) => {
  const L1 = p.L1 * 1e-3, L2 = p.L2 * 1e-3, C = p.Cf * 1e-6;
  return C > 0 ? Math.sqrt((L1 + L2) / (L1 * L2 * C)) / (2 * Math.PI) : NaN;
};

/** Damping resistor commonly chosen: Rd = 1/(3 ω_res Cf). */
export const RdOpt = (p: Params) => (p.Cf > 0 ? 1 / (3 * 2 * Math.PI * fRes(p) * p.Cf * 1e-6) : NaN);

export interface LclInfo {
  fres: number;
  RdOpt: number;
  /** Grid-current ripple (peak-to-peak deviation from the averaged model, A). */
  ripple: number;
  /** Gain at the switching frequency relative to an L filter of the same total inductance. */
  attenuation: number;
}

/** Inverter voltage phasor that gives Ig = Iref in phase with the grid (feed-forward). */
function vinvPhasor(p: Params): Complex {
  const G = lclGain(p, 50);
  // Ig = G·(Vinv − Vg·H), where H = Vg's own transfer; with the grid source, solve by superposition:
  // Ig = G·Vinv − Y_g·Vg, where Y_g is Ig per volt of grid voltage (Vinv shorted).
  const Yg = lclGridAdmittance(p, 50);
  return cdiv(cx(LCL.Iref * Math.SQRT2 + cmul(Yg, cx(LCL.Vg * Math.SQRT2)).re, cmul(Yg, cx(LCL.Vg * Math.SQRT2)).im), G);
}

/** Ig per volt of grid voltage with the inverter voltage shorted (Ig flows into the grid source). */
function lclGridAdmittance(p: Params, f: number): Complex {
  const w = 2 * Math.PI * f;
  const L1 = p.L1 * 1e-3, L2 = p.L2 * 1e-3, C = p.Cf * 1e-6;
  const Z1 = cx(LCL.r, w * L1), Z2 = cx(LCL.r, w * L2);
  if (C <= 0) return cdiv(cx(1), cx(Z1.re + Z2.re, Z1.im + Z2.im));
  const Zc = cx(p.Rd, -1 / (w * C));
  const par = cdiv(cmul(Zc, Z1), cx(Zc.re + Z1.re, Zc.im + Z1.im));
  return cdiv(cx(1), cx(Z2.re + par.re, Z2.im + par.im));
}

function lclRun(p: Params, switched: boolean) {
  const L1 = p.L1 * 1e-3, L2 = p.L2 * 1e-3, C = Math.max(p.Cf, 1e-3) * 1e-6, r = LCL.r;
  const Rd = p.Cf > 0 ? p.Rd : 1e6; // no capacitor: an open branch
  // States [i1, vc, ig]; inputs [vinv, vg]. Capacitor branch: Rd in series with C.
  const A = [
    [-(r + Rd) / L1, -1 / L1, Rd / L1],
    [1 / C, 0, -1 / C],
    [Rd / L2, 1 / L2, -(r + Rd) / L2],
  ];
  const B = [
    [1 / L1, 0],
    [0, 0],
    [0, -1 / L2],
  ];
  const fs = p.fs * 1e3;
  const n = Math.min(100000, Math.max(6000, Math.round(LCL.window * fs * 50)));
  const dt = LCL.window / (n - 1);
  const V = vinvPhasor(p);
  const ref = (t: number) => V.re * Math.cos(W50 * t) - V.im * Math.sin(W50 * t);
  const vg = (t: number) => LCL.Vg * Math.SQRT2 * Math.cos(W50 * t);
  const u = (t: number): number[] => {
    if (!switched) return [ref(t + dt / 2), vg(t + dt / 2)];
    // Average the PWM over the step (8 sub-samples) so edges are not quantised to the step.
    let v = 0;
    for (let j = 0; j < 8; j++) {
      const tj = t + ((j + 0.5) * dt) / 8;
      const m = Math.max(-1, Math.min(1, ref(tj) / LCL.Vdc));
      const ph = (tj * fs) % 1;
      const c = ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph;
      v += m >= c ? LCL.Vdc : -LCL.Vdc;
    }
    return [v / 8, vg(t + dt / 2)];
  };
  // Without a capacitor the middle state is decoupled; keep it at zero.
  if (p.Cf <= 0) {
    A[1] = [0, 0, 0];
    A[0] = [-(r + r) / (L1 + L2), 0, 0];
    A[2] = [-(r + r) / (L1 + L2), 0, 0];
    B[0] = [1 / (L1 + L2), -1 / (L1 + L2)];
    B[2] = [1 / (L1 + L2), -1 / (L1 + L2)];
  }
  // Start from the averaged steady state, so what remains is due to switching alone.
  const Ig = cx(LCL.Iref * Math.SQRT2, 0);
  const w = W50;
  const Vnode = cx(LCL.Vg * Math.SQRT2 + LCL.r * Ig.re, w * L2 * Ig.re);
  let x0 = [Ig.re, 0, Ig.re];
  if (p.Cf > 0) {
    const Zc = cx(p.Rd, -1 / (w * C));
    const Ic = cdiv(Vnode, Zc);
    const Vc = cdiv(Ic, cx(0, w * C));
    x0 = [Ig.re + Ic.re, Vc.re, Ig.re];
  }
  return simulate({ A, B }, x0, u, LCL.window, n);
}

const lclCache = new Map<string, { sw: ReturnType<typeof lclRun>; av: ReturnType<typeof lclRun> }>();
function lclRuns(p: Params) {
  const key = JSON.stringify([p.L1, p.L2, p.Cf, p.Rd, p.fs]);
  let r = lclCache.get(key);
  if (!r) {
    if (lclCache.size > 30) lclCache.clear();
    r = { sw: lclRun(p, true), av: lclRun(p, false) };
    lclCache.set(key, r);
  }
  return r;
}

export function lclInfo(p: Params): LclInfo {
  const { sw, av } = lclRuns(p);
  const n = sw.t.length;
  let ripple = 0;
  for (let k = 0; k < n; k++) if (sw.t[k] > 0.03) ripple = Math.max(ripple, Math.abs(sw.x[2][k] - av.x[2][k]));
  const fsHz = p.fs * 1e3;
  return {
    fres: fRes(p),
    RdOpt: RdOpt(p),
    ripple: 2 * ripple,
    attenuation: cabs(lclGain(p, fsHz)) / cabs(lclGain(p, fsHz, 'l')),
  };
}

export const lclModel: Model = {
  id: 'lcl',
  poles: () => [],
  window: () => LCL.window,
  simulate(p): Run {
    const { sw, av } = lclRuns(p);
    // Thin to about 6000 samples for the oscilloscope.
    const step = Math.max(1, Math.floor(sw.t.length / 6000));
    const pick = (a: Float64Array) => Float64Array.from({ length: Math.floor(a.length / step) }, (_, j) => a[j * step]);
    return { t: pick(sw.t), s: { ig: pick(sw.x[2]), igAvg: pick(av.x[2]), i1: pick(sw.x[0]) } };
  },
};
