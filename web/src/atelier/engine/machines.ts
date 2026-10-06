// Rotating machines for the EMT solver, as EMFs behind an impedance whose
// internal states (rotor angle and speed, rotor flux) are integrated after
// every network step and fed back at the next one (standard one-step interface).

import { monitor, rlSeries } from './elements';
import type { EmtElement } from './emt';
import { vsrcVar } from './grid';

const TWO_PI_3 = (2 * Math.PI) / 3;

export interface SmParams {
  Sn: number; // VA
  Vn: number; // V, line RMS
  f: number;
  H: number; // s
  D: number; // pu
  xd: number; // transient reactance, pu
  ra: number; // pu
  P0: number; // mechanical power setpoint, pu
  E0: number; // internal EMF, pu
  KA: number; // AVR gain (0: constant EMF)
  TA: number; // s
  /** Voltage setpoint (pu); 0: the terminal voltage reached at the end of initialisation. */
  Vref: number;
  R: number; // governor droop, pu (0: constant mechanical power)
  Tg: number; // s
  tRel: number; // s: rotor held at synchronous speed while the network transients die out
  /** Initial rotor angle (rad), from the steady-state initialisation (analyses.initMachines). */
  delta0?: number;
}

/**
 * Synchronous machine, classical model (EMF E behind the transient reactance),
 * with an optional voltage regulator and speed governor. Until tRel the rotor is
 * held at synchronous speed at the angle δ0 found by a steady-state solve with
 * P_e = P_m, while the network energisation transients die out; then it is
 * released. This is how EMT programs start machines in steady state.
 */
export function syncMachine(id: string, [a, b, c]: number[], p: SmParams, h: number, node: () => number): EmtElement[] {
  const w0 = 2 * Math.PI * p.f;
  const Zb = (p.Vn * p.Vn) / p.Sn;
  const Vph = (Math.SQRT2 * p.Vn) / Math.sqrt(3);
  let Vt0 = 1;
  let delta = p.delta0 ?? 0, w = 1, E = p.E0, Pm = p.P0, Pe = 0, t = 0;
  const e = [0, 0, 0];
  const x = [node(), node(), node()];
  const src = x.map((xi, k) => vsrcVar(`${id}:e${k}`, xi, 0, () => e[k]));
  const br = [a, b, c].map((n, k) => rlSeries(`${id}:z${k}`, x[k], n, p.ra * Zb, (p.xd * Zb) / w0, h));
  const setEmf = () => {
    const th = w0 * t + delta;
    for (let k = 0; k < 3; k++) e[k] = Vph * E * Math.cos(th - TWO_PI_3 * k);
  };
  setEmf();
  const ctrl = monitor(
    id,
    (_x, v) => {
      t += h;
      const [va, vb, vc] = [a, b, c].map(v);
      // Branch current runs from the EMF to the terminal: the current the machine delivers.
      const [ia, ib, ic] = br.map((q) => q.i);
      // Air-gap power delivered by the EMFs (machine convention: positive when generating).
      Pe = (e[0] * br[0].i + e[1] * br[1].i + e[2] * br[2].i) / p.Sn;
      const Vt = Math.sqrt((2 / 3) * (va * va + vb * vb + vc * vc)) / Vph;
      // Voltage regulator around the initial operating point; field limits 0–3 pu.
      if (t < p.tRel) Vt0 = Vt;
      const ref = p.Vref > 0 ? p.Vref : Vt0;
      if (p.KA > 0 && t >= p.tRel) E = Math.max(0, Math.min(3, E + (h / p.TA) * (p.E0 + p.KA * (ref - Vt) - E)));
      if (p.R > 0) Pm += (h / p.Tg) * (p.P0 + (1 - w) / p.R - Pm);
      if (t < p.tRel) {
        // Initialisation: rotor locked at δ0 and synchronous speed.
        w = 1;
      } else {
        w += (h / (2 * p.H)) * (Pm - Pe - p.D * (w - 1));
        delta += h * w0 * (w - 1);
      }
      setEmf();
      return { va, vb, vc, ia, ib, ic, delta: (delta * 180) / Math.PI, f: p.f * w, Pe, Pm, E, Vt };
    },
    { va: 0, vb: 0, vc: 0, ia: 0, ib: 0, ic: 0, delta: 0, f: p.f, Pe: 0, Pm: p.P0, E: p.E0, Vt: 0 },
  );
  // The controller runs last, after the branches have taken this step's currents.
  return [...src, ...br, ctrl];
}

