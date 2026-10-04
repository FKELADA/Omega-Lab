// Models for lessons 2.5–2.8: Clarke/Park transforms, per-unit, Fourier series,
// symmetrical components.

import { cabs, cadd, cdiv, cmul, cx, polar, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import { phasorRun } from './phasorRun';
import type { Model, Params, Run } from './types';

const deg = Math.PI / 180;

// ── 2.5 Clarke and Park ───────────────────────────────────────────────────────

/** Amplitude-invariant Clarke transform. */
export function clarke(a: number, b: number, c: number): [number, number] {
  return [(2 / 3) * (a - b / 2 - c / 2), (1 / Math.sqrt(3)) * (b - c)];
}

/** Park rotation of (α, β) into a frame at angle θ. */
export function park(al: number, be: number, th: number): [number, number] {
  const c = Math.cos(th), s = Math.sin(th);
  return [al * c + be * s, -al * s + be * c];
}

export interface ParkInfo {
  omega: number;
  omegaFrame: number;
  Vpk: number;
  /** Positive- and negative-sequence peak amplitudes of the fundamental. */
  V1: number;
  V2: number;
}

export function parkInfo({ V, f, kc, ratio }: Params): ParkInfo {
  const Vpk = Math.SQRT2 * V;
  const a = polar(1, 120 * deg);
  // Phase c scaled by kc: Fortescue on (1, a², kc·a).
  const Va = cx(Vpk), Vb = cmul(cx(Vpk), cmul(a, a)), Vc = cmul(cx(Vpk * kc), a);
  const V1 = cabs(cadd(cadd(Va, cmul(a, Vb)), cmul(cmul(a, a), Vc))) / 3;
  const V2 = cabs(cadd(cadd(Va, cmul(cmul(a, a), Vb)), cmul(a, Vc))) / 3;
  return { omega: 2 * Math.PI * f, omegaFrame: 2 * Math.PI * f * ratio, Vpk, V1, V2 };
}

export const clarkePark: Model = {
  id: 'clarke-park',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd, n = 1500): Run {
    const { kc, h5, phi } = p;
    const k = parkInfo(p);
    const t = linspace(0, tEnd, n);
    const out: Record<string, Float64Array> = {};
    for (const id of ['va', 'vb', 'vc', 'valpha', 'vbeta', 'vd', 'vq', 'theta']) out[id] = new Float64Array(n);
    t.forEach((tt, j) => {
      const th = k.omega * tt + phi * deg;
      const h = (h5 / 100) * k.Vpk;
      const va = k.Vpk * Math.cos(th) + h * Math.cos(5 * th);
      const vb = k.Vpk * Math.cos(th - 120 * deg) + h * Math.cos(5 * (th - 120 * deg));
      const vc = kc * k.Vpk * Math.cos(th + 120 * deg) + h * Math.cos(5 * (th + 120 * deg));
      const [al, be] = clarke(va, vb, vc);
      const thf = k.omegaFrame * tt;
      const [d, q] = park(al, be, thf);
      out.va[j] = va;
      out.vb[j] = vb;
      out.vc[j] = vc;
      out.valpha[j] = al;
      out.vbeta[j] = be;
      out.vd[j] = d;
      out.vq[j] = q;
      out.theta[j] = thf;
    });
    return { t, s: out };
  },
};

// ── 2.6 Per-unit: generator — T1 — line — T2 — load ───────────────────────────

/** The study system. Ratings are each device's own nameplate. */
export const PU_SYSTEM = {
  V1: 11e3, // generator zone, line-to-line
  T1: { S: 50e6, V1: 11e3, V2: 132e3, x: 0.1 },
  line: { R: 5, X: 20 }, // Ω, at 132 kV
  T2: { S: 40e6, V1: 132e3, V2: 33e3, x: 0.08 },
  V3: 33e3,
};

export interface Zone {
  Vb: number; // line-to-line base voltage
  Ib: number;
  Zb: number;
}

export interface PerUnitInfo {
  zones: [Zone, Zone, Zone];
  /** Series impedances on the common base, in pu. */
  zT1: Complex;
  zLine: Complex;
  zT2: Complex;
  zLoad: Complex;
  I: Complex; // pu
  Vload: Complex; // pu, on the load bus
  Pload: number; // W actually drawn (constant-impedance load at its voltage)
  drop: number; // 1 − |Vload|
}

