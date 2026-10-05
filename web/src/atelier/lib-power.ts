// Power electronics and three-phase supply: diode, thyristor, IGBT, three-phase
// source and load, thyristor bridge, PWM inverter bridge, saturable transformer.

import { cx, polar, type Complex } from '../lib/core/linalg';
import { idealXfmr, monitor, rlSeries, satInductor, vsource, waves } from './engine/elements';
import { diode, gates, igbt, thyristor } from './engine/switching';
import type { EmtElement } from './engine/emt';
import type { AcCtx } from './engine/ac';
import { si, type ElementDef, type PortDef } from './defs';

const deg = Math.PI / 180;
const rl = (R: number, L: number, w: number): Complex => {
  const d = R * R + (w * L) ** 2 || 1e-30;
  return { re: R / d, im: (-w * L) / d }; // 1/(R + jωL)
};
const mulc = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const off = { kind: 'none' as const };

const ph3 = (k: number) => ['a', 'b', 'c'][k];
const sig3 = (prefix: 'v' | 'i', unit: string, name: { fr: string; en: string }) =>
  [0, 1, 2].map((k) => ({ id: `${prefix}${ph3(k)}`, unit, name: { fr: `${name.fr} ${ph3(k)}`, en: `${name.en} ${ph3(k)}` }, sym: `${prefix}_${ph3(k)}` }));

/** The three-phase source's phase-k EMF (peak phasor), or 0 when switched off in that solve. */
function emf3(ctx: AcCtx, p: Record<string, number>, k: number): Complex {
  if (ctx.drive === 'off') return cx(0);
  if (ctx.drive === 'unit') return polar(1, -120 * k * deg);
  if (Math.abs(ctx.f - p.f) > 1e-9 * p.f) return cx(0);
  return polar((Math.SQRT2 * p.Vll) / Math.sqrt(3), (p.ph - 120 * k) * deg);
}

const abcPort = (dx: number, dy = 0): PortDef => ({ id: 'abc', dx, dy, phases: 3, label: 'abc' });

