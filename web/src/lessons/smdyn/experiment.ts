// Module 4.5 — The synchronous machine in motion: model hierarchy, voltage regulator, governor.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { ORDER, SCEN, SMD, smDynInfo, smDynModel, smInit, smNetwork, type SmDynInfo } from '../../lib/models/module4b';
import SmDynCanvas from './SmDynCanvas.svelte';

const onGrid = (p: Record<string, number>) => p.scen === SCEN.fault;

export const smDynLesson: Experiment = {
  id: 'smdyn',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.5 Machine synchrone : modèles et régulations', en: '4.5 Synchronous machine: models and controls' },
  ],
  title: { fr: 'L’alternateur en mouvement : modèles, régulateur de tension et de vitesse', en: 'The generator in motion: models, voltage regulator and governor' },
  model: smDynModel,
  info: smDynInfo,
  canvas: SmDynCanvas,
  instruments: [Chart0, Chart1],

  params: [
    {
      id: 'scen',
      symbol: 'E',
      name: { fr: 'Essai', en: 'Test' },
      unit: '',
      min: 0,
      max: 1,
      default: SCEN.load,
      scale: 'lin',
      choices: [
        { value: SCEN.load, label: { fr: 'Échelon de charge (îloté)', en: 'Load step (islanded)' } },
        { value: SCEN.fault, label: { fr: 'Défaut puis déclenchement de ligne', en: 'Fault then line trip' } },
      ],
    },
    { id: 'dP', symbol: '\\Delta P', name: { fr: 'Échelon de charge', en: 'Load step' }, unit: 'pu', min: 0.02, max: 0.3, default: 0.1, scale: 'lin', term: 'p' },
    { id: 'R', symbol: 's', name: { fr: 'Statisme du régulateur de vitesse', en: 'Governor droop' }, unit: '%', min: 2, max: 10, default: 5, scale: 'lin', term: 'L' },
    {
      id: 'order',
      symbol: 'M',
      name: { fr: 'Modèle de la machine', en: 'Machine model' },
      unit: '',
      min: 2,
      max: 3,
      default: ORDER.classical,
      scale: 'lin',
      choices: [
        { value: ORDER.classical, label: { fr: 'Classique (2 états)', en: 'Classical (2 states)' } },
        { value: ORDER.oneAxis, label: { fr: 'Un axe (3 états + AVR)', en: 'One-axis (3 states + AVR)' } },
      ],
    },
    { id: 'KA', symbol: 'K_A', name: { fr: 'Gain du régulateur de tension (0 : excitation fixe)', en: 'Voltage regulator gain (0: fixed excitation)' }, unit: '', min: 0, max: 400, default: 0, scale: 'lin', term: 'C' },
    { id: 'Xe', symbol: 'X_e', name: { fr: 'Réactance vers le réseau', en: 'Reactance to the grid' }, unit: 'pu', min: 0.2, max: 0.6, default: 0.3, scale: 'lin', term: 'S' },
  ],

  signals: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence (vitesse)', en: 'Frequency (speed)' }, unit: 'Hz', color: '--c-i', on: true, term: 'i' },
    { id: 'Pm', symbol: 'P_m', name: { fr: 'Puissance mécanique', en: 'Mechanical power' }, unit: 'pu', color: '--c-L', on: true, term: 'L' },
    { id: 'Pe', symbol: 'P_e', name: { fr: 'Puissance électrique', en: 'Electrical power' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'Vt', symbol: 'V_t', name: { fr: 'Tension aux bornes', en: 'Terminal voltage' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'delta', symbol: '\\delta', name: { fr: 'Angle interne', en: 'Rotor angle' }, unit: '°', color: '--c-a', on: false },
    { id: 'Efd', symbol: 'E_{fd}', name: { fr: 'Tension d’excitation', en: 'Field voltage' }, unit: 'pu', color: '--c-C', on: false, term: 'C' },
  ],

  charts: [
    {
      title: { fr: 'Caractéristique de statisme', en: 'Droop characteristic' },
      x: { label: 'P', unit: 'pu', range: [0.5, 1.2] },
      y: { label: 'f', unit: 'Hz', range: [49.2, 50.4] },
      series: (lab) => {
        const s = lab.params.R / 100;
        return [{ label: { fr: `statisme ${lab.params.R.toFixed(1)} %`, en: `droop ${lab.params.R.toFixed(1)} %` }, color: '--c-L', pts: [[0.5, 50 + (SMD.P0 - 0.5) * s * 50], [1.2, 50 - (1.2 - SMD.P0) * s * 50]] }];
      },
      points: (lab) => (onGrid(lab.params) ? [] : [{ x: lab.at('Pm'), y: lab.at('f'), color: '--accent' }]),
      bands: () => [{ y0: 49.8, y1: 50.2 }],
    },
    {
      title: { fr: 'Puissance selon l’angle (avant et après le déclenchement)', en: 'Power versus angle (before and after the trip)' },
      x: { label: 'δ', unit: '°', range: [0, 180] },
      y: { label: 'P', unit: 'pu', range: [0, 2.5] },
      series: (lab) => {
        const p = lab.params, ini = smInit(p.Xe, p.order);
        const curve = (Xe: number) => {
          const pts: [number, number][] = [];
          for (let d = 0; d <= 180; d += 2) pts.push([d, smNetwork((d * Math.PI) / 180, ini.Eqp, SMD.Vinf, Xe, ini.Xq).Pe]);
          return pts;
        };
        return [
          { label: { fr: 'avant', en: 'before' }, color: '--c-p', pts: curve(p.Xe) },
          { label: { fr: 'après (une ligne en moins)', en: 'after (one line lost)' }, color: '--c-R', pts: curve(p.Xe + SMD.dXe), dash: true },
          { label: { fr: 'P mécanique', en: 'mechanical P' }, color: '--c-L', pts: [[0, SMD.P0], [180, SMD.P0]], dash: true, width: 1.5 },
        ];
      },
      points: (lab) => (onGrid(lab.params) ? [{ x: lab.at('delta'), y: lab.at('Pe'), color: '--accent' }] : []),
      note: () => ({ fr: 'Courbes tracées à flux E′q constant (valeur initiale). Le modèle à un axe les fait glisser quand le flux varie.', en: 'Curves drawn at constant flux E′q (initial value). The one-axis model shifts them as the flux changes.' }),
    },
  ],

  predict: {
    signal: 'f',
    yRange: () => [49.4, 50.2],
    diagnose(pred, _run, p) {
      const end = pred.filter(([t]) => t > 15).map(([, y]) => y);
      const k = smDynInfo(p);
      if (end.length && end.reduce((s, v) => s + v, 0) / end.length > 49.95)
        return {
          fr: `La fréquence ne revient **pas** à 50 Hz : le régulateur de vitesse est **proportionnel** (statisme). Il n’augmente la puissance que si la fréquence reste basse : l’écart final vaut ici ${(50 - k.fss).toFixed(2).replace('.', ',')} Hz. Le retour à 50 Hz est le travail du réglage secondaire.`,
          en: `The frequency does **not** return to 50 Hz: the governor is **proportional** (droop). It raises power only while the frequency stays low: the final error is ${(50 - k.fss).toFixed(2)} Hz here. Bringing it back to 50 Hz is the job of secondary control.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'swing',
      title: { fr: 'L’équation du mouvement', en: 'The swing equation' },
      tex: () => `2H\\,\\frac{d\\Delta\\omega}{dt} = P_m - P_e - D\\,\\Delta\\omega, \\qquad \\frac{d\\delta}{dt} = \\omega_b\\,\\Delta\\omega, \\qquad H = ${SMD.H}\\ \\text{s}`,
      note: (c) =>
        c.tr({
          fr: 'Le rotor accélère quand la turbine fournit plus que le réseau ne prend. C’est l’équation commune à tous les modèles ; ils diffèrent par la manière de calculer $P_e$.',
          en: 'The rotor speeds up when the turbine delivers more than the grid takes. Every model shares this equation; they differ in how they compute $P_e$.',
        }),
    },
    {
      id: 'models',
      title: { fr: 'La hiérarchie des modèles', en: 'The model hierarchy' },
      tex: (c) =>
        c.p.order === ORDER.classical
          ? `\\text{${c.tr({ fr: 'classique :', en: 'classical:' })} } P_e = \\frac{E' V}{X'_d + X_e}\\sin\\delta, \\quad E' = \\text{${c.tr({ fr: 'cte', en: 'const.' })}}`
          : `\\begin{aligned} T'_{d0}\\,\\frac{dE'_q}{dt} &= E_{fd} - E'_q - (X_d - X'_d)\\,i_d \\\\ P_e &= E'_q\\,i_q + (X_q - X'_d)\\,i_d\\,i_q \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Classique (2 états : $\\delta$, $\\omega$) → un axe (3 : + $E\'_q$, le flux d’excitation) → deux axes (4) → subtransitoire (6, amortisseurs). Chaque ordre ajoute une constante de temps plus rapide. Pour la stabilité sur quelques secondes, le modèle à un axe avec l’AVR suffit souvent.',
          en: 'Classical (2 states: $\\delta$, $\\omega$) → one-axis (3: + $E\'_q$, the field flux) → two-axis (4) → subtransient (6, damper windings). Each order adds a faster time constant. For stability over a few seconds, the one-axis model with the AVR is often enough.',
        }),
    },
    {
      id: 'avr',
      title: { fr: 'Le régulateur de tension (AVR)', en: 'The voltage regulator (AVR)' },
      tex: (c) => `T_A\\,\\frac{dE_{fd}}{dt} = K_A\\,(V_{ref} - V_t) - E_{fd}, \\quad ${SMD.Efd[0]} \\le E_{fd} \\le ${SMD.Efd[1]}, \\quad K_A = ${c.p.KA.toFixed(0)}`,
      note: (c) =>
        c.tr({
          fr: 'Une excitation statique à thyristors : rapide ($T_A$ = 50 ms) et puissante (plafond 5 pu). Elle tient la tension, mais un gain élevé sur un réseau faible retire de l’amortissement : c’est la raison d’être du stabilisateur (PSS, leçon 8.2).',
          en: 'A static thyristor exciter: fast ($T_A$ = 50 ms) and strong (5 pu ceiling). It holds the voltage, but a high gain on a weak grid removes damping: that is why the stabiliser exists (PSS, lesson 8.2).',
        }),
    },
    {
      id: 'governor',
      title: { fr: 'Le régulateur de vitesse et le statisme', en: 'The governor and droop' },
      tex: (c) => {
        const k = c.k as SmDynInfo;
        return `T_g\\,\\frac{dP_m}{dt} = P_0 - \\frac{\\Delta\\omega}{s} - P_m \\;\\Rightarrow\\; \\Delta f_\\infty = -\\frac{\\Delta P\\, f_0}{1/s + D_{ch}} = ${c.q(k.fss - 50, 'Hz', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un statisme de 5 % signifie : une chute de fréquence de 5 % (2,5 Hz) ferait passer la machine de 0 à 100 % de sa puissance. Toutes les machines en réglage primaire se partagent ainsi un déséquilibre au prorata de leur puissance.',
          en: 'A 5 % droop means a 5 % frequency drop (2.5 Hz) would take the machine from 0 to 100 % of its power. All machines in primary control thus share an imbalance in proportion to their rating.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence après un échelon de charge', en: 'Predict the frequency after a load step' },
      body: {
        fr: `Un alternateur alimente seul (îloté) sa charge de 0,8 pu. À $t = 1$ s, la charge augmente de **0,1 pu**. Son régulateur de vitesse a un statisme de 5 %. **Dessinez la fréquence**, puis révélez.`,
        en: `A generator alone (islanded) supplies its 0.8 pu load. At $t = 1$ s the load rises by **0.1 pu**. Its governor has a 5 % droop. **Sketch the frequency**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'droop',
      title: { fr: 'Choisir le statisme', en: 'Choosing the droop' },
      body: {
        fr: `Trouvez le statisme qui garde la fréquence finale **au-dessus de 49,8 Hz** pour cet échelon de 0,1 pu.`,
        en: `Find the droop that keeps the final frequency **above 49.8 Hz** for this 0.1 pu step.`,
      },
      check: (lab) => !onGrid(lab.params) && lab.params.dP >= 0.099 && (lab.info as SmDynInfo).fss >= 49.8,
    },
    {
      id: 'classical',
      title: { fr: 'Le modèle classique', en: 'The classical model' },
      body: {
        fr: `Passez à l’essai **défaut puis déclenchement de ligne**, modèle **classique**. Un court-circuit de 100 ms près du poste est éliminé en ouvrant une ligne. Regardez $\\delta$ et $V_t$ : la machine oscille, puis la tension reste plus basse.`,
        en: `Switch to the **fault then line trip** test, **classical** model. A 100 ms short circuit near the substation is cleared by opening a line. Watch $\\delta$ and $V_t$: the machine swings, then the voltage stays lower.`,
      },
      check: (lab) => onGrid(lab.params) && lab.params.order === ORDER.classical,
    },
    {
      id: 'oneaxis',
      title: { fr: 'Ajouter le flux d’excitation', en: 'Adding the field flux' },
      body: {
        fr: `Choisissez le modèle **à un axe**, sans régulateur ($K_A = 0$). Le flux $E'_q$ n’est plus constant : il s’affaisse lentement ($T'_{d0}$ = 8 s) et la tension finale descend encore.`,
        en: `Choose the **one-axis** model, with no regulator ($K_A = 0$). The flux $E'_q$ is no longer constant: it sags slowly ($T'_{d0}$ = 8 s) and the final voltage falls further.`,
      },
      check: (lab) => onGrid(lab.params) && lab.params.order === ORDER.oneAxis && lab.params.KA === 0 && (lab.info as SmDynInfo).vEnd < 0.98,
    },
    {
      id: 'avr',
      title: { fr: 'Le régulateur de tension', en: 'The voltage regulator' },
      body: {
        fr: `Activez l’AVR avec un gain $K_A$ entre **20 et 50**. La tension revient à 1 pu malgré la ligne perdue, et les oscillations restent amorties. Affichez $E_{fd}$ : pendant le défaut, l’excitation monte au plafond.`,
        en: `Turn on the AVR with a gain $K_A$ between **20 and 50**. The voltage returns to 1 pu despite the lost line, and the swings stay damped. Show $E_{fd}$: during the fault the field is driven to its ceiling.`,
      },
      check: (lab) => {
        const k = lab.info as SmDynInfo;
        return onGrid(lab.params) && lab.params.order === ORDER.oneAxis && lab.params.KA >= 20 && k.vEnd > 0.99 && !k.growing;
      },
    },
    {
      id: 'weak',
      title: { fr: 'Gain élevé, réseau faible', en: 'High gain, weak grid' },
      body: {
        fr: `Montez $K_A$ à **100 ou plus** et la réactance vers le réseau à **0,5 pu** ou plus. Les oscillations de $\\delta$ ne s’amortissent plus : elles **croissent**. L’AVR rapide a retiré l’amortissement ; le PSS de la leçon 8.2 le rend.`,
        en: `Raise $K_A$ to **100 or more** and the reactance to the grid to **0.5 pu** or more. The $\\delta$ swings no longer die out: they **grow**. The fast AVR has removed the damping; the PSS of lesson 8.2 gives it back.`,
      },
      check: (lab) => onGrid(lab.params) && lab.params.order === ORDER.oneAxis && lab.params.KA >= 100 && lab.params.Xe >= 0.5 && (lab.info as SmDynInfo).growing,
    },
  ],
};