export function perUnitInfo({ Sbase, Pload, pf, tap }: Params): PerUnitInfo {
  const s = PU_SYSTEM;
  // Bases: chosen in zone 1, carried through the nominal transformer ratios.
  const Vb = [s.V1, (s.V1 * s.T1.V2) / s.T1.V1, ((s.V1 * s.T1.V2) / s.T1.V1) * (s.T2.V2 / s.T2.V1)];
  const zones = Vb.map((v) => ({ Vb: v, Ib: Sbase / (Math.sqrt(3) * v), Zb: (v * v) / Sbase })) as [Zone, Zone, Zone];
  // Change of base: z_new = z_old · (S_new / S_old) · (V_old / V_new)².
  const zT1 = cx(0, s.T1.x * (Sbase / s.T1.S) * (s.T1.V1 / Vb[0]) ** 2);
  const zLine = cx(s.line.R / zones[1].Zb, s.line.X / zones[1].Zb);
  const zT2 = cx(0, s.T2.x * (Sbase / s.T2.S) * (s.T2.V1 / Vb[1]) ** 2);
  // Load: constant impedance sized for Pload at nominal voltage, lagging pf.
  const Q = Pload * Math.tan(Math.acos(pf));
  const zLoadSI = cdiv(cx(s.V3 * s.V3), cx(Pload, -Q)); // Z = V²/S*
  // An off-nominal tap t on T2 (secondary voltage ×t) is modelled by referring the
  // load to the primary: z_load / t².
  const zLoad = cx(zLoadSI.re / zones[2].Zb / (tap * tap), zLoadSI.im / zones[2].Zb / (tap * tap));
  const zSum = cadd(cadd(cadd(zT1, zLine), zT2), zLoad);
  const I = cdiv(cx(1), zSum);
  const VloadPrimary = cmul(I, zLoad);
  const Vload = { re: VloadPrimary.re * tap, im: VloadPrimary.im * tap };
  const PloadReal = (cabs(Vload) ** 2) * Pload;
  return { zones, zT1, zLine, zT2, zLoad, I, Vload, Pload: PloadReal, drop: 1 - cabs(Vload) };
}

export const perUnit: Model = {
  id: 'per-unit',
  poles: () => [],
  window: () => 2 / 50,
  simulate(p, tEnd) {
    const k = perUnitInfo(p);
    // Waveforms in pu (peak = √2 in RMS-based pu).
    const r2 = Math.SQRT2;
    return phasorRun(tEnd, 2 * Math.PI * 50, {
      vs: cx(r2),
      vl: { re: r2 * k.Vload.re, im: r2 * k.Vload.im },
      i: { re: r2 * k.I.re, im: r2 * k.I.im },
    });
  },
};

// ── 2.7 Fourier series ────────────────────────────────────────────────────────

export const TARGETS = { square: 0, triangle: 1, sawtooth: 2, rectifier: 3 } as const;

/** Sine-series coefficient b_n of each target, for unit amplitude. */
export function fourierB(target: number, n: number): number {
  switch (target) {
    case TARGETS.square:
      return n % 2 ? 4 / (n * Math.PI) : 0;
    case TARGETS.triangle:
      return n % 2 ? ((8 / (Math.PI * Math.PI * n * n)) * (((n - 1) / 2) % 2 ? -1 : 1)) : 0;
    case TARGETS.sawtooth:
      return ((2 / (n * Math.PI)) * (n % 2 ? 1 : -1));
    case TARGETS.rectifier:
      // 120° blocks: +1 on (30°, 150°), −1 on (210°, 330°). Multiples of 3 vanish.
      return n % 2 ? (4 / (n * Math.PI)) * Math.cos((n * Math.PI) / 6) : 0;
    default:
      return 0;
  }
}

/** The exact target waveform, unit amplitude. */
export function targetValue(target: number, th: number): number {
  const x = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  switch (target) {
    case TARGETS.square:
      return x < Math.PI ? 1 : -1;
    case TARGETS.triangle:
      return (2 / Math.PI) * Math.asin(Math.sin(th));
    case TARGETS.sawtooth:
      return x < Math.PI ? x / Math.PI : x / Math.PI - 2;
    case TARGETS.rectifier: {
      const d = x / deg;
      return d > 30 && d < 150 ? 1 : d > 210 && d < 330 ? -1 : 0;
    }
    default:
      return 0;
  }
}

