// Module 7.6 — HVDC and the modular multilevel converter: nearest-level
// modulation, capacitor-voltage balancing, sub-module sizing, DC faults.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import Chart2 from '../../lib/instruments/charts/Chart2.svelte';
import type { Experiment } from '../../lib/lab/types';
import { dcFaultCurrent, MMC, mmcCaps, mmcInfo, mmcModel, MMC_SM, nlmThd, type MmcInfo } from '../../lib/models/module7c';
import MmcCanvas from './MmcCanvas.svelte';

const thdCurve: [number, number][] = Array.from({ length: 11 }, (_, j) => [4 + 2 * j, 100 * nlmThd(4 + 2 * j)]);

export const mmcLesson: Experiment = {
  id: 'mmc',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.6 CCHT et MMC', en: '7.6 HVDC and MMC' },
  ],
  title: { fr: 'Le convertisseur modulaire multiniveau des liaisons CCHT', en: 'The modular multilevel converter of HVDC links' },
  model: mmcModel,
  info: mmcInfo,
  canvas: MmcCanvas,
  instruments: [Chart0, Chart1, Chart2],

  params: [
    { id: 'N', symbol: 'N', name: { fr: 'Sous-modules par bras', en: 'Sub-modules per arm' }, unit: '', min: 4, max: 24, default: 10, scale: 'lin', step: 2, term: 'C' },
    { id: 'C', symbol: 'C_{SM}', name: { fr: 'Capacité d’un sous-module', en: 'Sub-module capacitance' }, unit: 'mF', min: 0.1, max: 3, default: 0.4, scale: 'log', term: 'C' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance transmise', en: 'Power transmitted' }, unit: 'MW', min: 0, max: 1000, default: 600, scale: 'lin', term: 'p' },
    {
      id: 'balance',
      symbol: '\\text{tri}',
      name: { fr: 'Équilibrage des condensateurs', en: 'Capacitor balancing' },
      unit: '',
      min: 0,
      max: 1,
      default: 1,
      scale: 'lin',
      choices: [
        { value: 1, label: { fr: 'Tri des tensions', en: 'Voltage sorting' } },
        { value: 0, label: { fr: 'Ordre fixe', en: 'Fixed order' } },
      ],
    },
    {
      id: 'sm',
      symbol: '\\text{SM}',
      name: { fr: 'Type de sous-module', en: 'Sub-module type' },
      unit: '',
      min: 0,
      max: 1,
      default: MMC_SM.half,
      scale: 'lin',
      choices: [
        { value: MMC_SM.half, label: { fr: 'Demi-pont', en: 'Half-bridge' } },
        { value: MMC_SM.full, label: { fr: 'Pont complet', en: 'Full-bridge' } },
      ],
    },
  ],

  signals: [
    { id: 'vac', symbol: 'v_{ac}', name: { fr: 'Tension de sortie (escalier)', en: 'Output voltage (staircase)' }, unit: 'kV', color: '--c-C', on: true, term: 'C' },
    { id: 'vref', symbol: 'v^*', name: { fr: 'Référence', en: 'Reference' }, unit: 'kV', color: '--c-S', on: true, dash: true },
    { id: 'upMax', symbol: 'v_{c,max}', name: { fr: 'Condensateur le plus chargé (bras haut)', en: 'Highest capacitor (upper arm)' }, unit: 'kV ', color: '--c-R', on: false, term: 'R' },
    { id: 'upMin', symbol: 'v_{c,min}', name: { fr: 'Condensateur le moins chargé (bras haut)', en: 'Lowest capacitor (upper arm)' }, unit: 'kV ', color: '--c-L', on: false, term: 'L' },
    { id: 'iu', symbol: 'i_u', name: { fr: 'Courant du bras haut', en: 'Upper-arm current' }, unit: 'kA', color: '--c-i', on: false, term: 'i' },
  ],

  charts: [
    {
      title: { fr: 'Tensions des sous-modules du bras haut', en: 'Upper-arm sub-module voltages' },
      x: { label: 'SM', range: [0, 25] },
      y: { label: 'vc', unit: 'kV', range: (lab) => {
        const v0 = MMC.Vdc / Math.round(lab.params.N);
        return [v0 * 0.7, v0 * 1.3];
      } },
      series: (lab) => {
        const caps = mmcCaps(lab.params, lab.t);
        const v0 = MMC.Vdc / Math.round(lab.params.N);
        const bars: [number, number][] = [];
        caps.forEach((v, j) => bars.push([j + 1, v0 * 0.7], [j + 1, v], [j + 1, v0 * 0.7]));
        return [
          { color: '--c-C', pts: bars, width: 6 },
          { label: { fr: 'nominal Vdc/N', en: 'nominal Vdc/N' }, color: '--muted', pts: [[0, v0], [25, v0]], dash: true, width: 1 },
        ];
      },
      note: (lab) =>
        lab.params.balance
          ? { fr: 'Avec le tri, on insère les condensateurs les moins chargés quand le courant les charge, et inversement : ils restent groupés.', en: 'With sorting, the least-charged capacitors are inserted when the current charges them, and vice versa: they stay together.' }
          : { fr: 'En ordre fixe, certains sous-modules sont insérés plus souvent : leurs tensions divergent.', en: 'In fixed order, some sub-modules are inserted more often: their voltages drift apart.' },
    },
    {
      title: { fr: 'Distorsion selon le nombre de sous-modules', en: 'Distortion versus number of sub-modules' },
      x: { label: 'N', range: [4, 24] },
      y: { label: 'DHT', unit: '%', range: [0, 25] },
      series: () => [{ color: '--c-C', pts: thdCurve }],
      points: (lab) => [{ x: Math.round(lab.params.N), y: 100 * (lab.info as MmcInfo).thd, color: '--accent' }],
      note: () => ({ fr: 'Les MMC réels ont 200 à 400 sous-modules par bras : la tension est quasi sinusoïdale, sans filtre.', en: 'Real MMCs have 200–400 sub-modules per arm: the voltage is nearly sinusoidal, without a filter.' }),
    },
    {
      title: { fr: 'Défaut côté continu (illustratif)', en: 'DC-side fault (illustrative)' },
      x: { label: 't', unit: 'ms', range: [-2, 20] },
      y: { label: 'idc', unit: 'kA', range: [0, 16] },
      series: (lab) => {
        const pts = (sm: number): [number, number][] => Array.from({ length: 111 }, (_, j) => [-2 + j * 0.2, dcFaultCurrent(sm, -2 + j * 0.2)]);
        return [
          { label: { fr: 'demi-pont', en: 'half-bridge' }, color: '--warn', pts: pts(MMC_SM.half), width: lab.params.sm === MMC_SM.half ? 2.5 : 1.2, dash: lab.params.sm !== MMC_SM.half },
          { label: { fr: 'pont complet', en: 'full-bridge' }, color: '--good', pts: pts(MMC_SM.full), width: lab.params.sm === MMC_SM.full ? 2.5 : 1.2, dash: lab.params.sm !== MMC_SM.full },
        ];
      },
      vlines: () => [{ x: 0, label: 'défaut' }, { x: 2, label: 'blocage' }],
      note: () => ({
        fr: 'Bloqué, un demi-pont laisse ses diodes former un redresseur : le réseau alternatif alimente le défaut. Un pont complet insère une tension négative et éteint le courant.',
        en: 'Once blocked, a half-bridge leaves its diodes forming a rectifier: the AC grid feeds the fault. A full-bridge inserts a negative voltage and extinguishes the current.',
      }),
    },
  ],

  equations: [
    {
      id: 'nlm',
      title: { fr: 'Modulation au plus proche niveau', en: 'Nearest-level modulation' },
      tex: (c) => `n_{haut} = \\mathrm{round}\\!\\Big(\\frac{N}{2}\\big(1 - \\frac{v^*}{V_{dc}/2}\\big)\\Big), \\quad n_{bas} = N - n_{haut}, \\qquad ${Math.round(c.p.N) + 1}\\ \\text{niveaux}`,
      note: (c) =>
        c.tr({
          fr: 'Chaque bras est une pile de petits convertisseurs à condensateur. En insérant plus ou moins de sous-modules, on fabrique un escalier qui suit la sinusoïde. Chaque interrupteur commute rarement : très peu de pertes.',
          en: 'Each arm is a stack of small capacitor converters. Inserting more or fewer sub-modules builds a staircase that follows the sine wave. Each switch commutates rarely: very low losses.',
        }),
    },
    {
      id: 'thd',
      title: { fr: 'Qualité de la tension', en: 'Voltage quality' },
      tex: (c) => `\\mathrm{DHT} = ${c.q(100 * (c.k as MmcInfo).thd, '%', 3)} \\quad (N = ${Math.round(c.p.N)})`,
      note: (c) =>
        c.tr({
          fr: 'Plus de sous-modules, plus de marches, moins d’harmoniques. Comparer avec l’onduleur à deux niveaux de la leçon 6.3, qui a besoin d’un filtre.',
          en: 'More sub-modules, more steps, fewer harmonics. Compare with the two-level inverter of lesson 6.3, which needs a filter.',
        }),
    },
    {
      id: 'balance',
      title: { fr: 'Équilibrer les condensateurs', en: 'Balancing the capacitors' },
      tex: (c) => {
        const k = c.k as MmcInfo;
        return `C\\frac{dv_{c,j}}{dt} = s_j\\,i_{bras}, \\qquad \\text{dispersion} = ${c.q(k.spread, '%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un sous-module inséré se charge ou se décharge selon le signe du courant de bras. Le tri choisit, à chaque instant, lesquels insérer pour garder toutes les tensions égales.',
          en: 'An inserted sub-module charges or discharges according to the sign of the arm current. Sorting chooses, at every instant, which ones to insert to keep all voltages equal.',
        }),
    },
    {
      id: 'ripple',
      title: { fr: 'Dimensionner les condensateurs', en: 'Sizing the capacitors' },
      tex: (c) => `\\Delta v_c = ${c.q((c.k as MmcInfo).ripple, '%', 3)}, \\qquad W = 6N\\cdot\\tfrac12 C v_c^2 = ${c.q((6 * Math.round(c.p.N) * 0.5 * c.p.C * 1e-3 * (MMC.Vdc / Math.round(c.p.N)) ** 2 * 1e6) / 1e6, 'MJ', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'L’énergie stockée dans les sous-modules se compte en dizaines de kJ par MVA ; ce sont les plus gros composants du poste. Moins de capacité, plus d’ondulation.',
          en: 'Energy stored in the sub-modules is counted in tens of kJ per MVA; they are the largest components of the station. Less capacitance, more ripple.',
        }),
    },
    {
      id: 'hvdc',
      title: { fr: 'LCC ou VSC', en: 'LCC or VSC' },
      personas: ['utility', 'research'],
      tex: () => `\\text{LCC: thyristors, réseau fort, filtres} \\qquad \\text{VSC–MMC: IGBT, P et Q indépendants, démarrage à vide}`,
      note: (c) =>
        c.tr({
          fr: 'Les liaisons à thyristors (leçon 6.2) transportent les plus fortes puissances mais consomment du réactif et exigent un réseau fort. Les MMC peuvent alimenter un réseau faible ou isolé, et s’assembler en réseaux continus multiterminaux — à condition de savoir couper un courant continu (disjoncteurs CC).',
          en: 'Thyristor links (lesson 6.2) carry the highest powers but absorb reactive power and require a strong grid. MMCs can supply a weak or isolated grid, and be assembled into multi-terminal DC grids — provided a DC current can be interrupted (DC breakers).',
        }),
    },
  ],

  steps: [
    {
      id: 'staircase',
      title: { fr: 'L’escalier', en: 'The staircase' },
      body: {
        fr: `Observez la tension de sortie : un escalier de $N + 1$ niveaux qui suit la référence. Montez $N$ à **20** ou plus : la distorsion passe sous **5 %**.`,
        en: `Look at the output voltage: a staircase of $N + 1$ levels following the reference. Raise $N$ to **20** or more: distortion falls below **5 %**.`,
      },
      check: (lab) => (lab.info as MmcInfo).thd < 0.05,
    },
    {
      id: 'insertion',
      title: { fr: 'Insérer et retirer', en: 'Inserting and bypassing' },
      body: {
        fr: `Parcourez une période : quand le bras haut insère beaucoup de sous-modules, le bras bas en insère peu. Leur somme reste $N$, et soutient la tension continue.`,
        en: `Scrub through a period: when the upper arm inserts many sub-modules, the lower arm inserts few. Their sum stays $N$, and holds up the DC voltage.`,
      },
      check: (lab) => lab.maxFrac > 0.3,
    },
    {
      id: 'drift',
      title: { fr: 'Sans équilibrage', en: 'Without balancing' },
      body: {
        fr: `Passez en **ordre fixe** : les tensions des condensateurs divergent en quelques périodes (dispersion de plus de 10 %).`,
        en: `Switch to **fixed order**: the capacitor voltages drift apart within a few periods (spread above 10 %).`,
      },
      check: (lab) => lab.params.balance === 0 && (lab.info as MmcInfo).spread > 10,
    },
    {
      id: 'sort',
      title: { fr: 'Le tri', en: 'Sorting' },
      body: {
        fr: `Revenez au **tri des tensions** : toutes les tensions restent groupées à moins de 2 %.`,
        en: `Go back to **voltage sorting**: all voltages stay within 2 % of each other.`,
      },
      check: (lab) => lab.params.balance === 1 && (lab.info as MmcInfo).spread < 2 && !!lab.completed.drift,
    },
    {
      id: 'capacitor',
      title: { fr: 'Des condensateurs trop petits', en: 'Capacitors that are too small' },
      body: {
        fr: `Réduisez la capacité des sous-modules jusqu’à une ondulation de **plus de 20 %** : la tension disponible varie trop pendant la période.`,
        en: `Reduce the sub-module capacitance until the ripple exceeds **20 %**: the available voltage varies too much over the period.`,
      },
      check: (lab) => (lab.info as MmcInfo).ripple > 20,
    },
    {
      id: 'fault',
      title: { fr: 'Un défaut côté continu', en: 'A DC-side fault' },
      body: {
        fr: `Comparez le courant de défaut continu des deux types de sous-modules, puis choisissez le **pont complet** : il éteint le défaut sans disjoncteur CC, au prix de deux fois plus de semi-conducteurs.`,
        en: `Compare the DC fault current of the two sub-module types, then choose the **full-bridge**: it extinguishes the fault without a DC breaker, at the cost of twice as many semiconductors.`,
      },
      check: (lab) => lab.params.sm === MMC_SM.full,
    },
  ],
};
