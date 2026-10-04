// Module 8.6 — Resonance stability: subsynchronous resonance between a
// series-compensated line and a turbine-generator shaft, and its cure.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { SSR, SSR_MITIGATION, ssrInfo, ssrModel, ssrSigmaCurve, type SsrInfo } from '../../lib/models/module8';
import StabilityTree from '../eac/StabilityTree.svelte';
import SsrCanvas from './SsrCanvas.svelte';

const peak = (a: [number, number][], t0: number, t1: number) => Math.max(0, ...a.filter(([t]) => t >= t0 && t < t1).map(([, y]) => Math.abs(y)));

export const ssrLesson: Experiment = {
  id: 'ssr',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.6 Stabilité de résonance', en: '8.6 Resonance stability' },
  ],
  title: { fr: 'Résonance hyposynchrone : compensation série et arbre de turbine', en: 'Subsynchronous resonance: series compensation and the turbine shaft' },
  model: ssrModel,
  info: ssrInfo,
  canvas: SsrCanvas,
  instruments: [Chart0, Chart1, StabilityTree],

  params: [
    { id: 'k', symbol: 'k', name: { fr: 'Taux de compensation série (X_C / X_L)', en: 'Series compensation level (X_C / X_L)' }, unit: '', min: 0.1, max: 0.8, default: 0.5, scale: 'lin', step: 0.01, term: 'C' },
    { id: 'fm', symbol: 'f_m', name: { fr: 'Fréquence du mode de torsion', en: 'Torsional mode frequency' }, unit: 'Hz', min: 10, max: 30, default: 14.6, scale: 'lin', step: 0.1, term: 'S' },
    { id: 'zetaM', symbol: '\\zeta_m', name: { fr: 'Amortissement mécanique de l’arbre', en: 'Mechanical damping of the shaft' }, unit: '%', min: 0.05, max: 2.5, default: 0.1, scale: 'log', term: 'R' },
    {
      id: 'mitig',
      symbol: 'X_C',
      name: { fr: 'Compensation', en: 'Compensation' },
      unit: '',
      min: 0,
      max: 1,
      default: SSR_MITIGATION.none,
      scale: 'lin',
      choices: [
        { value: SSR_MITIGATION.none, label: { fr: 'Condensateur fixe', en: 'Fixed capacitor' } },
        { value: SSR_MITIGATION.tcsc, label: { fr: 'TCSC', en: 'TCSC' } },
      ],
    },
  ],

  signals: [
    { id: 'T', symbol: '\\Delta T_{arbre}', name: { fr: 'Couple de torsion de l’arbre', en: 'Shaft torsional torque' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'env', symbol: 'A\\,e^{\\sigma t}', name: { fr: 'Enveloppe', en: 'Envelope' }, unit: 'pu', color: '--warn', on: true, dash: true },
    { id: 'envN', symbol: '-A\\,e^{\\sigma t}', name: { fr: 'Enveloppe (bas)', en: 'Envelope (lower)' }, unit: 'pu', color: '--warn', on: true, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Taux de croissance du mode de torsion', en: 'Torsional-mode growth rate' },
      x: { label: 'k', unit: '%', range: [10, 80] },
      y: { label: 'σ', unit: '1/s', range: [-1, 1.5] },
      bands: () => [{ y0: -1, y1: 0 }],
      series: (lab) => [
        { label: { fr: 'σ selon la compensation', en: 'σ versus compensation' }, color: '--c-S', pts: ssrSigmaCurve(lab.params) },
        { color: '--muted', pts: [[10, 0], [80, 0]], width: 1 },
      ],
      points: (lab) => [{ x: 100 * lab.params.k, y: (lab.info as SsrInfo).sigma, color: (lab.info as SsrInfo).growing ? '--warn' : '--good' }],
      note: (lab) => {
        const k = lab.info as SsrInfo;
        return k.growing
          ? { fr: `σ = +${k.sigma.toFixed(2)} 1/s : l’oscillation double toutes les ${(Math.LN2 / k.sigma).toFixed(1)} s. L’arbre casse en quelques secondes.`, en: `σ = +${k.sigma.toFixed(2)} 1/s: the oscillation doubles every ${(Math.LN2 / k.sigma).toFixed(1)} s. The shaft breaks within seconds.` }
          : { fr: `σ = ${k.sigma.toFixed(2)} 1/s : le mode est amorti.`, en: `σ = ${k.sigma.toFixed(2)} 1/s: the mode is damped.` };
      },
    },
    {
      title: { fr: 'Coïncidence des fréquences', en: 'Frequency coincidence' },
      x: { label: 'k', unit: '%', range: [10, 80] },
      y: { label: 'f', unit: 'Hz', range: [0, 40] },
      series: (lab) => [
        { label: { fr: '50 − f_er : fréquence vue par le rotor', en: '50 − f_er: frequency seen by the rotor' }, color: '--c-C', pts: Array.from({ length: 71 }, (_, j) => [10 + j, 50 * (1 - Math.sqrt((10 + j) / 100))] as [number, number]) },
        { label: { fr: 'f_m : mode de torsion', en: 'f_m: torsional mode' }, color: '--c-S', pts: [[10, lab.params.fm], [80, lab.params.fm]], dash: true },
      ],
      points: (lab) => [{ x: 100 * lab.params.k, y: (lab.info as SsrInfo).fsub, color: '--accent' }],
      note: () => ({
        fr: 'Danger quand les deux courbes se croisent : le courant de résonance de la ligne produit un couple exactement à la fréquence propre de l’arbre.',
        en: 'Danger where the two curves cross: the line’s resonant current produces torque exactly at the shaft’s natural frequency.',
      }),
    },
  ],

  predict: {
    signal: 'T',
    yRange: () => [-0.3, 0.3],
    diagnose(pred, run) {
      const truth: [number, number][] = Array.from(run.t, (t, j) => [t, run.s.T[j]]);
      const W = SSR.window;
      if (peak(truth, W - 1, W) > 2 * peak(truth, 0, 1) && peak(pred, W - 1, W) <= peak(pred, 0, 1))
        return {
          fr: 'L’oscillation **grandit** : le condensateur série et l’inductance de la ligne résonnent à $f_{er} = 50\\sqrt{k}$. Vu du rotor, ce courant crée un couple à $50 - f_{er}$, ici égal à la fréquence propre de l’arbre. Chaque cycle de torsion renforce le courant qui l’entretient : c’est l’accident de **Mohave** (1970), deux arbres fissurés.',
          en: 'The oscillation **grows**: the series capacitor and the line inductance resonate at $f_{er} = 50\\sqrt{k}$. Seen from the rotor, this current creates torque at $50 - f_{er}$, here equal to the shaft’s natural frequency. Each torsional cycle reinforces the current that drives it: this is the **Mohave** incident (1970), two cracked shafts.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'fer',
      title: { fr: 'La résonance électrique de la ligne', en: 'The line’s electrical resonance' },
      tex: (c) => {
        const k = c.k as SsrInfo;
        return `f_{er} = f_0\\sqrt{\\frac{X_C}{X_L}} = 50\\sqrt{k} = ${c.q(k.fer, 'Hz', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un condensateur en série compense l’inductance d’une longue ligne et augmente la puissance transportable (leçon 4.6). Mais le circuit L–C série ainsi formé a une fréquence propre **sous** 50 Hz.',
          en: 'A series capacitor offsets the inductance of a long line and increases the transfer capability (lesson 4.6). But the series L–C circuit it forms has a natural frequency **below** 50 Hz.',
        }),
    },
    {
      id: 'sub',
      title: { fr: 'Ce que voit le rotor', en: 'What the rotor sees' },
      tex: (c) => {
        const k = c.k as SsrInfo;
        return `f_{rotor} = f_0 - f_{er} = ${c.q(k.fsub, 'Hz', 3)} \\quad \\text{vs} \\quad f_m = ${c.q(c.p.fm, 'Hz', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le rotor tourne à 50 Hz ; un courant statorique à $f_{er}$ y induit un couple à la différence des fréquences. Un arbre de turbine (HP, BP, alternateur) a plusieurs modes de torsion entre 10 et 50 Hz, très peu amortis.',
          en: 'The rotor spins at 50 Hz; a stator current at $f_{er}$ induces torque at the frequency difference. A turbine shaft (HP, LP, generator) has several torsional modes between 10 and 50 Hz, very lightly damped.',
        }),
    },
    {
      id: 'sigma',
      title: { fr: 'Le bilan d’amortissement', en: 'The damping balance' },
      tex: (c) => {
        const k = c.k as SsrInfo;
        return `\\sigma = -\\zeta_m\\,2\\pi f_m + K_E\\left[\\mathrm{Re}\\,Y(f_0 - f_m) - \\mathrm{Re}\\,Y(f_0 + f_m)\\right] = ${c.q(k.sigma, '1/s', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'L’amortissement mécanique est faible (≈ 0,1 %). Le réseau ajoute un terme **négatif** quand son admittance est grande à $f_0 - f_m$, c’est-à-dire près de la résonance. Instable si $\\sigma > 0$.',
          en: 'Mechanical damping is small (≈ 0.1 %). The network adds a **negative** term when its admittance is large at $f_0 - f_m$, that is near resonance. Unstable if $\\sigma > 0$.',
        }),
    },
    {
      id: 'ssci',
      title: { fr: 'SSCI : la version onduleur', en: 'SSCI: the inverter version' },
      personas: ['research', 'utility'],
      tex: () => `\\text{SSCI} : \\text{éolienne DFIG} + \\text{ligne compensée} \\;\\to\\; \\text{résistance négative de la commande}`,
      note: (c) =>
        c.tr({
          fr: 'En 2009 au Texas, des éoliennes à machine asynchrone doublement alimentée ont oscillé à environ 20 Hz avec une ligne compensée, sans arbre en jeu : la commande du convertisseur rotorique présentait une résistance négative. C’est l’interaction hyposynchrone avec la commande (SSCI).',
          en: 'In 2009 in Texas, doubly-fed induction wind turbines oscillated at about 20 Hz with a compensated line, without any shaft involved: the rotor-side converter control presented a negative resistance. This is subsynchronous control interaction (SSCI).',
        }),
    },
    {
      id: 'cure',
      title: { fr: 'Les parades', en: 'Countermeasures' },
      personas: ['utility', 'research'],
      tex: () => `\\text{TCSC} \\cdot \\text{filtres bloqueurs} \\cdot \\text{relais de torsion} \\cdot \\text{amortissement par l’excitation}`,
      note: (c) =>
        c.tr({
          fr: 'Un TCSC (leçon 4.7) compense à 50 Hz mais paraît **inductif** aux fréquences hyposynchrones : la résonance disparaît. On peut aussi filtrer, ou surveiller la torsion et déclencher l’alternateur avant la rupture.',
          en: 'A TCSC (lesson 4.7) compensates at 50 Hz but looks **inductive** at subsynchronous frequencies: the resonance disappears. Filters, or torsional monitoring that trips the generator before the shaft fails, are other options.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la torsion', en: 'Predict the torsion' },
      body: {
        fr: `Une centrale thermique exporte par une longue ligne compensée à **50 %** par un condensateur série. Un petit choc excite la torsion de l’arbre (mode à ${14.6} Hz). **Dessinez le couple de torsion**, puis révélez.`,
        en: `A thermal power station exports over a long line compensated **50 %** by a series capacitor. A small kick excites the shaft torsion (mode at ${14.6} Hz). **Sketch the torsional torque**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'detune',
      title: { fr: 'Désaccorder', en: 'Detuning' },
      body: {
        fr: `Avec le condensateur fixe, changez le taux de compensation jusqu’à ce que le mode soit **amorti**. Regardez le second graphique : les fréquences ne coïncident plus.`,
        en: `With the fixed capacitor, change the compensation level until the mode is **damped**. Look at the second chart: the frequencies no longer coincide.`,
      },
      check: (lab) => lab.params.mitig === SSR_MITIGATION.none && !(lab.info as SsrInfo).growing,
    },
    {
      id: 'find',
      title: { fr: 'Un autre arbre', en: 'Another shaft' },
      body: {
        fr: `Un autre groupe a son mode de torsion à **20 Hz**. Réglez $f_m$, puis trouvez le taux de compensation qui le rend **instable**. Vérifiez : $50(1 - \\sqrt k) = 20$.`,
        en: `Another unit has its torsional mode at **20 Hz**. Set $f_m$, then find the compensation level that makes it **unstable**. Check: $50(1 - \\sqrt k) = 20$.`,
      },
      check: (lab) => Math.abs(lab.params.fm - 20) < 0.3 && lab.params.mitig === SSR_MITIGATION.none && (lab.info as SsrInfo).growing,
    },
    {
      id: 'damping',
      title: { fr: 'Plus d’amortissement mécanique ?', en: 'More mechanical damping?' },
      body: {
        fr: `Toujours en résonance, multipliez l’amortissement mécanique par cinq (**0,5 %**). Le mode grandit encore, et un arbre réel dépasse rarement ces valeurs, il faut agir côté réseau.`,
        en: `Still at resonance, multiply the mechanical damping by five (**0.5 %**). The mode still grows, and a real shaft rarely exceeds such values, so the fix must come from the network side.`,
      },
      check: (lab) => lab.params.zetaM >= 0.45 && lab.params.mitig === SSR_MITIGATION.none && (lab.info as SsrInfo).growing,
    },
    {
      id: 'tcsc',
      title: { fr: 'Un TCSC', en: 'A TCSC' },
      body: {
        fr: `Remplacez le condensateur fixe par un **TCSC**, avec au moins 45 % de compensation : la ligne garde sa capacité de transport, et le mode est amorti quelle que soit la compensation.`,
        en: `Replace the fixed capacitor with a **TCSC**, with at least 45 % compensation: the line keeps its transfer capability, and the mode is damped whatever the compensation.`,
      },
      check: (lab) => lab.params.mitig === SSR_MITIGATION.tcsc && lab.params.k >= 0.45 && !(lab.info as SsrInfo).growing,
    },
  ],
};
