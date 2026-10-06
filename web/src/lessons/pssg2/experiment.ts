// Module 8.10 — Designing PSSs on Kundur's two-area system, with G2ELin results baked into the app.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { PSS, interOf, pssGain, pssInfo, pssModel, type PssInfo } from '../../lib/models/g2data-b';
import PssG2Canvas from './PssG2Canvas.svelte';

const info = (lab: { info: unknown }) => lab.info as PssInfo;
/** A constant-damping line ζ in the (σ, f) plane: σ = −ζ ω / √(1 − ζ²). */
const zetaLine = (z: number): [number, number][] => [
  [0, 0],
  [(-z / Math.sqrt(1 - z * z)) * 2 * Math.PI * 3, 3],
];

export const pssG2Lesson: Experiment = {
  id: 'pssg2',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.10 Régler des PSS (G2ELin)', en: '8.10 Tuning PSSs (G2ELin)' },
  ],
  title: { fr: 'Régler des stabilisateurs sur le réseau à deux zones de Kundur (G2ELin)', en: 'Tuning stabilisers on Kundur’s two-area system (G2ELin)' },
  model: pssModel,
  info: pssInfo,
  canvas: PssG2Canvas,
  instruments: [Chart0, Chart1],

  params: [
    {
      id: 'place',
      sweep: false,
      symbol: '\\text{PSS}',
      name: { fr: 'Machines équipées d’un PSS', en: 'Machines fitted with a PSS' },
      unit: '',
      min: 0,
      max: PSS.places.length - 1,
      default: 0,
      scale: 'lin',
      choices: PSS.places.map((p, value) => ({ value, label: p.name })),
    },
    { id: 'K', symbol: 'K_{STAB}', name: { fr: 'Gain des PSS', en: 'PSS gain' }, unit: '', min: 0, max: 100, default: 20, scale: 'lin', term: 'C' },
  ],

  signals: [
    { id: 'd13', symbol: 'f_1 - f_3', name: { fr: 'Écart de vitesse G1 − G3 (inter-zones)', en: 'Speed difference G1 − G3 (inter-area)' }, unit: 'mHz', color: '--c-p', on: true, term: 'p' },
    { id: 'w1', symbol: '\\Delta f_1', name: { fr: 'Vitesse de G1', en: 'Speed of G1' }, unit: 'mHz', color: '--c-a', on: false },
    { id: 'w2', symbol: '\\Delta f_2', name: { fr: 'Vitesse de G2', en: 'Speed of G2' }, unit: 'mHz', color: '--c-b', on: false },
    { id: 'w3', symbol: '\\Delta f_3', name: { fr: 'Vitesse de G3', en: 'Speed of G3' }, unit: 'mHz', color: '--c-c', on: false },
    { id: 'w4', symbol: '\\Delta f_4', name: { fr: 'Vitesse de G4', en: 'Speed of G4' }, unit: 'mHz', color: '--c-i', on: false },
  ],

  charts: [
    {
      title: { fr: 'Modes entre 0,1 et 3 Hz', en: 'Modes between 0.1 and 3 Hz' },
      x: { label: 'σ', unit: '1/s', range: [-6, 0.5] },
      y: { label: 'f', unit: 'Hz', range: [0, 3] },
      series: () => [
        { label: { fr: 'ζ = 5 %', en: 'ζ = 5 %' }, color: '--c-R', pts: zetaLine(0.05), dash: true, width: 1.2 },
        { label: { fr: 'ζ = 15 %', en: 'ζ = 15 %' }, color: '--c-L', pts: zetaLine(0.15), dash: true, width: 1.2 },
      ],
      points: (lab) => {
        const k = info(lab);
        const none = PSS.modes.none[0].filter((m) => m.cat === 'synchronisation');
        return [
          ...none.map((m) => ({ x: m.re, y: m.f, color: '--muted', hollow: true })),
          ...k.modes.map((m) => ({ x: Math.max(-6, m.re), y: m.f, color: m.cat === 'control' ? '--c-C' : m === k.inter ? '--c-p' : '--c-S', label: m === k.inter ? 'inter' : m.cat === 'control' ? 'exc' : undefined })),
        ];
      },
      note: () => ({
        fr: 'Cercles : sans PSS. Points : avec les PSS choisis (rouge : inter-zones, vert : locaux, bleu : modes de la régulation). Plus un point est à gauche des droites, plus il est amorti.',
        en: 'Circles: without PSS. Dots: with the chosen PSSs (red: inter-area, green: local, blue: control modes). The further left of the lines, the better damped.',
      }),
    },
    {
      title: { fr: 'Amortissement du mode inter-zones selon le gain', en: 'Inter-area damping versus gain' },
      x: { label: 'K', unit: '', range: [0, 100] },
      y: { label: 'ζ', unit: '%', range: [-5, 60] },
      bands: () => [{ y0: -5, y1: 5 }],
      series: (lab) =>
        PSS.places
          .filter((p) => p.id !== 'none')
          .map((p) => ({
            label: p.name,
            color: p.id === info(lab).place ? '--c-p' : '--c-L',
            width: p.id === info(lab).place ? 2.5 : 1,
            dash: p.id !== info(lab).place,
            pts: PSS.gains.map((K) => [K, interOf(PSS.modes[p.id][K])?.z ?? NaN] as [number, number]),
          })),
      points: (lab) => [{ x: info(lab).K, y: info(lab).inter.z, color: '--accent' }],
      note: () => ({ fr: 'Bande grise : moins de 5 % d’amortissement, insuffisant pour l’exploitation.', en: 'Grey band: below 5 % damping, not enough for operation.' }),
    },
  ],

  predict: {
    signal: 'd13',
    yRange: () => [-60, 60],
    diagnose(pred, run) {
      const half = (lo: number, hi: number, arr: [number, number][]) => Math.max(...arr.filter(([t]) => t >= lo && t < hi).map(([, y]) => Math.abs(y)), 0);
      const early = half(1, 4, pred), late = half(11, 15, pred);
      const truthLate = Math.max(...Array.from(run.s.d13).slice(Math.round(run.t.length * 0.75)).map(Math.abs));
      if (late < 0.5 * early && truthLate > 0.5)
        return {
          fr: 'Sans PSS, le mode inter-zones de ce réseau n’est **pas amorti** : son amortissement est légèrement négatif, et l’oscillation grandit lentement au lieu de s’éteindre.',
          en: 'Without PSSs, this grid’s inter-area mode is **not damped**: its damping is slightly negative, and the oscillation slowly grows instead of dying out.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'mode',
      title: { fr: 'Les modes électromécaniques', en: 'The electromechanical modes' },
      tex: (c) => {
        const k = c.k as PssInfo;
        const z = (m: { z: number }) => c.q(m.z, '\\%', 3);
        return `\\begin{aligned} &\\text{${c.tr({ fr: 'inter-zones', en: 'inter-area' })}} : f = ${c.q(k.inter.f, 'Hz', 3)},\\ \\zeta = ${z(k.inter)} \\\\ &\\text{${c.tr({ fr: 'locaux', en: 'local' })}} : ${k.locals.map((m) => `${c.q(m.f, 'Hz', 3)}\\ (${z(m)})`).join(',\\ ')} \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Deux modes locaux (G1 contre G2, G3 contre G4, vers 1 à 1,8 Hz) et un mode inter-zones (une zone contre l’autre, vers 0,6 Hz). Calculés par G2ELin sur le modèle complet : machines d’ordre 6, excitation et PSS du livre de Kundur, réseau RMS.',
          en: 'Two local modes (G1 against G2, G3 against G4, around 1 to 1.8 Hz) and one inter-area mode (one area against the other, around 0.6 Hz). Computed by G2ELin on the full model: 6th-order machines, Kundur’s exciter and PSS, RMS network.',
        }),
    },
    {
      id: 'pss',
      title: { fr: 'Le stabilisateur de Kundur', en: 'Kundur’s stabiliser' },
      tex: (c) => {
        const k = c.k as PssInfo;
        return `v_{PSS} = K_{STAB}\\,\\frac{sT_W}{1+sT_W}\\,\\frac{1+sT_1}{1+sT_2}\\,\\frac{1+sT_3}{1+sT_4}\\,\\Delta\\omega, \\qquad K_{STAB} = ${c.q(k.K, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un filtre passe-haut (washout, $T_W$ = 10 s) et deux avances de phase compensent le retard de l’excitation : le PSS ajoute un couple en phase avec la vitesse, donc de l’amortissement (leçon 8.2).',
          en: 'A washout ($T_W$ = 10 s) and two lead stages compensate the exciter’s lag: the PSS adds torque in phase with speed, hence damping (lesson 8.2).',
        }),
    },
    {
      id: 'worst',
      title: { fr: 'Le mode le moins amorti', en: 'The least damped mode' },
      tex: (c) => {
        const k = c.k as PssInfo;
        return `\\min \\zeta = ${c.q(k.worst.z, '\\%', 3)} \\quad (${c.q(k.worst.f, 'Hz', 3)},\\ \\text{${k.worst.cat === 'control' ? c.tr({ fr: 'régulation', en: 'control' }) : c.tr({ fr: 'électromécanique', en: 'electromechanical' })}})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Avec un gain élevé sur les quatre machines (50 et plus), les modes les moins amortis deviennent ceux de la régulation (excitation et PSS) : ils restent bien amortis sur ce réseau, mais sur un réseau plus faible un gain excessif peut les déstabiliser. Le réglage est un compromis.',
          en: 'With a high gain on all four machines (50 and above), the least damped modes become the regulators’ own (exciter and PSS): they stay well damped on this grid, but on a weaker grid too much gain can destabilise them. Tuning is a trade-off.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire l’oscillation inter-zones', en: 'Predict the inter-area oscillation' },
      body: {
        fr: `Sans aucun PSS, on donne une petite impulsion de vitesse à G1. **Dessinez l’écart de vitesse entre G1 et G3** sur 15 s, puis révélez.`,
        en: `With no PSS at all, G1 gets a small speed kick. **Sketch the speed difference between G1 and G3** over 15 s, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'g1',
      title: { fr: 'Un PSS sur G1', en: 'One PSS on G1' },
      body: {
        fr: `Équipez **G1 seul** d’un PSS de gain 20. Le mode inter-zones est stabilisé, mais reste peu amorti.`,
        en: `Fit **G1 alone** with a PSS of gain 20. The inter-area mode is stabilised, but stays lightly damped.`,
      },
      check: (lab) => info(lab).place === 'G1' && info(lab).K >= 15 && info(lab).inter.z > 0,
    },
    {
      id: 'g3',
      title: { fr: 'Le bon emplacement', en: 'The right place' },
      body: {
        fr: `Déplacez le PSS sur **G3**, au même gain. Il amortit mieux le mode inter-zones : G3 y participe davantage.`,
        en: `Move the PSS to **G3**, at the same gain. It damps the inter-area mode better: G3 takes a larger part in it.`,
      },
      check: (lab) => {
        const k = info(lab);
        const g1 = interOf(PSS.modes.G1[pssGain('G1', k.K)]);
        return k.place === 'G3' && k.K >= 15 && k.inter.z > g1.z;
      },
    },
    {
      id: 'two',
      title: { fr: 'Deux PSS, un par zone', en: 'Two PSSs, one per area' },
      body: {
        fr: `Équipez **G1 et G3** et trouvez un gain qui porte le mode inter-zones à **au moins 5 %** d’amortissement.`,
        en: `Fit **G1 and G3** and find a gain that brings the inter-area mode to **at least 5 %** damping.`,
      },
      check: (lab) => info(lab).place === 'G1G3' && info(lab).inter.z >= 5,
    },
    {
      id: 'all',
      title: { fr: 'Toutes les machines', en: 'Every machine' },
      body: {
        fr: `Équipez **les quatre machines**. Trouvez un gain pour lequel le mode inter-zones dépasse **15 %** et les modes locaux **20 %**.`,
        en: `Fit **all four machines**. Find a gain for which the inter-area mode exceeds **15 %** and the local modes **20 %**.`,
      },
      check: (lab) => info(lab).place === 'all' && info(lab).inter.z >= 15 && info(lab).localMin >= 20,
    },
  ],
};

