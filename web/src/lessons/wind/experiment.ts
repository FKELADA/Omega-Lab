// Module 7.4 — Wind: the power coefficient Cp(λ, β), optimal tip-speed ratio,
// pitch control above rated wind, gusts, and synthetic inertia.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { cp, CP_MAX, LAMBDA_OPT, powerCurve, V_RATED, windInfo, windModel, windPoint, WT, type WindInfo } from '../../lib/models/module7b';
import WindCanvas from './WindCanvas.svelte';

const cpCurve = (beta: number): [number, number][] => Array.from({ length: 131 }, (_, j) => [1 + j * 0.1, cp(1 + j * 0.1, beta)]);

export const windLesson: Experiment = {
  id: 'wind',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.4 Éolien', en: '7.4 Wind' },
  ],
  title: { fr: 'L’éolienne : capter le vent, limiter la puissance, aider la fréquence', en: 'The wind turbine: capturing wind, limiting power, supporting frequency' },
  model: windModel,
  info: windInfo,
  canvas: WindCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'v', symbol: 'v', name: { fr: 'Vitesse moyenne du vent', en: 'Mean wind speed' }, unit: 'm/s', min: 4, max: 20, default: 8, scale: 'lin', term: 'S' },
    { id: 'gust', symbol: '\\Delta v', name: { fr: 'Rafale (à t = 6 s)', en: 'Gust (at t = 6 s)' }, unit: 'm/s', min: 0, max: 8, default: 3, scale: 'lin', term: 'S' },
    { id: 'Hsyn', symbol: 'H_{syn}', name: { fr: 'Inertie synthétique', en: 'Synthetic inertia' }, unit: 's', min: 0, max: 10, default: 0, scale: 'lin', term: 'p' },
  ],

  signals: [
    { id: 'P', symbol: 'P', name: { fr: 'Puissance électrique', en: 'Electrical power' }, unit: 'MW', color: '--c-p', on: true, term: 'p' },
    { id: 'v', symbol: 'v', name: { fr: 'Vitesse du vent', en: 'Wind speed' }, unit: 'm/s', color: '--c-C', on: true, term: 'S' },
    { id: 'rpm', symbol: '\\Omega', name: { fr: 'Vitesse du rotor', en: 'Rotor speed' }, unit: 'rpm', color: '--c-L', on: false, term: 'L' },
    { id: 'beta', symbol: '\\beta', name: { fr: 'Angle de calage des pales', en: 'Blade pitch angle' }, unit: '°', color: '--c-R', on: false, term: 'R' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence du réseau', en: 'Grid frequency' }, unit: 'Hz', color: '--c-S', on: false, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Coefficient de puissance Cp(λ, β)', en: 'Power coefficient Cp(λ, β)' },
      x: { label: 'λ', range: [1, 14] },
      y: { label: 'Cp', range: [0, 0.6] },
      series: () => [
        { label: { fr: 'β = 0°', en: 'β = 0°' }, color: '--c-p', pts: cpCurve(0) },
        { label: { fr: 'β = 5°', en: 'β = 5°' }, color: '--c-C', pts: cpCurve(5), width: 1.4 },
        { label: { fr: 'β = 10°', en: 'β = 10°' }, color: '--c-L', pts: cpCurve(10), width: 1.4 },
        { label: { fr: 'β = 20°', en: 'β = 20°' }, color: '--c-R', pts: cpCurve(20), width: 1.4 },
        { label: { fr: 'limite de Betz 16/27', en: 'Betz limit 16/27' }, color: '--muted', pts: [[1, 16 / 27], [14, 16 / 27]], dash: true, width: 1 },
      ],
      points: (lab) => {
        const pt = windPoint(lab.params, lab.t);
        return [{ x: pt.lambda, y: pt.cp, color: '--accent' }];
      },
      vlines: () => [{ x: LAMBDA_OPT, label: 'λ_opt' }],
      note: () => ({
        fr: 'Sous la vitesse nominale, on règle la vitesse du rotor pour rester au sommet (λ optimal). Au-delà, on tourne les pales (β) pour perdre volontairement du rendement.',
        en: 'Below rated wind, the rotor speed is set to stay at the top (optimal λ). Above it, the blades are pitched (β) to throw efficiency away on purpose.',
      }),
    },
    {
      title: { fr: 'Courbe de puissance', en: 'Power curve' },
      x: { label: 'v', unit: 'm/s', range: [0, 28] },
      y: { label: 'P', unit: 'MW', range: [0, 2.6] },
      series: () => [{ color: '--c-p', pts: Array.from({ length: 281 }, (_, j) => [j / 10, powerCurve(j / 10)] as [number, number]) }],
      points: (lab) => {
        const pt = windPoint(lab.params, lab.t);
        return [{ x: pt.v, y: pt.P, color: '--accent' }];
      },
      vlines: () => [{ x: WT.vIn, label: 'démarrage' }, { x: V_RATED, label: 'nominal' }, { x: WT.vOut, label: 'arrêt' }],
      note: () => ({
        fr: 'P ∝ v³ jusqu’à la vitesse nominale, puis plafonnée par le calage ; arrêt de sécurité au-delà de 25 m/s.',
        en: 'P ∝ v³ up to rated wind, then capped by pitching; safety shutdown beyond 25 m/s.',
      }),
    },
  ],

  predict: {
    signal: 'P',
    yRange: () => [0, 2.5],
    diagnose(pred, run) {
      const inGust = (t: number) => t >= WT.tGust && t <= WT.tGust + 6;
      const truthPeak = Math.max(...Array.from(run.s.P).filter((_, j) => inGust(run.t[j])));
      const base = run.s.P[0];
      const mine = pred.filter(([t]) => inGust(t)).map(([, y]) => y);
      const mine0 = pred.filter(([t]) => t < WT.tGust).map(([, y]) => y);
      if (mine.length && mine0.length && truthPeak > base * 1.2) {
        const ratio = Math.max(...mine) / (mine0.reduce((s, v) => s + v, 0) / mine0.length);
        if (ratio < 1 + 0.5 * (truthPeak / base - 1))
          return {
            fr: 'La puissance du vent croît comme le **cube** de sa vitesse : une rafale de +40 % fait presque **tripler** la puissance disponible. Ici l’inertie du rotor lisse un peu le pic.',
            en: 'Wind power grows with the **cube** of its speed: a +40 % gust almost **triples** the available power. Here the rotor inertia smooths the peak a little.',
          };
      }
      return null;
    },
  },

  equations: [
    {
      id: 'power',
      title: { fr: 'La puissance du vent', en: 'Wind power' },
      tex: (c) => {
        const pt = windPoint(c.p, c.t);
        return `P = \\tfrac12 \\rho \\pi R^2 v^3\\, C_p(\\lambda, \\beta), \\qquad C_p = ${c.q(pt.cp, '', 3)} \\le C_{p,max} = ${c.q(CP_MAX, '', 3)} < \\tfrac{16}{27}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une éolienne ne peut pas arrêter complètement l’air qui la traverse : au mieux, elle en extrait 59 % (limite de Betz). Les rotors modernes atteignent 45 à 50 %.',
          en: 'A turbine cannot stop the air flowing through it completely: at best it extracts 59 % (Betz limit). Modern rotors reach 45–50 %.',
        }),
    },
    {
      id: 'tsr',
      title: { fr: 'Vitesse spécifique', en: 'Tip-speed ratio' },
      tex: (c) => `\\lambda = \\frac{\\Omega R}{v} = ${c.q(windPoint(c.p, c.t).lambda, '', 3)}, \\qquad \\lambda_{opt} = ${c.q(LAMBDA_OPT, '', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Pour rester à $C_{p,max}$, la vitesse du rotor doit suivre celle du vent : le couple du générateur est commandé en $k\\,\\Omega^2$. C’est possible parce que le convertisseur découple la vitesse du rotor de la fréquence du réseau.',
          en: 'To stay at $C_{p,max}$, rotor speed must follow wind speed: the generator torque is set to $k\\,\\Omega^2$. This is possible because the converter decouples rotor speed from grid frequency.',
        }),
    },
    {
      id: 'pitch',
      title: { fr: 'Le calage des pales', en: 'Pitch control' },
      tex: (c) => `\\beta = K_p(\\Omega - \\Omega_n) + K_i\\!\\int(\\Omega - \\Omega_n)\\,dt, \\qquad \\beta_{max} = ${c.q((c.k as WindInfo).maxBeta, '°', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Au-dessus de la vitesse nominale, le générateur reste à puissance nominale et le calage limite la vitesse du rotor. Les pales tournent lentement (quelques degrés par seconde) : l’inertie du rotor absorbe le début des rafales.',
          en: 'Above rated wind, the generator stays at rated power and pitch limits the rotor speed. Blades turn slowly (a few degrees per second): the rotor inertia absorbs the start of gusts.',
        }),
    },
    {
      id: 'inertia',
      title: { fr: 'Inertie synthétique', en: 'Synthetic inertia' },
      tex: (c) => {
        const k = c.k as WindInfo;
        return `\\begin{aligned} \\Delta P &= -2H_{syn} \\frac{df/dt}{f_0}P_n \\le 0{,}1\\,P_n \\\\ \\Delta P_{max} &= ${c.q(k.extraP, 'MW', 3)}, \\quad \\text{creux de reprise } ${c.q(k.recoveryDip, 'MW', 3)} \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le rotor tourne librement : son énergie cinétique n’aide pas le réseau. La commande peut en puiser temporairement (le rotor ralentit), mais il faut ensuite la rendre : un creux de puissance suit le soutien.',
          en: 'The rotor spins freely: its kinetic energy does not help the grid. The control can borrow some temporarily (the rotor slows), but it must then be paid back: a power dip follows the support.',
        }),
    },
    {
      id: 'types',
      title: { fr: 'Les quatre types d’éoliennes', en: 'The four turbine types' },
      personas: ['research', 'utility'],
      tex: () => `\\text{1: asynchrone direct} \\quad \\text{2: rotor bobiné à résistance} \\quad \\text{3: MADA (DFIG)} \\quad \\text{4: convertisseur complet}`,
      note: (c) =>
        c.tr({
          fr: 'Types 1 et 2 : vitesse quasi fixe, couplés au réseau (inertie naturelle mais pas de MPPT). Type 3 : un convertisseur au rotor (~30 % de la puissance). Type 4 : tout passe par le convertisseur — c’est le modèle simulé ici, et la norme en mer.',
          en: 'Types 1 and 2: near-fixed speed, coupled to the grid (natural inertia but no MPPT). Type 3: a rotor-side converter (~30 % of the power). Type 4: everything goes through the converter — the model simulated here, and the offshore standard.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance pendant une rafale', en: 'Predict the power during a gust' },
      body: {
        fr: `Le vent souffle à 8 m/s ; à $t = 6$ s, une rafale ajoute 3 m/s pendant 4 s. **Dessinez la puissance électrique**, puis révélez.`,
        en: `The wind blows at 8 m/s; at $t = 6$ s a gust adds 3 m/s for 4 s. **Sketch the electrical power**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'optimal',
      title: { fr: 'Au sommet de Cp', en: 'At the top of Cp' },
      body: {
        fr: `Sans rafale, sous la vitesse nominale : le point de fonctionnement reste au **sommet** de la courbe $C_p(\\lambda)$ quelle que soit la vitesse du vent. Essayez deux vitesses moyennes différentes.`,
        en: `With no gust, below rated wind: the operating point stays at the **top** of the $C_p(\\lambda)$ curve whatever the wind speed. Try two different mean speeds.`,
      },
      check: (lab) => lab.params.gust < 0.1 && lab.params.v < 10 && Math.abs(windPoint(lab.params, lab.t).lambda - LAMBDA_OPT) < 0.3,
    },
    {
      id: 'rated',
      title: { fr: 'Au-delà du nominal', en: 'Above rated' },
      body: {
        fr: `Montez le vent moyen à **14 m/s** ou plus : la puissance plafonne à 2 MW et les pales se calent.`,
        en: `Raise the mean wind to **14 m/s** or more: power caps at 2 MW and the blades pitch.`,
      },
      check: (lab) => lab.params.v >= 14 && (lab.info as WindInfo).maxBeta > 2,
    },
    {
      id: 'gust',
      title: { fr: 'Une forte rafale', en: 'A strong gust' },
      body: {
        fr: `Au-dessus du nominal, ajoutez une rafale de **6 m/s** ou plus. Le calage absorbe la rafale : la puissance reste quasi constante, la vitesse du rotor monte un peu.`,
        en: `Above rated, add a gust of **6 m/s** or more. Pitch absorbs the gust: power stays nearly constant, rotor speed rises slightly.`,
      },
      check: (lab) => lab.params.v >= 13 && lab.params.gust >= 6 && (lab.info as WindInfo).Ppeak < 2.1,
    },
    {
      id: 'inertia',
      title: { fr: 'Soutenir la fréquence', en: 'Supporting frequency' },
      body: {
        fr: `Revenez sous le nominal (vent < 11 m/s) et activez une inertie synthétique de **5 s** ou plus. À $t = 18$ s, la fréquence chute : l’éolienne fournit un surplus de puissance… puis un creux pendant que le rotor reprend de la vitesse.`,
        en: `Go back below rated (wind < 11 m/s) and enable a synthetic inertia of **5 s** or more. At $t = 18$ s the frequency drops: the turbine supplies extra power… then a dip while the rotor speeds back up.`,
      },
      check: (lab) => lab.params.v < 11 && lab.params.Hsyn >= 5 && (lab.info as WindInfo).extraP > 0.05,
    },
  ],
};
