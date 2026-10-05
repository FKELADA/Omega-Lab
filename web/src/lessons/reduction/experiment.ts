// Module 8.9 — Model reduction: from a full EMT model to RMS (phasor) models and
// ever simpler machines, with G2ELin results baked into the app.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import Chart2 from '../../lib/instruments/charts/Chart2.svelte';
import type { Experiment } from '../../lib/lab/types';
import { emModes, REDUCTION, reductionInfo, reductionModel, type ReductionInfo } from '../../lib/models/g2data';
import LadderCanvas from './LadderCanvas.svelte';

const LEVELS = REDUCTION.levels;
const info = (lab: { info: unknown }) => lab.info as ReductionInfo;
const levelIs = (lab: { info: unknown }, id: string) => info(lab).level === id;
/** Eigenvalue as a point on log–log axes: |σ| and f, floored so real or marginal poles stay on the chart. */
const logPt = ([re, im]: [number, number]) => ({ x: Math.max(1e-3, Math.abs(re)), y: Math.max(0.01, Math.abs(im) / (2 * Math.PI)) });
const MODE_COL = ['--c-p', '--c-R', '--c-S'];
const MODE_NAME = [
  { fr: 'inter-zones', en: 'inter-area' },
  { fr: 'local 1', en: 'local 1' },
  { fr: 'local 2', en: 'local 2' },
];

