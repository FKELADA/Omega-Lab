// Module 8.5 — Converter-driven stability: a grid-following plant on a weak
// grid, the PLL interaction, and the minimum short-circuit ratio.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { CDS, cdsBoundary, cdsInfo, cdsModel, type CdsInfo } from '../../lib/models/module8';
import StabilityTree from '../eac/StabilityTree.svelte';
import CdsCanvas from './CdsCanvas.svelte';

const TWO_PI = 2 * Math.PI;

/** The run diverged or keeps oscillating after the power step. */
function unsettled(P: ArrayLike<number>): boolean {
  const a = Array.from(P);
  if (a.some((v) => !isFinite(v))) return true;
  const tail = a.slice(Math.floor(a.length * 0.8));
  return Math.max(...tail) - Math.min(...tail) > 0.1;
}

export const cdsLesson: Experiment = {
  id: 'cds',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.5 Stabilité liée aux convertisseurs', en: '8.5 Converter-driven stability' },
  ],
  title: { fr: 'Stabilité liée aux convertisseurs : la PLL sur un réseau faible', en: 'Converter-driven stability: the PLL on a weak grid' },
  model: cdsModel,
  info: cdsInfo,
  canvas: CdsCanvas,
  instruments: [Chart0, Chart1, StabilityTree],

  params: [
    { id: 'SCR', symbol: '\\mathrm{SCR}', name: { fr: 'Rapport de court-circuit au point de raccordement', en: 'Short-circuit ratio at the connection point' }, unit: '', min: 1.2, max: 10, default: 2, scale: 'log', term: 'L' },
    { id: 'fpll', symbol: 'f_{PLL}', name: { fr: 'Bande passante de la PLL', en: 'PLL bandwidth' }, unit: 'Hz', min: 5, max: 150, default: 60, scale: 'log', term: 'S' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance injectée (t = 50 ms)', en: 'Power injected (t = 50 ms)' }, unit: 'pu', min: 0.2, max: 1, default: 1, scale: 'lin', term: 'p' },
  ],

  signals: [
    { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'Pset', symbol: 'P^*', name: { fr: 'Consigne', en: 'Setpoint' }, unit: 'pu', color: '--c-p', on: true, dash: true },
    { id: 'v', symbol: '|v|', name: { fr: 'Tension au point de raccordement', en: 'Voltage at the connection point' }, unit: 'pu', color: '--c-L', on: true, term: 'L' },
    { id: 'fpll', symbol: 'f_{PLL}', name: { fr: 'Fréquence estimée par la PLL', en: 'PLL frequency estimate' }, unit: 'Hz', color: '--c-S', on: false, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Frontière de stabilité : SCR minimal', en: 'Stability boundary: minimum SCR' },
      x: { label: 'f PLL', unit: 'Hz', range: [5, 150], log: true },
      y: { label: 'SCR', range: [1, 6] },
      series: (lab) => [
        { label: { fr: 'SCR minimal (stable au-dessus)', en: 'minimum SCR (stable above)' }, color: '--warn', pts: cdsBoundary(lab.params.P).filter(([, s]) => isFinite(s)) },
      ],
      points: (lab) => [{ x: lab.params.fpll, y: lab.params.SCR, color: (lab.info as CdsInfo).stable ? '--good' : '--warn' }],
      note: (lab) => ({
        fr: `À P = ${lab.params.P.toFixed(2)} pu : plus la PLL est rapide, plus il faut un réseau fort. Une PLL lente est robuste mais suit mal les sauts de phase.`,
        en: `At P = ${lab.params.P.toFixed(2)} pu: the faster the PLL, the stronger the grid it needs. A slow PLL is robust but tracks phase jumps poorly.`,
      }),
    },
    {
      title: { fr: 'Valeurs propres lentes (plan s)', en: 'Slow eigenvalues (s-plane)' },
      x: { label: 'σ', unit: '1/s', range: [-200, 150] },
      y: { label: 'f', unit: 'Hz', range: [0, 200] },
      series: () => [{ color: '--muted', pts: [[0, 0], [0, 200]], width: 1 }],
      points: (lab) => {
        const k = lab.info as CdsInfo;
        return (k.poles ?? [])
          .filter((z) => z.im >= 0 && z.re > -200 && z.im / TWO_PI < 200)
          .map((z) => ({ x: z.re, y: z.im / TWO_PI, color: z.re > 0 ? '--warn' : '--c-S' }));
      },
      note: (lab) => {
        const c = (lab.info as CdsInfo).critical;
        if (!c) return { fr: 'Pas de point de fonctionnement : le réseau ne peut pas transporter cette puissance.', en: 'No operating point: the grid cannot carry this power.' };
        return {
          fr: `Mode le moins amorti : σ = ${c.re.toFixed(1)} 1/s à ${(Math.abs(c.im) / TWO_PI).toFixed(1)} Hz. Il naît de l’interaction entre la PLL, la boucle de puissance et l’impédance du réseau.`,
          en: `Least-damped mode: σ = ${c.re.toFixed(1)} 1/s at ${(Math.abs(c.im) / TWO_PI).toFixed(1)} Hz. It comes from the interaction between the PLL, the power loop and the grid impedance.`,
        };
      },
    },
  ],

  predict: {
    signal: 'P',
    yRange: () => [-0.5, 2],
    diagnose(pred, run) {
      const mine = pred.filter(([t]) => t > 0.3).map(([, y]) => y);
      const settles = mine.length > 0 && Math.max(...mine) - Math.min(...mine) < 0.15;
      if (unsettled(run.s.P) && settles)
        return {
          fr: 'Sur un réseau faible, la tension au point de raccordement **dépend du courant injecté**. La PLL, qui se cale sur cette tension, voit donc sa propre action : rapide, elle corrige une erreur qu’elle a elle-même créée, et le système **oscille puis diverge**. La même PLL est parfaitement stable sur un réseau fort.',
          en: 'On a weak grid the voltage at the connection point **depends on the injected current**. The PLL, which locks onto that voltage, therefore sees its own action: when fast, it corrects an error it created itself, and the system **oscillates then diverges**. The same PLL is perfectly stable on a strong grid.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'scr',
      title: { fr: 'Le rapport de court-circuit', en: 'The short-circuit ratio' },
      tex: (c) => `\\mathrm{SCR} = \\frac{S_{cc}}{P_n} = \\frac{1}{X_g\\ [\\text{pu}]} = ${c.q(c.p.SCR, '', 3)}, \\qquad X_g = ${c.q(1 / c.p.SCR, 'pu', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Un SCR élevé (> 10) : le réseau impose sa tension. Sous 3, le réseau est « faible » ; sous 2, « très faible ». Les grands parcs éoliens en mer ou les zones désertiques éloignées des centrales sont souvent dans ce cas.',
          en: 'A high SCR (> 10): the grid imposes its voltage. Below 3 the grid is “weak”; below 2, “very weak”. Large offshore wind farms or remote desert areas far from power stations are often in this case.',
        }),
    },
    {
      id: 'static',
      title: { fr: 'La limite statique', en: 'The static limit' },
      tex: () => `P_{max} = \\frac{V\\,V_g}{X_g} \\approx \\mathrm{SCR}\\ \\text{pu}`,
      note: (c) =>
        c.tr({
          fr: 'Comme pour une ligne (leçon 4.1) : on ne peut pas injecter plus que $V V_g / X_g$. Mais la commande devient instable **bien avant** cette limite, d’autant plus tôt que la PLL est rapide.',
          en: 'As for a line (lesson 4.1): no more than $V V_g / X_g$ can be injected. But control becomes unstable **well before** this limit, the earlier the faster the PLL.',
        }),
    },
    {
      id: 'pll',
      title: { fr: 'La PLL voit sa propre action', en: 'The PLL sees its own action' },
      tex: (c) => `v_{PCC} = v_g + Z_g\\,i, \\qquad \\omega_{PLL} = \\left(k_p + \\frac{k_i}{s}\\right) v_q, \\quad f_{PLL} = ${c.q(c.p.fpll, 'Hz', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'La PLL (leçon 3.4) aligne son repère sur la tension au point de raccordement. Quand $Z_g$ est grande, cette tension tourne avec le courant injecté : une boucle de rétroaction supplémentaire, positive à forte puissance.',
          en: 'The PLL (lesson 3.4) aligns its frame with the voltage at the connection point. When $Z_g$ is large, this voltage rotates with the injected current: an extra feedback loop, positive at high power.',
        }),
    },
    {
      id: 'impedance',
      title: { fr: 'L’analyse par impédances', en: 'Impedance-based analysis' },
      personas: ['research', 'utility'],
      tex: () => `\\text{stable} \\iff \\frac{Z_g(s)}{Z_{conv}(s)}\\ \\text{vérifie le critère de Nyquist}`,
      note: (c) =>
        c.tr({
          fr: 'Vu du réseau, l’onduleur est une impédance qui dépend de sa commande ; dans la bande de la PLL, sa partie réelle devient **négative**. Le critère de Nyquist (leçon 3.2) appliqué au rapport des impédances prédit l’instabilité. Les gestionnaires demandent désormais ces impédances aux constructeurs.',
          en: 'Seen from the grid, the inverter is an impedance shaped by its control; within the PLL band its real part becomes **negative**. The Nyquist criterion (lesson 3.2) applied to the impedance ratio predicts instability. Operators now ask manufacturers for these impedances.',
        }),
    },
    {
      id: 'cure',
      title: { fr: 'Les remèdes', en: 'Remedies' },
      personas: ['utility', 'research'],
      tex: () => `\\text{PLL plus lente} \\cdot \\text{compensateur synchrone} \\cdot \\text{onduleurs formeurs} \\cdot \\text{limitation de puissance}`,
      note: (c) =>
        c.tr({
          fr: `Les interactions de commande sont réelles : oscillations à quelques Hz au Texas (ERCOT, parcs éoliens), à 30 Hz dans le Xinjiang en 2015. On renforce le réseau (compensateur synchrone), on règle plus lentement les PLL, ou on passe en formeur de réseau, qui n’a pas besoin de PLL pour se synchroniser (leçon 7.2). Boucle de courant : ${CDS.fc} Hz.`,
          en: `Control interactions are real: oscillations at a few Hz in Texas (ERCOT, wind farms), at 30 Hz in Xinjiang in 2015. The grid is reinforced (synchronous condenser), PLLs are tuned slower, or the plant goes grid-forming, which needs no PLL to synchronise (lesson 7.2). Current loop: ${CDS.fc} Hz.`,
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance', en: 'Predict the power' },
      body: {
        fr: `Une centrale solaire suiveuse, raccordée à un réseau **faible** (SCR = 2), a une PLL rapide (60 Hz). Elle passe à pleine puissance à $t = 50$ ms. **Dessinez la puissance injectée**, puis révélez.`,
        en: `A grid-following solar plant, connected to a **weak** grid (SCR = 2), has a fast PLL (60 Hz). It ramps to full power at $t = 50$ ms. **Sketch the injected power**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'slow',
      title: { fr: 'Ralentir la PLL', en: 'Slow the PLL down' },
      body: {
        fr: `Sans toucher au réseau ni à la puissance, réduisez la bande passante de la PLL jusqu’à ce que la centrale soit **stable**.`,
        en: `Without touching the grid or the power, reduce the PLL bandwidth until the plant is **stable**.`,
      },
      check: (lab) => lab.params.SCR <= 2.05 && lab.params.P >= 0.95 && (lab.info as CdsInfo).stable,
    },
    {
      id: 'strong',
      title: { fr: 'Renforcer le réseau', en: 'Strengthen the grid' },
      body: {
        fr: `Remettez la PLL à au moins **55 Hz**, puis augmentez le SCR jusqu’à la stabilité : c’est ce que fait un compensateur synchrone ou une nouvelle ligne.`,
        en: `Set the PLL back to at least **55 Hz**, then raise the SCR until stable: this is what a synchronous condenser or a new line does.`,
      },
      check: (lab) => lab.params.fpll >= 55 && lab.params.P >= 0.95 && (lab.info as CdsInfo).stable,
    },
    {
      id: 'curtail',
      title: { fr: 'Limiter la puissance', en: 'Curtail the power' },
      body: {
        fr: `Revenez à SCR = 2 avec la PLL rapide et réduisez la puissance injectée jusqu’à la stabilité : la solution des gestionnaires en attendant un renforcement, au prix d’énergie perdue.`,
        en: `Go back to SCR = 2 with the fast PLL and reduce the injected power until stable: the operators’ fix while awaiting reinforcement, at the cost of lost energy.`,
      },
      check: (lab) => lab.params.SCR <= 2.05 && lab.params.fpll >= 55 && (lab.info as CdsInfo).stable,
    },
    {
      id: 'minscr',
      title: { fr: 'Le SCR minimal', en: 'The minimum SCR' },
      body: {
        fr: `Défi : à pleine puissance, avec une PLL d’au plus **25 Hz**, trouvez un SCR **inférieur à 1,4** pour lequel la centrale reste stable. Repérez-vous sur la frontière.`,
        en: `Challenge: at full power, with a PLL of at most **25 Hz**, find an SCR **below 1.4** for which the plant stays stable. Use the boundary as a guide.`,
      },
      check: (lab) => lab.params.P >= 0.95 && lab.params.fpll <= 25 && lab.params.SCR < 1.4 && (lab.info as CdsInfo).stable,
    },
  ],
};
