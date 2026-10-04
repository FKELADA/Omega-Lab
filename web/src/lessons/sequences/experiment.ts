// Module 2.8 — Symmetrical components (Fortescue).

import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import { cabs, carg, type Complex } from '../../lib/core/linalg';
import type { EqContext, Experiment } from '../../lib/lab/types';
import { sequenceInfo, sequences, type SequenceInfo } from '../../lib/models/module2b';
import SequenceView from './SequenceView.svelte';

const pol = (c: EqContext, z: Complex) => `${c.q(cabs(z), '', 3)}\\angle ${c.q((carg(z) * 180) / Math.PI, '°', 3)}`;

export const sequencesLesson: Experiment = {
  id: 'sequences',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.8 Composantes symétriques', en: '2.8 Symmetrical components' },
  ],
  title: { fr: 'Trois systèmes équilibrés cachés dans un déséquilibre', en: 'Three balanced sets hidden in an unbalance' },
  model: sequences,
  info: sequenceInfo,
  canvas: PhasorDiagram,
  instruments: [SequenceView],

  params: [
    { id: 'Ma', symbol: '|V_a|', name: { fr: 'Module phase a', en: 'Phase a magnitude' }, unit: 'pu', min: 0, max: 1.5, default: 1, scale: 'lin', term: 'a' },
    { id: 'Mb', symbol: '|V_b|', name: { fr: 'Module phase b', en: 'Phase b magnitude' }, unit: 'pu', min: 0, max: 1.5, default: 1, scale: 'lin', term: 'b' },
    { id: 'Ab', symbol: '\\angle V_b', name: { fr: 'Angle phase b', en: 'Phase b angle' }, unit: '°', min: -180, max: 180, default: -120, scale: 'lin', term: 'b' },
    { id: 'Mc', symbol: '|V_c|', name: { fr: 'Module phase c', en: 'Phase c magnitude' }, unit: 'pu', min: 0, max: 1.5, default: 0.6, scale: 'lin', term: 'c' },
    { id: 'Ac', symbol: '\\angle V_c', name: { fr: 'Angle phase c', en: 'Phase c angle' }, unit: '°', min: -180, max: 180, default: 120, scale: 'lin', term: 'c' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', min: 1, max: 60, default: 50, scale: 'lin' },
  ],

  signals: [
    { id: 'va', symbol: 'v_a', name: { fr: 'Phase a', en: 'Phase a' }, unit: 'pu', color: '--c-a', on: true, term: 'a' },
    { id: 'vb', symbol: 'v_b', name: { fr: 'Phase b', en: 'Phase b' }, unit: 'pu', color: '--c-b', on: true, term: 'b' },
    { id: 'vc', symbol: 'v_c', name: { fr: 'Phase c', en: 'Phase c' }, unit: 'pu', color: '--c-c', on: true, term: 'c' },
    { id: 'v1', symbol: 'v_{a1}', name: { fr: 'Directe (phase a)', en: 'Positive (phase a)' }, unit: 'pu', color: '--c-v1', on: false, dash: true },
    { id: 'v2', symbol: 'v_{a2}', name: { fr: 'Inverse (phase a)', en: 'Negative (phase a)' }, unit: 'pu', color: '--c-v2', on: false, dash: true },
    { id: 'v0', symbol: 'v_0', name: { fr: 'Homopolaire', en: 'Zero' }, unit: 'pu', color: '--c-vs', on: false, dash: true },
  ],

  phasors: {
    omega: (p) => 2 * Math.PI * p.f,
    unit: 'pu',
    rms: true,
    items: (_p, k: SequenceInfo) => [
      { id: 'Va', label: 'V_a', term: 'a', color: '--c-a', value: k.Va },
      { id: 'Vb', label: 'V_b', term: 'b', color: '--c-b', value: k.Vb },
      { id: 'Vc', label: 'V_c', term: 'c', color: '--c-c', value: k.Vc },
    ],
  },

  equations: [
    {
      id: 'operator',
      title: { fr: 'L’opérateur a', en: 'The operator a' },
      tex: () => `a = e^{j120^\\circ} = -\\tfrac12 + j\\tfrac{\\sqrt3}{2}, \\qquad a^3 = 1, \\qquad 1 + a + a^2 = 0`,
      note: (c) =>
        c.tr({
          fr: 'Multiplier par $a$ fait tourner un phaseur de 120° (leçon 2.4).',
          en: 'Multiplying by $a$ turns a phasor by 120° (lesson 2.4).',
        }),
    },
    {
      id: 'fortescue',
      title: { fr: 'Transformation de Fortescue', en: 'Fortescue transform' },
      tex: (c) => {
        const k = c.k as SequenceInfo;
        return `\\begin{aligned}
          \\begin{bmatrix} \\underline V_0 \\\\ \\underline V_1 \\\\ \\underline V_2 \\end{bmatrix} &= \\frac13\\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & a & a^2 \\\\ 1 & a^2 & a \\end{bmatrix}
          \\begin{bmatrix} ${c.term('a', '\\underline V_a')} \\\\ ${c.term('b', '\\underline V_b')} \\\\ ${c.term('c', '\\underline V_c')} \\end{bmatrix} \\\\[4pt]
          \\underline V_1 &= ${pol(c, k.V1)}, \\quad \\underline V_2 = ${pol(c, k.V2)}, \\quad \\underline V_0 = ${pol(c, k.V0)}
        \\end{aligned}`;
      },
      bars: (c) => {
        const k = c.k as SequenceInfo;
        return {
          scale: 1,
          items: [
            { term: 'v1', label: '|V_1|', value: cabs(k.V1) },
            { term: 'v2', label: '|V_2|', value: cabs(k.V2) },
            { term: 'vs', label: '|V_0|', value: cabs(k.V0) },
          ],
        };
      },
      note: (c) =>
        c.tr({
          fr: 'N’importe quel triplet de phaseurs est la somme d’un système **direct** (a→b→c), d’un système **inverse** (a→c→b) et d’un système **homopolaire** (trois phaseurs identiques).',
          en: 'Any three phasors are the sum of a **positive** set (a→b→c), a **negative** set (a→c→b) and a **zero** set (three identical phasors).',
        }),
    },
    {
      id: 'meaning',
      title: { fr: 'Ce que chaque composante fait', en: 'What each component does' },
      tex: (c) => `\\begin{array}{ll}
        \\underline V_1 & \\text{${c.tr({ fr: 'champ tournant direct : couple utile', en: 'forward rotating field: useful torque' })}} \\\\
        \\underline V_2 & \\text{${c.tr({ fr: 'champ tournant inverse : échauffement', en: 'backward rotating field: heating' })}} \\\\
        \\underline V_0 & \\text{${c.tr({ fr: 'courant dans le neutre et la terre', en: 'neutral and earth current' })}}
      \\end{array}`,
      note: (c) =>
        c.tr({
          fr: 'Un moteur ne produit du couple qu’avec la composante directe. La composante inverse crée un champ qui tourne à l’envers : elle freine et chauffe le rotor.',
          en: 'A motor only makes useful torque from the positive sequence. The negative sequence creates a field turning backwards: it brakes and heats the rotor.',
        }),
    },
    {
      id: 'vuf',
      title: { fr: 'Taux de déséquilibre', en: 'Unbalance factor' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as SequenceInfo;
        return `\\mathrm{VUF} = \\frac{|\\underline V_2|}{|\\underline V_1|} = ${isFinite(k.vuf) ? c.q(100 * k.vuf, '%', 3) : '\\infty'}`;
      },
      note: (c) =>
        c.tr({
          fr: 'EN 50160 : le déséquilibre de tension doit rester sous 2 % (moyenne sur 10 min, 95 % du temps sur une semaine).',
          en: 'EN 50160: voltage unbalance must stay below 2 % (10-minute average, 95 % of the time over a week).',
        }),
    },
    {
      id: 'faults',
      title: { fr: 'Vers le calcul des défauts', en: 'Towards fault analysis' },
      personas: ['research', 'utility'],
      tex: () => `\\text{phase-terre / phase-to-ground: } \\underline I_1 = \\underline I_2 = \\underline I_0 = \\frac{\\underline V_f}{\\underline Z_1 + \\underline Z_2 + \\underline Z_0}`,
      note: (c) =>
        c.tr({
          fr: 'Chaque séquence a son propre circuit (réseau direct, inverse, homopolaire). Un défaut déséquilibré les relie entre eux : c’est la méthode utilisée dans tous les calculs de court-circuit (module 5).',
          en: 'Each sequence has its own network (positive, negative, zero). An unbalanced fault connects them together: this is the method behind every short-circuit study (Module 5).',
        }),
    },
  ],

  steps: [
    {
      id: 'balance',
      title: { fr: 'Rééquilibrer', en: 'Rebalancing' },
      body: {
        fr: `La phase c est creusée à 0,6 pu. Les trois petites roues montrent ce que contient ce système : surtout du **direct**, un peu d’**inverse** et d’**homopolaire**.

Ramenez $|V_c|$ à **1** : il ne reste plus que la composante directe.`,
        en: `Phase c dips to 0.6 pu. The three small wheels show what this set contains: mostly **positive**, a little **negative** and **zero**.

Bring $|V_c|$ back to **1**: only the positive sequence is left.`,
      },
      check: (lab) => (lab.info as SequenceInfo).vuf < 0.005 && cabs((lab.info as SequenceInfo).V1) > 0.9,
    },
    {
      id: 'swap',
      title: { fr: 'Inverser deux phases', en: 'Swapping two phases' },
      body: {
        fr: `Cliquez **b ↔ c** (ou réglez les angles à $+120°$ et $-120°$). Tout passe dans la composante **inverse** : le champ tourne à l’envers et un moteur triphasé change de **sens de rotation**. C’est pourquoi on vérifie l’ordre des phases avant toute mise en service.`,
        en: `Click **b ↔ c** (or set the angles to $+120°$ and $-120°$). Everything moves into the **negative** sequence: the field turns backwards and a three-phase motor **reverses**. That is why phase order is checked before any commissioning.`,
      },
      check: (lab) => cabs((lab.info as SequenceInfo).V2) > 0.9 && cabs((lab.info as SequenceInfo).V1) < 0.05,
    },
    {
      id: 'zero',
      title: { fr: 'Homopolaire pur', en: 'Pure zero sequence' },
      body: {
        fr: `Mettez les trois phases **en phase** (angles à 0°). Il ne reste que $\\underline V_0$ : trois tensions identiques qui ne font rien tourner, mais qui poussent du courant dans le neutre et la terre.`,
        en: `Put all three phases **in phase** (angles at 0°). Only $\\underline V_0$ remains: three identical voltages that turn nothing, but push current through the neutral and the earth.`,
      },
      check: (lab) => cabs((lab.info as SequenceInfo).V0) > 0.9 && cabs((lab.info as SequenceInfo).V1) < 0.05,
    },
    {
      id: 'fault',
      title: { fr: 'Un défaut phase-terre', en: 'A phase-to-ground fault' },
      body: {
        fr: `Repartez d’un système équilibré et mettez $|V_a| = 0$, comme lors d’un court-circuit franc de la phase a à la terre.

On obtient $|V_1| = 2/3$ et $|V_2| = |V_0| = 1/3$ : les trois séquences sont présentes, et c’est ce qu’un relais de protection détecte.`,
        en: `Start from a balanced set and set $|V_a| = 0$, as in a solid short circuit from phase a to ground.

You get $|V_1| = 2/3$ and $|V_2| = |V_0| = 1/3$: all three sequences appear, and that is what a protection relay detects.`,
      },
      check: (lab) => {
        const k = lab.info as SequenceInfo;
        return lab.params.Ma < 0.02 && Math.abs(cabs(k.V1) - 2 / 3) < 0.02 && Math.abs(cabs(k.V2) - 1 / 3) < 0.02;
      },
    },
    {
      id: 'limit',
      title: { fr: 'À la limite de la norme', en: 'At the limit of the standard' },
      body: {
        fr: `Repartez d’un système équilibré et réduisez légèrement une phase pour obtenir un déséquilibre **entre 1 % et 2 %**, la limite d’EN 50160. Quelle chute de tension sur une seule phase suffit ?`,
        en: `Start from a balanced set and lower one phase slightly to get an unbalance **between 1 % and 2 %**, the EN 50160 limit. How small a dip on a single phase does it take?`,
      },
      hint: { fr: 'Environ 3 à 6 % sur une phase : $|V_2| \\approx \\Delta V / 3$.', en: 'About 3–6 % on one phase: $|V_2| \\approx \\Delta V / 3$.' },
      check: (lab) => {
        const v = (lab.info as SequenceInfo).vuf;
        return v >= 0.01 && v <= 0.02;
      },
    },
  ],
};