export const reductionLesson: Experiment = {
  id: 'reduction',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.9 Réduction de modèles', en: '8.9 Model reduction' },
  ],
  title: { fr: 'Réduction de modèles : EMT, RMS et ordres de machine (G2ELin)', en: 'Model reduction: EMT, RMS and machine orders (G2ELin)' },
  model: reductionModel,
  info: reductionInfo,
  canvas: LadderCanvas,
  instruments: [Chart0, Chart1, Chart2],

  params: [
    {
      id: 'level',
      symbol: '\\text{modèle}',
      name: { fr: 'Niveau de modèle', en: 'Model level' },
      unit: '',
      min: 0,
      max: LEVELS.length - 1,
      default: 0,
      scale: 'lin',
      choices: LEVELS.map((L, value) => ({ value, label: { fr: L.id === 'emt' ? 'EMT' : L.id === 'rms' ? 'RMS' : L.id === 'o2' ? 'classique' : `ordre ${L.id.slice(1)}`, en: L.id === 'emt' ? 'EMT' : L.id === 'rms' ? 'RMS' : L.id === 'o2' ? 'classical' : `order ${L.id.slice(1)}` } })),
    },
  ],

  signals: [
    { id: 'dw', symbol: '\\Delta f', name: { fr: 'Vitesse, modèle choisi (en mHz)', en: 'Speed, chosen model (mHz)' }, unit: 'mHz', color: '--c-p', on: true, term: 'p' },
    { id: 'dwEmt', symbol: '\\Delta f_{EMT}', name: { fr: 'Vitesse, EMT complet (référence)', en: 'Speed, full EMT (reference)' }, unit: 'mHz', color: '--muted', on: true, dash: true },
    { id: 'lin', symbol: '\\Delta f_{lin}', name: { fr: 'Vitesse, modèle linéarisé', en: 'Speed, linearised model' }, unit: 'mHz', color: '--c-R', on: false, dash: true, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Valeurs propres de Kundur (échelles log)', en: 'Kundur eigenvalues (log scales)' },
      x: { label: '|σ|', unit: '1/s', range: [1e-3, 1e8], log: true },
      y: { label: 'f', unit: 'Hz', range: [0.01, 1e4], log: true },
      series: () => [],
      vlines: () => [{ x: 2 * Math.PI * 50, label: '50 Hz' }],
      points: (lab) => [
        ...REDUCTION.kundur.emt.all.map((e) => ({ ...logPt(e), color: '--muted', hollow: true })),
        ...REDUCTION.kundur[info(lab).level].all.map((e) => ({ ...logPt(e), color: '--accent' })),
      ],
      note: (lab) => ({
        fr: `Cercles : EMT complet (${REDUCTION.kundur.emt.nStates} états). Points : ${info(lab).kundurStates} états. Chaque réduction retire les valeurs propres les plus rapides (à droite) ; les modes lents, en bas à gauche, restent.`,
        en: `Circles: full EMT (${REDUCTION.kundur.emt.nStates} states). Dots: ${info(lab).kundurStates} states. Each reduction removes the fastest eigenvalues (right); the slow modes, bottom left, stay.`,
      }),
    },
    {
      title: { fr: 'Amortissement des modes électromécaniques', en: 'Damping of the electromechanical modes' },
      x: { label: 'niveau', unit: '', range: [-0.3, LEVELS.length - 0.7] },
      y: { label: 'ζ', unit: '%', range: [-2, 32] },
      bands: () => [{ y0: -2, y1: 5 }],
      series: () =>
        MODE_NAME.map((label, m) => ({
          label,
          color: MODE_COL[m],
          pts: LEVELS.map((L, j) => [j, emModes(REDUCTION.kundur[L.id])[m]?.zeta ?? NaN] as [number, number]),
        })),
      points: (lab) => info(lab).em.slice(0, 3).map((m, j) => ({ x: lab.params.level, y: m.zeta, color: MODE_COL[j], label: `${m.f.toFixed(2)} Hz` })),
      note: () => ({
        fr: 'Niveaux 0 à 5 : EMT, RMS, ordre 6, 4, 3, classique. Jusqu’à l’ordre 4 les modes bougent peu ; le modèle classique perd l’action du PSS et prédit un mode inter-zones presque pas amorti (zone grisée < 5 %).',
        en: 'Levels 0 to 5: EMT, RMS, order 6, 4, 3, classical. Down to order 4 the modes barely move; the classical model loses the PSS’s action and predicts an almost undamped inter-area mode (shaded zone < 5 %).',
      }),
    },
    {
      title: { fr: 'Taille du modèle', en: 'Model size' },
      x: { label: 'niveau', unit: '', range: [-0.3, LEVELS.length - 0.7] },
      y: { label: 'états', unit: '', range: [0, 100] },
      series: () => [
        { label: { fr: 'Kundur', en: 'Kundur' }, color: '--c-S', pts: LEVELS.map((L, j) => [j, REDUCTION.kundur[L.id].nStates] as [number, number]) },
        { label: { fr: 'SMIB', en: 'SMIB' }, color: '--c-C', pts: LEVELS.map((L, j) => [j, REDUCTION.smib[L.id].modal.nStates] as [number, number]) },
      ],
      points: (lab) => [
        { x: lab.params.level, y: info(lab).kundurStates, color: '--c-S', label: `${info(lab).kundurStates}` },
        { x: lab.params.level, y: info(lab).smibStates, color: '--c-C', label: `${info(lab).smibStates}` },
      ],
      note: () => ({
        fr: 'Passer en RMS retire d’un coup les états du réseau (courants des lignes, tensions des condensateurs) : un tiers des états de Kundur.',
        en: 'Going RMS removes the network states at once (line currents, capacitor voltages): a third of Kundur’s states.',
      }),
    },
  ],

  equations: [
    {
      id: 'scales',
      title: { fr: 'Des échelles de temps séparées', en: 'Separated time scales' },
      tex: () => `\\underbrace{\\tau_{\\text{réseau}} \\sim 1\\text{–}10\\ \\text{ms}}_{\\text{EMT}} \\ll \\underbrace{T''_d \\sim 30\\ \\text{ms}}_{\\text{amortisseurs}} \\ll \\underbrace{T'_{d0} \\sim 5\\ \\text{s}}_{\\text{excitation}}, \\quad T_{\\text{méca}} \\sim 1\\ \\text{s}`,
      note: (c) =>
        c.tr({
          fr: 'Un réseau mêle des dynamiques de la milliseconde à la minute. Quand on étudie l’une d’elles, les plus rapides ont déjà atteint leur équilibre : on peut les remplacer par une relation algébrique. C’est la perturbation singulière.',
          en: 'A grid mixes dynamics from milliseconds to minutes. When studying one of them, the faster ones have already settled: they can be replaced by an algebraic relation. This is singular perturbation.',
        }),
    },
    {
      id: 'singular',
      title: { fr: 'Perturbation singulière', en: 'Singular perturbation' },
      tex: () => `\\dot x = f(x, z), \\quad \\varepsilon\\,\\dot z = g(x, z) \\;\\xrightarrow{\\ \\varepsilon \\to 0\\ }\\; 0 = g(x, z)`,
      note: (c) =>
        c.tr({
          fr: '$z$ sont les états rapides (courants du réseau, flux), $x$ les lents (angles, vitesses, flux d’excitation). Le système devient algébro-différentiel, plus petit et surtout moins raide : le pas de calcul peut passer de la microseconde à la milliseconde.',
          en: '$z$ are the fast states (network currents, fluxes), $x$ the slow ones (angles, speeds, field flux). The system becomes differential-algebraic, smaller and above all less stiff: the time step can grow from microseconds to milliseconds.',
        }),
    },
    {
      id: 'rms',
      title: { fr: 'Le réseau quasi-stationnaire (RMS)', en: 'The quasi-stationary network (RMS)' },
      tex: () => `v = R\\,i + L\\frac{di}{dt} \\;\\xrightarrow{\\ \\text{phaseurs}\\ }\\; \\underline V = (R + jX)\\,\\underline I`,
      note: (c) =>
        c.tr({
          fr: 'En RMS, lignes et transformateurs deviennent des impédances : on ne voit plus les transitoires à 50 Hz ni les résonances du réseau. Les modes électromécaniques (0,1 à 2 Hz) ne changent presque pas, la simulation est dix fois plus rapide.',
          en: 'In RMS, lines and transformers become impedances: 50 Hz transients and network resonances disappear. Electromechanical modes (0.1 to 2 Hz) hardly change, and the simulation runs ten times faster.',
        }),
    },
    {
      id: 'orders',
      title: { fr: 'Les ordres de la machine', en: 'Machine orders' },
      tex: (c) => {
        const k = c.k as ReductionInfo;
        return `n_{\\text{SMIB}} = ${k.smibStates}, \\quad n_{\\text{Kundur}} = ${k.kundurStates}, \\qquad \\max|\\Delta f - \\Delta f_{EMT}| = ${c.q(k.gap, 'mHz', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Ordre 6 : flux subtransitoires ; ordre 4 : transitoires d et q ; ordre 3 : flux d’excitation seul ; ordre 2 (classique) : $E\'$ constante, ce qui supprime l’action de l’AVR et du PSS. Chaque marche retire des états — et une partie de la physique.',
          en: 'Order 6: sub-transient fluxes; order 4: transient d and q; order 3: field flux only; order 2 (classical): constant $E\'$, which removes the AVR’s and PSS’s action. Each step removes states — and part of the physics.',
        }),
    },
    {
      id: 'when',
      title: { fr: 'Quand faut-il l’EMT ?', en: 'When is EMT needed?' },
      personas: ['research', 'utility'],
      tex: () => `f_{\\text{phénomène}} \\gtrsim 5\\ \\text{Hz} \\;\\Rightarrow\\; \\text{EMT}`,
      note: (c) =>
        c.tr({
          fr: 'Résonances sous-synchrones (leçon 8.6), interactions entre onduleurs et réseau faible (8.5), boucles de courant et PLL rapides, défauts asymétriques, harmoniques : là, le modèle RMS se trompe ou ne voit rien. Les réseaux riches en onduleurs poussent donc vers l’EMT, ou vers des modèles hybrides.',
          en: 'Sub-synchronous resonance (lesson 8.6), inverter–weak-grid interactions (8.5), fast current loops and PLLs, unbalanced faults, harmonics: there the RMS model is wrong or blind. Inverter-rich grids therefore push towards EMT, or towards hybrid models.',
        }),
    },
  ],

  steps: [
    {
      id: 'emt',
      title: { fr: 'La référence EMT', en: 'The EMT reference' },
      body: {
        fr: `Une machine sur réseau infini subit un **saut de phase de 20°**. Avec le modèle **EMT complet** (31 états), parcourez les 3 secondes : la machine oscille autour de 2 Hz avant de se recaler sur le réseau. Ce calcul a pris près d’une minute à G2ELin.`,
        en: `A machine on an infinite bus sees a **20° phase jump**. With the **full EMT** model (31 states), scrub through the 3 seconds: the machine swings at about 2 Hz before settling back with the grid. This run took G2ELin almost a minute.`,
      },
      check: (lab) => levelIs(lab, 'emt') && lab.maxFrac > 0.8,
    },
    {
      id: 'rms',
      title: { fr: 'Passer en RMS', en: 'Going RMS' },
      body: {
        fr: `Choisissez **RMS** : le réseau devient des phaseurs. La courbe colle à la référence EMT (pointillés), avec un tiers d’états en moins sur Kundur et un calcul environ **dix fois plus rapide**.`,
        en: `Choose **RMS**: the network becomes phasors. The curve sticks to the EMT reference (dashed), with a third fewer states on Kundur and a run about **ten times faster**.`,
      },
      check: (lab) => levelIs(lab, 'rms'),
    },
    {
      id: 'o4',
      title: { fr: 'Simplifier la machine', en: 'Simplifying the machine' },
      body: {
        fr: `Descendez à l’**ordre 4** puis à l’**ordre 3** : les valeurs propres rapides disparaissent du plan, les modes locaux de Kundur ralentissent un peu, mais le mode inter-zones reste bien amorti.`,
        en: `Step down to **order 4** then **order 3**: the fast eigenvalues leave the plane, Kundur’s local modes slow down a little, but the inter-area mode stays well damped.`,
      },
      check: (lab) => !!lab.flags.lvl_o4 && levelIs(lab, 'o3'),
    },
    {
      id: 'classical',
      title: { fr: 'Le modèle classique', en: 'The classical model' },
      body: {
        fr: `Choisissez le **modèle classique** : l’amortissement des modes électromécaniques tombe à **1 %**. Le modèle est trop simple pour l’étude des oscillations — il a perdu le PSS. Il reste utile pour un premier calcul de stabilité transitoire (leçon 8.1).`,
        en: `Choose the **classical model**: damping of the electromechanical modes drops to **1 %**. The model is too simple for oscillation studies — it has lost the PSS. It is still useful for a first transient-stability estimate (lesson 8.1).`,
      },
      check: (lab) => levelIs(lab, 'o2'),
    },
    {
      id: 'linear',
      title: { fr: 'Linéaire ou non', en: 'Linear or not' },
      body: {
        fr: `Affichez la **réponse linéarisée** (en pointillés rouges) : pour un saut de 20°, elle suit la simulation non linéaire à moins de 10 % près. C’est ce qui justifie l’analyse modale de la leçon 8.8.`,
        en: `Show the **linearised response** (red dashes): for a 20° jump it follows the nonlinear simulation within 10 %. This is what justifies the modal analysis of lesson 8.8.`,
      },
      check: (lab) => !!lab.visible.lin,
    },
  ],
};
