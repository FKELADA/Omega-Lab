// Module 8.8 — Modes and participation factors on real networks, from G2ELin's
// full models (results baked into the app, see scripts/bake-g2elin.mjs).

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { CATEGORY_COLOR, MAX_MACHINES, modesInfo, modesModel, NETWORK_IDS, NETWORKS, type ModesInfo } from '../../lib/models/g2data';
import ModeList from './ModeList.svelte';
import Participation from './Participation.svelte';
import ShapeMap from './ShapeMap.svelte';

const SHORT: Record<string, { fr: string; en: string }> = {
  kundur_two_area: { fr: 'Kundur', en: 'Kundur' },
  kundur_two_area_classic: { fr: 'Kundur classique', en: 'Kundur classical' },
  wscc9_3sm: { fr: 'WSCC 9', en: 'WSCC 9' },
  wscc9_2sm_1gfm: { fr: 'WSCC 9 + formeur', en: 'WSCC 9 + GFM' },
  wscc9_1sm_2gfl: { fr: 'WSCC 9 + suiveurs', en: 'WSCC 9 + GFL' },
  ieee39: { fr: 'IEEE 39', en: 'IEEE 39' },
};
const PALETTE = ['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i', '--c-a', '--c-n', '--c-b', '--c-c'];
const zetaLine = (z: number): [number, number][] => [[0, 0], [(-z * 2 * Math.PI * 3) / Math.sqrt(1 - z * z), 3]];
const sel = (lab: { info: unknown }) => (lab.info as ModesInfo).sel;
const netIs = (lab: { params: Record<string, number> }, id: string) => NETWORK_IDS[lab.params.net] === id;

