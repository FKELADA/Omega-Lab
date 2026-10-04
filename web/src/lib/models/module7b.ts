// Module 7 (continued) — PV with MPPT (7.3) and a wind turbine (7.4).

import { rk4 } from '../core/ode';
import type { Model, Params, Run } from './types';

// ── PV: single-diode model, bypass diodes, P&O MPPT (7.3) ────────────────────
// One 60-cell module in three 20-cell substrings, each with a bypass diode.

export const PVM = { Isc: 9.5, Voc: 37.8, n: 1.3, Rs: 0.1, Rsh: 300, alphaI: 0.0005, betaV: -0.0032, Tmppt: 0.02, window: 4, tCloud: 2 };

interface Substring {
  Iph: number;
  I0: number;
  a: number; // n·Ns·Vt
}

function substring(G: number, T: number): Substring {
  const Tk = T + 273.15;
  const Vt = (1.380649e-23 * Tk) / 1.602176634e-19;
  const a = PVM.n * 20 * Vt;
  const Iph = ((PVM.Isc * G) / 1000) * (1 + PVM.alphaI * (T - 25));
  const VocS = (PVM.Voc / 3) * (1 + PVM.betaV * (T - 25));
  const IscT = PVM.Isc * (1 + PVM.alphaI * (T - 25));
  const I0 = IscT / (Math.exp(VocS / a) - 1);
  return { Iph, I0, a };
}

/** Substring voltage at current I; its bypass diode clamps it at −0.5 V. */
function substringV(s: Substring, I: number): number {
  const f = (V: number) => s.Iph - s.I0 * (Math.exp((V + I * PVM.Rs) / s.a) - 1) - (V + I * PVM.Rs) / PVM.Rsh - I;
  let lo = -20, hi = 20;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) lo = m;
    else hi = m;
  }
  return Math.max(-0.5, (lo + hi) / 2);
}

