// Module 7 (continued) — battery fast frequency response (7.5), an MMC phase
// leg with nearest-level modulation (7.6), and a fault-ride-through test bench (7.7).

import { linspace } from '../core/lti';
import { rk4 } from '../core/ode';
import type { Model, Params, Run } from './types';

const W0 = 2 * Math.PI * 50;

// ── 7.5 Battery fast frequency response ─────────────────────────────────────
// A 30 GW system loses 1 GW at t = 1 s. Governors respond in seconds; a battery
// (droop or triggered FFR) in a fraction of a second, until its energy runs out.

export const BESS = { S: 30000, loss: 1000, tLoss: 1, D: 1, gain: 2000, tauG: 6, reserve: 1500, window: 60, db: 0.015, trig: 49.8 };
export const BESS_MODES = { droop: 0, ffr: 1 } as const;

function bessRun(p: Params, withBess = true, n = 1200) {
  const H = p.H, S = BESS.S;
  const Pb = withBess ? p.Pb : 0;
  const Emax = p.Eb; // MWh
  // States: Δf (Hz), governor power (MW), battery power (MW), energy used (MWh), FFR latch.
  const sol = rk4(
    (t, [df, pg, pb, eu, latch, tOn]) => {
      const loss = t >= BESS.tLoss ? BESS.loss : 0;
      // Swing on the system base: (2H S / f0) dΔf/dt = P_gen − P_load.
      const dload = (BESS.D * S * df) / 50; // load relief
      const ddf = ((pg + pb - loss - dload) * 50) / (2 * H * S);
      const gTarget = Math.min(BESS.reserve, Math.max(0, -df * BESS.gain)); // primary response, capped at the reserve
      let target = 0;
      const empty = eu >= Emax * 0.5; // starts half full
      if (!empty && Pb > 0) {
        if (p.mode === BESS_MODES.droop) target = Math.min(Pb, Math.max(0, ((-df - BESS.db) / 0.5) * Pb));
        // FFR: full power for 10 s after the trigger, then a 30 s ramp down while governors take over.
        else target = latch > 0.5 ? Pb * Math.max(0, Math.min(1, (40 - tOn) / 30)) : 0;
      }
      const trig = p.mode === BESS_MODES.ffr && 50 + df < BESS.trig ? 1 : 0;
      return [ddf, (gTarget - pg) / BESS.tauG, (target - pb) / Math.max(0.02, p.tau), pb / 3600, trig ? (1 - latch) / 0.05 : 0, latch > 0.5 ? 1 : 0];
    },
    [0, 0, 0, 0, 0, 0],
    BESS.window,
    n,
    6,
  );
  return { t: sol.t, f: sol.x[0].map((d) => 50 + d), pg: sol.x[1], pb: sol.x[2], eu: sol.x[3] };
}

export interface BessInfo {
  nadir: number;
  nadirNoBess: number;
  rocof: number; // Hz/s right after the loss
  empty: boolean;
  tEmpty: number | null;
  energyUsed: number; // MWh
  soc: number; // % at the end
}

const bessCache = new Map<string, ReturnType<typeof bessRun>>();
function bessRuns(p: Params) {
  const key = JSON.stringify([p.H, p.Pb, p.Eb, p.tau, p.mode]);
  let r = bessCache.get(key);
  if (!r) {
    if (bessCache.size > 80) bessCache.clear();
    r = bessRun(p);
    bessCache.set(key, r);
  }
  return r;
}
const noBessCache = new Map<number, ReturnType<typeof bessRun>>();
function noBess(p: Params) {
  let r = noBessCache.get(p.H);
  if (!r) {
    r = bessRun(p, false);
    noBessCache.set(p.H, r);
  }
  return r;
}

export const nadirOf = (p: Params) => Math.min(...bessRuns(p).f);

export function bessInfo(p: Params): BessInfo {
  const r = bessRuns(p);
  const half = p.Eb * 0.5;
  const kE = r.eu.findIndex((e) => e >= half - 1e-6);
  return {
    nadir: Math.min(...r.f),
    nadirNoBess: Math.min(...noBess(p).f),
    rocof: (-BESS.loss * 50) / (2 * p.H * BESS.S),
    empty: kE >= 0,
    tEmpty: kE >= 0 ? r.t[kE] : null,
    energyUsed: r.eu[r.eu.length - 1],
    soc: Math.max(0, (100 * (half - r.eu[r.eu.length - 1])) / p.Eb),
  };
}

