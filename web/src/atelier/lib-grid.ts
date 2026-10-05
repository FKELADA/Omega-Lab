// Three-phase grid and machines: lines (π and travelling-wave), series
// impedance, capacitor bank, transformer, breaker, fault, synchronous machine,
// induction motor.

import { cx, polar, type Complex } from '../lib/core/linalg';
import { capacitor, idealXfmr, monitor, rlSeries, timedSwitch } from './engine/elements';
import { bergeron, breaker } from './engine/grid';
import { inductionMotor, syncMachine } from './engine/machines';
import type { EmtElement } from './engine/emt';
import { si, type ElementDef, type PortDef, type Sig } from './defs';

const deg = Math.PI / 180;
const inv = (z: Complex): Complex => {
  const d = z.re * z.re + z.im * z.im || 1e-300;
  return { re: z.re / d, im: -z.im / d };
};
const mul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const ph = ['a', 'b', 'c'];
const port3 = (id: string, dx: number, label: string, dy = 0): PortDef => ({ id, dx, dy, phases: 3, label });
const i3: Sig[] = ph.map((x) => ({ id: `i${x}`, unit: 'A', name: { fr: `courant ${x}`, en: `current ${x}` }, sym: `i_${x}` }));
const v3: Sig[] = ph.map((x) => ({ id: `v${x}`, unit: 'V', name: { fr: `tension ${x}`, en: `voltage ${x}` }, sym: `v_${x}` }));
const zeros = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, 0]));
/** Monitor of three branch currents (and optionally three node voltages). */
const mon3 = (id: string, br: EmtElement[], nodes?: number[]) =>
  monitor(
    id,
    (_x, v) => {
      const o: Record<string, number> = {};
      br.forEach((b, k) => (o[`i${ph[k]}`] = b.i));
      nodes?.forEach((n, k) => (o[`v${ph[k]}`] = v(n)));
      return o;
    },
    zeros(['ia', 'ib', 'ic', 'va', 'vb', 'vc']),
  );

/** Is the breaker open at time t (ignoring the wait for a current zero)? */
export function breakerOpenAt(p: Record<string, number>, t: number): boolean {
  if (p.s0) return !(p.tc > 0 && t >= p.tc) || (p.to > p.tc && t >= p.to);
  return p.to > 0 && t >= p.to && !(p.tc > p.to && t >= p.tc);
}

function lineRLC(p: Record<string, number>) {
  return { R: p.r * p.len, L: p.l * 1e-3 * p.len, C: p.c * 1e-9 * p.len, Zc: Math.sqrt((p.l * 1e-3) / (p.c * 1e-9)), tau: p.len * Math.sqrt(p.l * 1e-3 * p.c * 1e-9) };
}

function trafo3Params(p: Record<string, number>) {
  const w = 2 * Math.PI * p.f, Zb = (p.V1 * p.V1) / p.S;
  return { R: p.r * Zb, Ls: (p.x * Zb) / w, n: p.V1 / p.V2 };
}

function smAcY(p: Record<string, number>, w: number) {
  const Zb = (p.Vn * p.Vn) / p.Sn;
  return inv({ re: p.ra * Zb, im: (w * p.xd * Zb) / (2 * Math.PI * p.f) });
}

