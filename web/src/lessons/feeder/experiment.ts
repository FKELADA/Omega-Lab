// Module 5.5 — A day on a distribution feeder with PV: time-series power flow,
// voltage rise, reverse flow, local voltage control and hosting capacity.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import type { Lab } from '../../lib/lab/lab.svelte';
import { CONTROLS, FEEDER, feederFlow, feederInfo, feederLoad, feederModel, hostingCurves, pvShape, type FeederInfo } from '../../lib/models/module5';
import FeederCanvas from './FeederCanvas.svelte';

const now = (lab: Lab) => feederFlow(lab.params, (lab.params.pv / 10) * pvShape(lab.t), feederLoad(lab.t));
const KM = 2; // per section
const CTRL_COLORS = ['--c-R', '--c-C', '--c-p', '--c-i'];

export const feederLesson: Experiment = {
  id: 'feeder',
  path: [
    { fr: 'Module 5 · Le réseau en régime permanent', en: 'Module 5 · The network in steady state' },
    { fr: '5.5 Une journée sur un départ', en: '5.5 A day on a feeder' },
  ],
  title: { fr: 'Du solaire sur un départ de distribution : tension, flux inverse, capacité d’accueil', en: 'Solar on a distribution feeder: voltage, reverse flow, hosting capacity' },
  model: feederModel,
  info: feederInfo,
  canvas: FeederCanvas,
  instruments: [Chart0, Chart1],
  timeUnit: 'h',

  params: [
    { id: 'pv', symbol: 'P_{PV}', name: { fr: 'Solaire par nœud (crête)', en: 'Solar per node (peak)' }, unit: 'MW', min: 0, max: 6, default: 2.5, scale: 'lin', term: 'i' },
    {
      id: 'control',
      symbol: '\\text{ctrl}',
      name: { fr: 'Réglage des onduleurs', en: 'Inverter control' },
      unit: '',
      min: 0,
      max: 3,
      default: CONTROLS.none,
      scale: 'lin',
      choices: [
        { value: CONTROLS.none, label: { fr: 'Aucun', en: 'None' } },
        { value: CONTROLS.cosphi, label: { fr: 'cos φ = 0,9', en: 'cos φ = 0.9' } },
        { value: CONTROLS.qv, label: { fr: 'Q(V)', en: 'Q(V)' } },
        { value: CONTROLS.curtail, label: { fr: 'Écrêtement P(V)', en: 'P(V) curtailment' } },
      ],
    },
    { id: 'Vsub', symbol: 'V_{poste}', name: { fr: 'Consigne du régleur en charge', en: 'Tap-changer setpoint' }, unit: 'pu', min: 0.97, max: 1.06, default: 1.03, scale: 'lin', term: 'S' },
    {
      id: 'cable',
      symbol: 'R/X',
      name: { fr: 'Type de ligne', en: 'Line type' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Aérienne', en: 'Overhead' } },
        { value: 1, label: { fr: 'Souterraine', en: 'Underground' } },
      ],
    },
  ],

  signals: [
    { id: 'vEnd', symbol: 'V_5', name: { fr: 'Tension en bout de départ', en: 'Voltage at the feeder end' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'vMid', symbol: 'V_3', name: { fr: 'Tension au milieu', en: 'Mid-feeder voltage' }, unit: 'pu', color: '--c-C', on: false, term: 'C' },
    { id: 'vSub', symbol: 'V_0', name: { fr: 'Tension au poste', en: 'Substation voltage' }, unit: 'pu', color: '--c-S', on: true, dash: true, term: 'S' },
    { id: 'psub', symbol: 'P_0', name: { fr: 'Puissance au poste', en: 'Power at the substation' }, unit: 'MW', color: '--c-R', on: true, term: 'R' },
    { id: 'ppv', symbol: 'P_{PV}', name: { fr: 'Production solaire', en: 'Solar output' }, unit: 'MW', color: '--c-i', on: true, dash: true, term: 'i' },
    { id: 'qpv', symbol: 'Q_{PV}', name: { fr: 'Réactif absorbé par le PV', en: 'Reactive power absorbed by PV' }, unit: 'Mvar', color: '--c-L', on: false, term: 'L' },
  ],

  charts: [
    {
      title: { fr: 'Profil de tension le long du départ', en: 'Voltage profile along the feeder' },
      x: { label: 'x', unit: 'km', range: [0, 10] },
      y: { label: 'V', unit: 'pu', range: [0.9, 1.1] },
      bands: () => [{ y0: 0.95, y1: FEEDER.Vmax }],
      series: (lab) => {
        const k = lab.info as FeederInfo;
        const prof = (f: (j: number) => number) => Array.from({ length: FEEDER.nodes + 1 }, (_, j) => [j * KM, f(j)] as [number, number]);
        return [
          { label: { fr: 'maximum du jour', en: 'daily maximum' }, color: '--warn', pts: prof((j) => Math.max(...k.hours.map((s) => s.V[j]))), dash: true, width: 1.2 },
          { label: { fr: 'minimum du jour', en: 'daily minimum' }, color: '--c-C', pts: prof((j) => Math.min(...k.hours.map((s) => s.V[j]))), dash: true, width: 1.2 },
          { label: { fr: 'à l’heure du curseur', en: 'at the cursor hour' }, color: '--c-p', pts: prof((j) => now(lab).V[j]) },
        ];
      },
      points: (lab) => now(lab).V.map((V, j) => ({ x: j * KM, y: V, color: '--c-p' })),
      note: () => ({
        fr: 'Zone verte : plage de planification ±5 % (la norme EN 50160 admet ±10 %).',
        en: 'Green band: ±5 % planning range (EN 50160 allows ±10 %).',
      }),
    },
    {
      title: { fr: 'Capacité d’accueil selon le réglage', en: 'Hosting capacity by control' },
      x: { label: 'P_PV', unit: 'MW/nœud', range: [0, 6] },
      y: { label: 'V max', unit: 'pu', range: [1, 1.12] },
      series: (lab) => {
        const curves = hostingCurves(lab.params);
        const names = [
          { fr: 'aucun', en: 'none' },
          { fr: 'cos φ fixe', en: 'fixed cos φ' },
          { fr: 'Q(V)', en: 'Q(V)' },
          { fr: 'écrêtement', en: 'curtailment' },
        ];
        return [
          ...curves.map((pts, c) => ({ label: names[c], color: CTRL_COLORS[c], pts, width: c === lab.params.control ? 2.5 : 1.3, dash: c !== lab.params.control })),
          { color: '--warn', pts: [[0, FEEDER.Vmax], [6, FEEDER.Vmax]] as [number, number][], width: 1 },
        ];
      },
      vlines: (lab) => [{ x: lab.params.pv }],
      points: (lab) => [{ x: lab.params.pv, y: (lab.info as FeederInfo).vMax, color: CTRL_COLORS[lab.params.control] }],
      note: (lab) => {
        const k = lab.info as FeederInfo;
        return {
          fr: `Avec ce réglage : environ ${k.hosting.toFixed(1).replace('.', ',')} MW par nœud (${(5 * k.hosting).toFixed(0)} MW sur le départ) avant de dépasser 1,05 pu à 13 h.`,
          en: `With this control: about ${k.hosting.toFixed(1)} MW per node (${(5 * k.hosting).toFixed(0)} MW on the feeder) before exceeding 1.05 pu at 1 pm.`,
        };
      },
    },
  ],

  predict: {
    signal: 'vEnd',
    yRange: () => [0.9, 1.1],
    diagnose(pred, run, p) {
      const noon = pred.filter(([t]) => t >= 11 && t <= 15).map(([, y]) => y);
      const truthNoon = Math.max(...Array.from(run.s.vEnd).filter((_, j) => run.t[j] >= 11 && run.t[j] <= 15));
      if (noon.length && truthNoon > p.Vsub + 0.003 && Math.max(...noon) < p.Vsub)
        return {
          fr: 'On imagine la tension toujours plus basse en bout de ligne. Avec du solaire, c’est faux à midi : la puissance **remonte** vers le poste, et la chute de tension s’inverse en **élévation**. En bout de départ, la tension dépasse celle du poste.',
          en: 'We picture voltage always lower at the far end. With solar, that is wrong at midday: power flows **back** towards the substation, and the voltage drop turns into a **rise**. At the feeder end, voltage exceeds the substation’s.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'drop',
      title: { fr: 'Chute (ou élévation) de tension', en: 'Voltage drop (or rise)' },
      tex: (c) => {
        const s = feederFlow(c.p, (c.p.pv / 10) * pvShape(c.t), feederLoad(c.t));
        return `\\Delta V \\approx \\frac{R\\,P + X\\,Q}{V}, \\qquad V_5 - V_0 = ${c.q(s.V[FEEDER.nodes] - s.V[0], 'pu', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Quand le PV injecte plus que les maisons ne consomment, $P$ change de signe dans chaque tronçon : la tension monte vers le bout du départ au lieu de baisser.',
          en: 'When PV injects more than the homes consume, $P$ changes sign in each section: voltage rises towards the end of the feeder instead of falling.',
        }),
    },
    {
      id: 'rx',
      title: { fr: 'Le rapport R/X', en: 'The R/X ratio' },
      tex: (c) => {
        const Z = c.p.cable === 1 ? FEEDER.Zsec.cable : FEEDER.Zsec.overhead;
        return `\\frac{R}{X} = ${c.q(Z.re / Z.im, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'En distribution, $R$ est du même ordre que $X$ (ou plus grand, en souterrain) : c’est la puissance **active** qui fait bouger la tension, contrairement au transport (leçon 4.9). Absorber du réactif aide, mais moins quand $R/X$ est grand.',
          en: 'In distribution, $R$ is comparable to $X$ (or larger, underground): it is **active** power that moves the voltage, unlike in transmission (lesson 4.9). Absorbing reactive power helps, but less when $R/X$ is large.',
        }),
    },
    {
      id: 'reverse',
      title: { fr: 'Le flux inverse', en: 'Reverse flow' },
      tex: (c) => {
        const s = feederFlow(c.p, (c.p.pv / 10) * pvShape(c.t), feederLoad(c.t));
        return `P_0 = \\sum P_{charge} + P_{pertes} - \\sum P_{PV} = ${c.q(s.Psub, 'MW', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Négatif : le départ exporte vers le réseau amont. Les protections et les régleurs conçus pour un flux descendant peuvent mal fonctionner.',
          en: 'Negative: the feeder exports to the upstream grid. Protection and tap changers designed for downward flow may misbehave.',
        }),
    },
    {
      id: 'qv',
      title: { fr: 'Le réglage Q(V)', en: 'Q(V) control' },
      tex: (c) => {
        const s = feederFlow(c.p, (c.p.pv / 10) * pvShape(c.t), feederLoad(c.t));
        return `Q_{PV} = -\\min\\!\\Big(0{,}48,\\ \\frac{0{,}48}{0{,}05}\\,(V - 1)\\Big) P_n, \\qquad \\sum Q_{abs} = ${c.q(s.Qpv, 'Mvar', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Chaque onduleur absorbe du réactif quand sa tension monte, jusqu’à $\\cos\\varphi = 0{,}9$. Il agit localement, sans communication. Le cos φ fixe absorbe en permanence, même quand ce n’est pas utile, et augmente les pertes.',
          en: 'Each inverter absorbs reactive power as its voltage rises, down to $\\cos\\varphi = 0.9$. It acts locally, without communication. Fixed cos φ absorbs all the time, even when not needed, and increases losses.',
        }),
    },
    {
      id: 'hosting',
      title: { fr: 'Capacité d’accueil', en: 'Hosting capacity' },
      tex: (c) => {
        const k = c.k as FeederInfo;
        return `P_{accueil} \\approx ${c.q(5 * k.hosting, 'MW', 3)}, \\qquad V_{max} = ${c.q(k.vMax, 'pu', 3)},\\ V_{min} = ${c.q(k.vMin, 'pu', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La production qu’un départ peut accueillir sans renforcement. Ici, c’est la tension qui limite ; ailleurs, ce peut être l’échauffement des câbles ou les protections.',
          en: 'The generation a feeder can take without reinforcement. Here voltage is the limit; elsewhere it may be cable heating or protection.',
        }),
    },
    {
      id: 'codes',
      title: { fr: 'Ce que demandent les codes de réseau', en: 'What grid codes require' },
      personas: ['utility', 'research'],
      tex: (c) => `\\text{EN 50160: } 0{,}9 \\le V \\le 1{,}1, \\qquad \\text{énergie écrêtée: } ${c.q((c.k as FeederInfo).curtailedMWh, 'MWh', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Les codes de raccordement (VDE-AR-N 4105/4110, IEEE 1547-2018, EN 50549) imposent aux onduleurs des capacités de réglage $Q(V)$ ou $\\cos\\varphi(P)$, et parfois un écrêtement $P(V)$ en dernier recours.',
          en: 'Connection codes (VDE-AR-N 4105/4110, IEEE 1547-2018, EN 50549) require inverters to offer $Q(V)$ or $\\cos\\varphi(P)$ control, and sometimes $P(V)$ curtailment as a last resort.',
        }),
    },
    {
      id: 'qsts',
      title: { fr: 'Répartition en séries temporelles', en: 'Time-series power flow' },
      personas: ['research'],
      tex: () => `\\{V(t_k)\\}_{k} = \\mathrm{PF}\\big(P_{charge}(t_k),\\ P_{PV}(t_k),\\ \\text{régulateurs}(t_{k-1})\\big)`,
      note: (c) =>
        c.tr({
          fr: 'Une répartition de charge par pas de temps (ici toutes les 15 min), en reprenant l’état des régulateurs du pas précédent (QSTS). C’est ainsi qu’on étudie l’impact d’un an de production et de consommation.',
          en: 'One power flow per time step (here every 15 min), carrying over the regulators’ state from the previous step (QSTS). This is how the impact of a year of generation and demand is studied.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension en bout de départ', en: 'Predict the voltage at the feeder end' },
      body: {
        fr: `Cinq quartiers sont alimentés par un départ 20 kV ; chacun a 2,5 MW de solaire. Le poste tient sa tension à 1,03 pu. **Dessinez la tension en bout de départ sur la journée**, puis révélez.`,
        en: `Five neighbourhoods are supplied by a 20 kV feeder; each has 2.5 MW of solar. The substation holds its voltage at 1.03 pu. **Sketch the voltage at the feeder end over the day**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'reverse',
      title: { fr: 'Le flux s’inverse', en: 'The flow reverses' },
      body: {
        fr: `Placez le curseur à **midi**. La puissance au poste est négative : le départ **exporte**, et les flèches pointent vers le poste.`,
        en: `Put the cursor at **midday**. Power at the substation is negative: the feeder **exports**, and the arrows point towards the substation.`,
      },
      check: (lab) => now(lab).Psub < 0,
    },
    {
      id: 'over',
      title: { fr: 'Surtension', en: 'Overvoltage' },
      body: {
        fr: `Augmentez le solaire jusqu’à ce que la tension dépasse **1,05 pu** à un moment de la journée. La limite atteinte n’est pas la puissance des câbles, mais la tension.`,
        en: `Raise solar until the voltage exceeds **1.05 pu** at some time of day. The limit reached is not the cables’ rating, but voltage.`,
      },
      check: (lab) => lab.params.control === CONTROLS.none && (lab.info as FeederInfo).vMax > FEEDER.Vmax,
    },
    {
      id: 'qv',
      title: { fr: 'Les onduleurs absorbent du réactif', en: 'Inverters absorb reactive power' },
      body: {
        fr: `Gardez au moins **3,5 MW** par nœud et choisissez le réglage **Q(V)**. La tension repasse sous 1,05 pu sans perdre d’énergie solaire.`,
        en: `Keep at least **3.5 MW** per node and choose **Q(V)** control. The voltage drops back under 1.05 pu without losing any solar energy.`,
      },
      check: (lab) => lab.params.control === CONTROLS.qv && lab.params.pv >= 3.5 && (lab.info as FeederInfo).vMax <= FEEDER.Vmax + 1e-3,
    },
    {
      id: 'oltc',
      title: { fr: 'Baisser la tension au poste ?', en: 'Lower the substation voltage?' },
      body: {
        fr: `Sans réglage des onduleurs, baissez la consigne du poste à **1,00 pu** ou moins. Midi va mieux, mais le soir, à la pointe de consommation, le bout du départ passe **sous 0,95 pu** : un seul régleur ne peut pas satisfaire les deux.`,
        en: `With no inverter control, lower the substation setpoint to **1.00 pu** or less. Midday improves, but in the evening, at peak demand, the end of the feeder drops **below 0.95 pu**: one tap changer cannot satisfy both.`,
      },
      check: (lab) => lab.params.control === CONTROLS.none && lab.params.Vsub <= 1.0 && (lab.info as FeederInfo).vMin < 0.95,
    },
    {
      id: 'curtail',
      title: { fr: 'L’écrêtement, en dernier recours', en: 'Curtailment, as a last resort' },
      body: {
        fr: `Avec **5 MW** ou plus par nœud, choisissez l’**écrêtement P(V)**. La tension est tenue, mais une partie de l’énergie solaire est perdue : regardez le compteur d’énergie écrêtée (profil Ingénieur).`,
        en: `With **5 MW** or more per node, choose **P(V) curtailment**. The voltage is held, but some solar energy is lost: see the curtailed-energy counter (Engineer profile).`,
      },
      check: (lab) => lab.params.control === CONTROLS.curtail && lab.params.pv >= 5 && (lab.info as FeederInfo).curtailedMWh > 0.5,
    },
  ],
};
