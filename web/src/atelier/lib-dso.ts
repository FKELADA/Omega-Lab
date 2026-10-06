// Distribution elements for Modules 9–10 benches: a primary-substation transformer whose MV
// neutral is a terminal (earth it through a resistor, a Petersen coil, or leave it isolated),
// and a breaker driven by its own protection relay (phase and earth overcurrent, time delays,
// auto-reclosing cycle).

import { cx, type Complex } from '../lib/core/linalg';
import { idealXfmr, monitor, rlSeries, resistor } from './engine/elements';
import { addG, nodeV, type EmtElement } from './engine/emt';
import { si, type ElementDef, type PortDef, type Sig } from './defs';

const ph = ['a', 'b', 'c'];
const port3 = (id: string, dx: number, label: string, dy = 0): PortDef => ({ id, dx, dy, phases: 3, label });
const inv = (z: Complex): Complex => {
  const d = z.re * z.re + z.im * z.im || 1e-300;
  return { re: z.re / d, im: -z.im / d };
};
/** A very large leakage to earth, so a floating (isolated) neutral stays solvable. */
const GLEAK = 1e-9;

function trafoParams(p: Record<string, number>) {
  const w = 2 * Math.PI * p.f, Zb = (p.V1 * p.V1) / p.S;
  return { R: p.r * Zb, Ls: (p.x * Zb) / w, n: p.V1 / p.V2 };
}

// ── The relay ─────────────────────────────────────────────────────────────────

export const RECLOSE = { none: 0, rapid: 1, both: 2 } as const;
export const RAPID_DEAD = 0.3;

type RelayState = 'closed' | 'tripping' | 'open' | 'closing' | 'locked';

/**
 * The relay: one-cycle RMS of each phase current and of the residual current 3I0, definite-time
 * phase and earth elements, and the reclosing sequence. The three pole switches read its orders.
 */
function relayController(p: Record<string, number>) {
  const T = 1 / (p.f || 50);
  const win = [0, 1, 2, 3].map(() => ({ t: [] as number[], q: [] as number[], sum: 0 }));
  const rms = [0, 0, 0, 0];
  const dead = p.reclose >= RECLOSE.both ? [RAPID_DEAD, p.tslow] : p.reclose >= RECLOSE.rapid ? [RAPID_DEAD] : [];
  const c = {
    state: 'closed' as RelayState,
    trips: 0,
    shot: 0,
    tPhase: -1,
    tEarth: -1,
    tOpened: 0,
    rms,
    get wantOpen() {
      return c.state === 'tripping';
    },
    get wantClose() {
      return c.state === 'closing';
    },
    reset() {
      win.forEach((w) => ((w.t = []), (w.q = []), (w.sum = 0)));
      rms.fill(0);
    },
    measure(t: number, i: number[], closed: boolean[]) {
      const vals = [i[0], i[1], i[2], i[0] + i[1] + i[2]];
      vals.forEach((v, k) => {
        const w = win[k];
        w.t.push(t);
        w.q.push(v * v);
        w.sum += v * v;
        while (w.t.length > 1 && w.t[0] < t - T) {
          w.t.shift();
          w.sum -= w.q.shift()!;
        }
        rms[k] = Math.sqrt(Math.max(0, w.sum / w.q.length));
      });
      // A full cycle of samples is needed before the relay can measure.
      const ready = t - win[0].t[0] >= 0.95 * T;
      if (c.state === 'closed' && ready) {
        const iph = Math.max(rms[0], rms[1], rms[2]);
        c.tPhase = iph > p.Is ? (c.tPhase < 0 ? t : c.tPhase) : -1;
        c.tEarth = p.Is0 > 0 && rms[3] > p.Is0 ? (c.tEarth < 0 ? t : c.tEarth) : -1;
        if ((c.tPhase >= 0 && t - c.tPhase >= p.td) || (c.tEarth >= 0 && t - c.tEarth >= p.td0)) {
          c.state = 'tripping';
          c.trips++;
        }
      } else if (c.state === 'tripping' && closed.every((x) => !x)) {
        c.state = 'open';
        c.tOpened = t;
        c.reset();
      } else if (c.state === 'open') {
        if (c.shot < dead.length) {
          if (t - c.tOpened >= dead[c.shot]) {
            c.state = 'closing';
            c.shot++;
          }
        } else c.state = 'locked';
      } else if (c.state === 'closing' && closed.every((x) => x)) {
        c.state = 'closed';
        c.tPhase = c.tEarth = -1;
      }
    },
  };
  return c;
}

