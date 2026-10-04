// Module 7.2 — Grid-following against grid-forming: a phase jump and a
// frequency drop seen by both, inertia, droop and weak grids.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { GFM, gflGfmInfo, gflGfmModel, GRID_EVENTS, gridEvent, type GflGfmInfo } from '../../lib/models/module7';
import GfmCanvas from './GfmCanvas.svelte';

export const gfmLesson: Experiment = {
  id: 'gfm',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.2 Suiveur ou formeur de réseau', en: '7.2 Grid-following or grid-forming' },
  ],
  title: { fr: 'Suivre le réseau ou le former ?', en: 'Following the grid or forming it?' },
  model: gflGfmModel,
  info: gflGfmInfo,
  canvas: GfmCanvas,
  instruments: [Chart0, Chart1],

  params: [
    {
      id: 'event',
      symbol: '\\text{évén.}',
      name: { fr: 'Événement réseau (t = 0,1 s)', en: 'Grid event (t = 0.1 s)' },
      unit: '',
      min: 0,
      max: 1,
      default: GRID_EVENTS.phase,
      scale: 'lin',
      choices: [
        { value: GRID_EVENTS.phase, label: { fr: 'Saut de phase −20°', en: 'Phase jump −20°' } },
        { value: GRID_EVENTS.rocof, label: { fr: 'Chute de fréquence', en: 'Frequency drop' } },
      ],
    },
    { id: 'H', symbol: 'H', name: { fr: 'Inertie virtuelle du formeur', en: 'Grid-forming virtual inertia' }, unit: 's', min: 0.1, max: 10, default: 2, scale: 'log', term: 'p' },
    { id: 'SCR', symbol: '\\mathrm{SCR}', name: { fr: 'Rapport de court-circuit', en: 'Short-circuit ratio' }, unit: '', min: 1.2, max: 20, default: 5, scale: 'log', term: 'L' },
    { id: 'fpll', symbol: 'f_{PLL}', name: { fr: 'Bande passante PLL du suiveur', en: 'Grid-following PLL bandwidth' }, unit: 'Hz', min: 5, max: 150, default: 20, scale: 'log', term: 'S' },
  ],

  signals: [
    { id: 'pGfm', symbol: 'P_{GFM}', name: { fr: 'Puissance du formeur', en: 'Grid-forming power' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'pGfl', symbol: 'P_{GFL}', name: { fr: 'Puissance du suiveur', en: 'Grid-following power' }, unit: 'pu', color: '--c-i', on: true, term: 'i' },
    { id: 'fGfm', symbol: 'f_{GFM}', name: { fr: 'Fréquence interne du formeur', en: 'Grid-forming internal frequency' }, unit: 'Hz', color: '--c-p', on: false, dash: true },
    { id: 'fGfl', symbol: 'f_{PLL}', name: { fr: 'Fréquence vue par la PLL', en: 'Frequency seen by the PLL' }, unit: 'Hz', color: '--c-i', on: false, dash: true },
    { id: 'fGrid', symbol: 'f_g', name: { fr: 'Fréquence du réseau', en: 'Grid frequency' }, unit: 'Hz', color: '--c-S', on: false, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Le formeur : courbe P–δ', en: 'Grid-forming: P–δ curve' },
      x: { label: 'δ − θg', unit: '°', range: [0, 180] },
      y: { label: 'P', unit: 'pu', range: [0, 3.5] },
      series: (lab) => {
        const Pmax = GFM.E / (GFM.Xv + 1 / lab.params.SCR);
        return [{ label: { fr: 'P = E·V·sin(δ − θg)/X', en: 'P = E·V·sin(δ − θg)/X' }, color: '--c-p', pts: Array.from({ length: 91 }, (_, j) => [2 * j, Pmax * Math.sin((2 * j * Math.PI) / 180)] as [number, number]) }];
      },
      points: (lab) => {
        const Pmax = GFM.E / (GFM.Xv + 1 / lab.params.SCR);
        const P = lab.at('pGfm');
        return isFinite(P) ? [{ x: (Math.asin(Math.max(-1, Math.min(1, P / Pmax))) * 180) / Math.PI, y: P, color: '--c-p' }] : [];
      },
      note: () => ({
        fr: 'Le formeur impose sa tension E∠δ : quand l’angle du réseau saute, l’écart δ − θg change aussitôt, et la puissance avec lui. Rien à mesurer, rien à attendre.',
        en: 'The grid-forming unit imposes its voltage E∠δ: when the grid angle jumps, δ − θg changes at once, and so does the power. Nothing to measure, nothing to wait for.',
      }),
    },
    {
      title: { fr: 'Le formeur : statisme P–f', en: 'Grid-forming: P–f droop' },
      x: { label: 'f', unit: 'Hz', range: [49.3, 50.2] },
      y: { label: 'P', unit: 'pu', range: [0, 1.2] },
      series: () => [
        { label: { fr: `statisme ${GFM.droop * 100} %`, en: `${GFM.droop * 100} % droop` }, color: '--c-R', pts: [[49.3, GFM.P0 + 0.7 / (50 * GFM.droop)], [50.2, GFM.P0 - 0.2 / (50 * GFM.droop)]] },
      ],
      points: (lab) => (isFinite(lab.at('pGfm')) ? [{ x: gridEvent(lab.params.event, lab.t).f, y: lab.at('pGfm'), color: '--c-p' }] : []),
      note: () => ({
        fr: 'En régime établi, le formeur partage les variations de charge comme un alternateur : ΔP = −Δf / (statisme · f₀).',
        en: 'In steady state, the grid-forming unit shares load changes like a generator: ΔP = −Δf / (droop · f₀).',
      }),
    },
  ],

  predict: {
    signal: 'pGfm',
    yRange: () => [-0.5, 2.5],
    diagnose(pred, run) {
      const k0 = run.t.findIndex((t) => t >= 0.1);
      const peak = Math.max(...Array.from(run.s.pGfm).slice(k0, k0 + 120));
      const mine = Math.max(...pred.filter(([t]) => t >= 0.1 && t <= 0.2).map(([, y]) => y), -Infinity);
      if (peak > 1 && mine < 0.5 + 0.4 * (peak - 0.5))
        return {
          fr: 'Le formeur réagit **instantanément** : c’est une source de tension. Quand l’angle du réseau recule de 20°, l’écart d’angle à travers sa réactance change d’un coup, et la puissance bondit — exactement comme un alternateur synchrone. Le suiveur, lui, attend que sa PLL ait vu le saut.',
          en: 'The grid-forming unit reacts **instantly**: it is a voltage source. When the grid angle falls back by 20°, the angle across its reactance changes at once and the power leaps — exactly like a synchronous generator. The grid-following unit waits until its PLL has seen the jump.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'gfl',
      title: { fr: 'Le suiveur : une source de courant', en: 'Grid-following: a current source' },
      tex: () => `\\underline i = (i_d^* + j\\,i_q^*)\\,e^{j\\theta_{PLL}}, \\qquad P = P^* \\ \\text{(quoi qu’il arrive au réseau)}`,
      note: (c) =>
        c.tr({
          fr: 'Il injecte le courant demandé, synchronisé par sa PLL. Il suppose qu’une tension existe déjà : il ne peut pas fonctionner seul, et n’apporte ni inertie ni tenue de tension naturelle.',
          en: 'It injects the requested current, synchronised by its PLL. It assumes a voltage already exists: it cannot run on its own, and brings neither inertia nor natural voltage support.',
        }),
    },
    {
      id: 'gfm',
      title: { fr: 'Le formeur : une machine synchrone virtuelle', en: 'Grid-forming: a virtual synchronous machine' },
      tex: (c) => `2H\\frac{d\\omega}{dt} = P^* - P - \\frac{\\omega - 1}{m}, \\quad \\frac{d\\delta}{dt} = \\omega_0(\\omega - 1), \\quad H = ${c.q(c.p.H, 's', 3)},\\ m = ${GFM.droop * 100}\\ \\%`,
      note: (c) =>
        c.tr({
          fr: 'Il impose une tension d’amplitude et d’angle donnés, et règle son angle par l’équation du mouvement d’un alternateur (leçon 3.3). Il peut alimenter un îlot seul.',
          en: 'It imposes a voltage of given magnitude and angle, and sets its angle by a generator’s swing equation (lesson 3.3). It can supply an island on its own.',
        }),
    },
    {
      id: 'response',
      title: { fr: 'Réponse à l’événement', en: 'Response to the event' },
      tex: (c) => {
        const k = c.k as GflGfmInfo;
        return `\\Delta P_{GFM} = ${c.q(k.dPgfm, 'pu', 3)}, \\qquad \\Delta P_{GFL} = ${k.gflUnstable ? '\\text{instable}' : c.q(k.dPgfl, 'pu', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Saut de phase : variation crête dans les 50 ms. Chute de fréquence : variation crête pendant la rampe.',
          en: 'Phase jump: peak change within 50 ms. Frequency drop: peak change during the ramp.',
        }),
    },
    {
      id: 'inertia',
      title: { fr: 'Inertie virtuelle', en: 'Virtual inertia' },
      tex: (c) => `\\Delta P_{inertie} = -2H\\,\\frac{df/dt}{f_0} = ${c.q((2 * c.p.H * 1) / 50, 'pu', 3)}\\ \\text{à } 1\\ \\text{Hz/s}`,
      note: (c) =>
        c.tr({
          fr: 'L’inertie n’est pas gratuite : l’énergie vient du bus continu ou d’une batterie, et le courant reste limité (leçon 7.1). Un formeur doit donc garder une marge de courant et d’énergie.',
          en: 'Inertia is not free: the energy comes from the DC link or a battery, and the current remains limited (lesson 7.1). A grid-forming unit must keep current and energy headroom.',
        }),
    },
    {
      id: 'variants',
      title: { fr: 'Les familles de formeurs', en: 'Grid-forming families' },
      personas: ['research', 'utility'],
      tex: () => `\\text{statisme}, \\quad \\text{VSM}, \\quad \\text{oscillateur virtuel (dVOC)}, \\quad \\text{matching control}`,
      note: (c) =>
        c.tr({
          fr: 'Ces lois sont proches en petits signaux (un statisme filtré équivaut à une inertie). Elles diffèrent par leur comportement en grandes perturbations et en limitation de courant. Les codes de réseau commencent à exiger des capacités de formeur (ENTSO-E, NERC, AEMO).',
          en: 'These laws are close in small signal (a filtered droop is equivalent to an inertia). They differ in large disturbances and under current limiting. Grid codes are starting to require grid-forming capability (ENTSO-E, NERC, AEMO).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la réponse du formeur', en: 'Predict the grid-forming response' },
      body: {
        fr: `À $t = 0{,}1$ s, l’angle de la tension du réseau recule de 20° (une centrale déclenche ailleurs). **Dessinez la puissance du formeur**, puis révélez.`,
        en: `At $t = 0.1$ s the grid voltage angle falls back by 20° (a power plant trips elsewhere). **Sketch the grid-forming power**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'compare',
      title: { fr: 'Comparer', en: 'Compare' },
      body: {
        fr: `Comparez les deux puissances juste après le saut : le formeur réagit au moins **5 fois** plus que le suiveur. C’est ce comportement « source de tension » qui stabilise un réseau.`,
        en: `Compare both powers just after the jump: the grid-forming unit reacts at least **5 times** more than the grid-following one. This “voltage source” behaviour is what stabilises a grid.`,
      },
      check: (lab) => lab.params.event === GRID_EVENTS.phase && (lab.info as GflGfmInfo).dPgfm > 5 * (lab.info as GflGfmInfo).dPgfl && lab.maxFrac > 0.3,
    },
    {
      id: 'rocof',
      title: { fr: 'Une chute de fréquence', en: 'A frequency drop' },
      body: {
        fr: `Choisissez la **chute de fréquence** (−1 Hz/s pendant 0,5 s). Le formeur fournit de la puissance pendant la rampe (inertie) puis la garde (statisme) ; le suiveur ne bouge pas.`,
        en: `Choose the **frequency drop** (−1 Hz/s for 0.5 s). The grid-forming unit supplies power during the ramp (inertia) and keeps it (droop); the grid-following unit does not move.`,
      },
      check: (lab) => lab.params.event === GRID_EVENTS.rocof && (lab.info as GflGfmInfo).dPgfmEnd > 0.1,
    },
    {
      id: 'inertia',
      title: { fr: 'Plus d’inertie', en: 'More inertia' },
      body: {
        fr: `Montez l’inertie virtuelle à **8 s** ou plus pendant la chute de fréquence : la réponse pendant la rampe augmente nettement.`,
        en: `Raise the virtual inertia to **8 s** or more during the frequency drop: the response during the ramp increases markedly.`,
      },
      check: (lab) => lab.params.event === GRID_EVENTS.rocof && lab.params.H >= 8,
    },
    {
      id: 'weak',
      title: { fr: 'Un réseau très faible', en: 'A very weak grid' },
      body: {
        fr: `Revenez au saut de phase, baissez le SCR sous **1,6** et montez la PLL du suiveur à **80 Hz** ou plus : le suiveur décroche, le formeur reste stable.`,
        en: `Go back to the phase jump, lower the SCR below **1.6** and raise the grid-following PLL to **80 Hz** or more: the grid-following unit loses stability, the grid-forming one stays stable.`,
      },
      check: (lab) => lab.params.SCR < 1.6 && (lab.info as GflGfmInfo).gflUnstable,
    },
  ],
};