export const bessModel: Model = {
  id: 'bess',
  poles: () => [],
  window: () => BESS.window,
  simulate(p): Run {
    const r = bessRuns(p);
    const r0 = noBess(p);
    return {
      t: r.t,
      s: {
        f: r.f,
        f0: r0.f,
        pb: r.pb,
        pg: r.pg,
        soc: r.eu.map((e) => Math.max(0, (100 * (p.Eb * 0.5 - e)) / p.Eb)),
      },
    };
  },
};

// ── 7.6 MMC phase leg ────────────────────────────────────────────────────────
// ±320 kV, N half-bridge sub-modules per arm, nearest-level modulation, with or
// without capacitor-voltage sorting.

export const MMC = { Vdc: 640, m: 0.9, cycles: 5, perCycle: 400 };

function mmcRun(p: Params) {
  const N = Math.round(p.N);
  const Vc0 = MMC.Vdc / N; // kV
  const C = p.C * 1e-3; // F
  const Vhat = (MMC.m * MMC.Vdc) / 2; // kV
  const Iac = (2 * (p.P / 3) * 1e3) / Vhat; // A peak, unity power factor (P in MW over 3 phases)
  const Idc = (p.P * 1e3) / MMC.Vdc / 3; // A per phase leg (kW / kV)
  const n = MMC.cycles * MMC.perCycle;
  const dt = 1 / 50 / MMC.perCycle;
  const up = new Array(N).fill(Vc0), lo = new Array(N).fill(Vc0);
  // A slight initial mismatch, as in a real converter.
  up.forEach((_, j) => (up[j] *= 1 + 0.002 * (j - N / 2) / N));
  lo.forEach((_, j) => (lo[j] *= 1 - 0.002 * (j - N / 2) / N));
  const t = new Float64Array(n), vac = new Float64Array(n), vref = new Float64Array(n), iu = new Float64Array(n);
  const upMax = new Float64Array(n), upMin = new Float64Array(n), nIns = new Float64Array(n), upMean = new Float64Array(n);
  const snap: Float64Array[] = [];
  const choose = (caps: number[], k: number, i: number) => {
    const idx = caps.map((_, j) => j);
    if (p.balance) idx.sort((a, b) => (i > 0 ? caps[a] - caps[b] : caps[b] - caps[a]));
    return idx.slice(0, k);
  };
  for (let s = 0; s < n; s++) {
    const tt = s * dt;
    const ref = Vhat * Math.sin(W0 * tt);
    const nu = Math.max(0, Math.min(N, Math.round((N / 2) * (1 - ref / (MMC.Vdc / 2)))));
    const nl = N - nu;
    const iac = Iac * Math.sin(W0 * tt);
    const iuA = Idc + iac / 2, ilA = Idc - iac / 2;
    const insU = choose(up, nu, iuA), insL = choose(lo, nl, ilA);
    const vu = insU.reduce((a, j) => a + up[j], 0), vl = insL.reduce((a, j) => a + lo[j], 0);
    t[s] = tt;
    vac[s] = (vl - vu) / 2;
    vref[s] = ref;
    iu[s] = iuA / 1000;
    upMax[s] = Math.max(...up);
    upMin[s] = Math.min(...up);
    upMean[s] = up.reduce((a, v) => a + v, 0) / N;
    nIns[s] = nu;
    snap.push(Float64Array.from(up));
    // Inserted capacitors carry the arm current (kV change = A·s / F / 1000).
    for (const j of insU) up[j] += (iuA * dt) / C / 1000;
    for (const j of insL) lo[j] += (ilA * dt) / C / 1000;
  }
  return { t, vac, vref, iu, upMax, upMin, nIns, Vc0, snap, upMean };
}

const mmcCache = new Map<string, ReturnType<typeof mmcRun>>();
function mmcRuns(p: Params) {
  const key = JSON.stringify([Math.round(p.N), p.C, p.P, p.balance]);
  let r = mmcCache.get(key);
  if (!r) {
    if (mmcCache.size > 60) mmcCache.clear();
    r = mmcRun(p);
    mmcCache.set(key, r);
  }
  return r;
}