/** One pole: opens at its current zero on the relay's order, closes on its reclosing order. */
function pole(id: string, a: number, b: number, ctl: ReturnType<typeof relayController>, Ron = 1e-4, Roff = 1e8) {
  let closed = true, prev = 0;
  const g = () => 1 / (closed ? Ron : Roff);
  const e: EmtElement & { closed: () => boolean } = {
    id, v: 0, i: 0,
    closed: () => closed,
    stamp: (A, sys) => addG(A, sys, a, b, g()),
    rhs: () => {},
    changed() {
      if (!closed && ctl.wantClose) {
        closed = true;
        prev = 0;
        return true;
      }
      return false;
    },
    check(x, _t, sys) {
      if (!closed || !ctl.wantOpen) return false;
      const i = g() * (nodeV(x, sys, a) - nodeV(x, sys, b));
      if (i * prev < 0 || Math.abs(i) < 1e-6) {
        closed = false;
        return true;
      }
      return false;
    },
    update(x, _t, sys) {
      e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      e.i = g() * e.v;
      if (closed) prev = e.i;
    },
  };
  return e;
}

const relaySigs: Sig[] = [
  ...ph.map((x) => ({ id: `i${x}`, unit: 'A', name: { fr: `courant ${x}`, en: `current ${x}` }, sym: `i_${x}` })),
  { id: 'i0', unit: 'A', name: { fr: 'courant résiduel 3I0', en: 'residual current 3I0' }, sym: '3i_0' },
  { id: 'Irms', unit: 'A', name: { fr: 'courant de phase efficace (max)', en: 'phase current RMS (max)' }, sym: 'I_{eff}' },
  { id: 'I0rms', unit: 'A', name: { fr: '3I0 efficace', en: '3I0 RMS' }, sym: '3I_{0,eff}' },
  { id: 'etat', unit: '', name: { fr: 'état (1 fermé, 0 ouvert)', en: 'state (1 closed, 0 open)' }, sym: 'k' },
];

