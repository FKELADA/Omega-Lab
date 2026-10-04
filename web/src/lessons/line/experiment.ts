// Module 4.1 — Transmission lines: models, Ferranti effect, natural load (SIL).

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import { cabs } from '../../lib/core/linalg';
import type { Experiment } from '../../lib/lab/types';
import { LINE_MODELS, line, lineInfo, type LineInfo } from '../../lib/models/module4';
import { fitPhase } from '../../lib/models/phasorRun';
import LineCanvas from './LineCanvas.svelte';
import ModelCompare from './ModelCompare.svelte';

const vrPu = (k: LineInfo, kV: number) => cabs(k.chosen.Vr) / ((kV * 1e3) / Math.sqrt(3));

export const lineLesson: Experiment = {
  id: 'line',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.1 Lignes', en: '4.1 Lines' },
  ],
  title: { fr: 'La ligne de transport : modèles, effet Ferranti, puissance naturelle', en: 'The transmission line: models, Ferranti effect, natural load' },
  model: line,
  info: lineInfo,
  canvas: LineCanvas,
  instruments: [Chart0, ModelCompare],

  params: [
    { id: 'km', symbol: 'L', name: { fr: 'Longueur', en: 'Length' }, unit: 'km', min: 10, max: 1000, default: 600, scale: 'log', term: 'L' },
    { id: 'P', symbol: 'P', name: { fr: 'Charge', en: 'Load' }, unit: 'MW', min: 0, max: 2000, default: 0, scale: 'lin', term: 'R' },
    { id: 'pf', symbol: '\\cos\\varphi', name: { fr: 'Facteur de puissance', en: 'Power factor' }, unit: '', min: 0.8, max: 1, default: 1, scale: 'lin' },
    {
      id: 'kV',
      symbol: 'U',
      name: { fr: 'Tension', en: 'Voltage' },
      unit: '',
      min: 225,
      max: 400,
      default: 400,
      scale: 'lin',
      choices: [225, 400].map((v) => ({ value: v, label: { fr: `${v} kV`, en: `${v} kV` } })),
    },
    {
      id: 'model',
      symbol: 'M',
      name: { fr: 'Modèle', en: 'Model' },
      unit: '',
      min: 0,
      max: 2,
      default: LINE_MODELS.exact,
      scale: 'lin',
      choices: [
        { value: LINE_MODELS.short, label: { fr: 'Ligne courte', en: 'Short' } },
        { value: LINE_MODELS.pi, label: { fr: 'π nominal', en: 'Nominal π' } },
        { value: LINE_MODELS.exact, label: { fr: 'Exact', en: 'Exact' } },
      ],
    },
  ],

  signals: [
    { id: 'vs', symbol: 'v_s', name: { fr: 'Tension d’envoi', en: 'Sending voltage' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'vr', symbol: 'v_r', name: { fr: 'Tension de réception', en: 'Receiving voltage' }, unit: 'V', color: '--c-C', on: true, term: 'C' },
    { id: 'is', symbol: 'i_s', name: { fr: 'Courant d’envoi', en: 'Sending current' }, unit: 'A', color: '--c-i', on: false, term: 'i' },
    { id: 'ir', symbol: 'i_r', name: { fr: 'Courant de réception', en: 'Receiving current' }, unit: 'A', color: '--c-R', on: false, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Profil de tension le long de la ligne', en: 'Voltage profile along the line' },
      x: { label: 'x', unit: 'km', range: (lab) => [0, lab.params.km] },
      y: { label: '|V|', unit: 'pu', range: [0.6, 1.5] },
      bands: () => [{ y0: 0.95, y1: 1.05 }],
      series: (lab) => {
        const k = lab.info as LineInfo;
        return [
          { label: { fr: 'à vide', en: 'no load' }, color: '--c-C', pts: lineInfo({ ...lab.params, P: 0 }).profile, dash: true, width: 1.5 },
          { label: { fr: 'à la puissance naturelle', en: 'at natural load (SIL)' }, color: '--c-vs', pts: lineInfo({ ...lab.params, P: k.SIL / 1e6, pf: 1 }).profile, dash: true, width: 1.5 },
          { label: { fr: 'charge actuelle', en: 'present load' }, color: '--c-p', pts: k.profile, width: 2.5 },
        ];
      },
      points: (lab) => [{ x: lab.params.km, y: vrPu(lab.info as LineInfo, lab.params.kV), color: '--accent', label: 'V_r', hollow: lab.params.model !== LINE_MODELS.exact }],
      note: () => ({ fr: 'Profil calculé avec le modèle exact ; le point montre le modèle choisi.', en: 'Profile from the exact model; the dot shows the chosen model.' }),
    },
  ],

  predict: {
    signal: 'vr',
    yRange: (p) => {
      const b = 1.6 * Math.SQRT2 * (p.kV * 1e3) / Math.sqrt(3);
      return [-b, b];
    },
    diagnose(pred, _run, p) {
      if (pred.length < 10) return null;
      const amp = fitPhase(pred, 2 * Math.PI * 50).amp;
      const vs = Math.SQRT2 * (p.kV * 1e3) / Math.sqrt(3);
      if (amp <= 1.02 * vs)
        return {
          fr: 'Surprise : à vide, une longue ligne **élève** la tension à son extrémité. La capacité de la ligne fait circuler un courant de charge qui traverse son inductance : c’est l’**effet Ferranti**, environ +26 % sur 600 km.',
          en: 'Surprise: at no load, a long line **raises** the voltage at its far end. The line capacitance draws a charging current through its inductance: this is the **Ferranti effect**, about +26 % over 600 km.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'constants',
      title: { fr: 'Constantes linéiques', en: 'Per-unit-length constants' },
      tex: (c) => {
        const k = c.k as LineInfo;
        return `\\begin{aligned}
          z &= r + j\\omega l, \\qquad y = j\\omega c \\\\
          \\gamma &= \\sqrt{zy} = \\alpha + j\\beta, \\qquad Z_c = \\sqrt{z/y} = ${c.q(k.Zc.re, 'Ω')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une ligne, c’est une inductance série et une capacité vers la terre réparties tout le long. $Z_c$ est son impédance caractéristique.',
          en: 'A line is a series inductance and a capacitance to ground spread along its whole length. $Z_c$ is its characteristic impedance.',
        }),
    },
    {
      id: 'telegraph',
      title: { fr: 'Solution exacte', en: 'Exact solution' },
      tex: () => `\\underline V(x) = \\underline V_r\\cosh\\gamma x + Z_c\\,\\underline I_r\\sinh\\gamma x`,
      note: (c) =>
        c.tr({
          fr: '$x$ est la distance à l’extrémité réceptrice. Le profil de tension en découle directement.',
          en: '$x$ is the distance from the receiving end. The voltage profile follows directly.',
        }),
    },
    {
      id: 'sil',
      title: { fr: 'Puissance naturelle et effet Ferranti', en: 'Natural load and Ferranti effect' },
      tex: (c) => {
        const k = c.k as LineInfo;
        return `\\begin{aligned}
          \\mathrm{SIL} &= \\frac{U^2}{Z_c} = ${c.q(k.SIL, 'W')} \\\\
          \\left.\\frac{V_r}{V_s}\\right|_{P=0} &= \\frac{1}{|\\cosh\\gamma L|} \\approx \\frac{1}{\\cos\\beta L} = ${c.q(k.ferranti, '', 4)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'À la puissance naturelle, la puissance réactive produite par la capacité égale celle consommée par l’inductance : le profil est plat. En dessous, la tension monte ; au-dessus, elle chute.',
          en: 'At natural load, the reactive power produced by the capacitance equals that absorbed by the inductance: the profile is flat. Below it, voltage rises; above it, voltage sags.',
        }),
    },
    {
      id: 'pi',
      title: { fr: 'Le modèle en π', en: 'The π model' },
      tex: () => `\\begin{aligned}
        \\text{nominal: } & Z = zL,\\quad \\tfrac{Y}{2} = \\tfrac{yL}{2} \\\\
        \\text{exact: } & Z' = Z_c\\sinh\\gamma L,\\quad \\tfrac{Y'}{2} = \\frac{\\tanh(\\gamma L/2)}{Z_c}
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Le π nominal suffit jusqu’à environ 200–250 km ; au-delà, on utilise le π équivalent exact, qui reproduit parfaitement les extrémités. C’est ce que font tous les logiciels de répartition de charge.',
          en: 'The nominal π is enough up to about 200–250 km; beyond that, the exact equivalent π reproduces the line ends perfectly. That is what every power-flow program does.',
        }),
    },
    {
      id: 'loadability',
      title: { fr: 'Capacité de transport', en: 'Loadability' },
      personas: ['utility', 'research'],
      tex: () => `P_{max} \\approx 3\\,\\mathrm{SIL}\\ (\\approx 80\\ \\mathrm{km}) \\;\\to\\; 1\\,\\mathrm{SIL}\\ (\\approx 500\\ \\mathrm{km})`,
      note: (c) =>
        c.tr({
          fr: 'Courbe de St Clair : les lignes courtes sont limitées thermiquement, les longues par la chute de tension puis par la stabilité. D’où la compensation série et shunt (leçon 4.6).',
          en: 'St Clair curve: short lines are thermally limited, long ones by voltage drop and then stability. Hence series and shunt compensation (lesson 4.6).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Une ligne à vide', en: 'An unloaded line' },
      body: {
        fr: `Une ligne 400 kV de **600 km** est alimentée à une extrémité ; l’autre est **ouverte** (aucune charge). **Dessinez la tension à l’extrémité ouverte** par rapport à la tension d’envoi (en vert), puis révélez.`,
        en: `A **600 km** 400 kV line is energised from one end; the other end is **open** (no load). **Sketch the voltage at the open end** relative to the sending voltage (green), then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'sil',
      title: { fr: 'La puissance naturelle', en: 'The natural load' },
      body: {
        fr: `Réglez la charge sur la **puissance naturelle** (SIL, environ 530 MW à 400 kV) avec $\\cos\\varphi = 1$. Le profil de tension devient presque **plat** : la ligne s’auto-compense.`,
        en: `Set the load to the **natural load** (SIL, about 530 MW at 400 kV) with $\\cos\\varphi = 1$. The voltage profile becomes almost **flat**: the line compensates itself.`,
      },
      check: (lab) => {
        const k = lab.info as LineInfo;
        return Math.abs(lab.params.P * 1e6 / k.SIL - 1) < 0.05 && lab.params.pf > 0.99;
      },
    },
    {
      id: 'heavy',
      title: { fr: 'Trop de charge', en: 'Too much load' },
      body: {
        fr: `Montez la charge jusqu’à ce que la tension de réception passe sous **0,9 pu**. Au-delà de la puissance naturelle, l’inductance consomme plus de réactif que la capacité n’en produit.`,
        en: `Raise the load until the receiving voltage drops below **0.9 pu**. Above the natural load, the inductance absorbs more reactive power than the capacitance produces.`,
      },
      check: (lab) => vrPu(lab.info as LineInfo, lab.params.kV) < 0.9,
    },
    {
      id: 'short',
      title: { fr: 'Le modèle trop simple', en: 'The model that is too simple' },
      body: {
        fr: `Choisissez le modèle **ligne courte** (sans capacité) sur une ligne d’au moins **400 km**. Comparez dans le tableau : il ignore l’effet Ferranti et le courant de charge.`,
        en: `Choose the **short line** model (no capacitance) on a line of at least **400 km**. Compare in the table: it misses the Ferranti effect and the charging current.`,
      },
      check: (lab) => lab.params.model === LINE_MODELS.short && lab.params.km >= 400,
    },
    {
      id: 'pi',
      title: { fr: 'Quand le π suffit', en: 'When the π model is enough' },
      body: {
        fr: `Choisissez le **π nominal** et ramenez la ligne sous **200 km**. L’écart avec le modèle exact tombe sous 1 % : c’est le modèle de tous les calculs de réseau courants.`,
        en: `Choose the **nominal π** and bring the line below **200 km**. The difference from the exact model drops below 1 %: this is the model used in everyday network studies.`,
      },
      check: (lab) => lab.params.model === LINE_MODELS.pi && lab.params.km <= 200,
    },
  ],
};
