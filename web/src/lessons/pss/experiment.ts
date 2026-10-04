// Module 8.2 — Small-signal stability: the electromechanical mode, the
// destabilising fast AVR, and the power-system stabiliser.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { HP, hpInfo, hpModel, hpZetaCurve, type HpInfo } from '../../lib/models/module8';
import HpCanvas from './HpCanvas.svelte';

const zetaLine = (z: number): [number, number][] => [[0, 0], [-z * 2 * Math.PI * 3 / Math.sqrt(1 - z * z), 3]];

export const pssLesson: Experiment = {
  id: 'pss',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.2 Stabilité aux petits signaux', en: '8.2 Small-signal stability' },
  ],
  title: { fr: 'Oscillations électromécaniques : le régulateur de tension et le PSS', en: 'Electromechanical oscillations: the voltage regulator and the PSS' },
  model: hpModel,
  info: hpInfo,
  canvas: HpCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'KA', symbol: 'K_A', name: { fr: 'Gain du régulateur de tension', en: 'Voltage-regulator gain' }, unit: '', min: 10, max: 400, default: 200, scale: 'log', term: 'R' },
    { id: 'Kpss', symbol: 'K_{PSS}', name: { fr: 'Gain du stabilisateur (PSS)', en: 'Stabiliser (PSS) gain' }, unit: '', min: 0, max: 40, default: 0, scale: 'lin', term: 'p' },
    { id: 'Xe', symbol: 'X_e', name: { fr: 'Réactance vers le réseau', en: 'Reactance to the grid' }, unit: 'pu', min: 0.2, max: 1, default: 0.65, scale: 'lin', term: 'L' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance produite', en: 'Power output' }, unit: 'pu', min: 0.4, max: 1, default: 0.9, scale: 'lin', term: 'S' },
  ],

  signals: [
    { id: 'dw', symbol: '\\Delta f', name: { fr: 'Écart de vitesse (en mHz)', en: 'Speed deviation (mHz)' }, unit: 'mHz', color: '--c-p', on: true, term: 'p' },
    { id: 'dd', symbol: '\\Delta\\delta', name: { fr: 'Écart d’angle', en: 'Angle deviation' }, unit: '°', color: '--c-S', on: false, term: 'S' },
    { id: 'dEt', symbol: '\\Delta E_t', name: { fr: 'Écart de tension (en %)', en: 'Voltage deviation (%)' }, unit: '%', color: '--c-R', on: false, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Valeurs propres (plan s)', en: 'Eigenvalues (s-plane)' },
      x: { label: 'σ', unit: '1/s', range: [-6, 2] },
      y: { label: 'f', unit: 'Hz', range: [0, 3] },
      bands: () => [],
      series: () => [
        { label: { fr: 'ζ = 5 %', en: 'ζ = 5 %' }, color: '--warn', pts: zetaLine(0.05), dash: true, width: 1 },
        { label: { fr: 'ζ = 15 %', en: 'ζ = 15 %' }, color: '--good', pts: zetaLine(0.15), dash: true, width: 1 },
        { color: '--muted', pts: [[0, 0], [0, 3]], width: 1 },
      ],
      points: (lab) => {
        const k = lab.info as HpInfo;
        return k.poles.filter((z) => z.im >= 0 && z.re > -6 && z.im / (2 * Math.PI) < 3).map((z) => ({ x: z.re, y: z.im / (2 * Math.PI), color: z === k.mode ? (z.re > 0 ? '--warn' : '--c-p') : '--muted', label: z === k.mode ? 'mode' : undefined }));
      },
      note: (lab) => {
        const k = lab.info as HpInfo;
        return {
          fr: `Mode électromécanique à ${k.freq.toFixed(2)} Hz, amortissement ${(100 * k.zeta).toFixed(1)} %. Visez au moins 5 %, idéalement plus de 10 %.`,
          en: `Electromechanical mode at ${k.freq.toFixed(2)} Hz, damping ${(100 * k.zeta).toFixed(1)} %. Aim for at least 5 %, ideally over 10 %.`,
        };
      },
    },
    {
      title: { fr: 'Amortissement selon le gain du régulateur', en: 'Damping versus regulator gain' },
      x: { label: 'KA', range: [10, 400], log: true },
      y: { label: 'ζ', unit: '%', range: [-15, 50] },
      bands: () => [{ y0: 5, y1: 50 }],
      series: (lab) => [
        { label: { fr: 'sans PSS', en: 'without PSS' }, color: '--c-R', pts: hpZetaCurve(lab.params, 0) },
        { label: { fr: 'avec le PSS réglé', en: 'with the PSS as set' }, color: '--c-p', pts: hpZetaCurve(lab.params, Math.max(lab.params.Kpss, 0.001)), dash: lab.params.Kpss < 0.05 },
      ],
      points: (lab) => [{ x: lab.params.KA, y: 100 * (lab.info as HpInfo).zeta, color: '--accent' }],
      note: () => ({
        fr: 'Un régulateur de tension rapide et puissant améliore la stabilité transitoire mais dégrade l’amortissement : c’est pour cela qu’on ajoute un PSS.',
        en: 'A fast, high-gain voltage regulator improves transient stability but degrades damping: this is why a PSS is added.',
      }),
    },
  ],

  predict: {
    signal: 'dw',
    yRange: () => [-60, 60],
    diagnose(pred, run) {
      const a = (t0: number, t1: number, ys: [number, number][]) => Math.max(0, ...ys.filter(([t]) => t >= t0 && t < t1).map(([, y]) => Math.abs(y)));
      const truth: [number, number][] = Array.from(run.t, (t, j) => [t, run.s.dw[j]]);
      const grows = a(8, 10, truth) > a(1, 3, truth);
      const mineDecays = a(8, 10, pred) < 0.7 * a(1, 3, pred);
      if (grows && mineDecays)
        return {
          fr: 'L’oscillation **grandit** : avec un régulateur de tension rapide à fort gain, le couple d’amortissement de l’alternateur devient **négatif**. Le régulateur réagit aux variations de tension causées par l’oscillation, avec un retard qui l’entretient au lieu de l’éteindre.',
          en: 'The oscillation **grows**: with a fast, high-gain voltage regulator, the generator’s damping torque becomes **negative**. The regulator reacts to the voltage swings caused by the oscillation, with a lag that feeds it instead of killing it.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'hp',
      title: { fr: 'Le modèle linéarisé', en: 'The linearised model' },
      tex: (c) => {
        const K = (c.k as HpInfo).K;
        return `\\Delta T_e = K_1\\Delta\\delta + K_2\\Delta E'_q, \\quad K_1 = ${c.q(K.K1, '', 3)},\\ K_2 = ${c.q(K.K2, '', 3)},\\ K_5 = ${c.q(K.K5, '', 3)},\\ K_6 = ${c.q(K.K6, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les constantes de Heffron–Phillips résument une machine sur réseau infini autour de son point de fonctionnement (leçon 3.3). $K_1$ est le couple synchronisant ; $K_5$, souvent négatif en forte charge, est la cause du problème.',
          en: 'The Heffron–Phillips constants summarise a machine on an infinite bus around its operating point (lesson 3.3). $K_1$ is the synchronising torque; $K_5$, often negative at high load, is the root of the problem.',
        }),
    },
    {
      id: 'mode',
      title: { fr: 'Le mode électromécanique', en: 'The electromechanical mode' },
      tex: (c) => {
        const k = c.k as HpInfo;
        return `\\lambda = ${c.q(k.mode.re, '', 3)} \\pm j\\,${c.q(Math.abs(k.mode.im), '', 3)}, \\quad f = ${c.q(k.freq, 'Hz', 3)}, \\quad \\zeta = ${c.q(100 * k.zeta, '%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une paire de valeurs propres complexes autour de 1 Hz : le rotor oscille contre le réseau (mode local). Entre régions d’un grand réseau, on trouve des modes inter-zones entre 0,1 et 0,8 Hz (leçon 8.7).',
          en: 'A complex pair of eigenvalues around 1 Hz: the rotor swings against the grid (local mode). Between regions of a large grid, inter-area modes appear between 0.1 and 0.8 Hz (lesson 8.7).',
        }),
    },
    {
      id: 'damping',
      title: { fr: 'Couples synchronisant et amortisseur', en: 'Synchronising and damping torques' },
      tex: () => `\\Delta T_e = K_S\\,\\Delta\\delta + K_D\\,\\Delta\\omega`,
      note: (c) =>
        c.tr({
          fr: 'La composante en phase avec l’angle tient le synchronisme ; celle en phase avec la vitesse amortit. Le régulateur de tension augmente la première mais peut rendre la seconde négative.',
          en: 'The component in phase with angle keeps synchronism; the one in phase with speed damps. The voltage regulator increases the first but can make the second negative.',
        }),
    },
    {
      id: 'pss',
      title: { fr: 'Le stabilisateur (PSS)', en: 'The power-system stabiliser (PSS)' },
      tex: () => `\\Delta V_{PSS} = K_{PSS}\\,\\frac{sT_w}{1 + sT_w}\\,\\frac{1 + sT_1}{1 + sT_2}\\,\\Delta\\omega, \\qquad T_w = ${HP.Tw}\\ \\text{s},\\ T_1 = ${HP.T1}\\ \\text{s},\\ T_2 = ${HP.T2}\\ \\text{s}`,
      note: (c) =>
        c.tr({
          fr: 'Le PSS injecte dans le régulateur un signal proportionnel à la vitesse, avancé en phase pour compenser le retard du circuit d’excitation : il crée un couple en phase avec la vitesse, donc de l’amortissement. Le filtre passe-haut l’annule en régime établi.',
          en: 'The PSS feeds the regulator a signal proportional to speed, phase-advanced to compensate for the lag of the field circuit: it creates torque in phase with speed, hence damping. The high-pass filter cancels it in steady state.',
        }),
    },
    {
      id: 'grid',
      title: { fr: 'Pourquoi les réseaux ont des PSS', en: 'Why grids have PSSs' },
      personas: ['utility', 'research'],
      tex: () => `\\text{WECC 1996, Italie 2003: oscillations mal amorties} \\;\\to\\; \\text{PSS obligatoires}`,
      note: (c) =>
        c.tr({
          fr: 'Les grands blackouts ont souvent commencé par des oscillations mal amorties entre régions. Les gestionnaires imposent des PSS sur les grands alternateurs et surveillent l’amortissement en temps réel (PMU). Les onduleurs peuvent aussi fournir un « POD » (amortissement des oscillations).',
          en: 'Major blackouts have often started with poorly damped oscillations between regions. Operators require PSSs on large generators and monitor damping in real time (PMUs). Inverters can provide “POD” (power oscillation damping) too.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire l’oscillation', en: 'Predict the oscillation' },
      body: {
        fr: `Un alternateur très chargé a un régulateur de tension rapide ($K_A = 200$), sans PSS. On augmente légèrement sa puissance mécanique à $t = 0{,}5$ s. **Dessinez l’écart de vitesse**, puis révélez.`,
        en: `A heavily loaded generator has a fast voltage regulator ($K_A = 200$), without a PSS. Its mechanical power is raised slightly at $t = 0.5$ s. **Sketch the speed deviation**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'avr',
      title: { fr: 'Un régulateur plus doux', en: 'A gentler regulator' },
      body: {
        fr: `Sans PSS, baissez le gain du régulateur jusqu’à ce que le mode redevienne **stable**. On perd en tenue de tension : ce n’est pas la bonne solution.`,
        en: `Without a PSS, lower the regulator gain until the mode is **stable** again. Voltage support suffers: this is not the right fix.`,
      },
      check: (lab) => lab.params.Kpss < 0.05 && (lab.info as HpInfo).stable,
    },
    {
      id: 'pss',
      title: { fr: 'Ajouter un PSS', en: 'Adding a PSS' },
      body: {
        fr: `Remettez $K_A = 200$ et augmentez le gain du PSS jusqu’à un amortissement d’au moins **15 %**.`,
        en: `Set $K_A = 200$ again and raise the PSS gain until damping reaches at least **15 %**.`,
      },
      check: (lab) => lab.params.KA >= 150 && (lab.info as HpInfo).zeta >= 0.15,
    },
    {
      id: 'weak',
      title: { fr: 'Un réseau plus faible', en: 'A weaker grid' },
      body: {
        fr: `Avec le PSS, allongez la liaison au réseau ($X_e \\ge 0{,}9$ pu) : le mode ralentit et son amortissement change. Le PSS garde-t-il plus de 5 % ?`,
        en: `With the PSS, lengthen the connection to the grid ($X_e \\ge 0.9$ pu): the mode slows down and its damping changes. Does the PSS keep it above 5 %?`,
      },
      check: (lab) => lab.params.Xe >= 0.9 && lab.params.Kpss >= 5 && (lab.info as HpInfo).zeta > 0.05,
    },
    {
      id: 'load',
      title: { fr: 'Moins de charge', en: 'Less load' },
      body: {
        fr: `Sans PSS mais avec le régulateur rapide, réduisez la puissance produite : le mode devient moins instable. Les problèmes d’amortissement apparaissent surtout à forte charge et sur liaisons longues.`,
        en: `Without a PSS but with the fast regulator, reduce the power output: the mode becomes less unstable. Damping problems appear mainly at high load and on long connections.`,
      },
      check: (lab) => lab.params.Kpss < 0.05 && lab.params.KA >= 150 && lab.params.P <= 0.6,
    },
  ],
};
