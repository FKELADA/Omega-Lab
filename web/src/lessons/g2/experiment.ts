// Module 8.7 — Inter-area oscillations: modes, mode shapes and free responses
// on a four-machine, two-area system. Real networks follow in 8.8 and 8.9.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { tr } from '../../lib/ui/ui.svelte';
import { interCurve, MODE_KIND, modeOf, twoAreaInfo, twoAreaModel, type TwoAreaInfo } from '../../lib/models/module8b';
import TwoAreaCanvas from './TwoAreaCanvas.svelte';

const zetaLine = (z: number): [number, number][] => [[0, 0], [(-z * 2 * Math.PI * 2) / Math.sqrt(1 - z * z), 2]];
const inter = (lab: { info: unknown }) => modeOf(lab.info as TwoAreaInfo, MODE_KIND.inter);
const KIND_LABEL = [
  { fr: 'inter-zones', en: 'inter-area' },
  { fr: 'local 1', en: 'local 1' },
  { fr: 'local 2', en: 'local 2' },
];

export const g2Lesson: Experiment = {
  id: 'g2',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.7 Oscillations inter-zones', en: '8.7 Inter-area oscillations' },
  ],
  title: { fr: 'Oscillations inter-zones : modes et formes modales', en: 'Inter-area oscillations: modes and mode shapes' },
  model: twoAreaModel,
  info: twoAreaInfo,
  canvas: TwoAreaCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'Xt', symbol: 'X_t', name: { fr: 'Réactance de la liaison entre zones', en: 'Tie-line reactance' }, unit: 'pu', min: 0.4, max: 2, default: 1, scale: 'lin', term: 'L' },
    { id: 'Ptie', symbol: 'P_{tie}', name: { fr: 'Transit de la zone 1 vers la zone 2', en: 'Transfer from area 1 to area 2' }, unit: 'pu', min: 0, max: 0.9, default: 0.4, scale: 'lin', term: 'p' },
    { id: 'H2', symbol: 'H_2', name: { fr: 'Inertie des machines de la zone 2', en: 'Inertia of the area-2 machines' }, unit: 's', min: 2, max: 12, default: 6.175, scale: 'lin', term: 'S' },
    { id: 'D', symbol: 'D', name: { fr: 'Amortissement', en: 'Damping' }, unit: 'pu', min: 0, max: 10, default: 1, scale: 'lin', term: 'R' },
    {
      id: 'kick',
      symbol: '\\text{choc}',
      name: { fr: 'Machine perturbée', en: 'Machine kicked' },
      unit: '',
      min: 0,
      max: 3,
      default: 0,
      scale: 'lin',
      choices: ['G1', 'G2', 'G3', 'G4'].map((g, i) => ({ value: i, label: { fr: g, en: g } })),
    },
    {
      id: 'mode',
      symbol: '\\text{mode}',
      name: { fr: 'Mode affiché', en: 'Mode shown' },
      unit: '',
      min: 0,
      max: 2,
      default: MODE_KIND.inter,
      scale: 'lin',
      choices: KIND_LABEL.map((label, value) => ({ value, label })),
    },
  ],

  signals: [
    { id: 'dw1', symbol: '\\Delta f_1', name: { fr: 'Vitesse de G1 (en mHz)', en: 'G1 speed (mHz)' }, unit: 'mHz', color: '--c-p', on: true, term: 'p' },
    { id: 'dw2', symbol: '\\Delta f_2', name: { fr: 'Vitesse de G2 (en mHz)', en: 'G2 speed (mHz)' }, unit: 'mHz', color: '--c-R', on: false, term: 'R' },
    { id: 'dw3', symbol: '\\Delta f_3', name: { fr: 'Vitesse de G3 (en mHz)', en: 'G3 speed (mHz)' }, unit: 'mHz', color: '--c-S', on: true, term: 'S' },
    { id: 'dw4', symbol: '\\Delta f_4', name: { fr: 'Vitesse de G4 (en mHz)', en: 'G4 speed (mHz)' }, unit: 'mHz', color: '--c-C', on: false, term: 'C' },
  ],

  charts: [
    {
      title: { fr: 'Modes électromécaniques (plan s)', en: 'Electromechanical modes (s-plane)' },
      x: { label: 'σ', unit: '1/s', range: [-1, 0.2] },
      y: { label: 'f', unit: 'Hz', range: [0, 2] },
      series: () => [
        { label: { fr: 'ζ = 5 %', en: 'ζ = 5 %' }, color: '--warn', pts: zetaLine(0.05), dash: true, width: 1 },
        { color: '--muted', pts: [[0, 0], [0, 2]], width: 1 },
      ],
      points: (lab) =>
        (lab.info as TwoAreaInfo).modes.map((m) => ({ x: m.eig.re, y: m.freq, color: m.kind === lab.params.mode ? '--accent' : '--c-S', label: tr(KIND_LABEL[m.kind]) })),
      note: (lab) => {
        const m = inter(lab);
        return {
          fr: `Mode inter-zones à ${m.freq.toFixed(2)} Hz, amortissement ${(100 * m.zeta).toFixed(1)} %. Les modes locaux sont plus rapides (1 à 2 Hz).`,
          en: `Inter-area mode at ${m.freq.toFixed(2)} Hz, damping ${(100 * m.zeta).toFixed(1)} %. Local modes are faster (1 to 2 Hz).`,
        };
      },
    },
    {
      title: { fr: 'Fréquence inter-zones selon la liaison', en: 'Inter-area frequency versus tie line' },
      x: { label: 'Xt', unit: 'pu', range: [0.4, 2] },
      y: { label: 'f', unit: 'Hz', range: [0, 1.2] },
      bands: () => [{ y0: 0.1, y1: 0.8 }],
      series: (lab) => [{ label: { fr: 'mode inter-zones', en: 'inter-area mode' }, color: '--c-L', pts: interCurve(lab.params) }],
      points: (lab) => [{ x: lab.params.Xt, y: inter(lab).freq, color: '--accent' }],
      note: () => ({
        fr: 'La bande grisée (0,1–0,8 Hz) est celle des modes inter-zones observés sur les grands réseaux : 0,2 Hz entre l’est et l’ouest de l’Europe continentale.',
        en: 'The shaded band (0.1–0.8 Hz) is where inter-area modes are seen on large grids: 0.2 Hz between east and west of continental Europe.',
      }),
    },
  ],

  predict: {
    signal: 'dw3',
    yRange: () => [-40, 40],
    diagnose(pred, run) {
      const truth = Array.from(run.s.dw3).map(Math.abs);
      const mine = pred.map(([, y]) => Math.abs(y));
      if (Math.max(...truth) > 5 && Math.max(0, ...mine) < 2)
        return {
          fr: 'G3 est loin de G1, mais il **oscille quand même** : le choc excite le mode **inter-zones**, où toute la zone 1 oscille contre toute la zone 2 autour de 0,7 Hz. Ces oscillations lentes traversent des centaines de kilomètres ; on les observe partout en Europe avec des PMU.',
          en: 'G3 is far from G1, yet it **oscillates too**: the kick excites the **inter-area** mode, where all of area 1 swings against all of area 2 at about 0.7 Hz. These slow oscillations cross hundreds of kilometres; PMUs see them all over Europe.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'model',
      title: { fr: 'Le modèle linéaire', en: 'The linear model' },
      tex: () => `\\frac{2H_i}{\\omega_0}\\Delta\\ddot\\delta_i = -\\sum_j K_{ij}\\,\\Delta\\delta_j - D\\,\\Delta\\omega_i, \\qquad K_{ij} = \\frac{\\partial P_{e,i}}{\\partial \\delta_j}`,
      note: (c) =>
        c.tr({
          fr: 'Chaque machine est une masse ; le réseau, réduit à leurs nœuds internes, agit comme un ensemble de ressorts $K_{ij}$ (coefficients synchronisants). C’est le modèle « classique » de la leçon 8.1, linéarisé comme en 3.3.',
          en: 'Each machine is a mass; the network, reduced to their internal nodes, acts as a set of springs $K_{ij}$ (synchronising coefficients). This is the “classical” model of lesson 8.1, linearised as in 3.3.',
        }),
      derive: (c) => {
        const K = (c.k as TwoAreaInfo).K;
        return [
          `\\text{${c.tr({ fr: 'Coefficients synchronisants (pu/rad) :', en: 'Synchronising coefficients (pu/rad):' })}}`,
          `K = \\begin{pmatrix}${K.map((r) => r.map((v) => v.toFixed(2)).join(' & ')).join('\\\\')}\\end{pmatrix}`,
          `\\textstyle\\sum_j K_{ij} = 0 \\;\\Rightarrow\\; \\text{${c.tr({ fr: 'mode rigide (même angle partout)', en: 'rigid mode (same angle everywhere)' })}}`,
        ];
      },
    },
    {
      id: 'modes',
      title: { fr: 'Les modes', en: 'The modes' },
      tex: (c) => {
        const k = c.k as TwoAreaInfo;
        return k.modes.map((m) => `f_{${['iz', 'l1', 'l2'][m.kind]}} = ${c.q(m.freq, 'Hz', 3)}\\ (\\zeta = ${c.q(100 * m.zeta, '%', 2)})`).join(',\\quad ');
      },
      note: (c) =>
        c.tr({
          fr: 'Quatre machines donnent trois modes oscillants (plus le mode rigide) : deux modes locaux, une machine contre sa voisine, et un mode inter-zones, une zone contre l’autre.',
          en: 'Four machines give three oscillating modes (plus the rigid mode): two local modes, one machine against its neighbour, and one inter-area mode, one area against the other.',
        }),
    },
    {
      id: 'shape',
      title: { fr: 'La forme modale', en: 'The mode shape' },
      tex: (c) => {
        const m = modeOf(c.k as TwoAreaInfo, c.p.mode);
        return `v = (${m.shape.map((v) => v.toFixed(2)).join(',\\ ')})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le vecteur propre dit qui oscille, et contre qui : des composantes de signes opposés oscillent en opposition. C’est là qu’il faut placer un PSS : sur les machines qui participent le plus au mode (leçon 8.2).',
          en: 'The eigenvector says who swings, and against whom: components of opposite sign swing in opposition. That is where a PSS belongs: on the machines that participate most in the mode (lesson 8.2).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la vitesse de G3', en: 'Predict G3’s speed' },
      body: {
        fr: `On donne un petit choc de vitesse à **G1**, dans la zone 1. **Dessinez l’écart de vitesse de G3**, à l’autre bout de la liaison, puis révélez.`,
        en: `A small speed kick is given to **G1**, in area 1. **Sketch the speed deviation of G3**, at the far end of the tie line, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'shape',
      title: { fr: 'Zone contre zone', en: 'Area against area' },
      body: {
        fr: `Affichez le mode **inter-zones** : G1 et G2 ont le même signe, G3 et G4 le signe opposé. Puis affichez un mode **local** : seules deux machines d’une même zone y participent.`,
        en: `Show the **inter-area** mode: G1 and G2 share a sign, G3 and G4 have the opposite one. Then show a **local** mode: only two machines of one area take part.`,
      },
      check: (lab) => lab.params.mode !== MODE_KIND.inter,
    },
    {
      id: 'weak',
      title: { fr: 'Une liaison plus faible', en: 'A weaker tie' },
      body: {
        fr: `Allongez la liaison ($X_t \\ge 1{,}8$ pu) : le mode inter-zones descend sous **0,5 Hz**, alors que les modes locaux ne bougent presque pas.`,
        en: `Lengthen the tie ($X_t \\ge 1.8$ pu): the inter-area mode drops below **0.5 Hz**, while the local modes barely move.`,
      },
      check: (lab) => lab.params.Xt >= 1.8 && inter(lab).freq < 0.5,
    },
    {
      id: 'transfer',
      title: { fr: 'Plus de transit', en: 'More transfer' },
      body: {
        fr: `Remettez $X_t = 1$ pu et poussez le transit au-delà de **0,8 pu** : l’angle aux bornes de la liaison augmente, son « ressort » s’assouplit et le mode ralentit encore. Les réseaux chargés oscillent plus lentement.`,
        en: `Set $X_t = 1$ pu again and push the transfer beyond **0.8 pu**: the angle across the tie grows, its “spring” softens and the mode slows further. Heavily loaded grids oscillate more slowly.`,
      },
      check: (lab) => Math.abs(lab.params.Xt - 1) < 0.1 && lab.params.Ptie >= 0.8,
    },
    {
      id: 'local',
      title: { fr: 'Exciter un mode local', en: 'Exciting a local mode' },
      body: {
        fr: `Perturbez **G3** et affichez le mode **local 2** : sur l’oscilloscope, G3 oscille vite contre G4, par-dessus l’oscillation lente entre zones.`,
        en: `Kick **G3** and show the **local 2** mode: on the oscilloscope, G3 swings fast against G4, on top of the slow oscillation between areas.`,
      },
      check: (lab) => lab.params.kick === 2 && lab.params.mode === MODE_KIND.local2,
    },
    {
      id: 'damp',
      title: { fr: 'Amortir', en: 'Damping' },
      body: {
        fr: `Augmentez l’amortissement jusqu’à ce que le mode inter-zones atteigne **5 %**. Sur un vrai réseau, cet amortissement vient des PSS (leçon 8.2) ou d’onduleurs (POD), placés là où la forme modale est grande.`,
        en: `Raise damping until the inter-area mode reaches **5 %**. On a real grid this damping comes from PSSs (lesson 8.2) or inverters (POD), placed where the mode shape is large.`,
      },
      check: (lab) => inter(lab).zeta >= 0.05,
    },
  ],
};