export function pvModule(G: number, T: number, shade: number) {
  const subs = [substring(G * (1 - shade), T), substring(G, T), substring(G, T)];
  const V = (I: number) => subs.reduce((s, sub) => s + substringV(sub, I), 0);
  const Imax = Math.max(...subs.map((s) => s.Iph)) * 1.02 + 1e-6;
  /** Current at module voltage v (V falls as I rises). */
  const I = (v: number) => {
    let lo = 0, hi = Imax;
    for (let k = 0; k < 40; k++) {
      const m = (lo + hi) / 2;
      if (V(m) > v) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  return { V, I, Imax };
}

export interface PvCurve {
  iv: [number, number][];
  pv: [number, number][];
  Voc: number;
  Isc: number;
  /** Local maxima of P(V), highest first. */
  peaks: { V: number; P: number }[];
}

const pvCurveCache = new Map<string, PvCurve>();
export function pvCurve(G: number, T: number, shade: number): PvCurve {
  const key = `${G.toFixed(1)}|${T.toFixed(1)}|${shade.toFixed(3)}`;
  const hit = pvCurveCache.get(key);
  if (hit) return hit;
  const m = pvModule(G, T, shade);
  const Voc = m.V(0);
  const iv: [number, number][] = [], pv: [number, number][] = [];
  for (let j = 0; j <= 160; j++) {
    const v = (Voc * j) / 160;
    const i = m.I(v);
    iv.push([v, i]);
    pv.push([v, v * i]);
  }
  const peaks: { V: number; P: number }[] = [];
  for (let j = 1; j < pv.length - 1; j++) if (pv[j][1] >= pv[j - 1][1] && pv[j][1] > pv[j + 1][1] && pv[j][1] > 1) peaks.push({ V: pv[j][0], P: pv[j][1] });
  peaks.sort((a, b) => b.P - a.P);
  const r = { iv, pv, Voc, Isc: m.I(0), peaks };
  if (pvCurveCache.size > 200) pvCurveCache.clear();
  pvCurveCache.set(key, r);
  return r;
}

export const PV_SCAN = { off: 0, on: 1 } as const;
export const pvIrradiance = (p: Params, t: number) => (t < PVM.tCloud ? p.G : p.G * (1 - p.cloud));

function pvRun(p: Params) {
  const steps = Math.round(PVM.window / PVM.Tmppt);
  const t: number[] = [], P: number[] = [], Pa: number[] = [], V: number[] = [], I: number[] = [];
  // Inverters wake up near open-circuit voltage and walk down towards the MPP.
  let v = 0.95 * pvCurve(pvIrradiance(p, 0), p.T, p.shade).Voc, dir = -1, lastP = 0;
  for (let k = 0; k <= steps; k++) {
    const tt = k * PVM.Tmppt;
    const G = pvIrradiance(p, tt);
    const m = pvModule(G, p.T, p.shade);
    const c = pvCurve(G, p.T, p.shade);
    // Optional global scan every second: move to the best point of the curve.
    if (p.scan === PV_SCAN.on && k % Math.round(1 / PVM.Tmppt) === 0 && c.peaks.length) v = c.peaks[0].V;
    const i = m.I(v);
    const pw = v * i;
    t.push(tt);
    P.push(pw);
    Pa.push(c.peaks[0]?.P ?? 0);
    V.push(v);
    I.push(i);
    // Perturb and observe: keep going while power rises, turn back when it falls.
    if (pw < lastP) dir = -dir;
    lastP = pw;
    v = Math.min(c.Voc, Math.max(1, v + dir * p.dV));
  }
  return { t, P, Pa, V, I };
}

export interface PvInfo {
  /** Energy tracked / energy available, after the first second. */
  efficiency: number;
  Pend: number;
  PmaxEnd: number;
  /** Ends near a local, not the global, maximum. */
  stuckLocal: boolean;
  peaks: number;
  /** Peak-to-peak power oscillation in steady state (W). */
  ripple: number;
}

const pvRunCache = new Map<string, ReturnType<typeof pvRun>>();
function pvRunCached(p: Params) {
  const key = JSON.stringify([p.G, p.T, p.cloud, p.dV, p.shade, p.scan]);
  let r = pvRunCache.get(key);
  if (!r) {
    if (pvRunCache.size > 60) pvRunCache.clear();
    r = pvRun(p);
    pvRunCache.set(key, r);
  }
  return r;
}

export function pvInfo(p: Params): PvInfo {
  const r = pvRunCached(p);
  let e = 0, ea = 0;
  r.t.forEach((tt, k) => {
    if (tt >= 1) {
      e += r.P[k];
      ea += r.Pa[k];
    }
  });
  const last = r.t.length - 1;
  const tail = r.P.slice(Math.floor(r.t.length * 0.85));
  const c = pvCurve(pvIrradiance(p, PVM.window), p.T, p.shade);
  return {
    efficiency: e / ea,
    Pend: r.P[last],
    PmaxEnd: r.Pa[last],
    stuckLocal: c.peaks.length > 1 && r.P[last] < 0.9 * r.Pa[last],
    peaks: c.peaks.length,
    ripple: Math.max(...tail) - Math.min(...tail),
  };
}

export const pvArrayModel: Model = {
  id: 'pv-array',
  poles: () => [],
  window: () => PVM.window,
  simulate(p): Run {
    const r = pvRunCached(p);
    const f = (a: number[]) => Float64Array.from(a);
    return { t: f(r.t), s: { P: f(r.P), Pa: f(r.Pa), V: f(r.V), I: f(r.I) } };
  },
};

// ── Wind turbine: Cp(λ, β), MPPT, pitch, synthetic inertia (7.4) ─────────────
// A 2 MW full-converter (type 4) turbine, rotor radius 40 m.

export const WT = { R: 40, rho: 1.225, Prated: 2e6, H: 4, vIn: 3, vOut: 25, window: 30, tGust: 6, tFreq: 18 };

/** Heier's empirical power coefficient. */
export function cp(lambda: number, beta: number): number {
  const li = 1 / (1 / (lambda + 0.08 * beta) - 0.035 / (beta ** 3 + 1));
  return Math.max(0, 0.5176 * (116 / li - 0.4 * beta - 5) * Math.exp(-21 / li) + 0.0068 * lambda);
}

const OPT = (() => {
  let best = 0, at = 0;
  for (let l = 2; l <= 14; l += 0.005) if (cp(l, 0) > best) [best, at] = [cp(l, 0), l];
  return { lambda: at, cp: best };
})();
export const CP_MAX = OPT.cp, LAMBDA_OPT = OPT.lambda;
const AREA = Math.PI * WT.R ** 2;
/** Wind speed at which optimal-Cp operation reaches rated power. */
export const V_RATED = Math.cbrt(WT.Prated / (0.5 * WT.rho * AREA * CP_MAX));
export const W_RATED = (LAMBDA_OPT * V_RATED) / WT.R;
const J = (2 * WT.H * WT.Prated) / W_RATED ** 2;
const KOPT = (0.5 * WT.rho * AREA * WT.R ** 3 * CP_MAX) / LAMBDA_OPT ** 3;

/** Static power curve (MW). */
export const powerCurve = (v: number) => (v < WT.vIn || v > WT.vOut ? 0 : Math.min(WT.Prated, 0.5 * WT.rho * AREA * v ** 3 * CP_MAX) / 1e6);

/** Mean wind plus a 4 s one-minus-cosine gust. */
export function windSpeed(p: Params, t: number) {
  const g = t >= WT.tGust && t < WT.tGust + 4 ? (p.gust / 2) * (1 - Math.cos((2 * Math.PI * (t - WT.tGust)) / 4)) : 0;
  return p.v + g;
}
/** Grid frequency: −0.5 Hz/s for 1 s, then held at 49.5 Hz. */
export const windGridF = (t: number) => 50 - 0.5 * Math.min(1, Math.max(0, t - WT.tFreq));
const dfdt = (t: number) => (t >= WT.tFreq && t < WT.tFreq + 1 ? -0.5 : 0);

function windRun(p: Params, n = 1500) {
  const v0 = p.v;
  const w0 = v0 <= V_RATED ? (LAMBDA_OPT * v0) / WT.R : W_RATED;
  let beta0 = 0;
  if (v0 > V_RATED) {
    // The pitch that limits aerodynamic power to rated at rated speed.
    let lo = 0, hi = 40;
    for (let k = 0; k < 50; k++) {
      const b = (lo + hi) / 2;
      const Pa = 0.5 * WT.rho * AREA * v0 ** 3 * cp((W_RATED * WT.R) / v0, b);
      if (Pa > WT.Prated) lo = b;
      else hi = b;
    }
    beta0 = (lo + hi) / 2;
  }
  const genTorque = (t: number, w: number) => {
    const base = w < W_RATED ? KOPT * w * w : WT.Prated / w;
    // Synthetic inertia: extra power ∝ −df/dt, limited to 10 % of rating.
    const dP = Math.min(0.1 * WT.Prated, Math.max(0, (-2 * p.Hsyn * dfdt(t)) / 50) * WT.Prated);
    return base + dP / w;
  };
  const Kp = 60, Ki = 25; // pitch PI on the speed error (deg per rad/s)
  const sol = rk4(
    (t, [w, beta, xi]) => {
      const v = windSpeed(p, t);
      const Pa = 0.5 * WT.rho * AREA * v ** 3 * cp((w * WT.R) / Math.max(0.1, v), Math.max(0, beta));
      const Ta = Pa / Math.max(0.05, w);
      const err = w - W_RATED;
      // The pitch only acts above rated speed (held at 0° below), rate-limited to 8°/s.
      let target = Kp * err + Ki * xi;
      if (target < 0) target = 0;
      const dbeta = Math.max(-8, Math.min(8, (target - beta) / 0.2));
      const dxi = beta <= 0.01 && err < 0 ? 0 : err;
      return [(Ta - genTorque(t, w)) / J, dbeta, dxi];
    },
    [w0, beta0, beta0 / Ki],
    WT.window,
    n,
    4,
  );
  const P = sol.t.map((t, k) => (genTorque(t, sol.x[0][k]) * sol.x[0][k]) / 1e6);
  return {
    t: sol.t,
    w: sol.x[0],
    beta: sol.x[1].map((b) => Math.max(0, b)),
    P,
    v: sol.t.map((t) => windSpeed(p, t)),
    f: sol.t.map(windGridF),
    lambda: sol.t.map((t, k) => (sol.x[0][k] * WT.R) / windSpeed(p, t)),
  };
}

export interface WindInfo {
  vRated: number;
  rpmRated: number;
  maxBeta: number;
  Pmean: number;
  /** Peak extra power during the frequency event (MW). */
  extraP: number;
  /** Largest drop below the pre-event power afterwards (MW). */
  recoveryDip: number;
  /** Peak power during the gust (MW). */
  Ppeak: number;
}

const windCache = new Map<string, ReturnType<typeof windRun>>();
function windRunCached(p: Params) {
  const key = JSON.stringify([p.v, p.gust, p.Hsyn]);
  let r = windCache.get(key);
  if (!r) {
    if (windCache.size > 60) windCache.clear();
    r = windRun(p);
    windCache.set(key, r);
  }
  return r;
}

export function windInfo(p: Params): WindInfo {
  const r = windRunCached(p);
  const k0 = r.t.findIndex((t) => t >= WT.tFreq) - 1;
  const P0 = r.P[k0];
  let extra = 0, dip = 0, peak = 0;
  for (let k = 0; k < r.t.length; k++) {
    if (r.t[k] < WT.tFreq) peak = Math.max(peak, r.P[k]);
    else if (r.t[k] < WT.tFreq + 1.2) extra = Math.max(extra, r.P[k] - P0);
    else dip = Math.max(dip, P0 - r.P[k]);
  }
  return {
    vRated: V_RATED,
    rpmRated: (W_RATED * 60) / (2 * Math.PI),
    maxBeta: Math.max(...r.beta),
    Pmean: r.P.reduce((s, x) => s + x, 0) / r.P.length,
    extraP: extra,
    recoveryDip: dip,
    Ppeak: peak,
  };
}

/** Operating point (λ, β, Cp) at time t, for the Cp chart. */
export function windPoint(p: Params, t: number) {
  const r = windRunCached(p);
  const k = Math.min(r.t.length - 1, Math.max(0, Math.round((t / WT.window) * (r.t.length - 1))));
  return { lambda: r.lambda[k], beta: r.beta[k], cp: cp(r.lambda[k], r.beta[k]), v: r.v[k], P: r.P[k] };
}

export const windModel: Model = {
  id: 'wind',
  poles: () => [],
  window: () => WT.window,
  simulate(p): Run {
    const r = windRunCached(p);
    return {
      t: r.t,
      s: {
        v: Float64Array.from(r.v),
        P: Float64Array.from(r.P),
        rpm: r.w.map((w) => (w * 60) / (2 * Math.PI)),
        beta: r.beta,
        f: Float64Array.from(r.f),
      },
    };
  },
};

/** Voltage of each substring at module current I (−0.5 V means its bypass diode conducts). */
export function substringVoltages(G: number, T: number, shade: number, I: number): number[] {
  return [substring(G * (1 - shade), T), substring(G, T), substring(G, T)].map((s) => substringV(s, I));
}