export interface ImParams {
  Pn: number;
  Vn: number;
  f: number;
  pp: number; // pole pairs
  rs: number;
  rr: number;
  xls: number;
  xlr: number;
  xm: number; // pu on Vn²/Pn
  H: number; // s
  T0: number; // load torque, pu of rated
  fan: number; // 1: torque ∝ speed², 0: constant
}

/**
 * Induction motor as a voltage behind its transient inductance L′ (stator frame).
 * Rotor flux ψr: dψr/dt = (Lm/Tr) i_s − ψr/Tr + j ω_r ψr; back-EMF e′ = (Lm/Lr) dψr/dt;
 * torque T = 1.5 p (Lm/Lr) Im(ψr* i_s). Starts from standstill.
 */
export function inductionMotor(id: string, [a, b, c]: number[], p: ImParams, h: number, node: () => number): EmtElement[] {
  const wb = 2 * Math.PI * p.f;
  const Zb = (p.Vn * p.Vn) / p.Pn;
  const Lls = (p.xls * Zb) / wb, Llr = (p.xlr * Zb) / wb, Lm = (p.xm * Zb) / wb;
  const Rs = p.rs * Zb, Rr = p.rr * Zb;
  const Ls = Lls + Lm, Lr = Llr + Lm, Lp = Ls - (Lm * Lm) / Lr, Tr = Lr / Rr;
  const ws = wb / p.pp; // synchronous mechanical speed
  const Tn = p.Pn / (ws * 0.97); // rated torque (about 3 % slip)
  const J = (2 * p.H * p.Pn) / (ws * ws);
  let pa = 0, pb = 0, wm = 0, Te = 0;
  const e = [0, 0, 0];
  const x = [node(), node(), node()];
  const src = x.map((xi, k) => vsrcVar(`${id}:e${k}`, xi, 0, () => e[k]));
  // Branch from the terminal into the machine: its current is the motor current.
  const br = [a, b, c].map((n, k) => rlSeries(`${id}:z${k}`, n, x[k], Rs, Lp, h));
  const ctrl = monitor(
    id,
    (_x, v) => {
      const [ia, ib, ic] = br.map((q) => q.i);
      const ial = (2 * ia - ib - ic) / 3, ibe = (ib - ic) / Math.sqrt(3);
      const wr = p.pp * wm;
      const dA = (Lm / Tr) * ial - pa / Tr - wr * pb;
      const dB = (Lm / Tr) * ibe - pb / Tr + wr * pa;
      pa += h * dA;
      pb += h * dB;
      // Back-EMF for the next step, in αβ then abc.
      const eA = (Lm / Lr) * dA, eB = (Lm / Lr) * dB;
      e[0] = eA;
      e[1] = -0.5 * eA + (Math.sqrt(3) / 2) * eB;
      e[2] = -0.5 * eA - (Math.sqrt(3) / 2) * eB;
      Te = 1.5 * p.pp * (Lm / Lr) * (pa * ibe - pb * ial);
      const Tl = p.T0 * Tn * (p.fan ? (wm / ws) ** 2 : 1) * (wm > 0 || Te > p.T0 * Tn ? 1 : 0);
      wm += (h / J) * (Te - Tl);
      if (wm < 0 && !p.fan) wm = 0;
      const [va, vb, vc] = [a, b, c].map(v);
      return { ia, ib, ic, va, vb, vc, n: (wm * 60) / (2 * Math.PI), Te, slip: 1 - wm / ws, p: va * ia + vb * ib + vc * ic };
    },
    { ia: 0, ib: 0, ic: 0, va: 0, vb: 0, vc: 0, n: 0, Te: 0, slip: 1, p: 0 },
  );
  // The controller runs last, after the branches have taken this step's currents.
  return [...src, ...br, ctrl];
}
