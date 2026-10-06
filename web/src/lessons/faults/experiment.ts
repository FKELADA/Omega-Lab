// Module 5.3 — Faults: symmetrical components, sequence networks, grounding,
// fault level and short-circuit ratio.

import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { cabs, cadd } from '../../lib/core/linalg';
import { FAULT, FAULT_TYPES, faultInfo, faultModel, faultSweep, GROUNDING, type FaultInfo } from '../../lib/models/module5';
import FaultCanvas from './FaultCanvas.svelte';
import SeqNetworks from './SeqNetworks.svelte';

const Ibase = (FAULT.Sbase * 1e3) / (Math.sqrt(3) * FAULT.kV); // A

export const faultsLesson: Experiment = {
  id: 'faults',
  path: [
    { fr: 'Module 5 · Le réseau en régime permanent', en: 'Module 5 · The network in steady state' },
    { fr: '5.3 Défauts', en: '5.3 Faults' },
  ],
  title: { fr: 'Courts-circuits : composantes symétriques, mise à la terre et puissance de court-circuit', en: 'Short circuits: symmetrical components, grounding and fault level' },
  model: faultModel,
  info: faultInfo,
  canvas: FaultCanvas,
  instruments: [SeqNetworks, PhasorDiagram, Chart0],

  params: [
    {
      id: 'type',
      symbol: '\\text{type}',
      name: { fr: 'Type de défaut', en: 'Fault type' },
      unit: '',
      min: 0,
      max: 3,
      default: FAULT_TYPES.slg,
      scale: 'lin',
      choices: [
        { value: FAULT_TYPES.tph, label: { fr: 'Triphasé', en: 'Three-phase' } },
        { value: FAULT_TYPES.slg, label: { fr: 'Phase–terre', en: 'Phase-to-ground' } },
        { value: FAULT_TYPES.ll, label: { fr: 'Biphasé', en: 'Phase-to-phase' } },
        { value: FAULT_TYPES.llg, label: { fr: 'Biphasé–terre', en: 'Two-phase-to-ground' } },
      ],
    },
    {
      id: 'ground',
      symbol: 'Z_n',
      name: { fr: 'Neutre du transformateur', en: 'Transformer neutral' },
      unit: '',
      min: 0,
      max: 2,
      default: GROUNDING.solid,
      scale: 'lin',
      choices: [
        { value: GROUNDING.solid, label: { fr: 'À la terre', en: 'Solidly earthed' } },
        { value: GROUNDING.resistance, label: { fr: 'Par résistance', en: 'Resistance earthed' } },
        { value: GROUNDING.isolated, label: { fr: 'Isolé', en: 'Isolated' } },
      ],
    },
    { id: 'km', symbol: 'd', name: { fr: 'Distance du défaut', en: 'Fault distance' }, unit: 'km', min: 0, max: 100, default: 50, scale: 'lin', term: 'L' },
    { id: 'Rf', symbol: 'R_f', name: { fr: 'Résistance de défaut', en: 'Fault resistance' }, unit: 'pu', min: 0, max: 1, default: 0, scale: 'lin', term: 'R' },
  ],

  signals: [
    { id: 'ia', symbol: 'i_a', name: { fr: 'Courant phase a', en: 'Phase a current' }, unit: 'pu', color: '--c-a', on: true, term: 'a' },
    { id: 'ib', symbol: 'i_b', name: { fr: 'Courant phase b', en: 'Phase b current' }, unit: 'pu', color: '--c-b', on: true, term: 'b' },
    { id: 'ic', symbol: 'i_c', name: { fr: 'Courant phase c', en: 'Phase c current' }, unit: 'pu', color: '--c-c', on: true, term: 'c' },
    { id: 'va', symbol: 'v_a', name: { fr: 'Tension phase a au défaut', en: 'Phase a voltage at the fault' }, unit: 'pu', color: '--c-a', on: false, dash: true },
    { id: 'vb', symbol: 'v_b', name: { fr: 'Tension phase b au défaut', en: 'Phase b voltage at the fault' }, unit: 'pu', color: '--c-b', on: false, dash: true },
    { id: 'vc', symbol: 'v_c', name: { fr: 'Tension phase c au défaut', en: 'Phase c voltage at the fault' }, unit: 'pu', color: '--c-c', on: false, dash: true },
  ],

  phasors: {
    omega: () => 2 * Math.PI * 50,
    unit: 'pu',
    rms: true,
    items: (_p, k: FaultInfo) => [
      { id: 'Ia', label: 'Ia', term: 'a', color: '--c-a', value: k.Iabc[0] },
      { id: 'Ib', label: 'Ib', term: 'b', color: '--c-b', value: k.Iabc[1] },
      { id: 'Ic', label: 'Ic', term: 'c', color: '--c-c', value: k.Iabc[2] },
      { id: 'In', label: '3I0', term: 'n', color: '--c-n', value: cadd(cadd(k.Iabc[0], k.Iabc[1]), k.Iabc[2]), thin: true },
    ],
  },

  charts: [
    {
      title: { fr: 'Courant de défaut selon la distance', en: 'Fault current versus distance' },
      x: { label: 'd', unit: 'km', range: [0, 100] },
      y: { label: 'I max', unit: 'pu', range: [0, 5] },
      series: (lab) => [
        { label: { fr: 'triphasé', en: 'three-phase' }, color: '--c-R', pts: faultSweep(lab.params, FAULT_TYPES.tph) },
        { label: { fr: 'phase–terre', en: 'phase–ground' }, color: '--c-a', pts: faultSweep(lab.params, FAULT_TYPES.slg) },
        { label: { fr: 'biphasé', en: 'phase–phase' }, color: '--c-C', pts: faultSweep(lab.params, FAULT_TYPES.ll), dash: true },
        { label: { fr: 'biphasé–terre', en: 'two-phase–ground' }, color: '--c-p', pts: faultSweep(lab.params, FAULT_TYPES.llg), dash: true },
      ],
      points: (lab) => [{ x: lab.params.km, y: (lab.info as FaultInfo).Imax, color: '--accent' }],
      vlines: (lab) => [{ x: lab.params.km }],
      note: () => ({
        fr: 'Plus le défaut est loin, plus l’impédance de la ligne le limite. Le neutre et Rf changent surtout les défauts à la terre.',
        en: 'The further the fault, the more the line impedance limits it. The neutral and Rf mainly affect ground faults.',
      }),
    },
  ],

  predict: {
    signal: 'ia',
    yRange: () => [-14, 14],
    diagnose(pred, run) {
      const tf = FAULT.tFault;
      const truth = Math.max(...Array.from(run.s.ia).filter((_, j) => run.t[j] > tf).map(Math.abs));
      const mine = Math.max(0, ...pred.filter(([t]) => t > tf).map(([, y]) => Math.abs(y)));
      if (mine < 0.45 * truth)
        return {
          fr: 'Un court-circuit n’est limité que par les **réactances** du générateur, du transformateur et de la ligne, pas par la charge : le courant devient **plusieurs fois** le courant de charge. Le premier pic est encore plus haut à cause de la **composante continue** (leçon 4.4).',
          en: 'A short circuit is limited only by the **reactances** of the generator, transformer and line, not by the load: the current becomes **several times** the load current. The first peak is higher still because of the **DC offset** (lesson 4.4).',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'fortescue',
      title: { fr: 'Composantes symétriques', en: 'Symmetrical components' },
      tex: () =>
        `\\begin{bmatrix} I_a \\\\ I_b \\\\ I_c \\end{bmatrix} = \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & a^2 & a \\\\ 1 & a & a^2 \\end{bmatrix} \\begin{bmatrix} I_0 \\\\ I_1 \\\\ I_2 \\end{bmatrix}, \\qquad a = e^{j120^\\circ}`,
      note: (c) =>
        c.tr({
          fr: 'Un défaut déséquilibré se ramène à trois réseaux équilibrés (leçon 2.8), reliés au point de défaut d’une façon propre à chaque type.',
          en: 'An unbalanced fault reduces to three balanced networks (lesson 2.8), joined at the fault point in a way specific to each type.',
        }),
    },
    {
      id: 'connect',
      title: { fr: 'Le courant de ce défaut', en: 'This fault’s current' },
      tex: (c) => {
        const k = c.k as FaultInfo;
        const I = (j: number) => c.q(cabs(k.Iabc[j]), 'pu', 3);
        switch (c.p.type) {
          case FAULT_TYPES.tph:
            return `I_a = \\frac{E}{Z_1 + Z_f} = ${I(0)}`;
          case FAULT_TYPES.slg:
            return `I_a = 3I_0 = \\frac{3E}{Z_1 + Z_2 + Z_0 + 3Z_f} = ${I(0)}`;
          case FAULT_TYPES.ll:
            return `I_b = -I_c = \\frac{-j\\sqrt3\\,E}{Z_1 + Z_2 + Z_f}, \\quad |I_b| = ${I(1)}`;
          default:
            return `I_1 = \\frac{E}{Z_1 + Z_2 \\parallel (Z_0 + 3Z_f)}, \\quad |I_b| = ${I(1)},\\ |I_c| = ${I(2)}`;
        }
      },
      note: (c) =>
        c.tr({
          fr: 'Sans terre ($Z_0$ infini), aucun courant homopolaire ne peut circuler : un défaut phase–terre ne fait presque pas de courant.',
          en: 'Without an earth path ($Z_0$ infinite), no zero-sequence current can flow: a phase-to-ground fault draws almost no current.',
        }),
    },
    {
      id: 'level',
      title: { fr: 'Puissance de court-circuit', en: 'Fault level' },
      tex: (c) => {
        const k = c.k as FaultInfo;
        return `S_{cc} = \\frac{S_b}{|Z_1|} = ${c.q(k.Ssc, 'MVA', 3)}, \\qquad I_{cc} = ${c.q((k.I3ph * Ibase) / 1000, 'kA', 3)}\\ (${FAULT.kV}\\ \\text{kV})`;
      },
      note: (c) =>
        c.tr({
          fr: 'La « force » du réseau en ce point : elle dimensionne les disjoncteurs et fixe la chute de tension quand une charge varie. Elle baisse quand on s’éloigne des sources.',
          en: 'The “strength” of the grid at this point: it sizes the breakers and sets how much the voltage dips when a load changes. It falls as you move away from the sources.',
        }),
    },
    {
      id: 'scr',
      title: { fr: 'Rapport de court-circuit', en: 'Short-circuit ratio' },
      tex: (c) => `\\mathrm{SCR} = \\frac{S_{cc}}{P_n} = ${c.q((c.k as FaultInfo).Ssc / 100, '', 3)}\\quad (P_n = 100\\ \\text{MW})`,
      note: (c) =>
        c.tr({
          fr: 'Pour un parc éolien ou solaire de 100 MW raccordé ici. En dessous de 3 environ, le réseau est dit « faible » : les onduleurs suiveurs de réseau deviennent difficiles à stabiliser (module 7).',
          en: 'For a 100 MW wind or solar plant connected here. Below about 3 the grid is called “weak”: grid-following inverters become hard to stabilise (Module 7).',
        }),
    },
    {
      id: 'ground',
      title: { fr: 'Le neutre et les surtensions', en: 'The neutral and overvoltages' },
      tex: (c) => {
        const k = c.k as FaultInfo;
        return `|V_b| = ${c.q(cabs(k.Vabc[1]), 'pu', 3)}, \\quad |V_c| = ${c.q(cabs(k.Vabc[2]), 'pu', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Neutre isolé : presque pas de courant de défaut, mais les phases saines montent à $\\sqrt3$ pu par rapport à la terre. À la terre : fort courant, phases saines proches de 1 pu. Une résistance de neutre est un compromis.',
          en: 'Isolated neutral: almost no fault current, but the healthy phases rise to $\\sqrt3$ pu to earth. Solidly earthed: large current, healthy phases near 1 pu. A neutral resistor is a compromise.',
        }),
    },
    {
      id: 'peak',
      title: { fr: 'Courant de crête (CEI 60909)', en: 'Peak current (IEC 60909)' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as FaultInfo;
        const kappa = 1.02 + 0.98 * Math.exp((-3) / k.XR);
        return `i_p = \\kappa\\sqrt2\\,I_{cc}, \\quad \\kappa = 1{,}02 + 0{,}98\\,e^{-3R/X} = ${c.q(kappa, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La composante continue dépend du rapport $X/R$ : plus il est grand, plus elle dure et plus le premier pic est haut (jusqu’à $2\\sqrt2\\,I_{cc}$).',
          en: 'The DC offset depends on $X/R$: the larger it is, the longer the offset lasts and the higher the first peak (up to $2\\sqrt2\\,I_{cc}$).',
        }),
    },
    {
      id: 'zbus',
      title: { fr: 'Méthode générale : la matrice Z', en: 'General method: the Z matrix' },
      personas: ['research', 'utility'],
      tex: () => `Z = Y^{-1}, \\qquad I_f = \\frac{V_k^{pre}}{Z_{kk} + Z_f}, \\qquad \\Delta V_i = -Z_{ik}\\,I_f`,
      note: (c) =>
        c.tr({
          fr: 'Sur un réseau maillé, la diagonale de $Z = Y^{-1}$ (leçon 5.1) donne directement l’impédance de Thévenin de chaque nœud : c’est ainsi que les logiciels calculent les courants de défaut partout d’un coup.',
          en: 'On a meshed grid, the diagonal of $Z = Y^{-1}$ (lesson 5.1) gives each bus’s Thevenin impedance directly: this is how software computes fault currents everywhere at once.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le courant de défaut', en: 'Predict the fault current' },
      body: {
        fr: `Une ligne 225 kV porte un courant de charge de 0,5 pu. À $t = 40$ ms, la phase a touche la terre à mi-ligne. **Dessinez le courant de la phase a**, puis révélez.`,
        en: `A 225 kV line carries 0.5 pu of load current. At $t = 40$ ms, phase a touches the ground at mid-line. **Sketch the phase a current**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'tph',
      title: { fr: 'Le défaut triphasé', en: 'The three-phase fault' },
      body: {
        fr: `Passez au défaut **triphasé**. Il reste équilibré : seul le réseau direct intervient. Son courant donne la **puissance de court-circuit** du point.`,
        en: `Switch to the **three-phase** fault. It stays balanced: only the positive network is involved. Its current gives the **fault level** at that point.`,
      },
      check: (lab) => lab.params.type === FAULT_TYPES.tph,
    },
    {
      id: 'isolated',
      title: { fr: 'Neutre isolé', en: 'Isolated neutral' },
      body: {
        fr: `Revenez au défaut **phase–terre** et **isolez le neutre**. Le courant de défaut disparaît presque, mais regardez la tension des phases saines (cartes d’équations) : elle monte vers $\\sqrt3$ pu.`,
        en: `Go back to the **phase-to-ground** fault and **isolate the neutral**. The fault current almost vanishes, but look at the healthy phases’ voltage (equation cards): it rises towards $\\sqrt3$ pu.`,
      },
      check: (lab) => lab.params.type === FAULT_TYPES.slg && lab.params.ground === GROUNDING.isolated && (lab.info as FaultInfo).Imax < 0.05,
    },
    {
      id: 'near',
      title: { fr: 'Plus fort que le triphasé', en: 'Larger than three-phase' },
      body: {
        fr: `Neutre **à la terre**, défaut phase–terre à **10 km ou moins** du poste. Le courant dépasse celui du défaut triphasé : près d’un transformateur étoile–terre, $Z_0$ est plus petit que $Z_1$.`,
        en: `**Solidly earthed** neutral, phase-to-ground fault **10 km or less** from the substation. The current exceeds the three-phase one: near a grounded-star transformer, $Z_0$ is smaller than $Z_1$.`,
      },
      check: (lab) => {
        const k = lab.info as FaultInfo;
        return lab.params.type === FAULT_TYPES.slg && lab.params.ground === GROUNDING.solid && lab.params.km <= 10 && k.Imax > k.I3ph;
      },
    },
    {
      id: 'll',
      title: { fr: 'Le défaut biphasé', en: 'The phase-to-phase fault' },
      body: {
        fr: `Choisissez le défaut **biphasé**. Il ne touche pas la terre : le neutre n’y change rien, et son courant vaut $\\sqrt3/2 \\approx 87\\ \\%$ du triphasé.`,
        en: `Choose the **phase-to-phase** fault. It does not touch the ground: the neutral makes no difference, and its current is $\\sqrt3/2 \\approx 87\\ \\%$ of the three-phase one.`,
      },
      check: (lab) => lab.params.type === FAULT_TYPES.ll,
    },
    {
      id: 'rf',
      title: { fr: 'Un défaut résistant', en: 'A resistive fault' },
      body: {
        fr: `Défaut **phase–terre**, résistance de défaut de **0,5 pu** ou plus (environ 250 Ω : un arbre, un sol sec). Le courant baisse nettement : ces défauts sont les plus difficiles à détecter pour les protections.`,
        en: `**Phase-to-ground** fault with a fault resistance of **0.5 pu** or more (about 250 Ω: a tree, dry soil). The current drops markedly: these faults are the hardest for protection to detect.`,
      },
      check: (lab) => lab.params.type === FAULT_TYPES.slg && lab.params.Rf >= 0.5,
    },
  ],
};
