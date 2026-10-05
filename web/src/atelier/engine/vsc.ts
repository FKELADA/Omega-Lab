// Averaged three-phase voltage-source converters, as in lessons 7.1–7.2: three
// controlled EMFs behind the filter inductance, driven by their control after
// every network step.
// - Grid-following (GFL): synchronous-frame PLL, dq current loops with
//   decoupling and a current limit; the power setpoint comes from the resource.
// - Grid-forming (GFM): virtual synchronous machine, an internal voltage whose
//   angle follows P–f droop with inertia and whose magnitude follows Q–V droop.

import { monitor, rlSeries } from './elements';
import type { EmtElement } from './emt';
import { vsrcVar } from './grid';

const S3 = Math.sqrt(3);

export interface VscBase {
  Sn: number;
  Vn: number;
  f: number;
  lf: number; // filter inductance, pu
}

export interface GflCfg extends VscBase {
  fc: number; // current-loop bandwidth, Hz
  fpll: number; // PLL bandwidth, Hz
  Imax: number; // pu
}

/** What the resource sees of its converter each step (SI, peak dq quantities). */
export interface VscMeas {
  t: number;
  h: number;
  P: number; // W, delivered
  Q: number; // var, delivered
  f: number; // Hz (PLL or internal)
  vd: number;
  Vpk: number; // rated phase peak
}

interface Core {
  els: EmtElement[];
}

function filter(id: string, nodes: number[], c: VscBase, h: number, node: () => number) {
  const w0 = 2 * Math.PI * c.f, Zb = (c.Vn * c.Vn) / c.Sn;
  const Lf = (c.lf * Zb) / w0, Rf = (c.lf / 20) * Zb;
  const e = [0, 0, 0];
  const x = [node(), node(), node()];
  const src = x.map((xi, k) => vsrcVar(`${id}:e${k}`, xi, 0, () => e[k]));
  const br = nodes.map((n, k) => rlSeries(`${id}:f${k}`, x[k], n, Rf, Lf, h));
  return { e, src, br, Lf, Rf, w0 };
}

const clarke = (a: number, b: number, c: number) => [(2 * a - b - c) / 3, (b - c) / S3];
const toAbc = (al: number, be: number) => [al, -0.5 * al + (S3 / 2) * be, -0.5 * al - (S3 / 2) * be];

/**
 * Grid-following converter. `setpoint(m)` returns the active and reactive power
 * to deliver (W, var). Extra outputs from `extra(m)` are recorded with the run.
 */