export const modesLesson: Experiment = {
  id: 'modes',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.8 Modes et participations', en: '8.8 Modes and participation' },
  ],
  title: { fr: 'Modes et facteurs de participation sur des réseaux réels (G2ELin)', en: 'Modes and participation factors on real networks (G2ELin)' },
  model: modesModel,
  info: modesInfo,
  canvas: ModeList,
  instruments: [Chart0, Participation, ShapeMap],

  params: [
    {
      id: 'net',
      symbol: '\\text{réseau}',
      name: { fr: 'Réseau', en: 'Network' },
      unit: '',
      min: 0,
      max: NETWORK_IDS.length - 1,
      default: 0,
      scale: 'lin',
      choices: NETWORK_IDS.map((id, j) => ({ value: j, label: SHORT[id] })),
    },
    { id: 'mode', sweep: false, symbol: 'k', name: { fr: 'Mode étudié (n° dans la liste)', en: 'Mode studied (number in the list)' }, unit: '', min: 1, max: 20, default: 1, scale: 'lin', step: 1, term: 'p' },
    { id: 'kick', sweep: false, symbol: 'G_i', name: { fr: 'Machine perturbée', en: 'Machine kicked' }, unit: '', min: 1, max: MAX_MACHINES, default: 1, scale: 'lin', step: 1, term: 'S' },
  ],

  signals: Array.from({ length: MAX_MACHINES }, (_, j) => ({
    id: `w${j + 1}`,
    symbol: `\\Delta f_{G${j + 1}}`,
    name: { fr: `Vitesse de G${j + 1} (en mHz)`, en: `G${j + 1} speed (mHz)` },
    unit: 'mHz',
    color: PALETTE[j],
    on: j < 4,
  })),

  charts: [
    {
      title: { fr: 'Valeurs propres (plan s)', en: 'Eigenvalues (s-plane)' },
      x: { label: 'σ', unit: '1/s', range: (lab) => [Math.min(-1, ...(lab.info as ModesInfo).modes.map((m) => m.re)) * 1.1, 0.5] },
      y: { label: 'f', unit: 'Hz', range: [0, 3.2] },
      series: () => [
        { label: { fr: 'ζ = 5 %', en: 'ζ = 5 %' }, color: '--warn', pts: zetaLine(0.05), dash: true, width: 1 },
        { label: { fr: 'ζ = 10 %', en: 'ζ = 10 %' }, color: '--good', pts: zetaLine(0.1), dash: true, width: 1 },
        { color: '--muted', pts: [[0, 0], [0, 3.2]], width: 1 },
      ],
      points: (lab) => {
        const k = lab.info as ModesInfo;
        return k.modes.map((m, j) => ({ x: m.re, y: m.f, color: CATEGORY_COLOR[m.category] ?? '--muted', hollow: j !== k.index, label: j === k.index ? `${j + 1}` : undefined }));
      },
      note: () => ({
        fr: 'Couleur : nature du mode (violet synchronisme, orange régulation, rose électrique). Un mode à droite de la ligne orange est mal amorti.',
        en: 'Colour: nature of the mode (purple synchronisation, orange control, pink electrical). A mode right of the orange line is poorly damped.',
      }),
    },
  ],

  equations: [
    {
      id: 'modal',
      title: { fr: 'Analyse modale', en: 'Modal analysis' },
      tex: (c) => {
        const k = c.k as ModesInfo;
        return `\\dot{\\Delta x} = A\\,\\Delta x, \\quad A = V\\Lambda W, \\qquad n = ${k.net.nStates}\\ \\text{états}, \\quad \\lambda_{${k.index + 1}} = ${c.q(k.sel.re, '', 3)} \\pm j\\,${c.q(Math.abs(k.sel.im), '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le modèle complet de G2ELin, linéarisé autour du point de fonctionnement (leçon 3.3) : chaque valeur propre est un mode, chaque colonne de $V$ (vecteur propre à droite) dit comment les états y participent en amplitude et en phase.',
          en: 'G2ELin’s full model, linearised around the operating point (lesson 3.3): each eigenvalue is a mode, each column of $V$ (right eigenvector) says how the states take part in amplitude and phase.',
        }),
    },
    {
      id: 'damping',
      title: { fr: 'Fréquence et amortissement', en: 'Frequency and damping' },
      tex: (c) => {
        const m = (c.k as ModesInfo).sel;
        return `f = \\frac{\\omega}{2\\pi} = ${c.q(m.f, 'Hz', 3)}, \\qquad \\zeta = \\frac{-\\sigma}{\\sqrt{\\sigma^2 + \\omega^2}} = ${c.q(m.zeta, '%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les gestionnaires visent au moins 5 % d’amortissement pour les modes électromécaniques ; sous 3 %, une oscillation met plus de dix périodes à s’éteindre.',
          en: 'Operators aim for at least 5 % damping on electromechanical modes; below 3 %, an oscillation takes more than ten periods to die out.',
        }),
    },
    {
      id: 'participation',
      title: { fr: 'Facteurs de participation', en: 'Participation factors' },
      tex: () => `p_{ki} = \\frac{|v_{ki}\\,w_{ik}|}{\\sum_j |v_{ji}\\,w_{ij}|}, \\qquad \\sum_k p_{ki} = 1`,
      note: (c) =>
        c.tr({
          fr: 'Ils combinent l’observabilité (vecteur à droite) et la commandabilité (vecteur à gauche) : ils disent quels états « font » le mode. C’est là qu’il faut agir — par exemple placer un PSS sur la machine qui participe le plus au mode inter-zones.',
          en: 'They combine observability (right eigenvector) and controllability (left eigenvector): they say which states “make” the mode. That is where to act — for example, put a PSS on the machine that takes part most in the inter-area mode.',
        }),
    },
    {
      id: 'shape',
      title: { fr: 'Forme modale', en: 'Mode shape' },
      tex: (c) => {
        const k = c.k as ModesInfo;
        const entries = Object.entries(k.shape ?? {}).sort((a, b) => b[1][0] - a[1][0]).slice(0, 4);
        return `v_{\\theta} = \\left(${entries.map(([u, [a, ph]]) => `\\text{${u.replace('_', ' ')}}: ${c.q(a, '', 2)}\\angle ${c.q(ph, '°', 3)}`).join(',\\ ')}\\right)`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les composantes du vecteur propre sur les angles des unités : des phases opposées indiquent des groupes qui oscillent les uns contre les autres.',
          en: 'The eigenvector components on the units’ angles: opposite phases mark groups that swing against each other.',
        }),
    },
    {
      id: 'categories',
      title: { fr: 'La nature des modes', en: 'The nature of modes' },
      personas: ['research', 'utility'],
      tex: () => `\\text{synchronisme} \\cdot \\text{régulation} \\cdot \\text{électrique (machine)} \\cdot \\text{réseau}`,
      note: (c) =>
        c.tr({
          fr: 'G2ELin classe chaque mode selon les états qui y participent : équations du mouvement et PLL (synchronisme), régulateurs AVR, PSS, gouverneurs et boucles d’onduleurs (régulation), flux et amortisseurs (électrique), courants et tensions du réseau (réseau). Les modes de réseau, très rapides, sont hors de ce graphique.',
          en: 'G2ELin classifies each mode by the states that take part: swing equations and PLLs (synchronisation), AVRs, PSSs, governors and inverter loops (control), fluxes and dampers (electrical), network currents and voltages (network). The very fast network modes are outside this chart.',
        }),
    },
  ],

  steps: [
    {
      id: 'interarea',
      title: { fr: 'Le mode inter-zones', en: 'The inter-area mode' },
      body: {
        fr: `Sur le réseau de Kundur (modèle détaillé), cliquez sur le mode de **synchronisme sous 1 Hz** : c’est le mode inter-zones. Sur la carte, les machines des deux zones pointent dans des directions opposées.`,
        en: `On Kundur’s network (detailed model), click the **synchronisation mode below 1 Hz**: this is the inter-area mode. On the map, the machines of the two areas point in opposite directions.`,
      },
      check: (lab) => netIs(lab, 'kundur_two_area') && sel(lab).category === 'synchronisation' && sel(lab).f < 1,
    },
    {
      id: 'local',
      title: { fr: 'Un mode local', en: 'A local mode' },
      body: {
        fr: `Choisissez un mode de synchronisme **au-dessus de 1 Hz** : seules deux machines d’une même zone y participent vraiment, l’une contre l’autre.`,
        en: `Choose a synchronisation mode **above 1 Hz**: only two machines of the same area really take part, one against the other.`,
      },
      check: (lab) => netIs(lab, 'kundur_two_area') && sel(lab).category === 'synchronisation' && sel(lab).f > 1,
    },
    {
      id: 'control',
      title: { fr: 'Un mode de régulation', en: 'A control mode' },
      body: {
        fr: `Choisissez un mode de **régulation** ou **électrique** : ses participations ne sont plus les angles et vitesses, mais les états des régulateurs ou les flux des machines.`,
        en: `Choose a **control** or **electrical** mode: its participations are no longer angles and speeds, but regulator states or machine fluxes.`,
      },
      check: (lab) => ['control', 'unit_electrical'].includes(sel(lab).category),
    },
    {
      id: 'free',
      title: { fr: 'Une réponse libre', en: 'A free response' },
      body: {
        fr: `Sur Kundur, perturbez **G3** et parcourez les 12 secondes : toutes les machines oscillent, et l’oscillation lente qui dure est le mode inter-zones.`,
        en: `On Kundur, kick **G3** and scrub through the 12 seconds: every machine oscillates, and the slow oscillation that lasts is the inter-area mode.`,
      },
      check: (lab) => netIs(lab, 'kundur_two_area') && lab.params.kick === 3 && lab.maxFrac > 0.8,
    },
    {
      id: 'classic',
      title: { fr: 'Sans régulateurs', en: 'Without regulators' },
      body: {
        fr: `Passez au **modèle classique** de Kundur (sans AVR, PSS ni amortisseurs) : le mode inter-zones y est **instable**. C’est le PSS du modèle détaillé qui l’amortit.`,
        en: `Switch to Kundur’s **classical model** (no AVR, PSS or dampers): the inter-area mode is **unstable** there. The detailed model’s PSS is what damps it.`,
      },
      check: (lab) => netIs(lab, 'kundur_two_area_classic') && sel(lab).category === 'synchronisation' && sel(lab).f < 1 && sel(lab).zeta < 0,
    },
    {
      id: 'inverters',
      title: { fr: 'Avec des onduleurs', en: 'With inverters' },
      body: {
        fr: `Comparez le réseau WSCC 9 nœuds à **3 alternateurs** et sa version où un alternateur est remplacé par un **onduleur formeur**. Un nouveau mode apparaît, dominé par le formeur, et les modes des alternateurs changent.`,
        en: `Compare the WSCC 9-bus network with **3 generators** and its version where one generator is replaced by a **grid-forming inverter**. A new mode appears, dominated by the grid-forming unit, and the generators’ modes change.`,
      },
      check: (lab) => !!lab.flags.net_wscc9_3sm && !!lab.flags.net_wscc9_2sm_1gfm,
    },
    {
      id: 'ieee39',
      title: { fr: 'Un grand réseau', en: 'A large network' },
      body: {
        fr: `Sur le réseau **IEEE 39 nœuds** (403 états), trouvez un mode de synchronisme amorti à **moins de 5 %**. Regardez quelles machines y participent : c’est là qu’un stabilisateur serait le plus utile.`,
        en: `On the **IEEE 39-bus** network (403 states), find a synchronisation mode damped **below 5 %**. Look at which machines take part: that is where a stabiliser would help most.`,
      },
      check: (lab) => netIs(lab, 'ieee39') && sel(lab).category === 'synchronisation' && sel(lab).zeta < 5,
    },
  ],
};
