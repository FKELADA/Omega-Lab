// Module 4.6 — Shunt and series compensation, nose curves, voltage collapse.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { compInfo, compensation, noseCurve, type CompInfo } from '../../lib/models/module4';
import CompCanvas from './CompCanvas.svelte';

export const compLesson: Experiment = {
  id: 'comp',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.6 Compensation', en: '4.6 Compensation' },
  ],
  title: { fr: 'Compenser une ligne : condensateurs, inductances et courbe du nez', en: 'Compensating a line: capacitors, reactors and the nose curve' },
  model: compensation,
  info: compInfo,
  canvas: CompCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'P', symbol: 'P', name: { fr: 'Charge', en: 'Load' }, unit: 'pu', min: 0, max: 2.2, default: 0.6, scale: 'lin', term: 'R' },
    { id: 'pf', symbol: '\\cos\\varphi', name: { fr: 'Facteur de puissance', en: 'Power factor' }, unit: '', min: 0.8, max: 1, default: 0.95, scale: 'lin' },
    { id: 'B', symbol: 'B', name: { fr: 'Compensation shunt (+ condensateur, − inductance)', en: 'Shunt compensation (+ capacitor, − reactor)' }, unit: 'pu', min: -0.5, max: 1, default: 0, scale: 'lin', term: 'C' },
    { id: 'k', symbol: 'k', name: { fr: 'Compensation série', en: 'Series compensation' }, unit: '', min: 0, max: 0.7, default: 0, scale: 'lin', term: 'C' },
  ],

  signals: [
    { id: 'vs', symbol: 'v_s', name: { fr: 'Tension d’envoi', en: 'Sending voltage' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'vr', symbol: 'v_r', name: { fr: 'Tension de la charge', en: 'Load voltage' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
  ],

  charts: [
    {
      title: { fr: 'Courbe P–V (« courbe du nez »)', en: 'P–V curve (“nose curve”)' },
      x: { label: 'P', unit: 'pu', range: [0, 2.4] },
      y: { label: 'V', unit: 'pu', range: [0, 1.4] },
      bands: () => [{ y0: 0.95, y1: 1.05 }],
      series: (lab) => [
        { label: { fr: 'sans compensation', en: 'uncompensated' }, color: '--c-C', pts: noseCurve({ ...lab.params, B: 0, k: 0 }), dash: true, width: 1.5 },
        { label: { fr: 'réglage actuel', en: 'present setting' }, color: '--c-p', pts: noseCurve(lab.params) },
      ],
      points: (lab) => {
        const k = lab.info as CompInfo;
        return [
          ...(k.V !== null ? [{ x: lab.params.P, y: k.V, color: '--accent' }] : []),
          { x: k.Pmax, y: k.Vcrit, color: '--warn', hollow: true, label: 'P_max' },
        ];
      },
      vlines: (lab) => [{ x: lab.params.P }],
      note: () => ({ fr: 'Seule la branche haute est exploitable. Au bout du nez, la tension s’effondre.', en: 'Only the upper branch is usable. At the tip of the nose, voltage collapses.' }),
    },
    {
      title: { fr: 'Transfert maximal et compensation série', en: 'Maximum transfer and series compensation' },
      x: { label: 'k', unit: '', range: [0, 0.7] },
      y: { label: 'P_max', unit: 'pu', range: [0, 5] },
      series: (lab) => {
        const pts: [number, number][] = [];
        for (let k = 0; k <= 0.7; k += 0.02) pts.push([k, compInfo({ ...lab.params, k }).Pmax]);
        return [{ color: '--c-p', pts }];
      },
      points: (lab) => [{ x: lab.params.k, y: (lab.info as CompInfo).Pmax, color: '--accent' }],
      note: () => ({ fr: 'Le condensateur série « raccourcit » électriquement la ligne : P_max ∝ 1/X(1 − k).', en: 'The series capacitor electrically “shortens” the line: P_max ∝ 1/X(1 − k).' }),
    },
  ],

  equations: [
    {
      id: 'drop',
      title: { fr: 'Chute de tension', en: 'Voltage drop' },
      tex: (c) => {
        const k = c.k as CompInfo;
        return `\\Delta V \\approx \\frac{RP + XQ}{V}, \\qquad V_r = ${k.V === null ? '\\text{—}' : c.q(k.V, '', 3)}\\ \\text{pu}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Sur une ligne, $X \\gg R$ : la tension dépend surtout de la puissance réactive transportée. On agit donc sur $Q$ (shunt) ou sur $X$ (série).',
          en: 'On a line $X \\gg R$: voltage depends mainly on the reactive power carried. So we act on $Q$ (shunt) or on $X$ (series).',
        }),
    },
    {
      id: 'shunt',
      title: { fr: 'Compensation shunt', en: 'Shunt compensation' },
      tex: (c) => `Q_C = B\\,V^2 = ${c.q((c.k as CompInfo).Qc, '', 3)}\\ \\text{pu}`,
      note: (c) =>
        c.tr({
          fr: 'Un condensateur fournit du réactif sur place, mais en proportion de $V^2$ : quand la tension chute, il aide moins, justement quand on en a besoin. Une inductance shunt absorbe le réactif en excès à faible charge.',
          en: 'A capacitor supplies reactive power locally, but in proportion to $V^2$: when voltage falls, it helps less, precisely when needed. A shunt reactor absorbs excess reactive power at light load.',
        }),
    },
    {
      id: 'series',
      title: { fr: 'Compensation série', en: 'Series compensation' },
      tex: (c) => {
        const k = c.k as CompInfo;
        return `X_{eff} = X(1 - k), \\qquad P_{max} = ${c.q(k.Pmax, '', 3)}\\ \\text{pu}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un condensateur en série annule une partie de la réactance de la ligne : on peut transporter plus, et plus loin.',
          en: 'A series capacitor cancels part of the line reactance: more power can be carried, over longer distances.',
        }),
    },
    {
      id: 'ssr',
      title: { fr: 'Le revers : la résonance hyposynchrone', en: 'The downside: subsynchronous resonance' },
      personas: ['research', 'utility'],
      tex: (c) => `f_{er} = f_0\\sqrt{k} = ${c.q(50 * Math.sqrt(c.p.k), 'Hz', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Ligne et condensateur série forment un circuit RLC (leçon 1.4) qui résonne sous 50 Hz. Si cette fréquence rencontre un mode de torsion de l’arbre d’un turbo-alternateur, il peut se rompre (Mohave, 1970-71). Les onduleurs peuvent aussi interagir avec elle (SSCI, module 8).',
          en: 'Line and series capacitor form an RLC circuit (lesson 1.4) resonating below 50 Hz. If that frequency meets a torsional mode of a turbine-generator shaft, the shaft can break (Mohave, 1970–71). Inverters can interact with it too (SSCI, Module 8).',
        }),
    },
  ],

  steps: [
    {
      id: 'heavy',
      title: { fr: 'Une forte charge', en: 'A heavy load' },
      body: {
        fr: `Sans compensation, augmentez la charge jusqu’à ce que la tension passe sous **0,9 pu**. Le point descend sur la branche haute de la courbe P–V et se rapproche du nez.`,
        en: `With no compensation, raise the load until the voltage drops below **0.9 pu**. The point slides down the upper branch of the P–V curve, towards the nose.`,
      },
      check: (lab) => {
        const k = lab.info as CompInfo;
        return k.V !== null && k.V < 0.9 && lab.params.B === 0 && lab.params.k === 0;
      },
    },
    {
      id: 'capacitor',
      title: { fr: 'Un condensateur shunt', en: 'A shunt capacitor' },
      body: {
        fr: `Gardez la charge et ajoutez un **condensateur shunt** pour remonter la tension au-dessus de **0,98 pu**. Toute la courbe P–V monte.`,
        en: `Keep the load and add a **shunt capacitor** to bring the voltage back above **0.98 pu**. The whole P–V curve moves up.`,
      },
      check: (lab) => {
        const k = lab.info as CompInfo;
        return lab.params.B > 0 && k.V !== null && k.V >= 0.98 && lab.params.P >= 0.8;
      },
    },
    {
      id: 'light',
      title: { fr: 'La nuit, à faible charge', en: 'At night, at light load' },
      body: {
        fr: `Baissez la charge sous **0,2 pu** en gardant un gros condensateur ($B \\geq 0{,}5$) : la tension dépasse **1,1 pu**. Les gestionnaires déconnectent les condensateurs, voire mettent des inductances, la nuit.`,
        en: `Lower the load below **0.2 pu** while keeping a large capacitor ($B \\geq 0.5$): the voltage exceeds **1.1 pu**. Operators switch capacitors out, or even switch reactors in, at night.`,
      },
      check: (lab) => {
        const k = lab.info as CompInfo;
        return lab.params.P <= 0.2 && lab.params.B >= 0.5 && k.V !== null && k.V > 1.1;
      },
    },
    {
      id: 'series',
      title: { fr: 'Un condensateur série', en: 'A series capacitor' },
      body: {
        fr: `Ajoutez au moins **40 %** de compensation série. Le transfert maximal augmente fortement : c’est ainsi qu’on fait passer plus de puissance sur les très longues lignes.`,
        en: `Add at least **40 %** series compensation. Maximum transfer rises sharply: this is how more power is pushed through very long lines.`,
      },
      check: (lab) => lab.params.k >= 0.4,
    },
    {
      id: 'collapse',
      title: { fr: 'L’effondrement', en: 'Collapse' },
      body: {
        fr: `Augmentez la charge au-delà de $P_{max}$ : il n’y a plus de solution, la tension **s’effondre**. C’est la stabilité de tension du module 8.`,
        en: `Raise the load beyond $P_{max}$: there is no solution any more, the voltage **collapses**. This is the voltage stability of Module 8.`,
      },
      check: (lab) => (lab.info as CompInfo).V === null,
    },
  ],
};
