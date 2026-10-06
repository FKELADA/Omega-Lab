// Module 4.4 — The synchronous machine: short circuit, excitation, capability.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import { cabs, cx } from '../../lib/core/linalg';
import type { Experiment } from '../../lib/lab/types';
import { SM, smInfo, syncMachine, vCurve, type SmInfo } from '../../lib/models/module4';
import SmCanvas from './SmCanvas.svelte';

const MODE = { steady: 0, sc: 1 };

export const smLesson: Experiment = {
  id: 'sm',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.4 Machine synchrone : court-circuit et capabilité', en: '4.4 Synchronous machine: short circuit and capability' },
  ],
  title: { fr: 'L’alternateur : court-circuit, excitation, diagramme de capacité', en: 'The generator: short circuit, excitation, capability' },
  model: syncMachine,
  info: smInfo,
  canvas: SmCanvas,
  instruments: [PhasorDiagram, Chart0, Chart1],

  params: [
    {
      id: 'mode',
      symbol: 'M',
      name: { fr: 'Essai', en: 'Test' },
      unit: '',
      min: 0,
      max: 1,
      default: MODE.sc,
      scale: 'lin',
      choices: [
        { value: MODE.sc, label: { fr: 'Court-circuit', en: 'Short circuit' } },
        { value: MODE.steady, label: { fr: 'Régime établi', en: 'Steady state' } },
      ],
    },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'pu', min: 0, max: 1, default: 0.8, scale: 'lin', term: 'R' },
    { id: 'E', symbol: 'E', name: { fr: 'Excitation (f.é.m. interne)', en: 'Excitation (internal EMF)' }, unit: 'pu', min: 0.3, max: 2.8, default: 1.8, scale: 'lin', term: 'L' },
    { id: 'Xd', symbol: 'X_d', name: { fr: 'Réactance synchrone', en: 'Synchronous reactance' }, unit: 'pu', min: 0.8, max: 2.2, default: 1.8, scale: 'lin', term: 'L' },
    { id: 'Xd1', symbol: "X'_d", name: { fr: 'Réactance transitoire', en: 'Transient reactance' }, unit: 'pu', min: 0.2, max: 0.5, default: 0.3, scale: 'lin' },
    { id: 'Xd2', symbol: "X''_d", name: { fr: 'Réactance subtransitoire', en: 'Subtransient reactance' }, unit: 'pu', min: 0.1, max: 0.35, default: 0.2, scale: 'lin' },
    { id: 'theta', symbol: '\\theta', name: { fr: 'Instant du défaut', en: 'Fault instant' }, unit: '°', min: 0, max: 90, default: 0, scale: 'lin', term: 'S' },
  ],

  signals: [
    { id: 'i', symbol: 'i_a', name: { fr: 'Courant phase a', en: 'Phase a current' }, unit: 'pu', color: '--c-i', on: true, term: 'i' },
    { id: 'env', symbol: 'i_{env}', name: { fr: 'Enveloppe alternative', en: 'AC envelope' }, unit: 'pu', color: '--c-L', on: true, dash: true },
    { id: 'envN', symbol: '-i_{env}', name: { fr: 'Enveloppe (bas)', en: 'Envelope (lower)' }, unit: 'pu', color: '--c-L', on: true, dash: true },
    { id: 'dc', symbol: 'i_{DC}', name: { fr: 'Composante continue', en: 'DC component' }, unit: 'pu', color: '--c-R', on: true, dash: true, term: 'R' },
    { id: 'v', symbol: 'v', name: { fr: 'Tension réseau', en: 'Grid voltage' }, unit: 'pu', color: '--c-S', on: false, term: 'S' },
    { id: 'e', symbol: 'e', name: { fr: 'F.é.m. interne', en: 'Internal EMF' }, unit: 'pu', color: '--c-a', on: false },
  ],

  phasors: {
    omega: () => 2 * Math.PI * 50,
    unit: 'pu',
    rms: true,
    items: (p, k: SmInfo) => [
      { id: 'V', label: 'V', term: 'S', color: '--c-S', value: cx(SM.V) },
      { id: 'jXI', label: 'jX_dI', term: 'L', color: '--c-L', value: { re: k.E.re - SM.V, im: k.E.im }, after: 'V' },
      { id: 'E', label: 'E', term: 'R', color: '--c-a', value: k.E, thin: true },
      { id: 'I', label: 'I', term: 'i', color: '--c-i', value: k.I, drawScale: 1 },
    ],
  },

  charts: [
    {
      title: { fr: 'Diagramme de capacité', en: 'Capability chart' },
      x: { label: 'Q', unit: 'pu', range: [-1, 1] },
      y: { label: 'P', unit: 'pu', range: [0, 1.1] },
      series: (lab) => {
        const Xd = lab.params.Xd;
        const stator: [number, number][] = [], field: [number, number][] = [], stab: [number, number][] = [];
        for (let a = 0; a <= 180; a += 2) stator.push([Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]);
        for (let P = 0; P <= 1.1; P += 0.01) {
          const r = SM.Emax / Xd;
          if (r > P) field.push([-1 / Xd + Math.sqrt(r * r - P * P), P]);
        }
        const d = (SM.deltaMax * Math.PI) / 180;
        for (let E = 0; E <= 3; E += 0.02) stab.push([(E * Math.cos(d) - 1) / Xd, (E * Math.sin(d)) / Xd]);
        return [
          { label: { fr: 'courant statorique', en: 'stator current' }, color: '--c-i', pts: stator },
          { label: { fr: 'courant d’excitation', en: 'field current' }, color: '--c-L', pts: field },
          { label: { fr: 'turbine', en: 'turbine' }, color: '--c-R', pts: [[-1, SM.Pturb], [1, SM.Pturb]], dash: true },
          { label: { fr: 'stabilité (δ = 70°)', en: 'stability (δ = 70°)' }, color: '--warn', pts: stab, dash: true },
        ];
      },
      points: (lab) => {
        const k = lab.info as SmInfo;
        return lab.params.mode === MODE.steady && k.stable ? [{ x: k.Q, y: k.P, color: '--accent', label: '●' }] : [];
      },
    },
    {
      title: { fr: 'Courbes en V', en: 'V-curves' },
      x: { label: 'E', unit: 'pu', range: [0.3, 3] },
      y: { label: '|I|', unit: 'pu', range: [0, 2] },
      series: (lab) => [
        { label: { fr: 'P = 0', en: 'P = 0' }, color: '--c-C', pts: vCurve(0, lab.params.Xd), dash: true, width: 1.5 },
        { label: { fr: 'P actuel', en: 'present P' }, color: '--c-p', pts: vCurve(lab.params.P, lab.params.Xd) },
      ],
      points: (lab) => {
        const k = lab.info as SmInfo;
        return lab.params.mode === MODE.steady && k.stable ? [{ x: lab.params.E, y: cabs(k.I), color: '--accent' }] : [];
      },
      note: () => ({ fr: 'Le creux de chaque courbe correspond à un facteur de puissance unitaire.', en: 'The bottom of each curve is unity power factor.' }),
    },
  ],

  predict: {
    signal: 'i',
    yRange: (p) => {
      const b = (2.2 * Math.SQRT2) / p.Xd2;
      return [-b, b];
    },
    diagnose(pred) {
      const early = pred.filter(([t]) => t < 0.15).map(([, y]) => Math.abs(y));
      const late = pred.filter(([t]) => t > 2).map(([, y]) => Math.abs(y));
      if (early.length && late.length && Math.max(...early) < 1.5 * Math.max(...late))
        return {
          fr: 'Le courant de court-circuit **décroît** : d’abord limité par la réactance subtransitoire $X\'\'_d$ (très faible, courant énorme), puis par $X\'_d$, enfin par $X_d$. Il s’y ajoute une composante continue qui s’amortit.',
          en: 'Short-circuit current **decays**: first limited by the subtransient reactance $X\'\'_d$ (very small, huge current), then by $X\'_d$, finally by $X_d$. A decaying DC component comes on top.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'sc',
      title: { fr: 'Courant de court-circuit', en: 'Short-circuit current' },
      tex: () => `\\begin{aligned} i_a(t) = \\sqrt2 E\\Big[&\\left(\\tfrac{1}{X''_d} - \\tfrac{1}{X'_d}\\right)e^{-t/T''_d} + \\left(\\tfrac{1}{X'_d} - \\tfrac{1}{X_d}\\right)e^{-t/T'_d} \\\\ &+ \\tfrac{1}{X_d}\\Big]\\cos(\\omega t + \\theta) - \\frac{\\sqrt2 E}{X''_d}\\cos\\theta\\,e^{-t/T_a} \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: `Trois périodes : subtransitoire (quelques cycles, $T''_d = ${SM.Td2 * 1000}$ ms), transitoire ($T'_d = ${String(SM.Td1).replace('.', '{,}')}$ s), puis permanente. Le terme continu dépend de l’instant du défaut.`,
          en: `Three periods: subtransient (a few cycles, $T''_d = ${SM.Td2 * 1000}$ ms), transient ($T'_d = ${SM.Td1}$ s), then steady state. The DC term depends on the fault instant.`,
        }),
    },
    {
      id: 'phasor',
      title: { fr: 'Le diagramme de phaseurs', en: 'The phasor diagram' },
      tex: (c) => {
        const k = c.k as SmInfo;
        return `\\underline E = \\underline V + jX_d\\,\\underline I \\qquad |\\underline E| = ${c.q(c.p.E, '', 3)},\\ \\delta = ${c.q(k.delta, '°', 3)},\\ |\\underline I| = ${c.q(cabs(k.I), '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Modèle à rotor lisse, en régime établi, raccordé à un réseau infini ($V = 1$ pu).',
          en: 'Round-rotor model, in steady state, connected to an infinite bus ($V = 1$ pu).',
        }),
    },
    {
      id: 'pq',
      title: { fr: 'Puissances', en: 'Powers' },
      tex: (c) => {
        const k = c.k as SmInfo;
        return `\\begin{aligned}
          ${c.term('R', 'P')} &= \\frac{EV}{X_d}\\sin\\delta = ${c.term('R', c.q(k.P, '', 3))} \\\\
          ${c.term('C', 'Q')} &= \\frac{EV\\cos\\delta - V^2}{X_d} = ${c.term('C', c.q(k.Q, '', 3))}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La turbine fixe $P$ ; l’excitation fixe $Q$. Surexcité ($E\\cos\\delta > V$), l’alternateur fournit du réactif et soutient la tension du réseau.',
          en: 'The turbine sets $P$; the excitation sets $Q$. Over-excited ($E\\cos\\delta > V$), the generator exports reactive power and supports grid voltage.',
        }),
    },
    {
      id: 'duty',
      title: { fr: 'Pouvoir de coupure', en: 'Breaker duty' },
      personas: ['utility', 'research'],
      tex: (c) => `i_{crête} \\approx \\frac{2\\sqrt2\\,E}{X''_d} = ${c.q((2 * Math.SQRT2) / c.p.Xd2, '', 3)}\\ \\text{pu}`,
      note: (c) =>
        c.tr({
          fr: 'C’est $X\'\'_d$ qui fixe le courant de crête que les disjoncteurs doivent supporter. Les onduleurs, eux, ne fournissent qu’environ 1,1 à 1,5 fois leur courant nominal : un réseau riche en renouvelables a moins de courant de court-circuit, ce qui change le réglage des protections (module 7).',
          en: '$X\'\'_d$ sets the peak current breakers must withstand. Inverters only supply about 1.1–1.5 times rated current: a high-renewable grid has less short-circuit current, which changes protection settings (Module 7).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le courant de court-circuit', en: 'Predict the short-circuit current' },
      body: {
        fr: `Un alternateur à vide ($E = 1$ pu) subit un court-circuit triphasé franc à ses bornes. **Dessinez le courant de la phase a** pendant 3 secondes, puis révélez.`,
        en: `A generator at no load ($E = 1$ pu) suffers a solid three-phase short circuit at its terminals. **Sketch the phase-a current** over 3 seconds, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'offset',
      title: { fr: 'La composante continue', en: 'The DC component' },
      body: {
        fr: `Déplacez l’instant du défaut à **90°**. La composante continue disparaît sur cette phase : elle dépend de la tension au moment du défaut, exactement comme le courant d’appel du transformateur (leçon 4.2).`,
        en: `Move the fault instant to **90°**. The DC component vanishes on this phase: it depends on the voltage at the fault instant, just like the transformer inrush (lesson 4.2).`,
      },
      check: (lab) => lab.params.mode === MODE.sc && lab.params.theta >= 85,
    },
    {
      id: 'over',
      title: { fr: 'Fournir du réactif', en: 'Exporting reactive power' },
      body: {
        fr: `Passez en **régime établi** et augmentez l’excitation jusqu’à fournir **Q ≥ 0,3 pu**. Le point se déplace vers la droite du diagramme de capacité.`,
        en: `Switch to **steady state** and raise the excitation until you export **Q ≥ 0.3 pu**. The point moves to the right of the capability chart.`,
      },
      check: (lab) => lab.params.mode === MODE.steady && (lab.info as SmInfo).Q >= 0.3,
    },
    {
      id: 'under',
      title: { fr: 'Absorber du réactif', en: 'Absorbing reactive power' },
      body: {
        fr: `Baissez l’excitation jusqu’à **absorber** du réactif ($Q \\le -0{,}2$ pu). L’angle $\\delta$ augmente : l’alternateur se rapproche de sa limite de stabilité.`,
        en: `Lower the excitation until you **absorb** reactive power ($Q \\le -0.2$ pu). The angle $\\delta$ grows: the generator moves towards its stability limit.`,
      },
      check: (lab) => lab.params.mode === MODE.steady && (lab.info as SmInfo).stable && (lab.info as SmInfo).Q <= -0.2,
    },
    {
      id: 'unity',
      title: { fr: 'Le courant minimal', en: 'The minimum current' },
      body: {
        fr: `Trouvez l’excitation qui donne le **plus petit courant** statorique pour la puissance actuelle : c’est le creux de la courbe en V, à facteur de puissance unitaire.`,
        en: `Find the excitation giving the **smallest stator current** at the present power: the bottom of the V-curve, at unity power factor.`,
      },
      check: (lab) => lab.params.mode === MODE.steady && Math.abs((lab.info as SmInfo).Q) < 0.03,
    },
    {
      id: 'limit',
      title: { fr: 'La limite de stabilité', en: 'The stability limit' },
      body: {
        fr: `Avec une excitation faible, augmentez $P$ jusqu’à ce que $\\delta$ atteigne **70°** ou plus. Au-delà de 90°, il n’y a plus d’équilibre : c’est la perte de synchronisme de la leçon 3.3.`,
        en: `With low excitation, raise $P$ until $\\delta$ reaches **70°** or more. Beyond 90° there is no equilibrium: the loss of synchronism of lesson 3.3.`,
      },
      check: (lab) => lab.params.mode === MODE.steady && (lab.info as SmInfo).delta >= 70,
    },
  ],
};