export const POWER: ElementDef[] = [
  {
    type: 'diode', family: 'power', prefix: 'D',
    name: { fr: 'Diode', en: 'Diode' },
    ports: [{ id: 'a', dx: -2, dy: 0, label: 'A' }, { id: 'b', dx: 2, dy: 0, label: 'K' }],
    params: [
      { id: 'Ron', symbol: 'R_{on}', name: { fr: 'Résistance passante', en: 'On resistance' }, unit: 'Ω', default: 1e-3, min: 1e-5, max: 1, scale: 'log' },
      { id: 'Vf', symbol: 'V_f', name: { fr: 'Tension de seuil', en: 'Threshold voltage' }, unit: 'V', default: 0, min: 0, max: 3, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-10 M-10,-10 L-10,10 L10,0 Z M10,-10 V10 M10,0 H40',
    signals: ['v', 'i', 'p'],
    ac: off,
    build: (id, [a, b], p) => diode(id, a, b, p.Ron, p.Vf),
    formulas: [
      {
        title: { fr: 'Diode idéale par morceaux', en: 'Piecewise-ideal diode' },
        tex: (c, id) => `i = \\begin{cases} (v - V_f)/R_{on} & \\text{passante} \\\\ 0 & \\text{bloquée} \\end{cases}, \\qquad i = ${c.q(c.at(`${id}.i`), 'A')}`,
        note: (c) => c.tr({ fr: 'Elle conduit dès que sa tension dépasse $V_f$, et se bloque quand son courant voudrait s’inverser. Le simulateur vérifie cet état après chaque résolution et recommence le pas s’il a changé.', en: 'It conducts as soon as its voltage exceeds $V_f$, and blocks when its current would reverse. The simulator checks this state after each solve and redoes the step if it changed.' }),
      },
    ],
  },
  {
    type: 'thyristor', family: 'power', prefix: 'TH',
    name: { fr: 'Thyristor', en: 'Thyristor' },
    ports: [{ id: 'a', dx: -2, dy: 0, label: 'A' }, { id: 'b', dx: 2, dy: 0, label: 'K' }],
    params: [
      { id: 'alpha', symbol: '\\alpha', name: { fr: 'Angle d’amorçage', en: 'Firing angle' }, unit: '°', default: 30, min: 0, max: 180, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence de référence', en: 'Reference frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'ph', symbol: '\\varphi_{ref}', name: { fr: 'Phase de la tension de référence (cos)', en: 'Reference voltage phase (cos)' }, unit: '°', default: -90, min: -180, max: 180, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-10 M-10,-10 L-10,10 L10,0 Z M10,-10 V10 M10,0 H40 M6,4 L14,14',
    label: (p) => `α = ${Math.round(p.alpha)}°`,
    signals: ['v', 'i', 'p'],
    ac: off,
    // Firing α after the reference voltage cos(ωt + φ) crosses zero upwards (at ωt = −90° − φ).
    build: (id, [a, b], p) => thyristor(id, a, b, gates.window(p.f, -90 - p.ph + p.alpha, 120)),
    formulas: [
      {
        title: { fr: 'Thyristor', en: 'Thyristor' },
        tex: (c, id) => `\\text{amorçage à } \\omega t = \\alpha = ${c.q(c.p[`${id}.alpha`], '°')} \\text{ après le passage par zéro}`,
        note: (c) => c.tr({ fr: 'Il ne s’amorce que polarisé en direct et pendant son impulsion de gâchette ; il ne s’éteint que lorsque son courant s’annule (leçon 6.2).', en: 'It only turns on when forward-biased during its gate pulse, and only turns off when its current falls to zero (lesson 6.2).' }),
      },
    ],
  },
  {
    type: 'igbt', family: 'power', prefix: 'Q',
    name: { fr: 'IGBT commandé (rapport cyclique)', en: 'IGBT (duty cycle)' },
    ports: [{ id: 'a', dx: -2, dy: 0, label: 'C' }, { id: 'b', dx: 2, dy: 0, label: 'E' }],
    params: [
      { id: 'fs', symbol: 'f_s', name: { fr: 'Fréquence de découpage', en: 'Switching frequency' }, unit: 'Hz', default: 20e3, min: 10, max: 200e3, scale: 'log' },
      { id: 'D', symbol: 'D', name: { fr: 'Rapport cyclique', en: 'Duty cycle' }, unit: '', default: 0.5, min: 0, max: 1, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-14 M14,0 H40 M-14,-10 H14 V10 H-14 Z M-8,6 L8,-6 M-6,-14 h12 M0,-14 v-2',
    label: (p) => `D = ${p.D.toFixed(2)}, ${si(p.fs, 'Hz')}`,
    signals: ['v', 'i', 'p'],
    ac: off,
    timeScale: (p) => 1 / p.fs,
    build: (id, [a, b], p) => igbt(id, a, b, gates.duty(p.fs, p.D)),
    formulas: [
      {
        title: { fr: 'Interrupteur commandé', en: 'Controlled switch' },
        tex: (c, id) => `\\text{fermé pendant } D\\,T_s = ${c.q(c.p[`${id}.D`] / c.p[`${id}.fs`], 's')} \\text{ sur } T_s = ${c.q(1 / c.p[`${id}.fs`], 's')}`,
        note: (c) => c.tr({ fr: 'Avec sa diode antiparallèle, il conduit dans les deux sens quand il est commandé, et seulement par la diode sinon. Associé à une diode de roue libre et à une bobine, il forme un hacheur (leçon 6.1).', en: 'With its antiparallel diode, it conducts both ways when gated, and only through the diode otherwise. With a freewheeling diode and an inductor, it forms a chopper (lesson 6.1).' }),
      },
    ],
  },
  {
    type: 'src3', family: 'sources', prefix: 'G',
    name: { fr: 'Source triphasée (réseau)', en: 'Three-phase source (grid)' },
    ports: [abcPort(2)],
    params: [
      { id: 'Vll', symbol: 'U', name: { fr: 'Tension composée (efficace)', en: 'Line voltage (RMS)' }, unit: 'V', default: 400, min: 1, max: 1e6, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'ph', symbol: '\\varphi', name: { fr: 'Phase de a', en: 'Phase of a' }, unit: '°', default: 0, min: -180, max: 180, scale: 'lin' },
      { id: 'R', symbol: 'R_s', name: { fr: 'Résistance interne', en: 'Internal resistance' }, unit: 'Ω', default: 0.01, min: 1e-5, max: 100, scale: 'log' },
      { id: 'L', symbol: 'L_s', name: { fr: 'Inductance interne', en: 'Internal inductance' }, unit: 'H', default: 2e-4, min: 1e-7, max: 1, scale: 'log' },
      { id: 'tJ', symbol: 't_s', name: { fr: 'Instant du saut de phase (0 : aucun)', en: 'Phase jump time (0: none)' }, unit: 's', default: 0, min: 0, max: 100, scale: 'lin' },
      { id: 'dJ', symbol: '\\Delta\\varphi', name: { fr: 'Saut de phase', en: 'Phase jump' }, unit: '°', default: -20, min: -90, max: 90, scale: 'lin' },
    ],
    symbol: 'M14,0 H40',
    glyph: '3~',
    circle: true,
    groundsItself: true,
    label: (p) => `${si(p.Vll, 'V')} ${si(p.f, 'Hz')}`,
    signals: [...sig3('v', 'V', { fr: 'tension', en: 'voltage' }), ...sig3('i', 'A', { fr: 'courant', en: 'current' }), { id: 'p', unit: 'W', name: { fr: 'puissance débitée', en: 'power delivered' } }],
    scopeDefault: ['ia', 'ib', 'ic'],
    timeScale: (p) => 1 / p.f,
    ac: {
      kind: 'multi',
      nV: 0,
      stamp: (ctx, nodes, p) =>
        nodes.forEach((n, k) => {
          const y = rl(p.R, p.L, ctx.w);
          ctx.y(n, 0, y);
          ctx.i(n, 0, mulc(emf3(ctx, p, k), y));
        }),
    },
    build: (id, nodes, p, h, node) => {
      const Vpk = (Math.SQRT2 * p.Vll) / Math.sqrt(3);
      const parts: EmtElement[] = [];
      const branches: EmtElement[] = [];
      nodes.forEach((n, k) => {
        const x = node();
        // Optional phase jump of dJ degrees at tJ (a distant event, lesson 7.2).
        const w0 = 2 * Math.PI * p.f;
        const jump = (t: number) => (p.tJ > 0 && t >= p.tJ ? p.dJ : 0);
        parts.push(vsource(`${id}:e${k}`, x, 0, (t) => Vpk * Math.cos(w0 * t + (p.ph - 120 * k + jump(t)) * deg)));
        const br = rlSeries(`${id}:z${k}`, x, n, p.R, p.L, h);
        branches.push(br);
        parts.push(br);
      });
      const mon = monitor(
        id,
        (_x, v) => {
          const va = v(nodes[0]), vb = v(nodes[1]), vc = v(nodes[2]);
          const [ia, ib, ic] = branches.map((b) => b.i);
          return { va, vb, vc, ia, ib, ic, p: va * ia + vb * ib + vc * ic };
        },
        { va: 0, vb: 0, vc: 0, ia: 0, ib: 0, ic: 0, p: 0 },
      );
      return [mon, ...parts];
    },
    formulas: [
      {
        title: { fr: 'Réseau triphasé', en: 'Three-phase grid' },
        tex: (c, id) => `e_k(t) = \\sqrt{\\tfrac23}\\,U\\cos\\big(\\omega t + \\varphi - k\\tfrac{2\\pi}{3}\\big), \\quad U = ${c.q(c.p[`${id}.Vll`], 'V')}, \\quad Z_s = R_s + jL_s\\omega`,
        note: (c) => c.tr({ fr: 'Trois sources en étoile, neutre à la terre, derrière l’impédance du réseau amont. Plus $L_s$ est petite, plus le réseau est fort (puissance de court-circuit $U^2/|Z_s|$).', en: 'Three star-connected sources, neutral grounded, behind the upstream grid impedance. The smaller $L_s$, the stronger the grid (short-circuit power $U^2/|Z_s|$).' }),
      },
      {
        title: { fr: 'Puissance de court-circuit', en: 'Short-circuit power' },
        tex: (c, id) => `S_{cc} = \\frac{U^2}{|Z_s|} = ${c.q(c.p[`${id}.Vll`] ** 2 / Math.hypot(c.p[`${id}.R`], 2 * Math.PI * c.p[`${id}.f`] * c.p[`${id}.L`]), 'VA')}`,
      },
    ],
  },
  {
    type: 'load3', family: 'sources', prefix: 'CH',
    name: { fr: 'Charge triphasée (P, Q)', en: 'Three-phase load (P, Q)' },
    ports: [abcPort(-2)],
    params: [
      { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'W', default: 10e3, min: 1, max: 1e9, scale: 'log' },
      { id: 'Q', symbol: 'Q', name: { fr: 'Puissance réactive (inductive)', en: 'Reactive power (inductive)' }, unit: 'var', default: 3e3, min: 0, max: 1e9, scale: 'lin' },
      { id: 'Vn', symbol: 'U_n', name: { fr: 'Tension nominale', en: 'Rated voltage' }, unit: 'V', default: 400, min: 1, max: 1e6, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence nominale', en: 'Rated frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
    ],
    symbol: 'M-40,0 H-14 M-14,-14 H14 V14 H-14 Z M-10,8 L-6,-8 L-2,8 L2,-8 L6,8 L10,-8',
    label: (p) => `${si(p.P, 'W')} ${si(p.Q, 'var')}`,
    signals: [...sig3('v', 'V', { fr: 'tension', en: 'voltage' }), ...sig3('i', 'A', { fr: 'courant', en: 'current' }), { id: 'p', unit: 'W', name: { fr: 'puissance absorbée', en: 'power absorbed' } }],
    ac: {
      kind: 'multi',
      nV: 0,
      stamp: (ctx, nodes, p) => {
        const { R, L } = loadRL(p);
        nodes.forEach((n) => ctx.y(n, 0, rl(R, L, ctx.w)));
      },
    },
    build: (id, nodes, p, h) => {
      const { R, L } = loadRL(p);
      const br = nodes.map((n, k) => rlSeries(`${id}:${k}`, n, 0, R, L, h));
      const mon = monitor(
        id,
        (_x, v) => {
          const [va, vb, vc] = nodes.map(v);
          const [ia, ib, ic] = br.map((b) => b.i);
          return { va, vb, vc, ia, ib, ic, p: va * ia + vb * ib + vc * ic };
        },
        { va: 0, vb: 0, vc: 0, ia: 0, ib: 0, ic: 0, p: 0 },
      );
      return [mon, ...br];
    },
    formulas: [
      {
        title: { fr: 'Charge à impédance constante', en: 'Constant-impedance load' },
        tex: (c, id) => {
          const { R, L } = loadRL({ P: c.p[`${id}.P`], Q: c.p[`${id}.Q`], Vn: c.p[`${id}.Vn`], f: c.p[`${id}.f`] });
          return `Z = \\frac{U_n^2}{P - jQ} = ${c.q(R, 'Ω')} + j\\,${c.q(2 * Math.PI * c.p[`${id}.f`] * L, 'Ω')} \\ \\text{par phase, en étoile}`;
        },
        note: (c) => c.tr({ fr: 'Elle absorbe $P$ et $Q$ sous sa tension nominale, et varie en $V^2$ autour (leçon 4.4).', en: 'It absorbs $P$ and $Q$ at rated voltage, and varies as $V^2$ around it (lesson 4.4).' }),
      },
    ],
  },
  {
    type: 'rect6', family: 'power', prefix: 'PD',
    name: { fr: 'Pont à thyristors (6 pulses)', en: 'Thyristor bridge (6-pulse)' },
    ports: [abcPort(-2), { id: 'p', dx: 2, dy: -1, label: '+' }, { id: 'n', dx: 2, dy: 1, label: '−' }],
    params: [
      { id: 'alpha', symbol: '\\alpha', name: { fr: 'Angle d’amorçage', en: 'Firing angle' }, unit: '°', default: 30, min: 0, max: 165, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence du réseau', en: 'Grid frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'ph', symbol: '\\varphi_a', name: { fr: 'Phase de a (cos)', en: 'Phase of a (cos)' }, unit: '°', default: 0, min: -180, max: 180, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-20 M20,-20 H40 M20,20 H40 M-20,-24 H20 V24 H-20 Z M-6,-8 L-6,8 L8,0 Z M8,-8 V8',
    box: [24, 28],
    label: (p) => `α = ${Math.round(p.alpha)}°`,
    signals: [{ id: 'vd', unit: 'V', name: { fr: 'tension continue', en: 'DC voltage' }, sym: 'v_d' }, { id: 'id', unit: 'A', name: { fr: 'courant continu', en: 'DC current' }, sym: 'i_d' }],
    scopeDefault: ['vd'],
    ac: off,
    timeScale: (p) => 1 / p.f / 6,
    build: (id, nodes, prm) => {
      const [a, b, c, p, n] = nodes;
      // T1 (a+) fires α after va overtakes vc (ωt = −60° − φ); then every 60°: T2 (c−), T3 (b+), T4 (a−), T5 (c+), T6 (b−).
      const t0 = -60 - prm.ph + prm.alpha;
      const g = (k: number) => gates.window(prm.f, t0 + 60 * (k - 1), 120);
      const th = [
        thyristor(`${id}:T1`, a, p, g(1)),
        thyristor(`${id}:T2`, n, c, g(2)),
        thyristor(`${id}:T3`, b, p, g(3)),
        thyristor(`${id}:T4`, n, a, g(4)),
        thyristor(`${id}:T5`, c, p, g(5)),
        thyristor(`${id}:T6`, n, b, g(6)),
      ];
      const mon = monitor(id, (_x, v) => ({ vd: v(p) - v(n), id: th[0].i + th[2].i + th[4].i }), { vd: 0, id: 0 });
      return [mon, ...th];
    },
    formulas: [
      {
        title: { fr: 'Tension continue moyenne', en: 'Mean DC voltage' },
        tex: (c, id) => `V_d = \\frac{3\\sqrt2}{\\pi}U\\cos\\alpha - \\frac{3}{\\pi}\\omega L_s I_d, \\qquad \\alpha = ${c.q(c.p[`${id}.alpha`], '°')}`,
        note: (c) => c.tr({ fr: 'Six thyristors amorcés tous les 60° ; au-delà de 90°, $V_d < 0$ et le pont fonctionne en onduleur (leçon 6.2). L’inductance du réseau crée l’empiètement.', en: 'Six thyristors fired every 60°; beyond 90°, $V_d < 0$ and the bridge works as an inverter (lesson 6.2). The grid inductance causes commutation overlap.' }),
      },
    ],
  },
  {
    type: 'inv3', family: 'power', prefix: 'OND',
    name: { fr: 'Onduleur triphasé (MLI)', en: 'Three-phase inverter (PWM)' },
    ports: [{ id: 'p', dx: -2, dy: -1, label: '+' }, { id: 'n', dx: -2, dy: 1, label: '−' }, abcPort(2)],
    params: [
      { id: 'm', symbol: 'm', name: { fr: 'Indice de modulation', en: 'Modulation index' }, unit: '', default: 0.8, min: 0, max: 1.3, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence de sortie', en: 'Output frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'fs', symbol: 'f_s', name: { fr: 'Fréquence de découpage', en: 'Switching frequency' }, unit: 'Hz', default: 2500, min: 100, max: 50e3, scale: 'log' },
      { id: 'ph', symbol: '\\varphi', name: { fr: 'Phase de a', en: 'Phase of a' }, unit: '°', default: 0, min: -180, max: 180, scale: 'lin' },
    ],
    symbol: 'M-40,-20 H-20 M-40,20 H-20 M20,0 H40 M-20,-24 H20 V24 H-20 Z M-12,-10 H-2 M2,6 c2,-6 4,-6 6,0 s4,6 6,0',
    box: [24, 28],
    label: (p) => `m = ${p.m.toFixed(2)}, ${si(p.fs, 'Hz')}`,
    signals: [...sig3('v', 'V', { fr: 'tension (/−)', en: 'voltage (/−)' }), ...sig3('i', 'A', { fr: 'courant', en: 'current' })],
    scopeDefault: ['ia', 'ib', 'ic'],
    ac: off,
    timeScale: (p) => 1 / p.fs,
    build: (id, nodes, prm) => {
      const [p, n, a, b, c] = nodes;
      const legs = [a, b, c].map((x, k) => {
        const g = (top: boolean) => gates.sine(prm.fs, prm.m, prm.f, prm.ph - 120 * k, top);
        return [igbt(`${id}:Q${k}h`, p, x, g(true)), igbt(`${id}:Q${k}l`, x, n, g(false))];
      });
      const mon = monitor(
        id,
        (_x, v) => {
          const out: Record<string, number> = {};
          [a, b, c].forEach((x, k) => {
            out[`v${ph3(k)}`] = v(x) - v(n);
            out[`i${ph3(k)}`] = legs[k][0].i - legs[k][1].i;
          });
          return out;
        },
        { va: 0, vb: 0, vc: 0, ia: 0, ib: 0, ic: 0 },
      );
      return [mon, ...legs.flat()];
    },
    formulas: [
      {
        title: { fr: 'MLI sinus–triangle', en: 'Sine-triangle PWM' },
        tex: (c, id) => `\\hat V_{a0,1} = m\\frac{V_{dc}}{2}, \\qquad \\hat U_1 = m\\frac{\\sqrt3}{2}V_{dc}, \\quad m = ${c.q(c.p[`${id}.m`], '')}`,
        note: (c) => c.tr({ fr: 'Chaque bras compare une sinusoïde à une porteuse triangulaire ; les harmoniques de découpage se groupent autour de $f_s$ et de ses multiples (leçon 6.3).', en: 'Each leg compares a sinusoid with a triangular carrier; switching harmonics cluster around $f_s$ and its multiples (lesson 6.3).' }),
      },
    ],
  },
  {
    type: 'trafo', family: 'power', prefix: 'TR',
    name: { fr: 'Transformateur (saturable)', en: 'Transformer (saturable)' },
    ports: [
      { id: 'a', dx: -2, dy: -1, label: '1+' },
      { id: 'b', dx: -2, dy: 1, label: '1−' },
      { id: 'c', dx: 2, dy: -1, label: '2+' },
      { id: 'd', dx: 2, dy: 1, label: '2−' },
    ],
    params: [
      { id: 'V1', symbol: 'V_1', name: { fr: 'Tension primaire (efficace)', en: 'Primary voltage (RMS)' }, unit: 'V', default: 230, min: 1, max: 1e6, scale: 'log' },
      { id: 'V2', symbol: 'V_2', name: { fr: 'Tension secondaire (efficace)', en: 'Secondary voltage (RMS)' }, unit: 'V', default: 230, min: 1, max: 1e6, scale: 'log' },
      { id: 'S', symbol: 'S_n', name: { fr: 'Puissance assignée', en: 'Rating' }, unit: 'VA', default: 1000, min: 1, max: 1e9, scale: 'log' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 1, max: 1000, scale: 'log' },
      { id: 'x', symbol: 'x_{cc}', name: { fr: 'Réactance de fuite (pu)', en: 'Leakage reactance (pu)' }, unit: '', default: 0.06, min: 0.001, max: 0.5, scale: 'log' },
      { id: 'r', symbol: 'r', name: { fr: 'Résistance des enroulements (pu)', en: 'Winding resistance (pu)' }, unit: '', default: 0.01, min: 1e-4, max: 0.2, scale: 'log' },
      { id: 'i0', symbol: 'i_0', name: { fr: 'Courant à vide (pu)', en: 'No-load current (pu)' }, unit: '', default: 0.01, min: 1e-4, max: 0.2, scale: 'log' },
      { id: 'psiK', symbol: '\\psi_{sat}', name: { fr: 'Flux de saturation (pu)', en: 'Saturation flux (pu)' }, unit: '', default: 1.2, min: 1.02, max: 2, scale: 'lin' },
      { id: 'psiR', symbol: '\\psi_r', name: { fr: 'Flux rémanent (pu)', en: 'Residual flux (pu)' }, unit: '', default: 0, min: -0.9, max: 0.9, scale: 'lin' },
    ],
    symbol:
      'M-40,-20 H-10 V-14 M-10,14 V20 H-40 M-10,-14 a5,5 0 0 1 0,10 a5,5 0 0 1 0,10 a5,5 0 0 1 0,8 M40,-20 H10 V-14 M10,14 V20 H40 M10,-14 a5,5 0 0 0 0,10 a5,5 0 0 0 0,10 a5,5 0 0 0 0,8 M-2,-16 V16 M2,-16 V16',
    box: [24, 26],
    label: (p) => `${si(p.V1, 'V')}/${si(p.V2, 'V')}`,
    signals: [
      { id: 'i1', unit: 'A', name: { fr: 'courant primaire', en: 'primary current' }, sym: 'i_1' },
      { id: 'v2', unit: 'V', name: { fr: 'tension secondaire', en: 'secondary voltage' }, sym: 'v_2' },
      { id: 'im', unit: 'A', name: { fr: 'courant magnétisant', en: 'magnetising current' }, sym: 'i_m' },
      { id: 'psi', unit: 'pu', name: { fr: 'flux', en: 'flux' }, sym: '\\psi' },
    ],
    scopeDefault: ['i1'],
    timeScale: (p) => 1 / p.f,
    ac: {
      kind: 'multi',
      nV: 1,
      nInt: 1,
      stamp: (ctx, [a, b, c, d], p) => {
        const { R, Ls, Lm, n } = trafoParams(p);
        const m = ctx.node();
        ctx.y(a, m, rl(R, Ls, ctx.w));
        ctx.y(m, b, rl(0, Lm, ctx.w));
        ctx.xfmr(m, b, c, d, n);
      },
    },
    build: (id, [a, b, c, d], p, h, node) => {
      const { R, Ls, Lm, Lsat, n, psiB } = trafoParams(p);
      const m = node();
      const ser = rlSeries(`${id}:s`, a, m, R, Ls, h);
      const mag = satInductor(`${id}:m`, m, b, Lm, Lsat, p.psiK * psiB, p.psiR * psiB, h);
      const xf = idealXfmr(`${id}:x`, m, b, c, d, n);
      const mon = monitor(id, (_x, v) => ({ i1: ser.i, v2: v(c) - v(d), im: mag.i, psi: mag.psi / psiB, v: v(a) - v(b), i: ser.i }), { i1: 0, v2: 0, im: 0, psi: p.psiR, v: 0, i: 0 });
      return [mon, ser, mag, xf];
    },
    formulas: [
      {
        title: { fr: 'Schéma équivalent', en: 'Equivalent circuit' },
        tex: (c, id) => {
          const { R, Ls, Lm, n } = trafoParams(Object.fromEntries(['V1', 'V2', 'S', 'f', 'x', 'r', 'i0', 'psiK'].map((k) => [k, c.p[`${id}.${k}`]])));
          return `R = ${c.q(R, 'Ω')},\\ L_\\sigma = ${c.q(Ls, 'H')},\\ L_m = ${c.q(Lm, 'H')},\\ m = \\frac{V_1}{V_2} = ${c.q(n, '')}`;
        },
        note: (c) => c.tr({ fr: 'Fuites et pertes en série, inductance magnétisante en parallèle, transformateur idéal de rapport $m$. Au-delà du flux de saturation, l’inductance magnétisante s’effondre.', en: 'Leakage and losses in series, magnetising inductance in parallel, ideal transformer of ratio $m$. Beyond the saturation flux, the magnetising inductance collapses.' }),
      },
      {
        title: { fr: 'Flux et enclenchement', en: 'Flux and inrush' },
        tex: (c, id) => `\\psi = ${c.q(c.at(`${id}.psi`), 'pu')}, \\qquad \\psi(t) = \\psi_r + \\int_0^t v\\,d\\tau`,
        note: (c) => c.tr({ fr: 'Enclenché au passage par zéro de la tension avec un flux rémanent, le flux peut atteindre $2 + \\psi_r$ pu : le fer sature et le courant d’appel dépasse de loin le courant nominal (leçon 4.2).', en: 'Switched on at a voltage zero crossing with residual flux, the flux can reach $2 + \\psi_r$ pu: the iron saturates and the inrush far exceeds rated current (lesson 4.2).' }),
      },
    ],
  },
];

function loadRL(p: Record<string, number>) {
  const S2 = p.P * p.P + p.Q * p.Q || 1e-30;
  return { R: (p.Vn * p.Vn * p.P) / S2, L: (p.Vn * p.Vn * p.Q) / S2 / (2 * Math.PI * p.f) };
}

function trafoParams(p: Record<string, number>) {
  const w = 2 * Math.PI * p.f;
  const Zb = (p.V1 * p.V1) / p.S, Lb = Zb / w;
  return {
    R: p.r * Zb,
    Ls: p.x * Lb,
    Lm: Lb / p.i0,
    // Air-core slope beyond saturation: about twice the leakage.
    Lsat: 2 * p.x * Lb,
    n: p.V1 / p.V2,
    psiB: (Math.SQRT2 * p.V1) / w,
  };
}

