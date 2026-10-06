// Module 8.11 — Reducing converter models (GFM, GFL): from full EMT to the RMS models phasor tools use,
// with G2ELin results baked into the app.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { IBR, ibrInfo, ibrModel, type IbrInfo } from '../../lib/models/g2data-b';
import IbrRedCanvas from './IbrRedCanvas.svelte';

const info = (lab: { info: unknown }) => lab.info as IbrInfo;
const logPt = (e: { re: number; im: number }) => ({ x: Math.max(1e-2, Math.abs(e.re)), y: Math.max(0.01, Math.abs(e.im) / (2 * Math.PI)) });
const nLevels = IBR.gfm.levels.length;

export const ibrRedLesson: Experiment = {
  id: 'ibrred',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.11 Réduire un convertisseur (G2ELin)', en: '8.11 Reducing a converter (G2ELin)' },
  ],
  title: { fr: 'Réduire un modèle de convertisseur : du modèle EMT complet au modèle RMS (G2ELin)', en: 'Reducing a converter model: from full EMT to the RMS model (G2ELin)' },
  model: ibrModel,
  info: ibrInfo,
  canvas: IbrRedCanvas,
  instruments: [Chart0, Chart1],

  params: [
    {
      id: 'conv',
      sweep: false,
      symbol: 'C',
      name: { fr: 'Convertisseur', en: 'Converter' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Formeur (GFM)', en: 'Grid-forming (GFM)' } },
        { value: 1, label: { fr: 'Suiveur (GFL)', en: 'Grid-following (GFL)' } },
      ],
    },
    {
      id: 'level',
      sweep: false,
      symbol: 'N',
      name: { fr: 'Niveau de modèle', en: 'Model level' },
      unit: '',
      min: 0,
      max: nLevels - 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'complet', en: 'full' } },
        { value: 1, label: { fr: 'sans transfo', en: 'no transformer' } },
        { value: 2, label: { fr: 'sans filtre', en: 'no filter' } },
        { value: 3, label: { fr: 'sans boucle de courant', en: 'no current loop' } },
        { value: 4, label: { fr: 'sans boucle externe', en: 'no outer loop' } },
        { value: 5, label: { fr: 'RMS', en: 'RMS' } },
      ],
    },
  ],

  signals: [
    { id: 'y', symbol: 'y', name: { fr: 'Réponse, modèle choisi', en: 'Response, chosen model' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'yFull', symbol: 'y_{EMT}', name: { fr: 'Réponse, modèle complet (référence)', en: 'Response, full model (reference)' }, unit: 'pu', color: '--muted', on: true, dash: true },
    { id: 'lin', symbol: 'y_{lin}', name: { fr: 'Réponse, modèle linéarisé', en: 'Response, linearised model' }, unit: 'pu', color: '--c-R', on: false, dash: true, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Valeurs propres (échelles log)', en: 'Eigenvalues (log scales)' },
      x: { label: '|σ|', unit: '1/s', range: [1e-2, 1e6], log: true },
      y: { label: 'f', unit: 'Hz', range: [0.01, 1e4], log: true },
      series: () => [],
      vlines: () => [{ x: 2 * Math.PI * 50, label: '50 Hz' }],
      points: (lab) => [
        ...info(lab).full.eig.map((e) => ({ ...logPt(e), color: '--muted', hollow: true })),
        ...info(lab).level.eig.map((e) => ({ ...logPt(e), color: '--accent' })),
      ],
      note: (lab) => ({
        fr: `Cercles : modèle complet (${info(lab).full.n} états). Points : ${info(lab).level.n} états. Chaque niveau retire une boucle ou un filtre, donc ses valeurs propres rapides.`,
        en: `Circles: full model (${info(lab).full.n} states). Dots: ${info(lab).level.n} states. Each level removes one loop or filter, hence its fast eigenvalues.`,
      }),
    },
    {
      title: { fr: 'Taille du modèle et temps de calcul', en: 'Model size and computing time' },
      x: { label: 'niveau', unit: '', range: [-0.3, nLevels - 0.7] },
      y: { label: 'n', unit: '', range: [0, 280] },
      series: (lab) => {
        const lv = IBR[info(lab).conv].levels;
        return [
          { label: { fr: 'nombre d’états', en: 'number of states' }, color: '--c-S', pts: lv.map((L, j) => [j, L.n] as [number, number]) },
          {
            label: { fr: 'temps de simulation (s)', en: 'simulation time (s)' },
            color: '--c-R',
            pts: lv.map((L, j) => [j, L.emt && 'seconds' in L.emt ? L.emt.seconds : NaN] as [number, number]),
          },
        ];
      },
      points: (lab) => [{ x: Math.round(lab.params.level), y: info(lab).level.n, color: '--accent' }],
      note: () => ({ fr: 'Temps mesurés sur le serveur G2ELin pour 0,5 s simulée (ordre de grandeur).', en: 'Times measured on the G2ELin server for 0.5 s simulated (order of magnitude).' }),
    },
  ],

  equations: [
    {
      id: 'level',
      title: { fr: 'Le niveau choisi', en: 'The chosen level' },
      tex: (c) => {
        const k = c.k as IbrInfo;
        return `\\text{${c.tr(k.level.name)}} : \\ ${k.level.n}\\ \\text{${c.tr({ fr: 'états', en: 'states' })}}, \\quad |\\lambda|_{max} = ${c.q(k.fastest, '1/s', 3)}`;
      },
      note: (c) => {
        const k = c.k as IbrInfo;
        return c.tr(
          k.failed
            ? { fr: 'À ce niveau, la simulation non linéaire de l’événement n’a pas convergé : le modèle réduit ne sait pas représenter ce transitoire.', en: 'At this level the nonlinear simulation of the event did not converge: the reduced model cannot represent this transient.' }
            : { fr: `Écart maximal au modèle complet : ${k.gap === null ? '—' : k.gap.toPrecision(2)} pu. Temps de simulation : ${k.seconds ?? '—'} s.`, en: `Largest gap from the full model: ${k.gap === null ? '—' : k.gap.toPrecision(2)} pu. Simulation time: ${k.seconds ?? '—'} s.` },
        );
      },
    },
    {
      id: 'singular',
      title: { fr: 'Rendre une dynamique algébrique', en: 'Making a dynamic algebraic' },
      tex: () => `\\varepsilon\\,\\dot x_f = f(x_s, x_f) \\;\\xrightarrow{\\ \\varepsilon \\to 0\\ }\\; 0 = f(x_s, x_f)`,
      note: (c) =>
        c.tr({
          fr: 'Une boucle beaucoup plus rapide que ce qu’on étudie est supposée à l’équilibre à chaque instant (perturbation singulière) : ses états deviennent des équations algébriques. C’est légitime tant que les dynamiques retirées sont nettement plus rapides que celles qui restent.',
          en: 'A loop much faster than what is studied is assumed to be at equilibrium at every instant (singular perturbation): its states become algebraic equations. This is valid as long as the removed dynamics are clearly faster than those that remain.',
        }),
    },
    {
      id: 'rms',
      title: { fr: 'Ce que gardent les outils RMS', en: 'What RMS tools keep' },
      tex: (c) =>
        `\\begin{aligned} &\\text{GFM} : P\\text{–}f,\\ Q\\text{–}V\\ \\text{(${c.tr({ fr: 'statisme et filtres de mesure', en: 'droop and measurement filters' })})} \\\\ &\\text{GFL} : \\text{PLL + ${c.tr({ fr: 'source de courant', en: 'current source' })}} \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Les outils de stabilité au pas de la milliseconde (phaseurs) ne gardent que le statisme d’un formeur, ou la PLL d’un suiveur. Les interactions rapides entre boucles de courant, filtres et réseau (leçons 6.4, 8.5) leur échappent : il faut alors une simulation EMT.',
          en: 'Stability tools stepping in milliseconds (phasors) keep only a grid-former’s droop, or a grid-follower’s PLL. Fast interactions between current loops, filters and the grid (lessons 6.4, 8.5) escape them: an EMT simulation is then needed.',
        }),
    },
  ],

  steps: [
    {
      id: 'gfm',
      title: { fr: 'Le formeur réduit à son statisme', en: 'The grid-former reduced to its droop' },
      body: {
        fr: `Avec le **formeur**, descendez au dernier niveau, **statisme seul**. Le nombre d’états fond, la réponse de puissance suit pourtant celle du modèle complet.`,
        en: `With the **grid-former**, go down to the last level, **droop only**. The number of states melts, yet the power response follows the full model’s.`,
      },
      check: (lab) => info(lab).conv === 'gfm' && info(lab).level.id === 'droop',
    },
    {
      id: 'fast',
      title: { fr: 'Ce qui disparaît', en: 'What disappears' },
      body: {
        fr: `Toujours avec le formeur, passez par le niveau **sans filtre LC**. Sur le graphique des valeurs propres, les résonances presque pas amorties du réseau et du filtre (de 600 Hz à quelques kHz) ont disparu.`,
        en: `Still with the grid-former, go through the **no LC filter** level. On the eigenvalue chart, the barely damped network and filter resonances (from 600 Hz to a few kHz) have gone.`,
      },
      check: (lab) => info(lab).conv === 'gfm' && info(lab).level.id === 'no_filter',
    },
    {
      id: 'gfl',
      title: { fr: 'Le suiveur réduit à sa PLL', en: 'The grid-follower reduced to its PLL' },
      body: {
        fr: `Passez au **suiveur** et descendez jusqu’à **PLL seule**. Comparez à ce qui se passe avec le formeur.`,
        en: `Switch to the **grid-follower** and go down to **PLL only**. Compare with what happens with the grid-former.`,
      },
      check: (lab) => info(lab).conv === 'gfl' && info(lab).level.id === 'pll',
    },
    {
      id: 'cost',
      title: { fr: 'Le prix du détail', en: 'The price of detail' },
      body: {
        fr: `Revenez au **modèle complet** du suiveur et regardez le temps de simulation : c’est le prix à payer pour voir les interactions rapides.`,
        en: `Go back to the grid-follower’s **full model** and look at the simulation time: that is the price of seeing fast interactions.`,
      },
      check: (lab) => info(lab).conv === 'gfl' && info(lab).level.id === 'full',
    },
  ],
};

