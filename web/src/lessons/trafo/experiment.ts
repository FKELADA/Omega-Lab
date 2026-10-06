// Module 4.2 — Transformers: from ideal to real, inrush, regulation and efficiency.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { TRAFO, magnetising, trafoEfficiency, trafoInfo, transformer, type TrafoInfo } from '../../lib/models/module4';
import TrafoCanvas from './TrafoCanvas.svelte';

export const trafoLesson: Experiment = {
  id: 'trafo',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.2 Transformateur : appel et rendement', en: '4.2 Transformer: inrush and efficiency' },
  ],
  title: { fr: 'Le transformateur : de l’idéal au réel', en: 'The transformer: from ideal to real' },
  model: transformer,
  info: trafoInfo,
  canvas: TrafoCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'theta0', symbol: '\\theta_0', name: { fr: 'Instant d’enclenchement (angle de la tension)', en: 'Switching instant (voltage angle)' }, unit: '°', min: 0, max: 180, default: 0, scale: 'lin', term: 'S' },
    { id: 'psiR', symbol: '\\psi_r', name: { fr: 'Flux rémanent', en: 'Residual flux' }, unit: 'pu', min: -0.8, max: 0.8, default: 0.6, scale: 'lin', term: 'L' },
    { id: 'psiSat', symbol: '\\psi_{sat}', name: { fr: 'Coude de saturation', en: 'Saturation knee' }, unit: 'pu', min: 1.05, max: 1.4, default: 1.2, scale: 'lin', term: 'L' },
    { id: 'r', symbol: 'r', name: { fr: 'Résistance d’enroulement', en: 'Winding resistance' }, unit: 'pu', min: 0.002, max: 0.05, default: 0.01, scale: 'log', term: 'R' },
    { id: 'load', sweep: false, symbol: 'S', name: { fr: 'Charge (régime établi)', en: 'Load (steady state)' }, unit: 'pu', min: 0, max: 1.2, default: 1, scale: 'lin', term: 'p' },
    { id: 'pf', sweep: false, symbol: '\\cos\\varphi', name: { fr: 'Facteur de puissance de la charge', en: 'Load power factor' }, unit: '', min: 0.6, max: 1, default: 0.8, scale: 'lin' },
  ],

  signals: [
    { id: 'i', symbol: 'i', name: { fr: 'Courant d’appel', en: 'Inrush current' }, unit: 'pu', color: '--c-i', on: true, term: 'i' },
    { id: 'psi', symbol: '\\psi', name: { fr: 'Flux', en: 'Flux' }, unit: 'pu', color: '--c-L', on: true, term: 'L' },
    { id: 'psiSteady', symbol: '\\psi_\\infty', name: { fr: 'Flux en régime établi', en: 'Steady-state flux' }, unit: 'pu', color: '--c-L', on: false, dash: true },
    { id: 'v', symbol: 'v', name: { fr: 'Tension', en: 'Voltage' }, unit: 'pu', color: '--c-S', on: false, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Courbe d’aimantation', en: 'Magnetising curve' },
      x: { label: 'i', unit: 'pu', range: (lab) => { const m = Math.max(0.1, (lab.info as TrafoInfo).iPeak * 1.1); return [-m, m]; } },
      y: { label: 'ψ', unit: 'pu', range: [-3, 3] },
      series: (lab) => {
        const pts: [number, number][] = [];
        for (let psi = -3; psi <= 3.001; psi += 0.02) pts.push([magnetising(psi, lab.params.psiSat), psi]);
        return [{ color: '--c-L', pts }];
      },
      points: (lab) => [{ x: lab.at('i'), y: lab.at('psi'), color: '--c-i' }],
      bands: (lab) => [{ y0: -lab.params.psiSat, y1: lab.params.psiSat }],
      note: () => ({ fr: 'Zone verte : fonctionnement linéaire. Au-delà du coude, le moindre flux en plus coûte un courant énorme.', en: 'Green band: linear operation. Past the knee, every bit of extra flux costs a huge current.' }),
    },
    {
      title: { fr: 'Rendement selon la charge', en: 'Efficiency versus load' },
      x: { label: 'S', unit: 'pu', range: [0, 1.2] },
      y: { label: 'η', unit: '%', range: [96, 100] },
      series: (lab) => {
        const pts: [number, number][] = [];
        for (let S = 0.02; S <= 1.2; S += 0.01) pts.push([S, 100 * trafoEfficiency(S, lab.params.pf)]);
        return [{ color: '--c-p', pts }];
      },
      points: (lab) => [{ x: lab.params.load, y: 100 * trafoEfficiency(lab.params.load, lab.params.pf), color: '--accent' }],
      vlines: (lab) => [{ x: (lab.info as TrafoInfo).bestLoad, label: 'η max' }],
    },
  ],

  predict: {
    signal: 'i',
    yRange: () => [-2, 7],
    diagnose(pred, run) {
      const truth = Math.max(...run.s.i);
      const mine = Math.max(...pred.map(([, y]) => y));
      if (truth > 2 && mine < 0.4 * truth)
        return {
          fr: 'À vide, un transformateur ne consomme que ~1 % de courant… en régime établi. À l’enclenchement, le flux peut monter jusqu’à **deux fois** sa valeur normale, plus le flux rémanent : le noyau sature et le courant d’appel atteint **plusieurs fois le courant nominal**.',
          en: 'At no load a transformer draws only ~1 % current… in steady state. At switch-on the flux can rise to **twice** its normal value, plus the residual flux: the core saturates and the inrush reaches **several times rated current**.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'ideal',
      title: { fr: 'Le transformateur idéal', en: 'The ideal transformer' },
      tex: () => `\\frac{V_1}{V_2} = \\frac{N_1}{N_2}, \\qquad \\frac{I_1}{I_2} = \\frac{N_2}{N_1}, \\qquad S_1 = S_2`,
      note: (c) =>
        c.tr({
          fr: 'Il change la tension sans perte et sans pièce mobile : c’est lui qui a fait gagner l’alternatif (leçon 1.5).',
          en: 'It changes voltage with no losses and no moving parts: it is what made AC win (lesson 1.5).',
        }),
    },
    {
      id: 'inrush',
      title: { fr: 'Le flux à l’enclenchement', en: 'Flux at switch-on' },
      tex: (c) => {
        const k = c.k as TrafoInfo;
        return `\\begin{aligned}
          \\frac{d\\psi}{dt} = v \\;&\\Rightarrow\\; \\psi(t) = \\psi_r + \\cos\\theta_0 - \\cos(\\omega t + \\theta_0) \\\\
          \\psi_{max} &= ${c.q(k.psiPeak, '', 3)}\\ \\text{pu}, \\qquad i_{max} = ${c.q(k.iPeak, '', 3)}\\ \\text{pu}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le flux suit l’intégrale de la tension. Enclencher au passage par zéro de la tension décale le flux de toute une amplitude : il culmine à 2 pu (plus le rémanent) et sature le noyau.',
          en: 'Flux follows the integral of voltage. Switching on at a voltage zero offsets the flux by a full amplitude: it peaks at 2 pu (plus the residual) and saturates the core.',
        }),
    },
    {
      id: 'equivalent',
      title: { fr: 'Schéma équivalent', en: 'Equivalent circuit' },
      tex: () => `u_k = ${TRAFO.uk * 100}\\,\\%,\\quad u_R = ${TRAFO.uR * 100}\\,\\%,\\quad i_0 = ${TRAFO.im * 100}\\,\\%,\\quad p_0 = ${(TRAFO.p0 * 100).toFixed(1).replace('.', '{,}')}\\,\\%`,
      note: (c) =>
        c.tr({
          fr: 'Une impédance série (fuites et cuivre, $u_k$) et une branche d’aimantation (courant à vide $i_0$, pertes fer $p_0$). Ce sont les données de la plaque signalétique.',
          en: 'A series impedance (leakage and copper, $u_k$) and a magnetising branch (no-load current $i_0$, iron losses $p_0$). These are the nameplate data.',
        }),
    },
    {
      id: 'regulation',
      title: { fr: 'Chute de tension et rendement', en: 'Regulation and efficiency' },
      tex: (c) => {
        const k = c.k as TrafoInfo;
        return `\\begin{aligned}
          \\varepsilon &\\approx S\\,(u_R\\cos\\varphi + u_X\\sin\\varphi) = ${c.q(100 * k.regulation, '%', 3)} \\\\
          \\eta &= \\frac{S\\cos\\varphi}{S\\cos\\varphi + p_0 + S^2 u_R} = ${c.q(100 * k.efficiency, '%', 4)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le rendement est maximal quand pertes cuivre et pertes fer sont égales, ici vers 45 % de charge.',
          en: 'Efficiency peaks when copper and iron losses are equal, here at about 45 % load.',
        }),
    },
    {
      id: 'group',
      title: { fr: 'Couplage et indice horaire', en: 'Vector group' },
      personas: ['utility', 'research'],
      tex: () => `\\text{Dyn11}: \\quad \\underline V_{LV} \\propto \\underline V_{HV}\\,e^{+j30^\\circ}`,
      note: (c) =>
        c.tr({
          fr: 'Triangle côté HT, étoile avec neutre côté BT, et 30° d’avance (11 heures sur l’horloge). C’est le couplage classique des postes de distribution : le triangle bloque les courants homopolaires (leçon 2.8).',
          en: 'Delta on the HV side, star with neutral on the LV side, and a 30° lead (11 o’clock). The classic distribution transformer: the delta blocks zero-sequence currents (lesson 2.8).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le courant d’enclenchement', en: 'Predict the switch-on current' },
      body: {
        fr: `On met sous tension un transformateur **à vide** (secondaire ouvert). En régime établi, il ne consomme que 1 % du courant nominal. L’enclenchement a lieu au **passage par zéro** de la tension, avec un flux rémanent de 0,6 pu. **Dessinez le courant**, puis révélez.`,
        en: `A transformer is energised **at no load** (secondary open). In steady state it draws only 1 % of rated current. Switch-on happens at a voltage **zero crossing**, with 0.6 pu of residual flux. **Sketch the current**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'timing',
      title: { fr: 'Enclencher au bon moment', en: 'Switching at the right moment' },
      body: {
        fr: `Mettez le flux rémanent à **0** et enclenchez au **maximum de la tension** ($\\theta_0 = 90°$). Le flux démarre directement sur sa trajectoire normale : plus d’appel de courant. C’est le principe des disjoncteurs à **manœuvre synchronisée**.`,
        en: `Set the residual flux to **0** and switch on at the **voltage peak** ($\\theta_0 = 90°$). The flux starts right on its normal path: no more inrush. This is the principle of **point-on-wave** switching.`,
      },
      check: (lab) => (lab.info as TrafoInfo).iPeak < 0.05,
    },
    {
      id: 'residual',
      title: { fr: 'Le flux rémanent', en: 'Residual flux' },
      body: {
        fr: `Gardez $\\theta_0 = 90°$ mais mettez un flux rémanent de **−0,8 pu**. Le bon instant ne suffit plus : il faut connaître le flux laissé par la dernière mise hors tension.`,
        en: `Keep $\\theta_0 = 90°$ but set a residual flux of **−0.8 pu**. The right instant is no longer enough: you also need to know the flux left by the last de-energisation.`,
      },
      check: (lab) => lab.params.theta0 >= 85 && (lab.info as TrafoInfo).iPeak > 1,
    },
    {
      id: 'damping',
      title: { fr: 'L’appel s’amortit', en: 'The inrush decays' },
      body: {
        fr: `Augmentez la résistance d’enroulement à **0,03 pu** ou plus : l’appel s’éteint plus vite. Les gros transformateurs, très peu résistifs, peuvent garder un courant d’appel pendant des secondes, ce qui gêne les protections.`,
        en: `Raise the winding resistance to **0.03 pu** or more: the inrush dies out faster. Large transformers, with very little resistance, can keep an inrush for seconds, which troubles protection relays.`,
      },
      check: (lab) => lab.params.r >= 0.03,
    },
    {
      id: 'efficiency',
      title: { fr: 'Le rendement', en: 'Efficiency' },
      body: {
        fr: `Réglez la charge sur le point de **rendement maximal** (environ 0,45 pu). Les transformateurs de distribution sont dimensionnés pour être le plus souvent autour de ce point.`,
        en: `Set the load to the point of **maximum efficiency** (about 0.45 pu). Distribution transformers are sized to spend most of their time near this point.`,
      },
      check: (lab) => Math.abs(lab.params.load - (lab.info as TrafoInfo).bestLoad) < 0.05,
    },
  ],
};