export interface MmcInfo {
  levels: number;
  thd: number;
  /** Spread of upper-arm capacitor voltages in the last cycle, % of nominal. */
  spread: number;
  /** Peak-to-peak ripple of the mean upper-arm capacitor voltage, % of nominal. */
  ripple: number;
  Vc0: number; // kV per sub-module
}

/** THD of the ideal nearest-level staircase with N sub-modules per arm. */
export function nlmThd(N: number): number {
  const n = 4000;
  let a1 = 0, b1 = 0, tot = 0;
  for (let k = 0; k < n; k++) {
    const th = (2 * Math.PI * k) / n;
    const ref = MMC.m * Math.sin(th);
    const nu = Math.round((N / 2) * (1 - ref));
    const v = (N - 2 * nu) / N; // normalised to Vdc/2
    a1 += v * Math.sin(th);
    b1 += v * Math.cos(th);
    tot += v * v;
  }
  const V1sq = ((2 * a1) / n) ** 2 + ((2 * b1) / n) ** 2;
  const rms2 = tot / n;
  return Math.sqrt(Math.max(0, rms2 - V1sq / 2) / (V1sq / 2));
}

export function mmcInfo(p: Params): MmcInfo {
  const r = mmcRuns(p);
  const k0 = Math.floor(r.t.length * (1 - 1 / MMC.cycles));
  let spread = 0, hi = -Infinity, lo = Infinity;
  for (let k = k0; k < r.t.length; k++) {
    spread = Math.max(spread, r.upMax[k] - r.upMin[k]);
    hi = Math.max(hi, r.upMean[k]);
    lo = Math.min(lo, r.upMean[k]);
  }
  return { levels: Math.round(p.N) + 1, thd: nlmThd(Math.round(p.N)), spread: (100 * spread) / r.Vc0, ripple: (100 * (hi - lo)) / r.Vc0, Vc0: r.Vc0 };
}

/** Upper-arm capacitor voltages at the sample nearest time t. */
export function mmcCaps(p: Params, t: number): Float64Array {
  const r = mmcRuns(p);
  const k = Math.min(r.t.length - 1, Math.max(0, Math.round((t / (MMC.cycles / 50)) * (r.t.length - 1))));
  return r.snap[k];
}

export const MMC_SM = { half: 0, full: 1 } as const;

/** Illustrative DC pole-to-pole fault current (kA) at t ms after the fault. */
export function dcFaultCurrent(sm: number, tms: number): number {
  const I0 = 1.6, tb = 2; // pre-fault current, blocking after 2 ms
  if (tms < 0) return I0;
  if (tms <= tb) return I0 + 2.4 * tms; // arm-capacitor discharge, ≈ Vdc / (2 L_arm)
  const Ib = I0 + 2.4 * tb;
  if (sm === MMC_SM.full) return Math.max(0, Ib * (1 - (tms - tb) / 3)); // negative arm voltage drives it to zero
  // Half-bridge: the freewheeling diodes form an uncontrolled rectifier fed by the AC grid.
  return Ib + (14 - Ib) * (1 - Math.exp(-(tms - tb) / 6));
}

export const mmcModel: Model = {
  id: 'mmc',
  poles: () => [],
  window: () => MMC.cycles / 50,
  simulate(p): Run {
    const r = mmcRuns(p);
    return { t: r.t, s: { vac: r.vac, vref: r.vref, iu: r.iu, upMax: r.upMax, upMin: r.upMin, upMean: r.upMean } };
  },
};

// ── 7.7 Fault-ride-through test bench ────────────────────────────────────────

export const FRT = { t0: 0.5, window: 3, Imax: 1.1, tau: 0.02, P0: 1, db: 0.1 };
export const PROTECTION = { legacy: 0, frt: 1 } as const;

/** Generic voltage-against-time envelope after the fault starts (s → pu). */
export function frtEnvelope(dt: number): number {
  if (dt < 0) return 0;
  if (dt < 0.15) return 0;
  if (dt < 1.5) return (0.85 * (dt - 0.15)) / 1.35;
  return 0.9;
}

export const frtVoltage = (p: Params, t: number) => {
  const dt = t - FRT.t0;
  if (dt < 0) return 1;
  if (dt < p.dur) return p.Vres;
  const r = dt - p.dur;
  return r < 0.5 ? 0.9 + (0.1 * r) / 0.5 : 1; // recovery after clearing
};