export const GRID_LIB: ElementDef[] = [
  {
    type: 'line3', family: 'grid', prefix: 'LG',
    name: { fr: 'Ligne triphasée', en: 'Three-phase line' },
    ports: [port3('a', -2, '1'), port3('b', 2, '2')],
    params: [
      { id: 'len', symbol: '\\ell', name: { fr: 'Longueur', en: 'Length' }, unit: 'km', default: 100, min: 0.1, max: 2000, scale: 'log' },
      { id: 'r', symbol: "R'", name: { fr: 'Résistance linéique', en: 'Resistance per km' }, unit: 'Ω/km', default: 0.03, min: 0.001, max: 1, scale: 'log' },
      { id: 'l', symbol: "L'", name: { fr: 'Inductance linéique', en: 'Inductance per km' }, unit: 'mH/km', default: 1, min: 0.1, max: 3, scale: 'lin' },
      { id: 'c', symbol: "C'", name: { fr: 'Capacité linéique', en: 'Capacitance per km' }, unit: 'nF/km', default: 11.5, min: 1, max: 400, scale: 'log' },
      {
        id: 'model', symbol: '\\text{modèle}', name: { fr: 'Modèle', en: 'Model' }, unit: '', default: 0, min: 0, max: 1, scale: 'lin',
        choices: [{ value: 0, label: { fr: 'π (localisé)', en: 'π (lumped)' } }, { value: 1, label: { fr: 'Ondes (Bergeron)', en: 'Waves (Bergeron)' } }],
      },
    ],
    symbol: 'M-40,0 H40 M-28,-8 V8 M28,-8 V8',
    label: (p) => `${si(p.len * 1000, 'm')}${p.model ? ' ≈' : ''}`,
    signals: [...i3, ...ph.map((x) => ({ id: `v${x}2`, unit: 'V', name: { fr: `tension ${x} (fin)`, en: `voltage ${x} (end)` }, sym: `v_{${x}2}` }))],
    ac: {
      kind: 'multi',
      nV: 0,
      nInt: (p) => (p.model ? 6 : 0),
      stamp: (ctx, nodes, p) => {
        const { R, L, C, Zc, tau } = lineRLC(p);
        for (let k = 0; k < 3; k++) {
          const a = nodes[k], b = nodes[3 + k];
          if (p.model) {
            // Exact lossless line between two internal nodes, with R/2 at each end.
            const x = ctx.w * tau, i1 = ctx.node(), i2 = ctx.node();
            ctx.y(a, i1, cx(2 / Math.max(R, 1e-6)));
            ctx.y(i2, b, cx(2 / Math.max(R, 1e-6)));
            ctx.y(i1, i2, { re: 0, im: -1 / (Zc * Math.sin(x) || 1e-12) });
            const sh: Complex = { re: 0, im: Math.tan(x / 2) / Zc };
            ctx.y(i1, 0, sh);
            ctx.y(i2, 0, sh);
          } else {
            ctx.y(a, b, inv({ re: R, im: ctx.w * L }));
            ctx.y(a, 0, { re: 0, im: (ctx.w * C) / 2 });
            ctx.y(b, 0, { re: 0, im: (ctx.w * C) / 2 });
          }
        }
      },
    },
    build: (id, nodes, p, h, node) => {
      const { R, L, C, Zc, tau } = lineRLC(p);
      const parts: EmtElement[] = [];
      const series: EmtElement[] = [];
      for (let k = 0; k < 3; k++) {
        const a = nodes[k], b = nodes[3 + k];
        if (p.model && tau > 2 * h) {
          const i1 = node(), i2 = node();
          const ra = rlSeries(`${id}:r${k}a`, a, i1, R / 2, 0, h);
          parts.push(ra, bergeron(`${id}:w${k}`, i1, i2, Zc, tau), rlSeries(`${id}:r${k}b`, i2, b, R / 2, 0, h));
          series.push(ra);
        } else {
          const s = rlSeries(`${id}:z${k}`, a, b, R, L, h);
          parts.push(s, capacitor(`${id}:c${k}a`, a, 0, C / 2, h), capacitor(`${id}:c${k}b`, b, 0, C / 2, h));
          series.push(s);
        }
      }
      const m = monitor(
        id,
        (_x, v) => {
          const o: Record<string, number> = {};
          for (let k = 0; k < 3; k++) {
            o[`i${ph[k]}`] = series[k].i;
            o[`v${ph[k]}2`] = v(nodes[3 + k]);
          }
          return o;
        },
        zeros(['ia', 'ib', 'ic', 'va2', 'vb2', 'vc2']),
      );
      return [...parts, m];
    },
    formulas: [
      {
        title: { fr: 'Paramètres de la ligne', en: 'Line parameters' },
        tex: (c, id) => {
          const q = (k: string) => c.p[`${id}.${k}`];
          const { Zc, tau } = lineRLC({ len: q('len'), r: q('r'), l: q('l'), c: q('c') });
          return `Z_c = \\sqrt{\\frac{L'}{C'}} = ${c.q(Zc, 'Ω')}, \\quad \\tau = \\ell\\sqrt{L'C'} = ${c.q(tau, 's')}, \\quad v = \\frac{1}{\\sqrt{L'C'}} = ${c.q(1 / Math.sqrt(q('l') * 1e-3 * q('c') * 1e-9), 'km/s')}`;
        },
        note: (c) => c.tr({ fr: 'Modèle π : une inductance série et deux capacités, valable tant que la ligne est courte devant la longueur d’onde (leçon 4.1). Modèle de Bergeron : les ondes voyagent à la vitesse $v$ et se réfléchissent aux extrémités, sans pertes (les pertes sont ramenées aux bouts).', en: 'π model: a series inductance and two capacitances, valid while the line is short compared with the wavelength (lesson 4.1). Bergeron model: waves travel at speed $v$ and reflect at the ends, lossless (losses are lumped at the ends).' }),
      },
      {
        title: { fr: 'Ondes de Bergeron', en: 'Bergeron waves' },
        personas: ['research', 'utility'],
        tex: () => `i_k(t) = \\frac{v_k(t)}{Z_c} - \\left[\\frac{v_m(t-\\tau)}{Z_c} + i_m(t-\\tau)\\right]`,
        note: (c) => c.tr({ fr: 'Chaque extrémité voit une conductance $1/Z_c$ et une source qui transporte ce qui a quitté l’autre extrémité τ secondes plus tôt : c’est la méthode de Dommel (EMTP).', en: 'Each end sees a conductance $1/Z_c$ and a source carrying what left the other end τ seconds earlier: Dommel’s method (EMTP).' }),
      },
    ],
  },
  {
    type: 'z3', family: 'grid', prefix: 'Z',
    name: { fr: 'Impédance série triphasée', en: 'Three-phase series impedance' },
    ports: [port3('a', -2, '1'), port3('b', 2, '2')],
    params: [
      { id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', default: 0.1, min: 1e-5, max: 1e4, scale: 'log' },
      { id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'H', default: 1e-3, min: 1e-7, max: 10, scale: 'log' },
    ],
    symbol: 'M-40,0 H-24 M24,0 H40 M-24,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0',
    label: (p) => `${si(p.R, 'Ω')} ${si(p.L, 'H')}`,
    signals: i3,
    ac: { kind: 'multi', nV: 0, stamp: (ctx, n, p) => [0, 1, 2].forEach((k) => ctx.y(n[k], n[3 + k], inv({ re: p.R, im: ctx.w * p.L }))) },
    build: (id, n, p, h) => {
      const br = [0, 1, 2].map((k) => rlSeries(`${id}:${k}`, n[k], n[3 + k], p.R, p.L, h));
      return [...br, mon3(id, br)];
    },
    formulas: [{ title: { fr: 'Impédance série', en: 'Series impedance' }, tex: (c, id) => `Z = R + jL\\omega, \\quad R = ${c.q(c.p[`${id}.R`], 'Ω')},\\ L = ${c.q(c.p[`${id}.L`], 'H')} \\ \\text{par phase}` }],
  },
  {
    type: 'cap3', family: 'grid', prefix: 'BC',
    name: { fr: 'Batterie de condensateurs', en: 'Capacitor bank' },
    ports: [port3('a', -2, 'abc')],
    params: [
      { id: 'Q', symbol: 'Q_C', name: { fr: 'Puissance réactive', en: 'Reactive power' }, unit: 'var', default: 1e6, min: 1, max: 1e9, scale: 'log' },
      { id: 'Vn', symbol: 'U_n', name: { fr: 'Tension nominale', en: 'Rated voltage' }, unit: 'V', default: 20e3, min: 1, max: 1e6, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
    ],
    symbol: 'M-40,0 H-5 M-5,-12 V12 M5,-12 V12 M5,0 H14 M14,-6 V6 M18,-4 V4',
    label: (p) => si(p.Q, 'var'),
    signals: i3,
    ac: { kind: 'multi', nV: 0, stamp: (ctx, n, p) => n.forEach((x) => ctx.y(x, 0, { re: 0, im: (ctx.w * p.Q) / (2 * Math.PI * p.f * p.Vn * p.Vn) })) },
    build: (id, n, p, h) => {
      const C = p.Q / (2 * Math.PI * p.f * p.Vn * p.Vn);
      const br = n.map((x, k) => capacitor(`${id}:${k}`, x, 0, C, h));
      return [...br, mon3(id, br)];
    },
    formulas: [{ title: { fr: 'Condensateurs en étoile', en: 'Star-connected capacitors' }, tex: (c, id) => `C = \\frac{Q_C}{\\omega U_n^2} = ${c.q(c.p[`${id}.Q`] / (2 * Math.PI * c.p[`${id}.f`] * c.p[`${id}.Vn`] ** 2), 'F')} \\ \\text{par phase}`, note: (c) => c.tr({ fr: 'Elle fournit $Q_C$ sous sa tension nominale, et $Q_C (U/U_n)^2$ ailleurs (leçon 4.6).', en: 'It supplies $Q_C$ at rated voltage, and $Q_C (U/U_n)^2$ otherwise (lesson 4.6).' }) }],
  },
  {
    type: 'trafo3', family: 'grid', prefix: 'TR',
    name: { fr: 'Transformateur triphasé (YNyn)', en: 'Three-phase transformer (YNyn)' },
    ports: [port3('a', -2, 'HT'), port3('b', 2, 'BT')],
    params: [
      { id: 'V1', symbol: 'U_1', name: { fr: 'Tension primaire', en: 'Primary voltage' }, unit: 'V', default: 225e3, min: 1, max: 1e6, scale: 'log' },
      { id: 'V2', symbol: 'U_2', name: { fr: 'Tension secondaire', en: 'Secondary voltage' }, unit: 'V', default: 20e3, min: 1, max: 1e6, scale: 'log' },
      { id: 'S', symbol: 'S_n', name: { fr: 'Puissance assignée', en: 'Rating' }, unit: 'VA', default: 100e6, min: 1e3, max: 2e9, scale: 'log' },
      { id: 'x', symbol: 'x_{cc}', name: { fr: 'Réactance de court-circuit (pu)', en: 'Short-circuit reactance (pu)' }, unit: '', default: 0.12, min: 0.01, max: 0.3, scale: 'lin' },
      { id: 'r', symbol: 'r', name: { fr: 'Résistance (pu)', en: 'Resistance (pu)' }, unit: '', default: 0.005, min: 1e-4, max: 0.05, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
    ],
    symbol: 'M-40,0 H-18 M18,0 H40 M-6,0 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M6,0 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0',
    box: [30, 16],
    label: (p) => `${si(p.V1, 'V')}/${si(p.V2, 'V')}`,
    signals: i3,
    ac: {
      kind: 'multi',
      nV: 3,
      nInt: 3,
      stamp: (ctx, n, p) => {
        const { R, Ls, n: ratio } = trafo3Params(p);
        for (let k = 0; k < 3; k++) {
          const m = ctx.node();
          ctx.y(n[k], m, inv({ re: R, im: ctx.w * Ls }));
          ctx.xfmr(m, 0, n[3 + k], 0, ratio);
        }
      },
    },
    build: (id, n, p, h, node) => {
      const { R, Ls, n: ratio } = trafo3Params(p);
      const parts: EmtElement[] = [];
      const br: EmtElement[] = [];
      for (let k = 0; k < 3; k++) {
        const m = node();
        const s = rlSeries(`${id}:z${k}`, n[k], m, R, Ls, h);
        br.push(s);
        parts.push(s, idealXfmr(`${id}:x${k}`, m, 0, n[3 + k], 0, ratio));
      }
      return [...parts, mon3(id, br)];
    },
    formulas: [
      {
        title: { fr: 'Transformateur de puissance', en: 'Power transformer' },
        tex: (c, id) => {
          const q = (k: string) => c.p[`${id}.${k}`];
          const { R, Ls } = trafo3Params({ V1: q('V1'), V2: q('V2'), S: q('S'), x: q('x'), r: q('r'), f: q('f') });
          return `m = \\frac{U_1}{U_2} = ${c.q(q('V1') / q('V2'), '')}, \\quad R = ${c.q(R, 'Ω')},\\ L_{cc} = ${c.q(Ls, 'H')} \\ \\text{(côté HT)}`;
        },
        note: (c) => c.tr({ fr: 'Étoile–étoile, neutres à la terre, sans courant magnétisant : l’impédance de court-circuit limite le courant de défaut et fait chuter la tension sous charge (leçon 2.6).', en: 'Star–star, neutrals grounded, without magnetising current: the short-circuit impedance limits fault current and makes the voltage drop under load (lesson 2.6).' }),
      },
    ],
  },
  {
    type: 'brk3', family: 'grid', prefix: 'DJ',
    name: { fr: 'Disjoncteur triphasé', en: 'Three-phase breaker' },
    ports: [port3('a', -2, '1'), port3('b', 2, '2')],
    params: [
      {
        id: 's0', symbol: '\text{état initial}', name: { fr: 'État initial', en: 'Initial state' }, unit: '', default: 0, min: 0, max: 1, scale: 'lin',
        choices: [{ value: 0, label: { fr: 'fermé', en: 'closed' } }, { value: 1, label: { fr: 'ouvert', en: 'open' } }],
      },
      { id: 'to', symbol: 't_{o}', name: { fr: 'Ordre d’ouverture (0 : jamais)', en: 'Opening order (0: never)' }, unit: 's', default: 0, min: 0, max: 100, scale: 'lin' },
      { id: 'tc', symbol: 't_{f}', name: { fr: 'Fermeture (0 : jamais)', en: 'Closing (0: never)' }, unit: 's', default: 0, min: 0, max: 100, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-12 M-12,0 L10,-12 M12,0 H40 M-8,-14 h8',
    label: (p) => [p.s0 ? (p.tc > 0 ? `↓ ${si(p.tc, 's')}` : '⊘') : '', p.to > 0 ? `↑ ${si(p.to, 's')}` : '', !p.s0 && p.tc > p.to && p.to > 0 ? `↓ ${si(p.tc, 's')}` : ''].filter(Boolean).join(' '),
    signals: i3,
    ac: {
      kind: 'multi',
      nV: 0,
      stamp: (ctx, n, p) => {
        const open = breakerOpenAt(p, p.T);
        [0, 1, 2].forEach((k) => ctx.y(n[k], n[3 + k], cx(open ? 1e-8 : 1e4)));
      },
    },
    build: (id, n, p) => {
      const br = [0, 1, 2].map((k) => breaker(`${id}:${k}`, n[k], n[3 + k], p.to, p.tc, !p.s0));
      return [...br, mon3(id, br)];
    },
    formulas: [
      {
        title: { fr: 'Coupure au zéro de courant', en: 'Interruption at current zero' },
        tex: (c, id) => `\\text{ordre à } t_o = ${c.q(c.p[`${id}.to`], 's')} \\;\\Rightarrow\\; \\text{coupure de chaque phase à son prochain } i = 0`,
        note: (c) => c.tr({ fr: 'Un disjoncteur ne coupe pas instantanément : l’arc s’éteint quand le courant passe par zéro, à des instants différents sur les trois phases.', en: 'A breaker does not interrupt instantly: the arc dies when the current crosses zero, at different instants on the three phases.' }),
      },
    ],
  },
  {
    type: 'fault3', family: 'grid', prefix: 'F',
    name: { fr: 'Court-circuit', en: 'Fault' },
    ports: [port3('a', 0, 'abc', -1)],
    params: [
      {
        id: 'type', symbol: '\\text{type}', name: { fr: 'Type', en: 'Type' }, unit: '', default: 0, min: 0, max: 3, scale: 'lin',
        choices: [
          { value: 0, label: { fr: 'triphasé', en: 'three-phase' } },
          { value: 1, label: { fr: 'a–terre', en: 'a–ground' } },
          { value: 2, label: { fr: 'a–b', en: 'a–b' } },
          { value: 3, label: { fr: 'a–b–terre', en: 'a–b–ground' } },
        ],
      },
      { id: 'Rf', symbol: 'R_f', name: { fr: 'Résistance de défaut', en: 'Fault resistance' }, unit: 'Ω', default: 0.01, min: 1e-4, max: 1e3, scale: 'log' },
      { id: 'ton', symbol: 't_d', name: { fr: 'Début', en: 'Start' }, unit: 's', default: 0.1, min: 0, max: 100, scale: 'lin' },
      { id: 'toff', symbol: 't_e', name: { fr: 'Élimination', en: 'Clearing' }, unit: 's', default: 0.2, min: 0, max: 100, scale: 'lin' },
    ],
    symbol: 'M0,-20 V-8 M-6,-8 L4,0 L-4,4 L6,14 M0,14 v2 M-10,18 H10',
    label: (p) => `${['3φ', 'a-T', 'a-b', 'ab-T'][p.type] ?? ''} ${si(p.ton, 's')}→${si(p.toff, 's')}`,
    signals: [...i3],
    ac: { kind: 'none' },
    build: (id, [a, b, c], p) => {
      const sw = (k: string, x: number, y: number) => timedSwitch(`${id}:${k}`, x, y, p.ton, p.toff, Math.max(p.Rf, 1e-4), 1e9);
      const list: EmtElement[] = [];
      const ia = (): number => list.filter((e) => e.id.endsWith(':a')).reduce((s, e) => s + e.i, 0);
      if (p.type === 0) list.push(sw('a', a, 0), sw('b', b, 0), sw('c', c, 0));
      else if (p.type === 1) list.push(sw('a', a, 0));
      else if (p.type === 2) list.push(sw('ab', a, b));
      else list.push(sw('a', a, 0), sw('b', b, 0));
      const cur = (ph0: string) => list.filter((e) => e.id.endsWith(`:${ph0}`)).reduce((s, e) => s + e.i, 0);
      const m = monitor(id, () => ({ ia: p.type === 2 ? cur('ab') : ia(), ib: p.type === 2 ? -cur('ab') : cur('b'), ic: cur('c') }), zeros(['ia', 'ib', 'ic']));
      return [...list, m];
    },
    formulas: [
      {
        title: { fr: 'Défaut', en: 'Fault' },
        tex: (c, id) => `t_d = ${c.q(c.p[`${id}.ton`], 's')}, \\quad t_e = ${c.q(c.p[`${id}.toff`], 's')}, \\quad R_f = ${c.q(c.p[`${id}.Rf`], 'Ω')}`,
        note: (c) => c.tr({ fr: 'Le défaut relie les phases entre elles ou à la terre pendant $[t_d, t_e]$. Comparez les courants des différents types (leçon 5.3), ou la durée critique d’une machine (leçon 8.1).', en: 'The fault connects phases together or to ground during $[t_d, t_e]$. Compare the currents of the different types (lesson 5.3), or a machine’s critical clearing time (lesson 8.1).' }),
      },
    ],
  },
  {
    type: 'sm3', family: 'machines', prefix: 'SM',
    name: { fr: 'Alternateur (modèle classique)', en: 'Synchronous generator (classical)' },
    ports: [port3('a', 2, 'abc')],
    params: [
      { id: 'Sn', symbol: 'S_n', name: { fr: 'Puissance assignée', en: 'Rating' }, unit: 'VA', default: 100e6, min: 1e3, max: 2e9, scale: 'log' },
      { id: 'Vn', symbol: 'U_n', name: { fr: 'Tension assignée', en: 'Rated voltage' }, unit: 'V', default: 20e3, min: 100, max: 1e6, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'P0', symbol: 'P_m', name: { fr: 'Puissance mécanique (pu)', en: 'Mechanical power (pu)' }, unit: '', default: 0.8, min: 0, max: 1.2, scale: 'lin' },
      { id: 'E0', symbol: "E'", name: { fr: 'F.é.m. interne (pu)', en: 'Internal EMF (pu)' }, unit: '', default: 1.1, min: 0.5, max: 2, scale: 'lin' },
      { id: 'H', symbol: 'H', name: { fr: 'Inertie', en: 'Inertia' }, unit: 's', default: 4, min: 0.5, max: 12, scale: 'lin' },
      { id: 'D', symbol: 'D', name: { fr: 'Amortissement (pu)', en: 'Damping (pu)' }, unit: '', default: 1, min: 0, max: 30, scale: 'lin' },
      { id: 'xd', symbol: "x'_d", name: { fr: 'Réactance transitoire (pu)', en: 'Transient reactance (pu)' }, unit: '', default: 0.3, min: 0.1, max: 0.6, scale: 'lin' },
      { id: 'ra', symbol: 'r_a', name: { fr: 'Résistance statorique (pu)', en: 'Stator resistance (pu)' }, unit: '', default: 0.003, min: 0, max: 0.05, scale: 'lin' },
      { id: 'KA', symbol: 'K_A', name: { fr: 'Gain du régulateur de tension (0 : sans)', en: 'Voltage regulator gain (0: none)' }, unit: '', default: 0, min: 0, max: 400, scale: 'lin' },
      { id: 'Vref', symbol: 'V_{ref}', name: { fr: 'Consigne de tension (pu)', en: 'Voltage setpoint (pu)' }, unit: '', default: 1, min: 0.8, max: 1.2, scale: 'lin' },
      { id: 'R', symbol: 'R', name: { fr: 'Statisme du régulateur de vitesse (0 : sans)', en: 'Governor droop (0: none)' }, unit: '', default: 0, min: 0, max: 0.2, scale: 'lin' },
      { id: 'tRel', symbol: 't_{lib}', name: { fr: 'Libération du rotor (initialisation)', en: 'Rotor release (initialisation)' }, unit: 's', default: 0.5, min: 0, max: 10, scale: 'lin' },
    ],
    symbol: 'M14,0 H40 M-6,-6 c3,-6 6,-6 6,0 s3,6 6,0',
    glyph: '',
    circle: true,
    groundsItself: true,
    label: (p) => `${si(p.Sn, 'VA')} P=${p.P0.toFixed(2)}`,
    signals: [
      ...i3,
      { id: 'delta', unit: '°', name: { fr: 'angle rotorique', en: 'rotor angle' }, sym: '\\delta' },
      { id: 'f', unit: 'Hz', name: { fr: 'fréquence', en: 'frequency' }, sym: 'f' },
      { id: 'Pe', unit: 'pu', name: { fr: 'puissance électrique', en: 'electrical power' }, sym: 'P_e' },
      { id: 'Pm', unit: 'pu', name: { fr: 'puissance mécanique', en: 'mechanical power' }, sym: 'P_m' },
      { id: 'Vt', unit: 'pu', name: { fr: 'tension aux bornes', en: 'terminal voltage' }, sym: 'V_t' },
    ],
    scopeDefault: ['delta'],
    ac: {
      kind: 'multi',
      nV: 0,
      stamp: (ctx, n, p) => {
        const y = smAcY(p, ctx.w);
        const Vph = (Math.SQRT2 * p.Vn) / Math.sqrt(3);
        n.forEach((x, k) => {
          ctx.y(x, 0, y);
          const E =
            ctx.drive === 'off' || (ctx.drive === 'own' && Math.abs(ctx.f - p.f) > 1e-9 * p.f)
              ? cx(0)
              : ctx.drive === 'unit'
                ? polar(1, -120 * k * deg)
                : polar(Vph * p.E0, (p.__delta0 ?? 0) - 120 * k * deg);
          ctx.i(x, 0, mul(E, y));
        });
      },
    },
    build: (id, n, p, h, node) =>
      syncMachine(id, n, { Sn: p.Sn, Vn: p.Vn, f: p.f, H: p.H, D: p.D, xd: p.xd, ra: p.ra, P0: p.P0, E0: p.E0, KA: p.KA, TA: 0.05, Vref: p.Vref, R: p.R, Tg: 0.5, tRel: p.tRel, delta0: p.__delta0 ?? 0 }, h, node),
    formulas: [
      {
        title: { fr: 'Équation du mouvement', en: 'Swing equation' },
        tex: (c, id) => `2H\\frac{d\\omega}{dt} = P_m - P_e - D(\\omega - 1), \\qquad \\delta = ${c.q(c.at(`${id}.delta`), '°')},\\ P_e = ${c.q(c.at(`${id}.Pe`), 'pu')}`,
        note: (c) => c.tr({ fr: 'F.é.m. $E\'$ derrière la réactance transitoire (modèle classique, leçons 3.3 et 8.1). L’angle initial est calculé pour que $P_e = P_m$ ; le rotor est tenu au synchronisme jusqu’à $t_{lib}$, le temps que les transitoires de mise sous tension disparaissent.', en: 'EMF $E\'$ behind the transient reactance (classical model, lessons 3.3 and 8.1). The initial angle is computed so that $P_e = P_m$; the rotor is held at synchronous speed until $t_{lib}$, while the energisation transients die out.' }),
      },
      {
        title: { fr: 'Régulations', en: 'Controls' },
        tex: () => `T_A\\dot E' = E'_0 + K_A(V_{ref} - V_t) - E', \\qquad T_g\\dot P_m = P_{m0} + \\frac{1 - \\omega}{R} - P_m`,
        note: (c) => c.tr({ fr: 'Avec $K_A > 0$, le régulateur de tension soutient la tension pendant les défauts ; avec $R > 0$, le régulateur de vitesse répond aux variations de fréquence (réglage primaire, leçon 8.4).', en: 'With $K_A > 0$, the voltage regulator supports voltage during faults; with $R > 0$, the governor responds to frequency changes (primary control, lesson 8.4).' }),
      },
    ],
  },
  {
    type: 'im3', family: 'machines', prefix: 'M',
    name: { fr: 'Moteur asynchrone', en: 'Induction motor' },
    ports: [port3('a', -2, 'abc')],
    params: [
      { id: 'Pn', symbol: 'P_n', name: { fr: 'Puissance assignée', en: 'Rating' }, unit: 'W', default: 15e3, min: 100, max: 1e8, scale: 'log' },
      { id: 'Vn', symbol: 'U_n', name: { fr: 'Tension assignée', en: 'Rated voltage' }, unit: 'V', default: 400, min: 100, max: 1e5, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'pp', symbol: 'p', name: { fr: 'Paires de pôles', en: 'Pole pairs' }, unit: '', default: 2, min: 1, max: 4, scale: 'lin', choices: [1, 2, 3, 4].map((v) => ({ value: v, label: { fr: `${v}`, en: `${v}` } })) },
      { id: 'H', symbol: 'H', name: { fr: 'Inertie (moteur + charge)', en: 'Inertia (motor + load)' }, unit: 's', default: 0.3, min: 0.05, max: 5, scale: 'log' },
      { id: 'T0', symbol: 'T_c', name: { fr: 'Couple de charge (pu)', en: 'Load torque (pu)' }, unit: '', default: 0.5, min: 0, max: 1.5, scale: 'lin' },
      { id: 'fan', symbol: '\\text{charge}', name: { fr: 'Type de charge', en: 'Load type' }, unit: '', default: 1, min: 0, max: 1, scale: 'lin', choices: [{ value: 0, label: { fr: 'couple constant', en: 'constant torque' } }, { value: 1, label: { fr: 'ventilateur', en: 'fan' } }] },
      { id: 'rr', symbol: 'r_r', name: { fr: 'Résistance rotorique (pu)', en: 'Rotor resistance (pu)' }, unit: '', default: 0.02, min: 0.005, max: 0.1, scale: 'log' },
    ],
    symbol: 'M-40,0 H-14',
    glyph: 'M',
    circle: true,
    label: (p) => `${si(p.Pn, 'W')}`,
    signals: [
      ...i3,
      { id: 'n', unit: 'tr/min', name: { fr: 'vitesse', en: 'speed' }, sym: 'n' },
      { id: 'Te', unit: 'N·m', name: { fr: 'couple', en: 'torque' }, sym: 'T_e' },
      { id: 'slip', unit: '', name: { fr: 'glissement', en: 'slip' }, sym: 'g' },
    ],
    scopeDefault: ['n', 'ia'],
    ac: {
      kind: 'multi',
      nV: 0,
      // Equivalent circuit at about 3 % slip (running).
      stamp: (ctx, n, p) => {
        const Zb = (p.Vn * p.Vn) / p.Pn, k = ctx.w / (2 * Math.PI * p.f), s = 0.03;
        const zr: Complex = { re: (p.rr * Zb) / s, im: 0.08 * Zb * k };
        const zm: Complex = { re: 0, im: 3 * Zb * k };
        const zp = inv({ re: inv(zr).re + inv(zm).re, im: inv(zr).im + inv(zm).im });
        const y = inv({ re: 0.02 * Zb + zp.re, im: 0.08 * Zb * k + zp.im });
        n.forEach((x) => ctx.y(x, 0, y));
      },
    },
    build: (id, n, p, h, node) =>
      inductionMotor(id, n, { Pn: p.Pn, Vn: p.Vn, f: p.f, pp: p.pp, rs: 0.02, rr: p.rr, xls: 0.08, xlr: 0.08, xm: 3, H: p.H, T0: p.T0, fan: p.fan }, h, node),
    formulas: [
      {
        title: { fr: 'Couple et vitesse', en: 'Torque and speed' },
        tex: (c, id) => `J\\frac{d\\Omega}{dt} = T_e - T_c, \\qquad n = ${c.q(c.at(`${id}.n`), 'tr/min')},\\ T_e = ${c.q(c.at(`${id}.Te`), 'N·m')}`,
        note: (c) => c.tr({ fr: 'Modèle à flux rotorique (tension derrière l’inductance transitoire). Démarre à l’arrêt : courant d’appel de 5 à 7 fois le nominal, puis glissement de quelques pour cent (leçon 4.5).', en: 'Rotor-flux model (voltage behind the transient inductance). Starts from standstill: inrush of 5 to 7 times rated, then a few per cent slip (lesson 4.5).' }),
      },
    ],
  },
];
