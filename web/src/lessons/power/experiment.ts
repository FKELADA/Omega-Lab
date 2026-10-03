// Module 2.3 — AC power: P, Q, S, and power-factor correction.

import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import { cabs, cx } from '../../lib/core/linalg';
import type { Experiment } from '../../lib/lab/types';
import { R_LINE, powerInfo, powerLoad, type PowerInfo } from '../../lib/models/acCircuits';
import PowerSchematic from './PowerSchematic.svelte';
import PowerTriangle from './PowerTriangle.svelte';

export const powerLesson: Experiment = {
  id: 'power',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.3 Puissances', en: '2.3 AC power' },
  ],
  title: { fr: 'P, Q, S et compensation de l’énergie réactive', en: 'P, Q, S and power-factor correction' },
  model: powerLoad,
  info: powerInfo,
  canvas: PowerSchematic,
  instruments: [PowerTriangle, PhasorDiagram],

  params: [
    { id: 'P', symbol: 'P', name: { fr: 'Puissance du moteur', en: 'Motor power' }, unit: 'W', min: 1e3, max: 50e3, default: 10e3, scale: 'log', term: 'R' },
    { id: 'pf', symbol: '\\cos\\varphi_M', name: { fr: 'Facteur de puissance du moteur', en: 'Motor power factor' }, unit: '', min: 0.3, max: 1, default: 0.7, scale: 'lin', term: 'L' },
    { id: 'C', symbol: 'C', name: { fr: 'Batterie de condensateurs', en: 'Capacitor bank' }, unit: 'F', min: 0, max: 1.5e-3, default: 0, scale: 'lin', term: 'C' },
    { id: 'V', symbol: 'V', name: { fr: 'Tension efficace', en: 'RMS voltage' }, unit: 'V', min: 100, max: 400, default: 230, scale: 'lin', term: 'S' },
    {
      id: 'f',
      symbol: 'f',
      name: { fr: 'Fréquence', en: 'Frequency' },
      unit: 'Hz',
      min: 50,
      max: 60,
      default: 50,
      scale: 'lin',
      choices: [
        { value: 50, label: { fr: '50 Hz', en: '50 Hz' } },
        { value: 60, label: { fr: '60 Hz', en: '60 Hz' } },
      ],
    },
  ],

  signals: [
    { id: 'p', symbol: 'p', name: { fr: 'Puissance instantanée', en: 'Instantaneous power' }, unit: 'W', color: '--c-p', on: true, term: 'p' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'W', color: '--c-P', on: true, term: 'P', dash: true },
    { id: 'pP', symbol: 'p_P', name: { fr: 'Partie active', en: 'Active part' }, unit: 'W', color: '--c-R', on: false, term: 'R' },
    { id: 'pQ', symbol: 'p_Q', name: { fr: 'Partie réactive', en: 'Reactive part' }, unit: 'W', color: '--c-L', on: false, term: 'L' },
    { id: 'v', symbol: 'v', name: { fr: 'Tension', en: 'Voltage' }, unit: 'V', color: '--c-S', on: false, term: 'S' },
    { id: 'i', symbol: 'i', name: { fr: 'Courant de ligne', en: 'Line current' }, unit: 'A', color: '--c-i', on: false, term: 'i' },
  ],

  phasors: {
    omega: (p) => 2 * Math.PI * p.f,
    unit: 'V',
    rms: true,
    items: (p, k: PowerInfo) => {
      // One scale for every current, chosen so the motor current is 80 % as long as V.
      const s = (0.8 * p.V) / Math.max(1e-9, cabs(k.Iload));
      return [
        { id: 'V', label: 'V', term: 'S', color: '--c-S', value: cx(p.V) },
        { id: 'IM', label: 'I_M', term: 'L', color: '--c-L', value: k.Iload, unit: 'A', drawScale: s },
        { id: 'IC', label: 'I_C', term: 'C', color: '--c-C', value: k.IC, unit: 'A', drawScale: s, after: 'IM' },
        { id: 'I', label: 'I', term: 'i', color: '--c-i', value: k.I, unit: 'A', drawScale: s, thin: true },
      ];
    },
  },

  predict: {
    signal: 'p',
    yRange: (p) => {
      const k = powerInfo(p);
      const S = cabs(k.S);
      return [-1.1 * S, 1.15 * (k.P + S)];
    },
    diagnose(pred, run, p) {
      const k = powerInfo(p);
      const S = cabs(k.S);
      const minPred = Math.min(...pred.map(([, y]) => y));
      if (Math.min(...run.s.p) < -0.1 * S && minPred > -0.05 * S)
        return {
          fr: 'Avec une charge inductive, $p(t)$ **devient négative** une partie de chaque période : l’énergie stockée dans le champ magnétique du moteur **revient** vers la source. Le radiateur de la leçon 1.3, lui, ne rendait rien.',
          en: 'With an inductive load, $p(t)$ **goes negative** for part of each cycle: energy stored in the motor’s magnetic field **flows back** to the source. The heater in lesson 1.3 never gave anything back.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'complex',
      title: { fr: 'Puissance complexe', en: 'Complex power' },
      tex: (c) => {
        const k = c.k as PowerInfo;
        return `\\begin{aligned}
          \\underline S &= \\underline V\\,\\underline I^{*} = ${c.term('R', 'P')} + j\\,${c.term('L', 'Q')} \\\\
          &= ${c.term('R', c.q(k.P, 'W'))} ${k.Q < 0 ? '-' : '+'} j\\,${c.term('L', c.q(Math.abs(k.Q), 'var'))} \\\\
          |\\underline S| &= V I = ${c.q(cabs(k.S), 'VA')}, \\qquad \\cos\\varphi = \\frac{P}{|\\underline S|} = ${c.q(k.pf, '', 3)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: '$P$ (W) fait le travail utile. $Q$ (var) mesure l’énergie qui fait des allers-retours. $|S|$ (VA) est ce que les câbles et transformateurs doivent supporter.',
          en: '$P$ (W) does the useful work. $Q$ (var) measures the energy going back and forth. $|S|$ (VA) is what cables and transformers must carry.',
        }),
    },
    {
      id: 'pt',
      title: { fr: 'Ce que Q signifie dans le temps', en: 'What Q means in time' },
      tex: (c) => `\\begin{aligned}
        ${c.term('p', 'p(t)')} &= ${c.term('R', 'P\\,(1 + \\cos 2\\omega t)')} + ${c.term('L', 'Q\\,\\sin 2\\omega t')} \\\\
        ${c.term('p', c.q(c.at('p'), 'W'))} &= ${c.term('R', c.q(c.at('pP'), 'W'))} ${c.at('pQ') < 0 ? '' : '+'} ${c.term('L', c.q(c.at('pQ'), 'W'))}
      \\end{aligned}`,
      bars: (c) => ({
        scale: cabs((c.k as PowerInfo).S) * 2,
        items: [
          { term: 'R', label: 'p_P', value: c.at('pP') },
          { term: 'L', label: 'p_Q', value: c.at('pQ') },
        ],
      }),
      note: (c) =>
        c.tr({
          fr: 'La partie active ne change jamais de signe et vaut $P$ en moyenne. La partie réactive oscille autour de zéro : en moyenne, elle ne transporte **aucune** énergie.',
          en: 'The active part never changes sign and averages to $P$. The reactive part swings around zero: on average it carries **no** energy at all.',
        }),
      derive: () => [
        'v = \\sqrt2 V\\cos\\omega t,\\quad i = \\sqrt2 I\\cos(\\omega t - \\varphi)',
        'p = v\\,i = 2VI\\cos\\omega t\\cos(\\omega t-\\varphi) = VI\\big[\\cos\\varphi + \\cos(2\\omega t - \\varphi)\\big]',
        '= \\underbrace{VI\\cos\\varphi}_{P}(1+\\cos2\\omega t) + \\underbrace{VI\\sin\\varphi}_{Q}\\sin2\\omega t',
      ],
    },
    {
      id: 'correction',
      title: { fr: 'Compensation', en: 'Correction' },
      tex: (c) => {
        const k = c.k as PowerInfo;
        return `\\begin{aligned}
          ${c.term('C', 'Q_C')} &= \\omega ${c.term('C', 'C')} V^2 = ${c.term('C', c.q(k.QC, 'var'))} \\\\
          C_{0{,}95} &= \\frac{P\\,(\\tan\\varphi_M - \\tan\\varphi_{0{,}95})}{\\omega V^2} = ${c.q(k.C95, 'F')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le condensateur fournit sur place l’énergie réactive que le moteur demande : elle ne circule plus dans le câble.',
          en: 'The capacitor supplies the motor’s reactive power on the spot, so it no longer travels through the cable.',
        }),
    },
    {
      id: 'losses',
      title: { fr: 'Pourquoi le distributeur s’en soucie', en: 'Why the utility cares' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as PowerInfo;
        return `\\begin{aligned}
          P_{\\text{${c.tr({ fr: 'pertes', en: 'loss' })}}} &= R_{\\ell}\\,I^2 = R_{\\ell}\\left(\\frac{P}{V\\cos\\varphi}\\right)^2 = ${c.q(k.loss, 'W')} \\quad (R_\\ell = ${c.q(R_LINE, 'Ω')}) \\\\
          \\tan\\varphi &= \\frac{Q}{P} = ${c.q(k.Q / k.P, '', 3)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'À puissance active égale, les pertes varient en $1/\\cos^2\\varphi$. Beaucoup de gestionnaires de réseau facturent l’énergie réactive au-delà d’un seuil ; en France, c’est $\\tan\\varphi > 0{,}4$ pour les clients raccordés en HTA.',
          en: 'For the same active power, losses scale as $1/\\cos^2\\varphi$. Many network operators bill reactive energy beyond a threshold; in France it is $\\tan\\varphi > 0.4$ for medium-voltage customers.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance d’un moteur', en: 'Predict a motor’s power' },
      body: {
        fr: `Un moteur de $10$ kW avec $\\cos\\varphi = 0{,}7$ est alimenté en $230$ V.

En 1.3, la puissance d’un radiateur était toujours positive. **Dessinez $p(t)$ pour ce moteur**, puis révélez.`,
        en: `A $10$ kW motor with $\\cos\\varphi = 0.7$ is supplied at $230$ V.

In 1.3, a heater’s power was always positive. **Sketch $p(t)$ for this motor**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'parts',
      title: { fr: 'Deux parties', en: 'Two parts' },
      body: {
        fr: `Affichez $p_P$ et $p_Q$ sur l’oscilloscope, puis lancez la lecture ▶.

$p(t)$ est la somme d’une partie **active**, toujours positive et de moyenne $P$, et d’une partie **réactive** qui va et vient sans rien transporter en moyenne. $Q$ est l’**amplitude** de ce va-et-vient.`,
        en: `Turn on $p_P$ and $p_Q$ on the oscilloscope, then press play ▶.

$p(t)$ is the sum of an **active** part, always positive with average $P$, and a **reactive** part that sloshes back and forth carrying nothing on average. $Q$ is the **amplitude** of that sloshing.`,
      },
      check: (lab) => !!lab.visible.pQ && lab.maxFrac > 0.9,
    },
    {
      id: 'correct',
      title: { fr: 'Relever le facteur de puissance', en: 'Raise the power factor' },
      body: {
        fr: `Ajoutez des condensateurs jusqu’à ce que la source voie $\\cos\\varphi \\geq 0{,}95$ (toujours inductif).

Regardez le triangle : le $-Q_C$ du condensateur annule une partie du $Q$ du moteur, et $S$ rétrécit. Le moteur, lui, consomme exactement la même chose.`,
        en: `Add capacitance until the supply sees $\\cos\\varphi \\geq 0.95$ (still lagging).

Watch the triangle: the capacitor’s $-Q_C$ cancels part of the motor’s $Q$, and $S$ shrinks. The motor itself draws exactly the same as before.`,
      },
      hint: { fr: 'Environ $420$ µF ici : la formule $C_{0,95}$ est dans les équations.', en: 'About $420$ µF here: the $C_{0.95}$ formula is in the equations.' },
      check: (lab) => {
        const k = lab.info as PowerInfo;
        return k.pf >= 0.95 && k.phi >= 0;
      },
    },
    {
      id: 'losses',
      title: { fr: 'Moins de pertes', en: 'Fewer losses' },
      body: {
        fr: `Visez $\\cos\\varphi > 0{,}99$ et comparez le courant de ligne et les pertes du câble au cas de départ.

Avec $\\cos\\varphi = 0{,}7$, le câble chauffait **deux fois plus** pour le même travail utile.`,
        en: `Aim for $\\cos\\varphi > 0.99$ and compare the line current and cable losses with where you started.

At $\\cos\\varphi = 0.7$ the cable was heating **twice as much** for the same useful work.`,
      },
      check: (lab) => (lab.info as PowerInfo).pf > 0.99,
    },
    {
      id: 'over',
      title: { fr: 'Trop compenser', en: 'Overcompensating' },
      body: {
        fr: `Continuez d’ajouter des condensateurs jusqu’à repasser sous $\\cos\\varphi = 0{,}95$, mais **capacitif** cette fois.

Le courant remonte, et le réseau voit maintenant une source d’énergie réactive, ce qui fait monter la tension. C’est pourquoi les batteries de condensateurs industrielles sont fractionnées en gradins et pilotées par un régulateur varmétrique.`,
        en: `Keep adding capacitance until you drop below $\\cos\\varphi = 0.95$ again, but **leading** this time.

The current rises again, and the grid now sees a source of reactive power, which pushes the voltage up. That is why industrial capacitor banks are split into steps driven by a reactive-power controller.`,
      },
      check: (lab) => {
        const k = lab.info as PowerInfo;
        return k.phi < 0 && k.pf < 0.95;
      },
    },
  ],
};