export const DSO_LIB: ElementDef[] = [
  {
    type: 'trafo3n',
    family: 'grid',
    prefix: 'TS',
    name: { fr: 'Transformateur de poste source (neutre HTA accessible)', en: 'Primary-substation transformer (MV neutral terminal)' },
    ports: [port3('a', -2, 'HT'), port3('b', 2, 'HTA'), { id: 'n', dx: 2, dy: 2, label: 'N' }],
    params: [
      { id: 'V1', symbol: 'U_1', name: { fr: 'Tension primaire', en: 'Primary voltage' }, unit: 'V', default: 63e3, min: 1, max: 1e6, scale: 'log' },
      { id: 'V2', symbol: 'U_2', name: { fr: 'Tension secondaire', en: 'Secondary voltage' }, unit: 'V', default: 20e3, min: 1, max: 1e6, scale: 'log' },
      { id: 'S', symbol: 'S_n', name: { fr: 'Puissance assignée', en: 'Rating' }, unit: 'VA', default: 36e6, min: 1e3, max: 2e9, scale: 'log' },
      { id: 'x', symbol: 'x_{cc}', name: { fr: 'Réactance de court-circuit (pu)', en: 'Short-circuit reactance (pu)' }, unit: '', default: 0.17, min: 0.01, max: 0.3, scale: 'lin' },
      { id: 'r', symbol: 'r', name: { fr: 'Résistance (pu)', en: 'Resistance (pu)' }, unit: '', default: 0.005, min: 1e-4, max: 0.05, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
    ],
    symbol: 'M-40,0 H-18 M18,0 H40 M-6,0 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M6,0 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M18,8 L40,40',
    box: [30, 20],
    label: (p) => `${si(p.V1, 'V')}/${si(p.V2, 'V')} · ${si(p.S, 'VA')}`,
    signals: [
      ...ph.map((x) => ({ id: `i${x}`, unit: 'A', name: { fr: `courant HT ${x}`, en: `HV current ${x}` }, sym: `i_${x}` })),
      { id: 'vN', unit: 'V', name: { fr: 'tension du neutre HTA', en: 'MV neutral voltage' }, sym: 'v_N' },
    ],
    ac: {
      kind: 'multi',
      nV: 3,
      nInt: 3,
      stamp: (ctx, n, p) => {
        const { R, Ls, n: ratio } = trafoParams(p);
        for (let k = 0; k < 3; k++) {
          const m = ctx.node();
          ctx.y(n[k], m, inv({ re: R, im: ctx.w * Ls }));
          ctx.xfmr(m, 0, n[3 + k], n[6], ratio);
        }
        ctx.y(n[6], 0, cx(GLEAK));
      },
    },
    build: (id, n, p, h, node) => {
      const { R, Ls, n: ratio } = trafoParams(p);
      const parts: EmtElement[] = [];
      const br: EmtElement[] = [];
      for (let k = 0; k < 3; k++) {
        const m = node();
        const s = rlSeries(`${id}:z${k}`, n[k], m, R, Ls, h);
        br.push(s);
        parts.push(s, idealXfmr(`${id}:x${k}`, m, 0, n[3 + k], n[6], ratio));
      }
      parts.push(resistor(`${id}:leak`, n[6], 0, 1 / GLEAK));
      const mon = monitor(
        id,
        (_x, v) => ({ ia: br[0].i, ib: br[1].i, ic: br[2].i, vN: v(n[6]) }),
        { ia: 0, ib: 0, ic: 0, vN: 0 },
      );
      return [...parts, mon];
    },
    formulas: [
      {
        title: { fr: 'Le neutre HTA du poste source', en: 'The MV neutral of the primary substation' },
        tex: (c, id) => `m = \\frac{U_1}{U_2} = ${c.q(c.p[`${id}.V1`] / c.p[`${id}.V2`], '')}, \\qquad v_N \\ \\text{${c.tr({ fr: 'sur la borne N', en: 'on terminal N' })}}`,
        note: (c) =>
          c.tr({
            fr: 'Étoile côté HT (neutre à la terre), étoile côté HTA avec le neutre sur la borne N. Reliez N à la terre par une résistance (neutre impédant), par une inductance (bobine de Petersen, neutre compensé) ou laissez-la libre (neutre isolé), puis faites un défaut a–terre (leçon 10.3).',
            en: 'Star on the HV side (neutral earthed), star on the MV side with the neutral on terminal N. Earth N through a resistor (resistance-earthed), an inductor (Petersen coil, compensated) or leave it free (isolated), then apply an a–earth fault (lesson 10.3).',
          }),
      },
    ],
  },
  {
    type: 'relay3',
    family: 'grid',
    prefix: 'P',
    name: { fr: 'Disjoncteur avec protection (relais, réenclencheur)', en: 'Breaker with protection (relay, recloser)' },
    ports: [port3('a', -2, '1'), port3('b', 2, '2')],
    params: [
      { id: 'Is', symbol: 'I_s', name: { fr: 'Seuil de phase (efficace)', en: 'Phase threshold (RMS)' }, unit: 'A', default: 400, min: 1, max: 1e5, scale: 'log' },
      { id: 'td', symbol: 't_d', name: { fr: 'Temporisation de phase', en: 'Phase time delay' }, unit: 's', default: 0.4, min: 0, max: 5, scale: 'lin' },
      { id: 'Is0', symbol: 'I_{s0}', name: { fr: 'Seuil de terre 3I0 (0 : sans)', en: 'Earth threshold 3I0 (0: none)' }, unit: 'A', default: 0, min: 0, max: 1e4, scale: 'lin' },
      { id: 'td0', symbol: 't_{d0}', name: { fr: 'Temporisation de terre', en: 'Earth time delay' }, unit: 's', default: 0.5, min: 0, max: 5, scale: 'lin' },
      {
        id: 'reclose',
        symbol: '\\text{cycle}',
        name: { fr: 'Réenclenchement', en: 'Reclosing' },
        unit: '',
        default: RECLOSE.none,
        min: 0,
        max: 2,
        scale: 'lin',
        choices: [
          { value: RECLOSE.none, label: { fr: 'aucun', en: 'none' } },
          { value: RECLOSE.rapid, label: { fr: 'rapide', en: 'rapid' } },
          { value: RECLOSE.both, label: { fr: 'rapide + lent', en: 'rapid + slow' } },
        ],
      },
      { id: 'tslow', symbol: 't_{lent}', name: { fr: 'Temps mort du réenclenchement lent', en: 'Slow reclosing dead time' }, unit: 's', default: 1, min: 0.3, max: 30, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence (mesure efficace)', en: 'Frequency (RMS measurement)' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
    ],
    symbol: 'M-40,0 H-12 M-12,0 L10,-12 M12,0 H40 M-8,-14 h8 M-14,8 h28 v10 h-28 z',
    box: [30, 20],
    label: (p) => `I> ${si(p.Is, 'A')} · ${si(p.td, 's')}${p.Is0 > 0 ? ` · I0> ${si(p.Is0, 'A')}` : ''}${p.reclose ? ' · ↻' : ''}`,
    signals: relaySigs,
    ac: {
      kind: 'multi',
      nV: 0,
      stamp: (ctx, n) => [0, 1, 2].forEach((k) => ctx.y(n[k], n[3 + k], cx(1e4))),
    },
    build: (id, n, p) => {
      const ctl = relayController(p);
      const poles = [0, 1, 2].map((k) => pole(`${id}:${k}`, n[k], n[3 + k], ctl));
      const meter: EmtElement = {
        id: `${id}:relay`,
        v: 0,
        i: 0,
        stamp: () => {},
        rhs: () => {},
        update(_x, t) {
          ctl.measure(t, poles.map((q) => q.i), poles.map((q) => q.closed()));
        },
      };
      const mon = monitor(
        id,
        () => ({
          ia: poles[0].i,
          ib: poles[1].i,
          ic: poles[2].i,
          i0: poles[0].i + poles[1].i + poles[2].i,
          Irms: Math.max(ctl.rms[0], ctl.rms[1], ctl.rms[2]),
          I0rms: ctl.rms[3],
          etat: poles.every((q) => q.closed()) ? 1 : 0,
        }),
        { ia: 0, ib: 0, ic: 0, i0: 0, Irms: 0, I0rms: 0, etat: 1 },
      );
      return [...poles, meter, mon];
    },
    formulas: [
      {
        title: { fr: 'La protection du départ', en: 'The feeder protection' },
        tex: (c, id) => {
          const q = (k: string) => c.p[`${id}.${k}`];
          return `I_{eff} > ${c.q(q('Is'), 'A')} \\text{ ${c.tr({ fr: 'pendant', en: 'for' })} } ${c.q(q('td'), 's')}${q('Is0') > 0 ? ` \\ \\text{${c.tr({ fr: 'ou', en: 'or' })}} \\ 3I_{0,eff} > ${c.q(q('Is0'), 'A')} \\text{ ${c.tr({ fr: 'pendant', en: 'for' })} } ${c.q(q('td0'), 's')}` : ''} \\;\\Rightarrow\\; \\text{${c.tr({ fr: 'ouverture', en: 'trip' })}}`;
        },
        note: (c) =>
          c.tr({
            fr: 'Le relais mesure les courants efficaces sur une période. Au-delà du seuil pendant la temporisation, il ordonne l’ouverture ; chaque pôle coupe à son zéro de courant. Avec le réenclencheur, il referme après 0,3 s (rapide) puis après le temps mort lent, et se verrouille si le défaut est toujours là (leçon 10.4).',
            en: 'The relay measures RMS currents over one cycle. Above the threshold for the time delay, it orders a trip; each pole interrupts at its current zero. With the recloser, it closes again after 0.3 s (rapid) then after the slow dead time, and locks out if the fault is still there (lesson 10.4).',
          }),
      },
    ],
  },
];
