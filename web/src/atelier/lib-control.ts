// Control blocks: signal sources, operators, sensors and actuators. Blocks are
// evaluated after each network step, in drawing order; actuators read their
// input at the next step (the usual one-step delay of EMT control systems).

import { ammeter } from './engine/elements';
import { addG, addI, nodeV, type EmtElement } from './engine/emt';
import { vsrcVar } from './engine/grid';
import type { ElementDef, PortDef, Sig } from './defs';

const sIn = (id: string, dx: number, dy: number, label = id): PortDef => ({ id, dx, dy, signal: 'in', label });
const sOut = (id = 'y', dx = 2, dy = 0, label = ''): PortDef => ({ id, dx, dy, signal: 'out', label });
const yOut: Sig[] = [{ id: 'y', unit: '', name: { fr: 'sortie', en: 'output' }, sym: 'y' }];
const box = 'M-24,-16 H24 V16 H-24 Z';
const leads1 = 'M-40,0 H-24 M24,0 H40';

/** A block whose output is recomputed after every step from its inputs and time. */
function block(id: string, step: (t: number, h: number) => number, write: (v: number) => void): EmtElement {
  let y = 0, last = 0;
  return {
    id, v: 0, i: 0,
    stamp: () => {},
    rhs: () => {},
    update(_x, t) {
      const h = t - last;
      last = t;
      y = step(t, h);
      write(y);
      this.v = y;
    },
    out: () => ({ y }),
  };
}

const formula = (fr: string, en: string, tex: string) => [{ title: { fr, en }, tex: () => tex }];