export function gflCore(
  id: string,
  nodes: number[],
  c: GflCfg,
  h: number,
  node: () => number,
  setpoint: (m: VscMeas) => { P: number; Q: number },
  extra: (m: VscMeas) => Record<string, number> = () => ({}),
): Core {
  const { e, src, br, Lf, Rf, w0 } = filter(id, nodes, c, h, node);
  const Vpk = (Math.SQRT2 * c.Vn) / S3, Ipk = (Math.SQRT2 * c.Sn) / (S3 * c.Vn);
  const wn = 2 * Math.PI * c.fpll, Kp = 1.4 * wn, Ki = wn * wn;
  const wc = 2 * Math.PI * c.fc, Kpc = Lf * wc, Kic = Rf * wc;
  let th = 0, xi = 0, w = w0, xd = 0, xq = 0, t = 0, started = false;
  const ctrl = monitor(
    id,
    (_x, v) => {
      t += h;
      const [va, vb, vc] = nodes.map(v);
      const [ia, ib, ic] = br.map((q) => q.i);
      const [val, vbe] = clarke(va, vb, vc), [ial, ibe] = clarke(ia, ib, ic);
      if (!started) {
        // Lock the PLL on the measured voltage at the first step.
        th = Math.atan2(vbe, val);
        started = true;
      }
      const cs = Math.cos(th), sn = Math.sin(th);
      const vd = val * cs + vbe * sn, vq = -val * sn + vbe * cs;
      const id_ = ial * cs + ibe * sn, iq = -ial * sn + ibe * cs;
      // PLL: drive v_q to zero.
      const err = vq / Vpk;
      xi += Ki * err * h;
      // The PLL's frequency is limited to ±10 Hz (as real PLLs are).
      xi = Math.max(-2 * Math.PI * 10, Math.min(2 * Math.PI * 10, xi));
      w = Math.max(w0 - 2 * Math.PI * 10, Math.min(w0 + 2 * Math.PI * 10, w0 + Kp * err + xi));
      th += w * h;
      const P = 1.5 * (vd * id_ + vq * iq), Q = 1.5 * (vq * id_ - vd * iq);
      const m: VscMeas = { t, h, P, Q, f: w / (2 * Math.PI), vd, Vpk };
      const sp = setpoint(m);
      const vdg = Math.max(vd, 0.2 * Vpk);
      let idr = sp.P / (1.5 * vdg), iqr = -sp.Q / (1.5 * vdg);
      // Current limit (active current first).
      const lim = c.Imax * Ipk;
      idr = Math.max(-lim, Math.min(lim, idr));
      const qroom = Math.sqrt(Math.max(0, lim * lim - idr * idr));
      iqr = Math.max(-qroom, Math.min(qroom, iqr));
      // Current loops with decoupling and voltage feed-forward.
      xd += Kic * (idr - id_) * h;
      xq += Kic * (iqr - iq) * h;
      let ed = vd - w * Lf * iq + Kpc * (idr - id_) + xd;
      let eq = vq + w * Lf * id_ + Kpc * (iqr - iq) + xq;
      // Modulation limit: the converter cannot produce more than 1.3 pu of voltage.
      const emag = Math.hypot(ed, eq), emax = 1.3 * Vpk;
      if (emag > emax) {
        ed *= emax / emag;
        eq *= emax / emag;
        xd = Math.max(-emax, Math.min(emax, xd));
        xq = Math.max(-emax, Math.min(emax, xq));
      }
      const th2 = th; // angle for the next step
      const [ea, eb, ec] = toAbc(ed * Math.cos(th2) - eq * Math.sin(th2), ed * Math.sin(th2) + eq * Math.cos(th2));
      e[0] = ea;
      e[1] = eb;
      e[2] = ec;
      return { ia, ib, ic, P: P / c.Sn, Q: Q / c.Sn, f: m.f, id: id_ / Ipk, iq: iq / Ipk, ...extra(m) };
    },
    { ia: 0, ib: 0, ic: 0, P: 0, Q: 0, f: c.f, id: 0, iq: 0, ...extra({ t: 0, h, P: 0, Q: 0, f: c.f, vd: 0, Vpk }) },
  );
  return { els: [...src, ...br, ctrl] };
}

export interface GfmCfg extends VscBase {
  H: number; // virtual inertia, s
  R: number; // P–f droop, pu (Δf/f0 per ΔP/Sn)
  kq: number; // Q–V droop, pu
}

/** Grid-forming converter (virtual synchronous machine with droops). */
export function gfmCore(
  id: string,
  nodes: number[],
  c: GfmCfg,
  h: number,
  node: () => number,
  setpoint: (m: VscMeas) => { P: number; Q: number },
): Core {
  const { e, src, br, w0 } = filter(id, nodes, c, h, node);
  const Vpk = (Math.SQRT2 * c.Vn) / S3;
  let th = 0, w = 1, t = 0, started = false, Pf = 0, Qf = 0;
  const ctrl = monitor(
    id,
    (_x, v) => {
      t += h;
      const [va, vb, vc] = nodes.map(v);
      const [ia, ib, ic] = br.map((q) => q.i);
      const [val, vbe] = clarke(va, vb, vc), [ial, ibe] = clarke(ia, ib, ic);
      if (!started) {
        th = Math.atan2(vbe, val);
        started = true;
      }
      // Instantaneous powers, lightly filtered (5 ms).
      const P = 1.5 * (val * ial + vbe * ibe), Q = 1.5 * (vbe * ial - val * ibe);
      Pf += (h / 0.005) * (P - Pf);
      Qf += (h / 0.005) * (Q - Qf);
      const m: VscMeas = { t, h, P: Pf, Q: Qf, f: (w * w0) / (2 * Math.PI), vd: Math.hypot(val, vbe), Vpk };
      const sp = setpoint(m);
      // Swing equation of the virtual machine, with the droop as damping.
      w += (h / (2 * c.H)) * ((sp.P - Pf) / c.Sn - (w - 1) / c.R);
      w = Math.max(0.8, Math.min(1.2, w));
      th += w * w0 * h;
      const E = Vpk * Math.max(0.5, Math.min(1.3, 1 + c.kq * ((sp.Q - Qf) / c.Sn)));
      for (let k = 0; k < 3; k++) e[k] = E * Math.cos(th - (2 * Math.PI * k) / 3);
      return { ia, ib, ic, P: Pf / c.Sn, Q: Qf / c.Sn, f: m.f };
    },
    { ia: 0, ib: 0, ic: 0, P: 0, Q: 0, f: c.f },
  );
  return { els: [...src, ...br, ctrl] };
}
