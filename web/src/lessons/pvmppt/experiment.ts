// Module 7.3 — Photovoltaics: the I–V and P–V curves, irradiance and
// temperature, perturb-and-observe MPPT, and partial shading.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { pvArrayModel, pvCurve, pvInfo, pvIrradiance, PV_SCAN, type PvInfo } from '../../lib/models/module7b';
import PvCanvas from './PvCanvas.svelte';

export const pvmpptLesson: Experiment = {
  id: 'pvmppt',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.3 Photovoltaïque', en: '7.3 PV' },
  ],
  title: { fr: 'Le photovoltaïque : courbes I–V et recherche du point de puissance maximale', en: 'Photovoltaics: I–V curves and maximum power point tracking' },
  model: pvArrayModel,
  info: pvInfo,
  canvas: PvCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'G', symbol: 'G', name: { fr: 'Ensoleillement', en: 'Irradiance' }, unit: 'W/m²', min: 100, max: 1000, default: 1000, scale: 'lin', term: 'S' },
    { id: 'cloud', symbol: '\\nu', name: { fr: 'Passage nuageux à t = 2 s', en: 'Cloud at t = 2 s' }, unit: '', min: 0, max: 0.8, default: 0.5, scale: 'lin', term: 'S' },
    { id: 'T', symbol: 'T', name: { fr: 'Température des cellules', en: 'Cell temperature' }, unit: '°C', min: -10, max: 75, default: 25, scale: 'lin', term: 'R' },
    { id: 'dV', symbol: '\\Delta V', name: { fr: 'Pas de l’algorithme P&O', en: 'P&O step' }, unit: 'V', min: 0.1, max: 4, default: 0.5, scale: 'log', term: 'p' },
    { id: 'shade', symbol: 's', name: { fr: 'Ombrage d’une sous-chaîne', en: 'Shading of one substring' }, unit: '', min: 0, max: 0.9, default: 0, scale: 'lin', term: 'L' },
    {
      id: 'scan',
      symbol: '\\text{scan}',
      name: { fr: 'Balayage global (chaque seconde)', en: 'Global scan (every second)' },
      unit: '',
      min: 0,
      max: 1,
      default: PV_SCAN.off,
      scale: 'lin',
      choices: [
        { value: PV_SCAN.off, label: { fr: 'Non', en: 'Off' } },
        { value: PV_SCAN.on, label: { fr: 'Oui', en: 'On' } },
      ],
    },
  ],

  signals: [
    { id: 'P', symbol: 'P', name: { fr: 'Puissance extraite', en: 'Power extracted' }, unit: 'W', color: '--c-p', on: true, term: 'p' },
    { id: 'Pa', symbol: 'P_{max}', name: { fr: 'Puissance disponible', en: 'Available power' }, unit: 'W', color: '--c-p', on: true, dash: true },
    { id: 'V', symbol: 'V', name: { fr: 'Tension du module', en: 'Module voltage' }, unit: 'V', color: '--c-C', on: false, term: 'C' },
    { id: 'I', symbol: 'I', name: { fr: 'Courant du module', en: 'Module current' }, unit: 'A', color: '--c-i', on: false, term: 'i' },
  ],

  charts: [
    {
      title: { fr: 'Caractéristique I–V', en: 'I–V characteristic' },
      x: { label: 'V', unit: 'V', range: [0, 45] },
      y: { label: 'I', unit: 'A', range: [0, 11] },
      series: (lab) => {
        const G = pvIrradiance(lab.params, lab.t);
        return [
          { label: { fr: 'conditions de référence (1000 W/m², 25 °C)', en: 'standard conditions (1000 W/m², 25 °C)' }, color: '--muted', pts: pvCurve(1000, 25, 0).iv, dash: true, width: 1.2 },
          { label: { fr: 'conditions actuelles', en: 'present conditions' }, color: '--c-i', pts: pvCurve(G, lab.params.T, lab.params.shade).iv },
        ];
      },
      points: (lab) => (isFinite(lab.at('V')) ? [{ x: lab.at('V'), y: lab.at('I'), color: '--accent' }] : []),
      note: () => ({ fr: 'Un générateur de courant à basse tension, une diode à haute tension : le coude est là où la puissance est maximale.', en: 'A current source at low voltage, a diode at high voltage: the knee is where power peaks.' }),
    },
    {
      title: { fr: 'Caractéristique P–V', en: 'P–V characteristic' },
      x: { label: 'V', unit: 'V', range: [0, 45] },
      y: { label: 'P', unit: 'W', range: [0, 340] },
      series: (lab) => [{ color: '--c-p', pts: pvCurve(pvIrradiance(lab.params, lab.t), lab.params.T, lab.params.shade).pv }],
      points: (lab) => {
        const c = pvCurve(pvIrradiance(lab.params, lab.t), lab.params.T, lab.params.shade);
        return [
          ...c.peaks.map((pk, j) => ({ x: pk.V, y: pk.P, color: j === 0 ? '--good' : '--warn', hollow: true, label: j === 0 ? 'MPP' : 'local' })),
          ...(isFinite(lab.at('V')) ? [{ x: lab.at('V'), y: lab.at('P'), color: '--accent' }] : []),
        ];
      },
      note: (lab) => {
        const k = lab.info as PvInfo;
        return {
          fr: `Rendement de suivi : ${(100 * k.efficiency).toFixed(1)} %. ${k.peaks > 1 ? 'Deux bosses : l’ombrage crée un maximum local.' : ''}`,
          en: `Tracking efficiency: ${(100 * k.efficiency).toFixed(1)} %. ${k.peaks > 1 ? 'Two humps: shading creates a local maximum.' : ''}`,
        };
      },
    },
  ],

  predict: {
    signal: 'P',
    yRange: () => [0, 340],
    diagnose(pred, run) {
      const before = pred.filter(([t]) => t > 1 && t < 1.9).map(([, y]) => y);
      const after = pred.filter(([t]) => t > 2.3).map(([, y]) => y);
      const tb = run.s.P[Math.round(run.t.length * 0.4)];
      const ta = run.s.P[run.t.length - 1];
      if (before.length && after.length) {
        const mine = after.reduce((s, v) => s + v, 0) / after.length / (before.reduce((s, v) => s + v, 0) / before.length);
        if (Math.abs(mine - ta / tb) > 0.25)
          return {
            fr: `Le courant d’une cellule est **proportionnel à l’ensoleillement** : la puissance suit presque exactement le nuage (−${Math.round(100 * (1 - ta / tb))} % ici), la tension changeant peu.`,
            en: `A cell’s current is **proportional to irradiance**: power follows the cloud almost exactly (−${Math.round(100 * (1 - ta / tb))} % here), while voltage changes little.`,
          };
      }
      return null;
    },
  },

  equations: [
    {
      id: 'diode',
      title: { fr: 'Le modèle à une diode', en: 'The single-diode model' },
      tex: () => `I = I_{ph} - I_0\\left(e^{\\frac{V + IR_s}{nN_sV_T}} - 1\\right) - \\frac{V + IR_s}{R_{sh}}, \\qquad I_{ph} \\propto G`,
      note: (c) =>
        c.tr({
          fr: 'Une cellule est une diode éclairée : la lumière crée un courant $I_{ph}$, la diode en court-circuite une partie quand la tension monte. 60 cellules en série font un module de 30 V environ.',
          en: 'A cell is an illuminated diode: light creates a current $I_{ph}$, and the diode shunts part of it as voltage rises. 60 cells in series make a module of about 30 V.',
        }),
    },
    {
      id: 'mpp',
      title: { fr: 'Point de puissance maximale', en: 'Maximum power point' },
      tex: (c) => {
        const cv = pvCurve(pvIrradiance(c.p, c.t), c.p.T, c.p.shade);
        const pk = cv.peaks[0];
        return `\\frac{dP}{dV} = 0: \\quad V_{mpp} = ${pk ? c.q(pk.V, 'V', 3) : '\\text{—}'},\\ P_{mpp} = ${pk ? c.q(pk.P, 'W', 3) : '\\text{—}'}, \\qquad V_{oc} = ${c.q(cv.Voc, 'V', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La puissance dépend de la tension imposée par l’onduleur. Le point optimal bouge avec le soleil et la température : il faut le chercher en permanence.',
          en: 'Power depends on the voltage the inverter imposes. The optimum moves with sun and temperature: it must be searched for all the time.',
        }),
    },
    {
      id: 'po',
      title: { fr: 'Perturber et observer', en: 'Perturb and observe' },
      tex: (c) => `V_{k+1} = V_k \\pm \\Delta V, \\quad \\text{on inverse si } P_k < P_{k-1}, \\qquad \\eta_{suivi} = ${c.q(100 * (c.k as PvInfo).efficiency, '%', 4)}`,
      note: (c) =>
        c.tr({
          fr: 'Simple et sans modèle. Un grand pas suit vite les changements mais oscille autour du maximum ; un petit pas est précis mais lent.',
          en: 'Simple and model-free. A large step follows changes quickly but oscillates around the maximum; a small step is precise but slow.',
        }),
    },
    {
      id: 'temp',
      title: { fr: 'Effet de la température', en: 'Effect of temperature' },
      tex: () => `\\frac{\\partial V_{oc}}{\\partial T} \\approx -0{,}32\\ \\%/^\\circ\\mathrm{C}, \\qquad \\frac{\\partial I_{sc}}{\\partial T} \\approx +0{,}05\\ \\%/^\\circ\\mathrm{C}`,
      note: (c) =>
        c.tr({
          fr: 'Une cellule chaude perd de la tension, donc de la puissance : un module produit plus par un jour froid et ensoleillé que par une canicule.',
          en: 'A hot cell loses voltage, so power: a module produces more on a cold sunny day than in a heatwave.',
        }),
    },
    {
      id: 'shade',
      title: { fr: 'Ombrage et diodes de dérivation', en: 'Shading and bypass diodes' },
      personas: ['research', 'utility'],
      tex: () => `V_{sous\\text{-}chaîne} \\ge -0{,}5\\ \\text{V}\\ \\text{(diode de dérivation)}`,
      note: (c) =>
        c.tr({
          fr: 'Une sous-chaîne ombragée limiterait le courant de tout le module ; sa diode de dérivation la court-circuite quand le courant dépasse ce qu’elle peut fournir. La courbe P–V a alors plusieurs bosses, et un algorithme local peut rester sur la mauvaise.',
          en: 'A shaded substring would limit the whole module’s current; its bypass diode shorts it when the current exceeds what it can deliver. The P–V curve then has several humps, and a local algorithm can stay on the wrong one.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance sous un nuage', en: 'Predict the power under a cloud' },
      body: {
        fr: `Un module est en plein soleil. À $t = 2$ s, un nuage coupe la moitié de l’ensoleillement. **Dessinez la puissance extraite**, puis révélez.`,
        en: `A module is in full sun. At $t = 2$ s a cloud cuts half of the irradiance. **Sketch the power extracted**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'climb',
      title: { fr: 'L’algorithme grimpe', en: 'The algorithm climbs' },
      body: {
        fr: `Parcourez le temps : l’onduleur part de la tension à vide et descend la courbe P–V jusqu’au maximum, puis oscille autour.`,
        en: `Scrub through time: the inverter starts at open-circuit voltage and walks down the P–V curve to the maximum, then oscillates around it.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'heat',
      title: { fr: 'La chaleur', en: 'Heat' },
      body: {
        fr: `Montez la température des cellules à **60 °C** ou plus : la tension à vide baisse, et la puissance maximale avec elle.`,
        en: `Raise the cell temperature to **60 °C** or more: the open-circuit voltage falls, and maximum power with it.`,
      },
      check: (lab) => lab.params.T >= 60,
    },
    {
      id: 'step',
      title: { fr: 'Le pas de recherche', en: 'The search step' },
      body: {
        fr: `Prenez un grand pas (**2 V** ou plus) : la puissance oscille fortement autour du maximum et le rendement de suivi baisse sous **98,5 %**.`,
        en: `Take a large step (**2 V** or more): the power oscillates strongly around the maximum and the tracking efficiency drops below **98.5 %**.`,
      },
      check: (lab) => lab.params.dV >= 2 && (lab.info as PvInfo).efficiency < 0.985,
    },
    {
      id: 'shade',
      title: { fr: 'L’ombrage', en: 'Shading' },
      body: {
        fr: `Revenez à un pas de 0,5 V et ombragez une sous-chaîne à **50 %** ou plus : la courbe P–V a deux bosses, et l’algorithme reste bloqué sur la mauvaise.`,
        en: `Go back to a 0.5 V step and shade one substring by **50 %** or more: the P–V curve has two humps, and the algorithm gets stuck on the wrong one.`,
      },
      check: (lab) => lab.params.dV < 1 && (lab.info as PvInfo).stuckLocal,
    },
    {
      id: 'scan',
      title: { fr: 'Le balayage global', en: 'The global scan' },
      body: {
        fr: `Activez le **balayage global** : chaque seconde, l’onduleur parcourt toute la courbe et repart du vrai maximum.`,
        en: `Turn on the **global scan**: every second, the inverter sweeps the whole curve and restarts from the true maximum.`,
      },
      check: (lab) => lab.params.scan === PV_SCAN.on && lab.params.shade >= 0.5 && !(lab.info as PvInfo).stuckLocal,
    },
  ],
};