export const H_MAX = 49;

export interface FourierInfo {
  b: number[]; // b[n], n = 1..H_MAX (b[0] unused)
  thd: number; // of the target, from H_MAX harmonics
  thdPartial: number;
  rmsTarget: number; // unit amplitude
}

const RMS_TARGET: Record<number, number> = {
  [TARGETS.square]: 1,
  [TARGETS.triangle]: 1 / Math.sqrt(3),
  [TARGETS.sawtooth]: 1 / Math.sqrt(3),
  [TARGETS.rectifier]: Math.sqrt(2 / 3),
};

export function fourierInfo({ target, N }: Params): FourierInfo {
  const b = [0];
  for (let n = 1; n <= H_MAX; n++) b.push(fourierB(target, n));
  const b1 = Math.abs(b[1]) || 1;
  const rms1 = b1 / Math.SQRT2;
  const rms = RMS_TARGET[target];
  // THD from the exact RMS (Parseval) — the truncated sum would underestimate it.
  const thd = Math.sqrt(Math.max(0, rms * rms - rms1 * rms1)) / rms1;
  let hp = 0;
  for (let n = 2; n <= N; n++) hp += b[n] * b[n];
  return { b, thd, thdPartial: Math.sqrt(hp) / b1, rmsTarget: rms };
}

export const fourier: Model = {
  id: 'fourier',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd, n = 2000): Run {
    const { target, N, V, f } = p;
    const k = fourierInfo(p);
    const w = 2 * Math.PI * f;
    const t = linspace(0, tEnd, n);
    const target_ = t.map((tt) => V * targetValue(target, w * tt));
    const partial = t.map((tt) => {
      let s = 0;
      for (let h = 1; h <= N; h++) if (k.b[h]) s += k.b[h] * Math.sin(h * w * tt);
      return V * s;
    });
    return {
      t,
      s: {
        target: target_,
        partial,
        h1: t.map((tt) => V * k.b[1] * Math.sin(w * tt)),
        err: partial.map((v, j) => v - target_[j]),
      },
    };
  },
};

// ── 2.8 Symmetrical components ────────────────────────────────────────────────

export const A = polar(1, 120 * deg);
const A2 = cmul(A, A);

export interface SequenceInfo {
  Va: Complex;
  Vb: Complex;
  Vc: Complex;
  V0: Complex;
  V1: Complex;
  V2: Complex;
  vuf: number; // |V2| / |V1|
  omega: number;
}

export function sequenceInfo({ Ma, Mb, Ab, Mc, Ac, f }: Params): SequenceInfo {
  const Va = polar(Ma, 0), Vb = polar(Mb, Ab * deg), Vc = polar(Mc, Ac * deg);
  const third = (z: Complex) => ({ re: z.re / 3, im: z.im / 3 });
  const V0 = third(cadd(cadd(Va, Vb), Vc));
  const V1 = third(cadd(cadd(Va, cmul(A, Vb)), cmul(A2, Vc)));
  const V2 = third(cadd(cadd(Va, cmul(A2, Vb)), cmul(A, Vc)));
  const m1 = cabs(V1);
  return { Va, Vb, Vc, V0, V1, V2, vuf: m1 > 1e-12 ? cabs(V2) / m1 : Infinity, omega: 2 * Math.PI * f };
}

export const sequences: Model = {
  id: 'sequences',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd) {
    const k = sequenceInfo(p);
    const r2 = (z: Complex) => ({ re: Math.SQRT2 * z.re, im: Math.SQRT2 * z.im });
    return phasorRun(tEnd, k.omega, {
      va: r2(k.Va),
      vb: r2(k.Vb),
      vc: r2(k.Vc),
      v1: r2(k.V1),
      v2: r2(k.V2),
      v0: r2(k.V0),
    });
  },
};

/** Bus voltages in pu along the chain: generator, T1 secondary, line end, load bus. */
export function busVoltages(k: PerUnitInfo): Complex[] {
  const drop = (V: Complex, z: Complex) => {
    const d = cmul(k.I, z);
    return { re: V.re - d.re, im: V.im - d.im };
  };
  const V1 = cx(1);
  const V2 = drop(V1, k.zT1);
  const V3 = drop(V2, k.zLine);
  return [V1, V2, V3, k.Vload];
}
