// Module 1.1 — R, L and C as energy elements.

import type { Experiment } from '../../lib/lab/types';
import { DRIVES, ELEMENTS, drive, element, elementInfo } from '../../lib/models/module1b';
import EnergyMeter from './EnergyMeter.svelte';
import ElementCanvas from './ElementCanvas.svelte';

const LAW: Record<number, { law: string; energy: string }> = {
  [ELEMENTS.R]: { law: 'v = R\\,i', energy: 'w_R = \\int_0^t R\\,i^2\\,d\\tau' },
  [ELEMENTS.L]: { law: 'v = L\\,\\frac{di}{dt}', energy: 'w_L = \\tfrac12 L\\,i^2' },
  [ELEMENTS.C]: { law: 'i = C\\,\\frac{dv}{dt}', energy: 'w_C = \\tfrac12 C\\,v^2' },
};

export const energyLesson: Experiment = {
  id: 'energy',
  path: [
    { fr: 'Module 1 · Circuits', en: 'Module 1 · Circuits' },
    { fr: '1.1 R, L, C', en: '1.1 R, L, C' },
  ],
  title: { fr: 'R, L et C : dissiper ou stocker l’énergie', en: 'R, L and C: burning or storing energy' },
  model: element,
  info: elementInfo,
  canvas: ElementCanvas,
  instruments: [EnergyMeter],

  params: [
    {
      id: 'el',
      symbol: 'X',
      name: { fr: 'Élément', en: 'Element' },
      unit: '',
      min: 0,
      max: 2,
      default: ELEMENTS.L,
      scale: 'lin',
      choices: [
        { value: ELEMENTS.R, label: { fr: 'Résistance', en: 'Resistor' } },
        { value: ELEMENTS.L, label: { fr: 'Bobine', en: 'Inductor' } },
        { value: ELEMENTS.C, label: { fr: 'Condensateur', en: 'Capacitor' } },
      ],
    },
    {
      id: 'wave',
      symbol: 'x(t)',
      name: { fr: 'Forme de la source', en: 'Source waveform' },
      unit: '',
      min: 0,
      max: 2,
      default: DRIVES.triangle,
      scale: 'lin',
      choices: [
        { value: DRIVES.triangle, label: { fr: 'Triangle', en: 'Triangle' } },
        { value: DRIVES.sine, label: { fr: 'Sinus', en: 'Sine' } },
        { value: DRIVES.trapezoid, label: { fr: 'Trapèze', en: 'Trapezoid' } },
      ],
    },
    { id: 'A', symbol: 'A', name: { fr: 'Amplitude de la source (A pour R et L, V pour C)', en: 'Source amplitude (A for R and L, V for C)' }, unit: '', min: 0.5, max: 10, default: 2, scale: 'lin', term: 'S' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', min: 1, max: 200, default: 50, scale: 'log' },
    { id: 'rise', symbol: 't_r', name: { fr: 'Durée des fronts (trapèze)', en: 'Edge time (trapezoid)' }, unit: 's', min: 5e-5, max: 2e-2, default: 2e-3, scale: 'log' },
    { id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', min: 1, max: 100, default: 10, scale: 'log', term: 'R' },
    { id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'H', min: 1e-3, max: 1, default: 0.1, scale: 'log', term: 'L' },
    { id: 'C', symbol: 'C', name: { fr: 'Capacité', en: 'Capacitance' }, unit: 'F', min: 1e-5, max: 1e-2, default: 1e-4, scale: 'log', term: 'C' },
  ],

  signals: [
    { id: 'i', symbol: 'i', name: { fr: 'Courant', en: 'Current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'v', symbol: 'v', name: { fr: 'Tension', en: 'Voltage' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'p', symbol: 'p', name: { fr: 'Puissance', en: 'Power' }, unit: 'W', color: '--c-p', on: false, term: 'p' },
    { id: 'w', symbol: 'w', name: { fr: 'Énergie', en: 'Energy' }, unit: 'J', color: '--c-C', on: false, term: 'C' },
  ],

  predict: {
    signal: 'v',
    yRange: (p) => {
      const b = 1.4 * 4 * p.L * p.A * p.f;
      return [-b, b];
    },
    diagnose(pred, _run, p) {
      // Correlate the sketch with the current's own shape: a sketch that copies i(t) missed the derivative.
      const xs = pred.map(([t]) => drive(p.wave, p.A, p.f, p.rise, t)[0]);
      const ys = pred.map(([, y]) => y);
      const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
      const mx = mean(xs), my = mean(ys);
      let sxy = 0, sxx = 0, syy = 0;
      xs.forEach((x, j) => {
        sxy += (x - mx) * (ys[j] - my);
        sxx += (x - mx) ** 2;
        syy += (ys[j] - my) ** 2;
      });
      const r = sxy / Math.sqrt(sxx * syy || 1e-30);
      if (r > 0.7)
        return {
          fr: 'La tension d’une bobine ne copie pas le courant : elle est proportionnelle à sa **pente**, $v = L\\,di/dt$. La pente d’un triangle est constante par morceaux, donc la tension est **carrée**.',
          en: 'An inductor’s voltage does not copy the current: it follows its **slope**, $v = L\\,di/dt$. A triangle has piecewise-constant slope, so the voltage is a **square wave**.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'law',
      title: { fr: 'Loi de l’élément', en: 'Element law' },
      tex: (c) => {
        const el = c.p.el as number;
        const t = el === ELEMENTS.R ? 'R' : el === ELEMENTS.L ? 'L' : 'C';
        return `\\begin{aligned}
          ${c.term(t, LAW[el].law)} \\\\
          ${c.term('S', `v = ${c.q(c.at('v'), 'V')}`)}, \\quad ${c.term('i', `i = ${c.q(c.at('i'), 'A')}`)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr(
          c.p.el === ELEMENTS.L
            ? { fr: 'La tension suit la **variation** du courant. Un courant qui ne change pas ne demande aucune tension ; un courant qui change brutalement en demande une énorme.', en: 'The voltage follows the **change** of current. A steady current needs no voltage; a sudden change needs a huge one.' }
            : c.p.el === ELEMENTS.C
              ? { fr: 'Le courant suit la **variation** de la tension : c’est le dual exact de la bobine, en échangeant $v$ et $i$, $L$ et $C$.', en: 'The current follows the **change** of voltage: the exact dual of the inductor, swapping $v$ and $i$, $L$ and $C$.' }
              : { fr: 'Tension et courant sont proportionnels, à chaque instant : pas de mémoire, pas de stockage.', en: 'Voltage and current are proportional at every instant: no memory, no storage.' },
        ),
    },
    {
      id: 'energy',
      title: { fr: 'Puissance et énergie', en: 'Power and energy' },
      tex: (c) => `\\begin{aligned}
        ${c.term('p', 'p')} &= v\\,i = ${c.term('p', c.q(c.at('p'), 'W'))} \\\\
        ${c.term('C', LAW[c.p.el as number].energy)} &= ${c.term('C', c.q(c.at('w'), 'J'))}
      \\end{aligned}`,
      note: (c) =>
        c.tr(
          c.p.el === ELEMENTS.R
            ? { fr: '$p = Ri^2 \\geq 0$ : l’énergie est toujours **dissipée** en chaleur.', en: '$p = Ri^2 \\geq 0$: energy is always **dissipated** as heat.' }
            : { fr: '$p$ change de signe : l’énergie entre, est **stockée** (champ magnétique ou électrique), puis **revient** à la source.', en: '$p$ changes sign: energy flows in, is **stored** (magnetic or electric field), then **flows back** to the source.' },
        ),
    },
    {
      id: 'duality',
      title: { fr: 'Dualité', en: 'Duality' },
      personas: ['research'],
      tex: (c) => `\\begin{array}{ccc}
        v & \\leftrightarrow & i \\\\
        L & \\leftrightarrow & C \\\\
        \\text{${c.tr({ fr: 'série', en: 'series' })}} & \\leftrightarrow & \\text{${c.tr({ fr: 'parallèle', en: 'parallel' })}} \\\\
        \\tfrac12 L i^2 & \\leftrightarrow & \\tfrac12 C v^2
      \\end{array}`,
      note: (c) =>
        c.tr({
          fr: 'Toute relation sur la bobine donne une relation sur le condensateur en échangeant ces grandeurs. Utile pour vérifier un calcul, et pour comprendre pourquoi un courant d’inductance et une tension de condensateur sont les **variables d’état** des circuits (leçon 1.2).',
          en: 'Any statement about the inductor gives one about the capacitor by swapping these quantities. Handy for checking a calculation, and for seeing why inductor current and capacitor voltage are the **state variables** of circuits (lesson 1.2).',
        }),
    },
    {
      id: 'surge',
      title: { fr: 'Couper un courant inductif', en: 'Interrupting an inductive current' },
      personas: ['utility', 'research'],
      tex: (c) => `v_{max} = L\\,\\frac{\\Delta i}{t_r} = ${c.q(c.p.L, 'H')} \\times \\frac{${c.q(c.p.A, '', 3)}\\ \\mathrm{A}}{${c.q(c.p.rise, 's')}} = ${c.q((c.p.L * c.p.A) / Math.min(c.p.rise, 1 / (8 * c.p.f)), 'V')}`,
      note: (c) =>
        c.tr({
          fr: 'Couper vite un courant dans une inductance crée une surtension : c’est l’origine des arcs dans les disjoncteurs, des diodes de roue libre sur les bobines de relais, et des parafoudres sur les réseaux.',
          en: 'Cutting a current in an inductance quickly creates an overvoltage: this is why breakers draw arcs, why relay coils have freewheeling diodes, and why grids have surge arresters.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension d’une bobine', en: 'Predict an inductor’s voltage' },
      body: {
        fr: `Une source impose un courant **triangulaire** dans une bobine de 0,1 H. **Dessinez la tension $v(t)$** aux bornes de la bobine, puis révélez.`,
        en: `A source forces a **triangular** current through a 0.1 H inductor. **Sketch the voltage $v(t)$** across the inductor, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'store',
      title: { fr: 'Stocker et rendre', en: 'Store and give back' },
      body: {
        fr: `Passez la source en **sinus** et lancez la lecture ▶. Le réservoir se remplit puis se vide deux fois par période, et la flèche de puissance change de sens. Le compteur d’énergie montre qu’à la fin, tout ce qui est entré est ressorti.`,
        en: `Switch the source to a **sine** and press play ▶. The tank fills and empties twice per period, and the power arrow reverses. The energy meter shows that by the end, everything that went in has come back out.`,
      },
      check: (lab) => lab.params.el === ELEMENTS.L && lab.params.wave === DRIVES.sine && lab.maxFrac > 0.9,
    },
    {
      id: 'capacitor',
      title: { fr: 'Le condensateur, en miroir', en: 'The capacitor, mirrored' },
      body: {
        fr: `Choisissez le **condensateur** avec une tension **triangulaire**. C’est maintenant le **courant** qui est carré : $i = C\\,dv/dt$. Même comportement que la bobine, en échangeant $v$ et $i$.`,
        en: `Choose the **capacitor** with a **triangular** voltage. Now the **current** is the square wave: $i = C\\,dv/dt$. Same behaviour as the inductor, with $v$ and $i$ swapped.`,
      },
      check: (lab) => lab.params.el === ELEMENTS.C && lab.params.wave === DRIVES.triangle,
    },
    {
      id: 'resistor',
      title: { fr: 'La résistance ne rend rien', en: 'The resistor gives nothing back' },
      body: {
        fr: `Choisissez la **résistance** : la puissance ne devient jamais négative, la flèche ne s’inverse jamais, et le réservoir « chaleur » ne fait que monter.`,
        en: `Choose the **resistor**: power never goes negative, the arrow never reverses, and the “heat” tank only ever rises.`,
      },
      check: (lab) => lab.params.el === ELEMENTS.R,
    },
    {
      id: 'edge',
      title: { fr: 'Couper brutalement', en: 'Cutting abruptly' },
      body: {
        fr: `Revenez à la **bobine**, choisissez le **trapèze** et réduisez la durée des fronts à **0,2 ms** ou moins. Changer le courant très vite crée une tension énorme : le courant dans une bobine refuse de changer brusquement.`,
        en: `Go back to the **inductor**, choose the **trapezoid** and shorten the edges to **0.2 ms** or less. Changing the current very fast creates a huge voltage: current through an inductor refuses to change abruptly.`,
      },
      check: (lab) => lab.params.el === ELEMENTS.L && lab.params.wave === DRIVES.trapezoid && lab.params.rise <= 2.05e-4,
    },
  ],
};

