// Module 10.4 — The MV protection plan: settings, time grading, auto-reclosing.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { FTYPE, PROT, iccAt, protInfo, protModel, type ProtInfo } from '../../lib/models/module10';
import ProtectionCanvas from './ProtectionCanvas.svelte';

export const protectionLesson: Experiment = {
  id: 'protection',
  path: [
    { fr: 'Module 10 · Le gestionnaire du réseau de distribution', en: 'Module 10 · The distribution system operator' },
    { fr: '10.4 Le plan de protection HTA', en: '10.4 The MV protection plan' },
  ],
  title: { fr: 'Couper vite, couper juste, réalimenter : la protection d’un départ HTA', en: 'Trip fast, trip right, restore: protecting an MV feeder' },
  model: protModel,
  info: protInfo,
  canvas: ProtectionCanvas,
  instruments: [Chart0],

  params: [
    { id: 'Is', symbol: 'I_s', name: { fr: 'Seuil de la protection de phase du départ', en: 'Feeder phase-overcurrent threshold' }, unit: 'A', min: 200, max: 3000, default: 1200, scale: 'log', term: 'i' },
    { id: 'td', symbol: 't_d', name: { fr: 'Temporisation du départ', en: 'Feeder time delay' }, unit: 's', min: 0.1, max: 1, default: 0.6, scale: 'lin', term: 'L' },
    { id: 'd', symbol: 'd', name: { fr: 'Distance du défaut (biphasé)', en: 'Fault distance (phase-to-phase)' }, unit: 'km', min: 0.5, max: PROT.len, default: 10, scale: 'lin', term: 'R' },
    {
      id: 'type',
      sweep: false,
      symbol: 'D',
      name: { fr: 'Nature du défaut', en: 'Fault type' },
      unit: '',
      min: 0,
      max: 1,
      default: FTYPE.transient,
      scale: 'lin',
      choices: [
        { value: FTYPE.transient, label: { fr: 'Fugitif (amorçage, branche)', en: 'Transient (flashover, branch)' } },
        { value: FTYPE.permanent, label: { fr: 'Permanent (câble endommagé)', en: 'Permanent (damaged cable)' } },
      ],
    },
    {
      id: 'reclose',
      sweep: false,
      symbol: 'R',
      name: { fr: 'Réenclencheur', en: 'Auto-recloser' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Hors service', en: 'Off' } },
        { value: 1, label: { fr: 'Rapide + lent', en: 'Rapid + slow' } },
      ],
    },
  ],

  signals: [
    { id: 'i', symbol: 'I', name: { fr: 'Courant en tête de départ', en: 'Feeder-head current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'sup', symbol: 'clients', name: { fr: 'Clients alimentés', en: 'Customers supplied' }, unit: '%', color: '--c-C', on: true, term: 'C' },
  ],

  charts: [
    {
      title: { fr: 'Courant de court-circuit le long du départ et réglage', en: 'Short-circuit current along the feeder and the setting' },
      x: { label: 'd', unit: 'km', range: [0, PROT.len] },
      y: { label: 'I', unit: 'A', range: [100, 10000], log: true },
      series: (lab) => {
        const tri: [number, number][] = [], bi: [number, number][] = [];
        for (let d = 0; d <= PROT.len + 1e-9; d += 0.5) {
          const c = iccAt(d);
          tri.push([d, c.I3]);
          bi.push([d, c.I2]);
        }
        return [
          { label: { fr: 'triphasé', en: 'three-phase' }, color: '--c-R', pts: tri },
          { label: { fr: 'biphasé (minimum)', en: 'phase-to-phase (minimum)' }, color: '--c-i', pts: bi },
          { label: { fr: 'seuil I_s', en: 'threshold I_s' }, color: '--c-L', pts: [[0, lab.params.Is], [PROT.len, lab.params.Is]], width: 2 },
          { label: { fr: 'charge maximale', en: 'highest load' }, color: '--c-C', pts: [[0, PROT.Iload], [PROT.len, PROT.Iload]], dash: true, width: 1.2 },
        ];
      },
      points: (lab) => [{ x: lab.params.d, y: iccAt(lab.params.d).I2, color: '--accent' }],
      note: () => ({
        fr: 'Le seuil doit rester au-dessus de la charge (avec une marge) et sous le plus petit défaut à protéger : le biphasé en bout de départ.',
        en: 'The threshold must stay above the load (with a margin) and below the smallest fault to clear: the phase-to-phase fault at the end of the feeder.',
      }),
    },
  ],

  equations: [
    {
      id: 'window',
      title: { fr: 'La fenêtre de réglage', en: 'The setting window' },
      tex: (c) => {
        const k = c.k as ProtInfo;
        return `1{,}3\\,I_{charge} = ${c.q(k.isMin, 'A', 3)} \\le I_s \\le 0{,}8\\,I_{cc,bi}^{fin} = ${c.q(k.isMax, 'A', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Trop bas, le départ déclenche sur une simple pointe de charge (ou à la remise sous tension, quand toutes les charges redémarrent). Trop haut, un défaut en bout de départ n’est pas vu.',
          en: 'Too low, the feeder trips on a mere load peak (or on re-energisation, when every load restarts). Too high, a fault at the end of the feeder is not seen.',
        }),
    },
    {
      id: 'icc',
      title: { fr: 'Le courant de court-circuit', en: 'The short-circuit current' },
      tex: (c) => {
        const k = c.k as ProtInfo;
        return `\\begin{aligned} I_{cc,tri}(d) &= \\frac{U}{\\sqrt3\\,|Z_s + z\\,d|}, \\quad I_{bi} = \\frac{\\sqrt3}{2} I_{tri} \\\\ I_{tri}(0) &= ${c.q(k.I3start, 'A', 3)}, \\quad I_{bi}(${PROT.len}\\,\\text{km}) = ${c.q(k.I2end, 'A', 3)} \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: `Jeu de barres HTA à ${PROT.Scc} MVA de puissance de court-circuit (ordre de grandeur), départ aérien de ${PROT.len} km.`,
          en: `MV busbar with ${PROT.Scc} MVA of short-circuit power (order of magnitude), ${PROT.len} km overhead feeder.`,
        }),
    },
    {
      id: 'grading',
      title: { fr: 'Sélectivité chronométrique et réenclenchement', en: 'Time grading and reclosing' },
      tex: (c) => `t_d + \\Delta t \\le t_{arrivée} = ${PROT.tIncomer}\\ \\text{s}, \\quad \\Delta t = ${PROT.margin}\\ \\text{s}; \\qquad \\text{${c.tr({ fr: 'cycle', en: 'cycle' })}} : ${PROT.rapid}\\ \\text{s} \\to ${PROT.slow}\\ \\text{s}`,
      note: (c) =>
        c.tr({
          fr: 'La protection du départ doit agir avant celle de l’arrivée du transformateur, sinon tout le jeu de barres est coupé. La plupart des défauts aériens sont fugitifs : un réenclenchement rapide les élimine en une fraction de seconde.',
          en: 'The feeder relay must act before the transformer incomer, otherwise the whole busbar is lost. Most overhead faults are transient: a rapid reclosure clears them in a fraction of a second.',
        }),
    },
  ],

  steps: [
    {
      id: 'setting',
      title: { fr: 'Régler le seuil', en: 'Setting the threshold' },
      body: {
        fr: `Le seuil est trop haut : un défaut en bout de départ ne serait pas vu, et c’est l’arrivée qui couperait tout le poste. Placez-le dans la **fenêtre de réglage**.`,
        en: `The threshold is too high: a fault at the end of the feeder would not be seen, and the incomer would cut the whole substation. Put it inside the **setting window**.`,
      },
      check: (lab) => (lab.info as ProtInfo).setOk,
    },
    {
      id: 'end',
      title: { fr: 'Un défaut en bout de départ', en: 'A fault at the end of the feeder' },
      body: {
        fr: `Placez le défaut à **20 km**, en bout de départ. Il doit être vu par la protection du départ, pas par l’arrivée.`,
        en: `Put the fault at **20 km**, at the end of the feeder. It must be seen by the feeder relay, not by the incomer.`,
      },
      check: (lab) => lab.params.d >= 19.5 && (lab.info as ProtInfo).sees && !(lab.info as ProtInfo).incomer,
    },
    {
      id: 'grading',
      title: { fr: 'La sélectivité', en: 'Grading' },
      body: {
        fr: `L’arrivée du transformateur est temporisée à 0,7 s. Réglez la temporisation du départ pour garder **0,3 s** de marge.`,
        en: `The transformer incomer is delayed by 0.7 s. Set the feeder delay to keep a **0.3 s** margin.`,
      },
      check: (lab) => (lab.info as ProtInfo).graded && (lab.info as ProtInfo).setOk,
    },
    {
      id: 'transient',
      title: { fr: 'Le réenclenchement rapide', en: 'Rapid reclosing' },
      body: {
        fr: `Mettez le **réenclencheur** en service. Un défaut fugitif est éliminé : les clients sont réalimentés après **0,3 s** de coupure.`,
        en: `Turn the **auto-recloser** on. A transient fault is cleared: customers are back after a **0.3 s** interruption.`,
      },
      check: (lab) => lab.params.reclose === 1 && lab.params.type === FTYPE.transient && (lab.info as ProtInfo).sees && !(lab.info as ProtInfo).lockout,
    },
    {
      id: 'permanent',
      title: { fr: 'Le défaut permanent', en: 'The permanent fault' },
      body: {
        fr: `Passez à un défaut **permanent**. Après le cycle rapide puis lent, le départ reste ouvert : il faut localiser et isoler le tronçon, puis réalimenter le reste (leçon 10.1).`,
        en: `Switch to a **permanent** fault. After the rapid then slow reclosures, the feeder stays open: the section must be located and isolated, then the rest restored (lesson 10.1).`,
      },
      check: (lab) => lab.params.reclose === 1 && lab.params.type === FTYPE.permanent && (lab.info as ProtInfo).lockout && (lab.info as ProtInfo).sees,
    },
  ],
};