export const CONTROL: ElementDef[] = [
  {
    type: 'kconst', family: 'control', prefix: 'K',
    name: { fr: 'Constante', en: 'Constant' },
    ports: [sOut()],
    params: [{ id: 'K', symbol: 'K', name: { fr: 'Valeur', en: 'Value' }, unit: '', default: 1, min: -1e6, max: 1e6, scale: 'lin' }],
    symbol: `${box} M24,0 H40`,
    label: (p) => `${p.K}`,
    glyph: 'K',
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => block(id, () => p.K, sig.out('y')),
    formulas: formula('Constante', 'Constant', 'y = K'),
  },
  {
    type: 'kstep', family: 'control', prefix: 'ECH',
    name: { fr: 'Échelon (consigne)', en: 'Step (setpoint)' },
    ports: [sOut()],
    params: [
      { id: 'y0', symbol: 'y_0', name: { fr: 'Valeur initiale', en: 'Initial value' }, unit: '', default: 0, min: -1e6, max: 1e6, scale: 'lin' },
      { id: 'y1', symbol: 'y_1', name: { fr: 'Valeur finale', en: 'Final value' }, unit: '', default: 1, min: -1e6, max: 1e6, scale: 'lin' },
      { id: 't0', symbol: 't_0', name: { fr: 'Instant', en: 'Instant' }, unit: 's', default: 0.01, min: 0, max: 100, scale: 'lin' },
    ],
    symbol: `${box} M24,0 H40 M-12,8 H0 V-8 H12`,
    label: (p) => `${p.y0} → ${p.y1}`,
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => block(id, (t) => (t >= p.t0 ? p.y1 : p.y0), sig.out('y')),
    formulas: formula('Échelon', 'Step', 'y(t) = y_0 + (y_1 - y_0)\\,\\mathbb{1}(t \\ge t_0)'),
  },
  {
    type: 'ksine', family: 'control', prefix: 'SIN',
    name: { fr: 'Sinusoïde (signal)', en: 'Sinusoid (signal)' },
    ports: [sOut()],
    params: [
      { id: 'A', symbol: 'A', name: { fr: 'Amplitude', en: 'Amplitude' }, unit: '', default: 1, min: 0, max: 1e6, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 0.01, max: 1e5, scale: 'log' },
      { id: 'ph', symbol: '\\varphi', name: { fr: 'Phase', en: 'Phase' }, unit: '°', default: 0, min: -180, max: 180, scale: 'lin' },
      { id: 'off', symbol: 'y_0', name: { fr: 'Décalage', en: 'Offset' }, unit: '', default: 0, min: -1e6, max: 1e6, scale: 'lin' },
    ],
    symbol: `${box} M24,0 H40 M-12,0 c3,-9 6,-9 9,0 s6,9 9,0`,
    signals: yOut,
    timeScale: (p) => 1 / p.f,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => block(id, (t) => p.off + p.A * Math.cos(2 * Math.PI * p.f * t + (p.ph * Math.PI) / 180), sig.out('y')),
    formulas: formula('Sinusoïde', 'Sinusoid', 'y(t) = y_0 + A\\cos(2\\pi f t + \\varphi)'),
  },
  {
    type: 'kgain', family: 'control', prefix: 'GN',
    name: { fr: 'Gain', en: 'Gain' },
    ports: [sIn('u', -2, 0, ''), sOut()],
    params: [{ id: 'K', symbol: 'K', name: { fr: 'Gain', en: 'Gain' }, unit: '', default: 1, min: -1e6, max: 1e6, scale: 'lin' }],
    symbol: `${leads1} M-24,-16 L24,0 L-24,16 Z`,
    label: (p) => `×${p.K}`,
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const u = sig.in('u');
      return block(id, () => p.K * u(), sig.out('y'));
    },
    formulas: formula('Gain', 'Gain', 'y = K\\,u'),
  },
  {
    type: 'ksum', family: 'control', prefix: 'SUM',
    name: { fr: 'Comparateur (somme)', en: 'Summing junction' },
    ports: [sIn('a', -2, -1, '+'), sIn('b', -2, 1, '±'), sOut()],
    params: [
      { id: 'sb', symbol: 's_b', name: { fr: 'Signe de b', en: 'Sign of b' }, unit: '', default: -1, min: -1, max: 1, scale: 'lin', choices: [{ value: 1, label: { fr: '+', en: '+' } }, { value: -1, label: { fr: '−', en: '−' } }] },
    ],
    symbol: 'M-40,-20 H-12 M-40,20 H-12 M12,0 H40 M0,0 m-14,0 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0 M-6,0 H6 M0,-6 V6',
    box: [20, 26],
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const a = sig.in('a'), b = sig.in('b');
      return block(id, () => a() + p.sb * b(), sig.out('y'));
    },
    formulas: formula('Somme', 'Sum', 'y = a \\pm b \\quad \\text{(l’erreur } e = \\text{consigne} - \\text{mesure)}'),
  },
  {
    type: 'kpi', family: 'control', prefix: 'PI',
    name: { fr: 'Régulateur PI', en: 'PI controller' },
    ports: [sIn('u', -2, 0, 'e'), sOut()],
    params: [
      { id: 'Kp', symbol: 'K_p', name: { fr: 'Gain proportionnel', en: 'Proportional gain' }, unit: '', default: 1, min: 0, max: 1e6, scale: 'lin' },
      { id: 'Ki', symbol: 'K_i', name: { fr: 'Gain intégral', en: 'Integral gain' }, unit: '1/s', default: 10, min: 0, max: 1e7, scale: 'lin' },
      { id: 'ymin', symbol: 'y_{min}', name: { fr: 'Sortie minimale', en: 'Minimum output' }, unit: '', default: -1e6, min: -1e9, max: 1e9, scale: 'lin' },
      { id: 'ymax', symbol: 'y_{max}', name: { fr: 'Sortie maximale', en: 'Maximum output' }, unit: '', default: 1e6, min: -1e9, max: 1e9, scale: 'lin' },
    ],
    symbol: `${box} ${leads1}`,
    glyph: 'PI',
    label: (p) => `Kp ${p.Kp}, Ki ${p.Ki}`,
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const u = sig.in('u');
      let xi = 0;
      return block(
        id,
        (_t, h) => {
          const e = u();
          const raw = p.Kp * e + xi + p.Ki * e * h;
          const y = Math.min(p.ymax, Math.max(p.ymin, raw));
          // Anti-windup: integrate only while not saturated (or when it brings the output back).
          if (y === raw || (raw > p.ymax && e < 0) || (raw < p.ymin && e > 0)) xi += p.Ki * e * h;
          return y;
        },
        sig.out('y'),
      );
    },
    formulas: formula('Régulateur PI', 'PI controller', 'y = K_p\\,e + K_i\\int e\\,dt, \\quad y_{min} \\le y \\le y_{max} \\ \\text{(anti-emballement)}'),
  },
  {
    type: 'kint', family: 'control', prefix: 'INT',
    name: { fr: 'Intégrateur', en: 'Integrator' },
    ports: [sIn('u', -2, 0, ''), sOut()],
    params: [
      { id: 'K', symbol: 'K', name: { fr: 'Gain', en: 'Gain' }, unit: '1/s', default: 1, min: -1e6, max: 1e6, scale: 'lin' },
      { id: 'y0', symbol: 'y_0', name: { fr: 'Valeur initiale', en: 'Initial value' }, unit: '', default: 0, min: -1e6, max: 1e6, scale: 'lin' },
    ],
    symbol: `${box} ${leads1}`,
    glyph: '∫',
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const u = sig.in('u');
      let y = p.y0;
      return block(id, (_t, h) => (y += p.K * u() * h), sig.out('y'));
    },
    formulas: formula('Intégrateur', 'Integrator', 'y = y_0 + K\\int_0^t u\\,d\\tau'),
  },
  {
    type: 'klag', family: 'control', prefix: 'PB',
    name: { fr: 'Premier ordre (filtre)', en: 'First-order lag' },
    ports: [sIn('u', -2, 0, ''), sOut()],
    params: [
      { id: 'K', symbol: 'K', name: { fr: 'Gain statique', en: 'Static gain' }, unit: '', default: 1, min: -1e6, max: 1e6, scale: 'lin' },
      { id: 'T', symbol: 'T', name: { fr: 'Constante de temps', en: 'Time constant' }, unit: 's', default: 0.01, min: 1e-6, max: 100, scale: 'log' },
    ],
    symbol: `${box} ${leads1}`,
    glyph: '1/(1+Ts)',
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const u = sig.in('u');
      let y = 0;
      return block(id, (_t, h) => (y += (h / Math.max(p.T, h)) * (p.K * u() - y)), sig.out('y'));
    },
    formulas: formula('Premier ordre', 'First-order lag', 'T\\,\\dot y + y = K\\,u'),
  },
  {
    type: 'klim', family: 'control', prefix: 'LIM',
    name: { fr: 'Limiteur', en: 'Limiter' },
    ports: [sIn('u', -2, 0, ''), sOut()],
    params: [
      { id: 'min', symbol: 'y_{min}', name: { fr: 'Minimum', en: 'Minimum' }, unit: '', default: -1, min: -1e9, max: 1e9, scale: 'lin' },
      { id: 'max', symbol: 'y_{max}', name: { fr: 'Maximum', en: 'Maximum' }, unit: '', default: 1, min: -1e9, max: 1e9, scale: 'lin' },
    ],
    symbol: `${box} ${leads1} M-14,8 H-6 L6,-8 H14`,
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const u = sig.in('u');
      return block(id, () => Math.min(p.max, Math.max(p.min, u())), sig.out('y'));
    },
    formulas: formula('Limiteur', 'Limiter', 'y = \\min(y_{max}, \\max(y_{min}, u))'),
  },
  {
    type: 'kmul', family: 'control', prefix: 'MUL',
    name: { fr: 'Produit', en: 'Product' },
    ports: [sIn('a', -2, -1, 'a'), sIn('b', -2, 1, 'b'), sOut()],
    params: [],
    symbol: `${box} M-40,-20 H-24 M-40,20 H-24 M24,0 H40`,
    box: [24, 26],
    glyph: '×',
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, _n, _p, _h, _node, sig) => {
      const a = sig.in('a'), b = sig.in('b');
      return block(id, () => a() * b(), sig.out('y'));
    },
    formulas: formula('Produit', 'Product', 'y = a\\,b'),
  },
  {
    type: 'kpwm', family: 'control', prefix: 'MLI',
    name: { fr: 'Modulateur MLI', en: 'PWM modulator' },
    ports: [sIn('u', -2, 0, 'm'), sOut('y', 2, 0, 'g')],
    params: [{ id: 'fs', symbol: 'f_s', name: { fr: 'Fréquence de la porteuse', en: 'Carrier frequency' }, unit: 'Hz', default: 10e3, min: 10, max: 200e3, scale: 'log' }],
    symbol: `${box} ${leads1} M-14,8 L-7,-8 L0,8 L7,-8 L14,8`,
    signals: yOut,
    timeScale: (p) => 1 / p.fs,
    ac: { kind: 'none' },
    build: (id, _n, p, _h, _node, sig) => {
      const u = sig.in('u');
      // Carrier: a triangle between 0 and 1; gate on while the reference exceeds it.
      return block(id, (t) => (u() > Math.abs(((t * p.fs) % 1) * 2 - 1) ? 1 : 0), sig.out('y'));
    },
    formulas: formula('Modulation de largeur d’impulsion', 'Pulse-width modulation', 'g = \\mathbb{1}\\big(u > c(t)\\big), \\quad c \\text{ triangulaire entre 0 et 1 à } f_s'),
  },
  {
    type: 'vsens', family: 'control', prefix: 'CV',
    name: { fr: 'Capteur de tension', en: 'Voltage sensor' },
    ports: [{ id: 'a', dx: -2, dy: -1, label: '+' }, { id: 'b', dx: -2, dy: 1, label: '−' }, sOut()],
    params: [{ id: 'K', symbol: 'K', name: { fr: 'Gain du capteur', en: 'Sensor gain' }, unit: '', default: 1, min: -1e6, max: 1e6, scale: 'lin' }],
    symbol: `${box} M-40,-20 H-24 M-40,20 H-24 M24,0 H40`,
    box: [24, 26],
    glyph: 'V→',
    signals: yOut,
    ac: { kind: 'none' },
    build: (id, [a, b], p, _h, _node, sig) => {
      const w = sig.out('y');
      let y = 0;
      const e: EmtElement = {
        id, v: 0, i: 0,
        stamp: () => {},
        rhs: () => {},
        update(x, _t, sys) {
          y = p.K * (nodeV(x, sys, a) - nodeV(x, sys, b));
          w(y);
          e.v = y;
        },
        out: () => ({ y }),
      };
      return e;
    },
    formulas: formula('Capteur de tension', 'Voltage sensor', 'y = K\\,(v_+ - v_-)'),
  },
  {
    type: 'isens', family: 'control', prefix: 'CI',
    name: { fr: 'Capteur de courant', en: 'Current sensor' },
    ports: [{ id: 'a', dx: -2, dy: 0, label: '+' }, { id: 'b', dx: 2, dy: 0, label: '−' }, sOut('y', 0, -2, '')],
    params: [{ id: 'K', symbol: 'K', name: { fr: 'Gain du capteur', en: 'Sensor gain' }, unit: '', default: 1, min: -1e6, max: 1e6, scale: 'lin' }],
    symbol: 'M-40,0 H-14 M14,0 H40 M0,-14 V-40',
    circle: true,
    glyph: 'I→',
    signals: yOut,
    ac: { kind: 'V', phasor: () => ({ re: 0, im: 0 }), meter: true },
    build: (id, [a, b], p, _h, _node, sig) => {
      const am = ammeter(`${id}:A`, a, b);
      const w = sig.out('y');
      let y = 0;
      const mon: EmtElement = {
        id, v: 0, i: 0,
        stamp: () => {},
        rhs: () => {},
        update() {
          y = p.K * am.i;
          w(y);
          this.v = y;
        },
        out: () => ({ y }),
      };
      return [am, mon];
    },
    formulas: formula('Capteur de courant', 'Current sensor', 'y = K\\,i \\quad \\text{(en série, impédance nulle)}'),
  },
  {
    type: 'vctrl', family: 'control', prefix: 'SV',
    name: { fr: 'Source de tension commandée', en: 'Controlled voltage source' },
    ports: [sIn('u', -2, 0, 'u'), { id: 'a', dx: 2, dy: -1, label: '+' }, { id: 'b', dx: 2, dy: 1, label: '−' }],
    params: [{ id: 'K', symbol: 'K', name: { fr: 'Gain', en: 'Gain' }, unit: 'V', default: 1, min: -1e6, max: 1e6, scale: 'lin' }],
    symbol: 'M-40,0 H-14 M14,-20 H40 M14,20 H40 M0,-14 L14,0 L0,14 L-14,0 Z',
    box: [20, 26],
    glyph: '',
    signals: ['v', 'i', 'p'],
    ac: { kind: 'none' },
    build: (id, [a, b], p, _h, _node, sig) => {
      const u = sig.in('u');
      return vsrcVar(id, a, b, () => p.K * u());
    },
    formulas: formula('Source commandée', 'Controlled source', 'v = K\\,u \\quad \\text{(lue au pas suivant)}'),
  },
  {
    type: 'ictrl', family: 'control', prefix: 'SI',
    name: { fr: 'Source de courant commandée', en: 'Controlled current source' },
    ports: [sIn('u', -2, 0, 'u'), { id: 'a', dx: 2, dy: -1, label: '+' }, { id: 'b', dx: 2, dy: 1, label: '−' }],
    params: [{ id: 'K', symbol: 'K', name: { fr: 'Gain', en: 'Gain' }, unit: 'A', default: 1, min: -1e6, max: 1e6, scale: 'lin' }],
    symbol: 'M-40,0 H-14 M14,-20 H40 M14,20 H40 M0,-14 L14,0 L0,14 L-14,0 Z M0,8 V-8 M-4,-4 L0,-8 L4,-4',
    box: [20, 26],
    signals: ['v', 'i', 'p'],
    ac: { kind: 'none' },
    build: (id, [a, b], p, _h, _node, sig) => {
      const u = sig.in('u');
      const e: EmtElement = {
        id, v: 0, i: 0,
        stamp: () => {},
        rhs(bb, _t, sys) {
          addI(bb, sys, b, a, p.K * u());
        },
        update(x, _t, sys) {
          e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
          e.i = p.K * u();
        },
      };
      return e;
    },
    formulas: formula('Source de courant commandée', 'Controlled current source', 'i = K\\,u \\quad \\text{(débitée par +)}'),
  },
  {
    type: 'igbtg', family: 'control', prefix: 'QG',
    name: { fr: 'IGBT à gâchette (commande)', en: 'IGBT with gate input' },
    ports: [{ id: 'a', dx: -2, dy: 0, label: 'C' }, { id: 'b', dx: 2, dy: 0, label: 'E' }, sIn('g', 0, -2, 'g')],
    params: [{ id: 'Ron', symbol: 'R_{on}', name: { fr: 'Résistance passante', en: 'On resistance' }, unit: 'Ω', default: 1e-3, min: 1e-5, max: 1, scale: 'log' }],
    symbol: 'M-40,0 H-14 M14,0 H40 M-14,-10 H14 V10 H-14 Z M-8,6 L8,-6 M0,-10 V-40',
    signals: ['v', 'i', 'p'],
    ac: { kind: 'none' },
    build: (id, [a, b], p, _h, _node, sig) => {
      const g = sig.in('g');
      const gOn = 1 / Math.max(p.Ron, 1e-6), gOff = 1e-7;
      let on = false, diodeOn = false;
      const G = () => (on || diodeOn ? gOn : gOff);
      const e: EmtElement = {
        id, v: 0, i: 0,
        stamp: (A, sys) => addG(A, sys, a, b, G()),
        rhs: () => {},
        changed() {
          const want = g() > 0.5;
          if (want === on) return false;
          on = want;
          if (on) diodeOn = false;
          return true;
        },
        check(x, _t, sys) {
          if (on) return false;
          const v = nodeV(x, sys, a) - nodeV(x, sys, b);
          const want = diodeOn ? G() * v < 1e-9 : v < -1e-9;
          if (want === diodeOn) return false;
          diodeOn = want;
          return true;
        },
        update(x, _t, sys) {
          e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
          e.i = G() * e.v;
        },
      };
      return e;
    },
    formulas: formula('IGBT commandé', 'Gated IGBT', '\\text{passant si } g > 0{,}5 \\text{ ; diode antiparallèle}'),
  },
];
