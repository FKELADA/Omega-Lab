// Module 10.3 — Neutral earthing and residual currents (3I0) on an MV network.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import type { Experiment } from '../../lib/lab/types';
import { cmul, cx } from '../../lib/core/linalg';
import { NEUTRAL, NTR, RELAY, neutralInfo, neutralModel, type NeutralInfo } from '../../lib/models/module10';
import NeutralCanvas from './NeutralCanvas.svelte';

const kV = (z: { re: number; im: number }) => cmul(z, cx(1 / 1000));

export const neutralLesson: Experiment = {
  id: 'neutral',
  path: [
    { fr: 'Module 10 · Le gestionnaire du réseau de distribution', en: 'Module 10 · The distribution system operator' },
    { fr: '10.3 Régimes de neutre et 3I0', en: '10.3 Neutral earthing and 3I0' },
  ],
  title: { fr: 'Un défaut à la terre en HTA : que voient les protections ?', en: 'An MV earth fault: what does protection see?' },
  model: neutralModel,
  info: neutralInfo,
  canvas: NeutralCanvas,
  instruments: [PhasorDiagram, Chart0],

  params: [
    {
      id: 'regime',
      sweep: false,
      symbol: 'N',
      name: { fr: 'Régime de neutre', en: 'Neutral earthing' },
      unit: '',
      min: 0,
      max: 2,
      default: NEUTRAL.isolated,
      scale: 'lin',
      choices: [
        { value: NEUTRAL.isolated, label: { fr: 'Isolé', en: 'Isolated' } },
        { value: NEUTRAL.resistance, label: { fr: 'Impédant (résistance)', en: 'Resistance-earthed' } },
        { value: NEUTRAL.compensated, label: { fr: 'Compensé (bobine de Petersen)', en: 'Compensated (Petersen coil)' } },
      ],
    },
    { id: 'Lc', sweep: false, symbol: 'L_c', name: { fr: 'Longueur totale de câbles souterrains', en: 'Total length of underground cable' }, unit: 'km', min: 10, max: 300, default: 50, scale: 'lin', term: 'C' },
    { id: 'In', sweep: false, symbol: 'I_N', name: { fr: 'Courant limité par la résistance de neutre', en: 'Current limited by the neutral resistor' }, unit: 'A', min: 150, max: 1000, default: 300, scale: 'lin', term: 'R' },
    { id: 'detune', sweep: false, symbol: '\\delta', name: { fr: 'Désaccord de la bobine', en: 'Coil detuning' }, unit: '%', min: -30, max: 30, default: 0, scale: 'lin', term: 'L' },
    { id: 'Rf', sweep: false, symbol: 'R_d', name: { fr: 'Résistance du défaut', en: 'Fault resistance' }, unit: 'Ω', min: 0.5, max: 5000, default: 1, scale: 'log', term: 'R' },
    { id: 'Is0', sweep: false, symbol: 'I_{s0}', name: { fr: 'Seuil des protections de terre des départs', en: 'Feeder earth-fault relay threshold' }, unit: 'A', min: 5, max: 400, default: 40, scale: 'log', term: 'i' },
    {
      id: 'relay',
      sweep: false,
      symbol: 'P',
      name: { fr: 'Type de protection', en: 'Relay type' },
      unit: '',
      min: 0,
      max: 1,
      default: RELAY.amp,
      scale: 'lin',
      choices: [
        { value: RELAY.amp, label: { fr: 'Ampèremétrique', en: 'Overcurrent' } },
        { value: RELAY.watt, label: { fr: 'Wattmétrique', en: 'Wattmetric' } },
      ],
    },
  ],

  signals: [
    { id: 'va', symbol: 'v_a', name: { fr: 'Phase en défaut', en: 'Faulty phase' }, unit: 'kV', color: '--c-a', on: true },
    { id: 'vb', symbol: 'v_b', name: { fr: 'Phase saine b', en: 'Healthy phase b' }, unit: 'kV', color: '--c-b', on: true },
    { id: 'vc', symbol: 'v_c', name: { fr: 'Phase saine c', en: 'Healthy phase c' }, unit: 'kV', color: '--c-c', on: false },
    { id: 'vn', symbol: 'v_N', name: { fr: 'Déplacement du point neutre', en: 'Neutral displacement' }, unit: 'kV', color: '--c-n', on: false, dash: true },
    { id: 'if', symbol: 'i_d', name: { fr: 'Courant de défaut', en: 'Fault current' }, unit: 'A', color: '--c-R', on: true, term: 'R' },
    { id: 'i0f', symbol: '3i_0^{d}', name: { fr: '3I0 au départ en défaut', en: '3I0 at the faulty feeder' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'i0h', symbol: '3i_0^{s}', name: { fr: '3I0 au départ sain', en: '3I0 at the healthy feeder' }, unit: 'A', color: '--c-C', on: true, term: 'C' },
  ],

  phasors: {
    omega: () => 2 * Math.PI * 50,
    unit: 'kV',
    rms: true,
    items: (_p, k: NeutralInfo) => [
      { id: 'Va', label: 'V_a', term: 'a', color: '--c-a', value: kV(k.Va) },
      { id: 'Vb', label: 'V_b', term: 'b', color: '--c-b', value: kV(k.Vb) },
      { id: 'Vc', label: 'V_c', term: 'c', color: '--c-c', value: kV(k.Vc) },
      { id: 'Vn', label: 'V_N', term: 'n', color: '--c-n', value: kV(k.Vn), thin: true },
      { id: 'I0f', label: '3I0 (défaut)', term: 'i', color: '--c-i', value: k.I0f, unit: 'A', drawScale: 8 / Math.max(10, k.i0f, k.i0h) },
      { id: 'I0h', label: '3I0 (sain)', term: 'C', color: '--c-C', value: k.I0h, unit: 'A', drawScale: 8 / Math.max(10, k.i0f, k.i0h) },
    ],
  },

  charts: [
    {
      title: { fr: 'Courant de défaut selon la longueur de câbles', en: 'Fault current versus cable length' },
      x: { label: 'L_c', unit: 'km', range: [10, 300] },
      y: { label: 'I_d', unit: 'A', range: [0, 1200] },
      series: (lab) => {
        const curve = (q: Record<string, number>): [number, number][] => {
          const pts: [number, number][] = [];
          for (let L = 10; L <= 300; L += 10) pts.push([L, neutralInfo({ ...lab.params, ...q, Lc: L }).ifA]);
          return pts;
        };
        return [
          { label: { fr: 'isolé', en: 'isolated' }, color: '--c-a', pts: curve({ regime: NEUTRAL.isolated }) },
          { label: { fr: 'impédant', en: 'resistance' }, color: '--c-R', pts: curve({ regime: NEUTRAL.resistance }) },
          { label: { fr: 'compensé', en: 'compensated' }, color: '--c-L', pts: curve({ regime: NEUTRAL.compensated }) },
        ];
      },
      points: (lab) => [{ x: lab.params.Lc, y: (lab.info as NeutralInfo).ifA, color: '--accent' }],
      note: () => ({
        fr: 'Un câble HTA souterrain apporte de l’ordre de 3 A de courant capacitif par kilomètre, une ligne aérienne cinquante fois moins.',
        en: 'An underground MV cable adds about 3 A of capacitive current per kilometre, an overhead line fifty times less.',
      }),
    },
  ],

  equations: [
    {
      id: 'vn',
      title: { fr: 'Le déplacement du point neutre', en: 'Neutral-point displacement' },
      tex: (c) => {
        const k = c.k as NeutralInfo;
        return `\\underline V_N = -\\frac{\\underline E_a / R_d}{Y_N + 3j\\omega C + 1/R_d}, \\qquad |V_N| = ${c.q(Math.hypot(k.Vn.re, k.Vn.im) / 1000, 'kV', 3)}, \\quad V_{saine} = ${c.q(k.vMax, '\\times E', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un défaut franc à la terre fait monter le point neutre jusqu’à la tension simple : les phases saines montent à $\\sqrt3$ fois leur tension normale. Le matériel HTA est isolé pour le supporter.',
          en: 'A solid earth fault lifts the neutral point to the phase voltage: the healthy phases rise to $\\sqrt3$ times their normal voltage. MV equipment is insulated for it.',
        }),
    },
    {
      id: 'currents',
      title: { fr: 'Courant de défaut et courants résiduels', en: 'Fault current and residual currents' },
      tex: (c) => {
        const k = c.k as NeutralInfo;
        return `\\begin{aligned}
          I_d &= ${c.q(k.ifA, 'A', 3)}, \\qquad 3I_C = 3\\omega C\\,E = ${c.q(k.Ic, 'A', 3)} \\\\
          3I_0^{d} &= |V_N\\,(Y_N + 3j\\omega(C - C_d))| = ${c.q(k.i0f, 'A', 3)} \\\\
          3I_0^{s} &= 3\\omega C_s\\,|V_N| = ${c.q(k.i0h, 'A', 3)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: `Le départ en défaut voit le courant du neutre plus les courants capacitifs de **tous les autres** départs ; un départ sain ne voit que son propre courant capacitif (ici ${(NTR.share[1] * 100).toFixed(0)} % du réseau). Un départ sain très câblé peut donc déclencher à tort.`,
          en: `The faulty feeder sees the neutral current plus the capacitive currents of **all the other** feeders; a healthy feeder sees only its own capacitive current (here ${(NTR.share[1] * 100).toFixed(0)} % of the network). A healthy feeder with a lot of cable can therefore trip wrongly.`,
        }),
    },
    {
      id: 'watt',
      title: { fr: 'La protection wattmétrique', en: 'The wattmetric relay' },
      tex: (c) => {
        const k = c.k as NeutralInfo;
        return `P_0 = \\Re\\{3\\,\\underline V_0\\,\\underline I_0^*\\} : \\quad ${c.q(k.pf, 'kW', 3)}_{(d)}, \\quad ${c.q(k.ph, 'kW', 3)}_{(s)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'En neutre compensé, les courants résiduels des départs sain et en défaut ont des amplitudes voisines : seule la composante **active** (pertes de la bobine et du défaut), qui ne circule que vers le défaut, permet de distinguer. C’est le principe des protections wattmétriques homopolaires (PWH).',
          en: 'With a compensated neutral, the residual currents of healthy and faulty feeders have similar magnitudes: only the **active** component (coil and fault losses), which flows only towards the fault, tells them apart. This is the principle of wattmetric earth-fault relays.',
        }),
    },
  ],

  steps: [
    {
      id: 'isolated',
      title: { fr: 'Neutre isolé et câbles', en: 'Isolated neutral and cables' },
      body: {
        fr: `Avec le neutre isolé, le défaut se referme par les capacités du réseau. Portez la longueur de câbles à **200 km** : le courant de défaut dépasse 500 A, et l’arc ne s’éteint plus de lui-même.`,
        en: `With an isolated neutral, the fault current returns through the network’s capacitances. Raise the cable length to **200 km**: the fault current exceeds 500 A, and the arc no longer self-extinguishes.`,
      },
      check: (lab) => lab.params.regime === NEUTRAL.isolated && lab.params.Lc >= 190 && (lab.info as NeutralInfo).ifA > 500,
    },
    {
      id: 'select',
      title: { fr: 'Neutre impédant : régler le seuil', en: 'Resistance-earthed neutral: setting the threshold' },
      body: {
        fr: `Passez en **neutre impédant** (300 A), toujours avec 200 km de câbles. Le départ sain voit plus de 100 A de courant capacitif. Réglez le seuil pour que **seul le départ en défaut** déclenche.`,
        en: `Switch to a **resistance-earthed neutral** (300 A), still with 200 km of cable. The healthy feeder sees over 100 A of capacitive current. Set the threshold so that **only the faulty feeder** trips.`,
      },
      check: (lab) => {
        const k = lab.info as NeutralInfo;
        return lab.params.regime === NEUTRAL.resistance && lab.params.Lc >= 190 && lab.params.relay === RELAY.amp && k.faultyTrips && !k.healthyTrips;
      },
    },
    {
      id: 'resistive',
      title: { fr: 'Le défaut résistant', en: 'The high-resistance fault' },
      body: {
        fr: `Un câble tombé sur un sol sec ou une branche : montez la résistance du défaut au-delà de **500 Ω**. Le courant tombe sous le seuil : le défaut n’est **pas vu**.`,
        en: `A conductor on dry ground, or a branch: raise the fault resistance beyond **500 Ω**. The current drops below the threshold: the fault is **not seen**.`,
      },
      check: (lab) => lab.params.regime === NEUTRAL.resistance && lab.params.Rf >= 500 && !(lab.info as NeutralInfo).faultyTrips,
    },
    {
      id: 'petersen',
      title: { fr: 'Le neutre compensé', en: 'The compensated neutral' },
      body: {
        fr: `Revenez à un défaut franc (1 Ω) et passez en **neutre compensé**, bobine accordée (désaccord dans ±5 %). Le courant de défaut tombe sous **50 A** : l’arc s’éteint souvent seul.`,
        en: `Go back to a solid fault (1 Ω) and switch to a **compensated neutral**, coil tuned (detuning within ±5 %). The fault current falls below **50 A**: the arc often goes out on its own.`,
      },
      check: (lab) => lab.params.regime === NEUTRAL.compensated && Math.abs(lab.params.detune) <= 5 && lab.params.Rf <= 10 && (lab.info as NeutralInfo).ifA < 50,
    },
    {
      id: 'wattmetric',
      title: { fr: 'La protection wattmétrique', en: 'The wattmetric relay' },
      body: {
        fr: `En neutre compensé, une protection ampèremétrique ne sait plus distinguer les départs. Passez en **wattmétrique** : seul le départ en défaut déclenche.`,
        en: `With a compensated neutral, an overcurrent relay can no longer tell the feeders apart. Switch to **wattmetric**: only the faulty feeder trips.`,
      },
      check: (lab) => {
        const k = lab.info as NeutralInfo;
        return lab.params.regime === NEUTRAL.compensated && lab.params.relay === RELAY.watt && k.faultyTrips && !k.healthyTrips;
      },
    },
  ],
};