function frtRun(p: Params, n = 1500) {
  const t = linspace(0, FRT.window, n);
  const dt = t[1] - t[0];
  let iq = 0, ip = FRT.P0, low = 0, tripped = -1, below = false;
  const out = { V: new Float64Array(n), env: new Float64Array(n), iq: new Float64Array(n), ip: new Float64Array(n), P: new Float64Array(n), iqRef: new Float64Array(n) };
  for (let k = 0; k < n; k++) {
    const tt = t[k];
    const V = frtVoltage(p, tt);
    const env = tt >= FRT.t0 ? frtEnvelope(tt - FRT.t0) : NaN;
    if (tt >= FRT.t0 && V < env - 1e-9) below = true;
    // Protection.
    if (tripped < 0) {
      if (p.prot === PROTECTION.legacy) {
        low = V < 0.8 ? low + dt : 0;
        if (low > 0.1) tripped = tt;
      } else if (below) tripped = tt;
    }
    let iqRef = 0, ipRef = 0;
    if (tripped < 0) {
      const dV = Math.max(0, 1 - FRT.db - V);
      iqRef = Math.min(FRT.Imax, p.K * dV);
      const ipMax = Math.sqrt(Math.max(0, FRT.Imax ** 2 - iqRef ** 2));
      ipRef = Math.min(FRT.P0 / Math.max(0.05, V), ipMax);
    }
    iq += ((iqRef - iq) * dt) / FRT.tau;
    // After the fault, active current comes back at the ramp rate; otherwise it follows its reference.
    const recovering = tripped < 0 && tt > FRT.t0 && V >= 0.9 && ip < ipRef;
    ip = recovering ? Math.min(ipRef, ip + p.ramp * dt) : ip + ((ipRef - ip) * dt) / FRT.tau;
    out.V[k] = V;
    out.env[k] = env;
    out.iq[k] = iq;
    out.ip[k] = ip;
    out.P[k] = V * ip;
    out.iqRef[k] = iqRef;
  }
  return { t, ...out, tripped, below };
}

export interface FrtInfo {
  tripped: boolean;
  tTrip: number | null;
  below: boolean; // the applied dip goes below the envelope (tripping is allowed)
  iqDip: number; // reactive current reached during the dip
  iqRequired: number;
  /** Time to reach 90 % of the reactive-current target (ms). */
  tRise: number;
  /** Time after clearing for P to reach 90 % (s). */
  tRecover: number | null;
  compliant: boolean;
}

const frtCache = new Map<string, ReturnType<typeof frtRun>>();
function frtRuns(p: Params) {
  const key = JSON.stringify([p.Vres, p.dur, p.K, p.prot, p.ramp]);
  let r = frtCache.get(key);
  if (!r) {
    if (frtCache.size > 60) frtCache.clear();
    r = frtRun(p);
    frtCache.set(key, r);
  }
  return r;
}

export function frtInfo(p: Params): FrtInfo {
  const r = frtRuns(p);
  const kDip = r.t.findIndex((t) => t >= FRT.t0 + Math.min(p.dur, 0.1) * 0.95);
  const iqReq = Math.min(FRT.Imax, p.K * Math.max(0, 1 - FRT.db - p.Vres));
  const k0 = r.t.findIndex((t) => t >= FRT.t0);
  const k90 = r.t.findIndex((t, k) => k >= k0 && r.iq[k] >= 0.9 * iqReq);
  const kClr = r.t.findIndex((t) => t >= FRT.t0 + p.dur);
  const kRec = r.t.findIndex((t, k) => k > kClr && r.P[k] >= 0.9 * FRT.P0);
  const tripped = r.tripped >= 0;
  const tRise = k90 >= 0 ? (r.t[k90] - FRT.t0) * 1000 : NaN;
  return {
    tripped,
    tTrip: tripped ? r.tripped : null,
    below: r.below,
    iqDip: r.iq[kDip],
    iqRequired: iqReq,
    tRise,
    tRecover: kRec >= 0 ? r.t[kRec] - (FRT.t0 + p.dur) : null,
    compliant: !r.below ? !tripped && (iqReq < 0.05 || tRise <= 60) : true,
  };
}

export const frtModel: Model = {
  id: 'frt',
  poles: () => [],
  window: () => FRT.window,
  simulate(p): Run {
    const r = frtRuns(p);
    return { t: r.t, s: { V: r.V, env: r.env, iq: r.iq, ip: r.ip, P: r.P } };
  },
};
