// Module 10 — The distribution system operator's view (applied to Enedis, the main French DSO).
// Every figure is an order of magnitude for teaching, not an operator's data.

import { cabs, cadd, cdiv, cmul, cx, polar, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import type { Model, Params, Run } from './types';

const W = 2 * Math.PI * 50;
const U = 20; // kV
const E = (U * 1000) / Math.sqrt(3); // phase-to-earth voltage (V)

// ── 10.1 An MV loop operated open ─────────────────────────────────────────────

/**
 * Two 20 kV feeders from two primary substations, joined into a loop of 20 sections of 1.5 km,
 * with 19 MV/LV substations (one at each inner node). The loop is run open at one switch.
 */
/** Drop limits: 5 % in normal operation, 7.5 % while back-feeding after a fault (orders of magnitude). */
export const LOOP = { sections: 20, len: 1.5, cosphi: 0.95, dvMax: 5, dvRescue: 7.5, Imax: { cable: 400, overhead: 300 } };
export const CABLES = [
  { name: { fr: 'Souterrain 240 mm² Al', en: 'Underground 240 mm² Al' }, r: 0.125, x: 0.11, kind: 'cable' as const },
  { name: { fr: 'Aérien 148 mm² Almélec', en: 'Overhead 148 mm² AAAC' }, r: 0.22, x: 0.35, kind: 'overhead' as const },
];
export const FAULT = { none: -1 } as const;

/** Load at node k (1…19), in MW at 100 % load: a little more near the towns at both ends. */
export const nodeLoad = (k: number) => 0.45 + 0.25 * Math.cos((Math.PI * k) / LOOP.sections) ** 2;

export interface LoopState {
  /** Which source feeds node k (0 = A, 1 = B, −1 = not supplied). */
  feed: number[];
  /** Voltage drop at node k (%). */
  dv: number[];
  /** Current in section j (between nodes j and j+1), in A. */
  I: number[];
  worstDv: number;
  worstI: number;
  lost: number; // nodes without supply
  ok: boolean;
}

/**
 * Radial load flow (linear drop) for an open point at switch `open` (sections are numbered
 * 0…19; section j joins nodes j and j+1; node 0 is source A, node 20 is source B). A fault on
 * section `fault` opens both its ends; with `rescue`, the normally open switch is closed.
 */
export function loopState(p: Params): LoopState {
  const c = CABLES[Math.round(p.cable)] ?? CABLES[0];
  const n = LOOP.sections;
  const open = new Set<number>([Math.round(p.open)]);
  const fault = Math.round(p.fault);
  if (fault >= 0) {
    open.add(fault);
    if (p.rescue) open.delete(Math.round(p.open));
  }
  const load = (k: number) => (k <= 0 || k >= n ? 0 : (nodeLoad(k) * p.load) / 100);
  const feed = new Array(n + 1).fill(-1), dv = new Array(n + 1).fill(0), I = new Array(n).fill(0);
  const tan = Math.tan(Math.acos(LOOP.cosphi));
  const run = (src: number, dir: 1 | -1) => {
    // Walk from the source until an open section; then accumulate currents back.
    const nodes: number[] = [src];
    let k = src;
    while (true) {
      const sec = dir === 1 ? k : k - 1;
      if (sec < 0 || sec >= n || open.has(sec)) break;
      k += dir;
      if (k <= 0 || k >= n) break;
      nodes.push(k);
    }
    nodes.forEach((m) => (feed[m] = dir === 1 ? 0 : 1));
    // Power through each section, from the far end back towards the source.
    let P = 0;
    const flows: number[] = [];
    for (let i = nodes.length - 1; i >= 1; i--) {
      P += load(nodes[i]);
      flows.unshift(P);
    }
    let drop = 0;
    flows.forEach((Pm, i) => {
      const sec = dir === 1 ? nodes[i] : nodes[i] - 1;
      const R = c.r * LOOP.len, X = c.x * LOOP.len;
      drop += (100 * (R * Pm + X * Pm * tan)) / U ** 2;
      dv[nodes[i + 1]] = drop;
      I[sec] = (1000 * Pm) / (Math.sqrt(3) * U * LOOP.cosphi);
    });
  };
  run(0, 1);
  run(n, -1);
  feed[0] = 0;
  feed[n] = 1;
  const inner = feed.slice(1, n);
  const lost = inner.filter((f) => f < 0).length;
  const worstDv = Math.max(...dv.filter((_, k) => feed[k] >= 0));
  const worstI = Math.max(...I);
  const Imax = LOOP.Imax[c.kind];
  return { feed, dv, I, worstDv, worstI, lost, ok: lost === 0 && worstDv <= (fault >= 0 ? LOOP.dvRescue : LOOP.dvMax) && worstI <= Imax };
}

export interface LoopInfo extends LoopState {
  Imax: number;
  /** The open point that minimises the worst drop at this load (no fault). */
  bestOpen: number;
  bestDv: number;
}

export function loopInfo(p: Params): LoopInfo {
  const s = loopState(p);
  const c = CABLES[Math.round(p.cable)] ?? CABLES[0];
  let bestOpen = 0, bestDv = Infinity;
  for (let o = 0; o < LOOP.sections; o++) {
    const w = loopState({ ...p, open: o, fault: FAULT.none }).worstDv;
    if (w < bestDv - 1e-9) {
      bestDv = w;
      bestOpen = o;
    }
  }
  return { ...s, Imax: LOOP.Imax[c.kind], bestOpen, bestDv };
}

export const loopModel: Model = {
  id: 'mv-loop',
  poles: () => [],
  window: () => LOOP.sections * LOOP.len,
  simulate(p, tEnd, n = 201): Run {
    // The axis is the distance along the loop, from substation A to substation B.
    const s = loopState(p);
    const x = linspace(0, tEnd, n);
    const at = (d: number) => Math.min(LOOP.sections, Math.max(0, d / LOOP.len));
    const v = x.map((d) => {
      const k = at(d), k0 = Math.floor(k), k1 = Math.min(LOOP.sections, k0 + 1), f = k - k0;
      // An open section (its two ends fed from different sides, or not at all) leaves a gap.
      if (k1 !== k0 && (s.feed[k0] !== s.feed[k1] || s.feed[k0] < 0) && f > 0) return NaN;
      const a = s.feed[k0] < 0 ? NaN : 100 - s.dv[k0], b = s.feed[k1] < 0 ? NaN : 100 - s.dv[k1];
      return a + (b - a) * f;
    });
    const i = x.map((d) => s.I[Math.min(LOOP.sections - 1, Math.floor(at(d)))]);
    return { t: x, s: { v, i } };
  },
};

// ── 10.2 The distribution voltage plan over a day ─────────────────────────────

/**
 * A primary substation's busbar (tap changer with line-drop compensation), a 20 kV feeder
 * lumped at its far end, an MV/LV transformer with an off-load tap, and the last LV customer.
 * The feeder carries load and PV; PV producers may absorb reactive power.
 */
export const DVP = {
  Pload: 6, // MW, feeder peak
  Pbt: 0.25, // MW on the LV feeder at its peak
  R: 3.0, // Ω, equivalent feeder resistance (to the lumped far end)
  X: 2.6,
  rBT: 0.025, // Ω, LV feeder to the last customer (400 V)
  xBT: 0.01,
  tanLoad: 0.3,
  trafoDrop: 2, // % MV/LV transformer drop at full load
  limitsMV: [95, 105], // % of 20 kV at the far end, order of magnitude
  limitsLV: [90, 110], // % of 230 V (EN 50160)
  window: 24,
};
export const QMODE = { none: 0, tan: 1, qu: 2 } as const;

/** Winter-day load shape with an evening peak, and a clear-sky PV shape (fractions). */
export const dLoad = (h: number) => 0.45 + 0.25 * Math.exp(-(((h - 12.5) / 3) ** 2)) + 0.55 * Math.exp(-(((h - 19) / 2) ** 2));
export const dPV = (h: number) => Math.max(0, Math.cos(((h - 13) / 14) * 2 * Math.PI)) ** 2 * (h > 6 && h < 20 ? 1 : 0);

export function dvpAt(p: Params, h: number) {
  const PL = DVP.Pload * dLoad(h), QL = PL * DVP.tanLoad;
  const Ppv = p.pv * dPV(h);
  const Pnet = PL - Ppv;
  // MV voltage at the far end before reactive control, to drive Q(U).
  const drop = (P: number, Q: number) => (100 * (DVP.R * P + DVP.X * Q)) / U ** 2;
  // Busbar: setpoint plus line-drop compensation on the net power through the feeder.
  const Vbus = p.Vc + (p.ldc * Pnet) / DVP.Pload;
  let Qpv = 0;
  if (p.qmode === QMODE.tan) Qpv = -0.35 * Ppv;
  const far0 = Vbus - drop(Pnet, QL - Qpv);
  if (p.qmode === QMODE.qu) {
    // Absorb in proportion to the overvoltage above 102 %, up to tan φ = −0.35 at 104 %.
    const k = Math.max(0, Math.min(1, (far0 - 102) / 2));
    Qpv = -0.35 * Ppv * k;
  }
  const farMV = Vbus - drop(Pnet, QL - Qpv);
  // LV: the transformer's off-load tap raises the LV side; LV load drops, LV PV raises.
  const sLV = dLoad(h), pvLV = (p.pv / 4) * dPV(h) * (DVP.Pbt / 1.5); // LV PV scales with the feeder's
  const PbtNet = DVP.Pbt * sLV - pvLV;
  const lvDrop = (100 * (DVP.rBT * PbtNet + DVP.xBT * DVP.Pbt * sLV * DVP.tanLoad)) / 0.4 ** 2;
  const trafo = DVP.trafoDrop * (PbtNet / DVP.Pbt);
  const lvEnd = farMV + p.tap - trafo - lvDrop;
  return { Vbus, farMV, lvEnd, Pnet, Qpv, Ppv, PL };
}

export interface DvpInfo {
  mvMin: number;
  mvMax: number;
  lvMin: number;
  lvMax: number;
  ok: boolean;
  /** Reactive energy absorbed by PV over the day (Mvarh), a cost for the network. */
  qAbs: number;
}

export function dvpInfo(p: Params): DvpInfo {
  let mvMin = Infinity, mvMax = -Infinity, lvMin = Infinity, lvMax = -Infinity, qAbs = 0;
  for (let h = 0; h < 24; h += 0.25) {
    const s = dvpAt(p, h);
    mvMin = Math.min(mvMin, s.farMV);
    mvMax = Math.max(mvMax, s.farMV);
    lvMin = Math.min(lvMin, s.lvEnd);
    lvMax = Math.max(lvMax, s.lvEnd);
    qAbs += -s.Qpv * 0.25;
  }
  const ok = lvMin >= DVP.limitsLV[0] && lvMax <= DVP.limitsLV[1] && mvMin >= DVP.limitsMV[0] && mvMax <= DVP.limitsMV[1];
  return { mvMin, mvMax, lvMin, lvMax, ok, qAbs };
}

export const dvpModel: Model = {
  id: 'distribution-voltage-plan',
  poles: () => [],
  window: () => DVP.window,
  simulate(p, tEnd, n = 289): Run {
    const t = linspace(0, tEnd, n);
    const r = Array.from(t, (h) => dvpAt(p, h));
    return {
      t,
      s: {
        bus: Float64Array.from(r, (x) => x.Vbus),
        mv: Float64Array.from(r, (x) => x.farMV),
        lv: Float64Array.from(r, (x) => x.lvEnd),
        pnet: Float64Array.from(r, (x) => x.Pnet),
      },
    };
  },
};

// ── 10.3 Neutral earthing and residual currents (3I0) ────────────────────────

/**
 * A 20 kV network: the faulty feeder holds 10 % of the network's capacitance, the largest
 * healthy feeder 20 %. Capacitance to earth: about 0.3 µF/km per phase for cables, 5 nF/km
 * for overhead lines.
 */
export const NEUTRAL = { isolated: 0, resistance: 1, compensated: 2 } as const;
export const RELAY = { amp: 0, watt: 1 } as const;
export const NTR = { cCable: 0.3e-6, cLine: 5e-9, overhead: 400, share: [0.1, 0.2], coilLoss: 0.05, wattMin: 1.5 };

export interface FaultPhasors {
  Ea: Complex;
  Eb: Complex;
  Ec: Complex;
  Vn: Complex; // neutral-point displacement
  Va: Complex;
  Vb: Complex;
  Vc: Complex;
  If: Complex; // fault current
  I0f: Complex; // residual current measured at the faulty feeder's head
  I0h: Complex; // residual current at the largest healthy feeder
  IN: Complex; // current through the neutral impedance
  Ic: number; // total capacitive current for a solid fault on an isolated network (A)
}

export function faultPhasors(p: Params): FaultPhasors {
  const C = 3 * 0 + p.Lc * NTR.cCable + NTR.overhead * NTR.cLine; // per phase, whole network (F)
  const Y3C = cx(0, 3 * W * C);
  const Ea = cx(E), Eb = polar(E, (-2 * Math.PI) / 3), Ec = polar(E, (2 * Math.PI) / 3);
  // Neutral admittance.
  let Yn = cx(0);
  if (p.regime === NEUTRAL.resistance) Yn = cx(p.In / E);
  if (p.regime === NEUTRAL.compensated) {
    const B = 3 * W * C * (1 + p.detune / 100); // coil susceptance; positive detune = over-compensated
    Yn = cx(NTR.coilLoss * 3 * W * C, -B);
  }
  const Gf = 1 / Math.max(0.01, p.Rf);
  // Vn (Yn + 3jωC + 1/Rf) = −Ea/Rf
  const Vn = cdiv(cmul(Ea, cx(-Gf)), cadd(cadd(Yn, Y3C), cx(Gf)));
  const Va = cadd(Ea, Vn), Vb = cadd(Eb, Vn), Vc = cadd(Ec, Vn);
  const If = cmul(Va, cx(Gf));
  const IN = cmul(Vn, Yn);
  const [sf, sh] = NTR.share;
  // Healthy feeder: its own capacitive current. Faulty feeder: everything else, seen from its head.
  const I0h = cmul(Vn, cx(0, 3 * W * C * sh));
  const I0f = cmul(Vn, cadd(Yn, cx(0, 3 * W * C * (1 - sf))));
  return { Ea, Eb, Ec, Vn, Va, Vb, Vc, If, I0f: cmul(I0f, cx(-1)), I0h, IN, Ic: 3 * W * C * E };
}

export interface NeutralInfo extends FaultPhasors {
  ifA: number;
  i0f: number;
  i0h: number;
  vMax: number; // highest healthy phase-to-earth voltage (pu of E)
  faultyTrips: boolean;
  healthyTrips: boolean;
  /** Active residual power seen at the faulty and healthy feeders (kW), for the wattmetric relay. */
  pf: number;
  ph: number;
}

export function neutralInfo(p: Params): NeutralInfo {
  const f = faultPhasors(p);
  const V0 = f.Vn; // zero-sequence voltage equals the neutral displacement here
  // Residual active power, with the convention that power flows into the feeder from the busbar.
  const pres = (I: Complex) => (3 * (V0.re * I.re + V0.im * I.im)) / 1000 / 3;
  const pf = -pres(f.I0f), ph = -pres(f.I0h);
  const amp = (I: Complex) => cabs(I) > p.Is0;
  // A wattmetric relay trips on residual current above the threshold and active power flowing towards the fault.
  const watt = (I: Complex, P: number) => cabs(I) > p.Is0 * 0.2 && P > NTR.wattMin;
  const faultyTrips = p.relay === RELAY.watt ? watt(f.I0f, pf) : amp(f.I0f);
  const healthyTrips = p.relay === RELAY.watt ? watt(f.I0h, ph) : amp(f.I0h);
  return {
    ...f,
    ifA: cabs(f.If),
    i0f: cabs(f.I0f),
    i0h: cabs(f.I0h),
    vMax: Math.max(cabs(f.Vb), cabs(f.Vc)) / E,
    faultyTrips,
    healthyTrips,
    pf,
    ph,
  };
}

export const neutralModel: Model = {
  id: 'neutral',
  poles: () => [],
  window: () => 0.06,
  simulate(p, tEnd, n = 601): Run {
    // Steady-state waveforms during the fault, from the phasors (peak = √2 × RMS).
    const f = faultPhasors(p);
    const t = linspace(0, tEnd, n);
    const wave = (z: Complex, scale = 1) => t.map((x) => (Math.SQRT2 * cabs(z) * Math.cos(W * x + Math.atan2(z.im, z.re))) / scale);
    return {
      t,
      s: {
        va: wave(f.Va, 1000),
        vb: wave(f.Vb, 1000),
        vc: wave(f.Vc, 1000),
        vn: wave(f.Vn, 1000),
        if: wave(f.If),
        i0f: wave(f.I0f),
        i0h: wave(f.I0h),
      },
    };
  },
};

// ── 10.4 The MV protection plan: settings, grading, reclosing ──────────────────

export const PROT = {
  Scc: 250, // MVA at the primary substation's MV busbar
  zr: 0.22, // Ω/km, overhead feeder
  zx: 0.35,
  len: 20,
  Iload: 250, // A, feeder's highest load current
  tIncomer: 0.7, // s, the transformer incomer's time delay
  margin: 0.3, // s, grading margin
  tFault: 1,
  rapid: 0.3, // s, rapid reclosing dead time
  slow: 15, // s, slow reclosing dead time
  window: 40,
};
export const FTYPE = { transient: 0, permanent: 1 } as const;

/** Three-phase and phase-to-phase fault currents (A) at distance d (km). */
export function iccAt(d: number) {
  const Zs = (U ** 2 / PROT.Scc); // Ω, mostly reactive
  const Z = Math.hypot(PROT.zr * d, Zs + PROT.zx * d);
  const I3 = (1000 * U) / (Math.sqrt(3) * Z);
  return { I3, I2: (Math.sqrt(3) / 2) * I3 };
}

export function protRun(p: Params, tEnd = PROT.window, n = 4001) {
  const t = linspace(0, tEnd, n);
  const Ifault = iccAt(p.d).I2;
  const sees = Ifault > p.Is;
  const out = { i: new Float64Array(n), brk: new Float64Array(n), sup: new Float64Array(n) };
  // Event list: fault, trips and reclosures.
  type Ev = { t: number; closed: boolean; faultOn: boolean };
  const ev: Ev[] = [{ t: 0, closed: true, faultOn: false }];
  let tt = PROT.tFault;
  ev.push({ t: tt, closed: true, faultOn: true });
  let lockout = false, shots = 0;
  const cycle = p.reclose ? [PROT.rapid, PROT.slow] : [];
  while (sees && tt < tEnd) {
    const tTrip = tt + p.td + 0.06; // relay time + breaker
    ev.push({ t: tTrip, closed: false, faultOn: p.type === FTYPE.permanent });
    if (shots >= cycle.length) {
      lockout = true;
      break;
    }
    const tClose = tTrip + cycle[shots++];
    const faultBack = p.type === FTYPE.permanent;
    ev.push({ t: tClose, closed: true, faultOn: faultBack });
    if (!faultBack) break;
    tt = tClose;
  }
  // The incomer clears the fault if the feeder relay does not see it.
  let incomer = false;
  if (!sees && Ifault > 1.2 * PROT.Iload) {
    incomer = true;
    ev.push({ t: PROT.tFault + PROT.tIncomer + 0.06, closed: false, faultOn: true });
    lockout = true;
  }
  ev.sort((a, b) => a.t - b.t);
  for (let k = 0; k < n; k++) {
    let s = ev[0];
    for (const e of ev) if (e.t <= t[k]) s = e;
    out.brk[k] = s.closed ? 1 : 0;
    out.i[k] = s.closed ? (s.faultOn ? Ifault : PROT.Iload) : 0;
    out.sup[k] = s.closed ? 100 : 0;
  }
  const tripTimes = ev.filter((e) => !e.closed).map((e) => e.t);
  return { t, s: out, sees, lockout, incomer, tripTimes, Ifault };
}

export interface ProtInfo {
  I3end: number;
  I2end: number;
  I3start: number;
  /** The setting window: above the load (×1.3), below the end-of-feeder two-phase fault (×0.8). */
  isMin: number;
  isMax: number;
  setOk: boolean;
  graded: boolean;
  sees: boolean;
  lockout: boolean;
  incomer: boolean;
  /** Customer minutes lost per customer for this event (min). */
  outage: number;
  Ifault: number;
}

export function protInfo(p: Params): ProtInfo {
  const end = iccAt(PROT.len), start = iccAt(0);
  const r = protRun(p);
  const isMin = 1.3 * PROT.Iload, isMax = 0.8 * end.I2;
  // Outage: zero if restored; otherwise until a crew isolates the section (about an hour, say 60 min).
  const restored = r.s.sup[r.s.sup.length - 1] > 0;
  const off = Array.from(r.s.sup).filter((v) => v === 0).length * (PROT.window / (r.t.length - 1));
  return {
    I3end: end.I3,
    I2end: end.I2,
    I3start: start.I3,
    isMin,
    isMax,
    setOk: p.Is >= isMin && p.Is <= isMax,
    graded: p.td + PROT.margin <= PROT.tIncomer + 1e-9,
    sees: r.sees,
    lockout: r.lockout,
    incomer: r.incomer,
    outage: restored ? off / 60 : 60,
    Ifault: r.Ifault,
  };
}

export const protModel: Model = {
  id: 'mv-protection',
  poles: () => [],
  window: () => PROT.window,
  simulate(p, tEnd, n = 4001): Run {
    const r = protRun(p, tEnd, n);
    return { t: r.t, s: r.s };
  },
};

// ── 10.5 Planning: N-1 at the primary substation, flexibility ──────────────────

/**
 * A primary substation with two 36 MVA transformers. Its N-1 firm capacity is one transformer
 * with a temporary overload, plus what MV back-up links can transfer to neighbours. Peak load
 * grows each year; contracted flexibility shaves the peak; the remedy is a third transformer.
 */
export const PLAN = { trafo: 36, overload: 1.2, pf: 0.95, P0: 34, cost: 4000, rate: 0.05, years: 20 };

export function firm(p: Params) {
  return PLAN.trafo * PLAN.overload * PLAN.pf + p.backup;
}

/** The first year (fractional) in which the peak, less flexibility, exceeds the firm capacity. */
export function violationYear(p: Params, flex = p.flex): number {
  const C = firm(p);
  const g = p.growth / 100;
  if (g <= 0) return PLAN.P0 - flex > C ? 0 : Infinity;
  const y = Math.log((C + flex) / PLAN.P0) / Math.log(1 + g);
  return Math.max(0, y);
}

export interface PlanInfo {
  firm: number;
  yNoFlex: number;
  yFlex: number;
  deferral: number;
  /** Value of deferring the investment (k€), against the cost of flexibility over the deferral (k€). */
  value: number;
  flexCost: number;
  net: number;
}

export function planInfo(p: Params): PlanInfo {
  const yNoFlex = violationYear(p, 0), yFlex = violationYear(p);
  const deferral = isFinite(yFlex) && isFinite(yNoFlex) ? yFlex - yNoFlex : isFinite(yNoFlex) ? PLAN.years : 0;
  const disc = (y: number) => (isFinite(y) ? 1 / (1 + PLAN.rate) ** y : 0);
  const value = PLAN.cost * (disc(yNoFlex) - disc(Math.min(yNoFlex + deferral, 60)));
  // Flexibility is paid each year it is needed, from the first violation to the deferred one.
  let flexCost = 0;
  for (let y = Math.floor(yNoFlex); isFinite(y) && y < yNoFlex + deferral && y < 60; y++) flexCost += (p.flex * p.price) / (1 + PLAN.rate) ** y;
  return { firm: firm(p), yNoFlex, yFlex, deferral, value, flexCost, net: value - flexCost };
}

export const planModel: Model = {
  id: 'planning',
  poles: () => [],
  window: () => PLAN.years,
  simulate(p, tEnd, n = 201): Run {
    const t = linspace(0, tEnd, n);
    const C = firm(p);
    const yR = violationYear(p);
    return {
      t,
      s: {
        peak: t.map((y) => PLAN.P0 * (1 + p.growth / 100) ** y),
        net: t.map((y) => PLAN.P0 * (1 + p.growth / 100) ** y - p.flex),
        firm: t.map((y) => (y >= yR ? C + PLAN.trafo * PLAN.pf : C)),
      },
    };
  },
};
