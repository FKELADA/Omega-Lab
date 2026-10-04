// Module 7.7 — Grid codes: the fault-ride-through envelope, reactive-current
// injection, active-power recovery, and a compliance test bench.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { FRT, frtEnvelope, frtInfo, frtModel, frtVoltage, PROTECTION, type FrtInfo } from '../../lib/models/module7c';
import FrtCanvas from './FrtCanvas.svelte';

export const frtLesson: Experiment = {
  id: 'frt',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.7 Codes de réseau', en: '7.7 Grid codes' },
  ],
  title: { fr: 'Les codes de réseau : tenir pendant un creux de tension', en: 'Grid codes: riding through a voltage dip' },
  model: frtModel,
  info: frtInfo,
  canvas: FrtCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'Vres', symbol: 'V_{res}', name: { fr: 'Tension résiduelle du creux', en: 'Residual voltage of the dip' }, unit: 'pu', min: 0, max: 0.9, default: 0.5, scale: 'lin', term: 'S' },
    { id: 'dur', symbol: 't_d', name: { fr: 'Durée du creux', en: 'Dip duration' }, unit: 's', min: 0.05, max: 1.2, default: 0.15, scale: 'log', term: 'S' },
    { id: 'K', symbol: 'K', name: { fr: 'Gain de courant réactif', en: 'Reactive-current gain' }, unit: '', min: 0, max: 6, default: 2, scale: 'lin', term: 'C' },
    { id: 'ramp', symbol: '\\dot P', name: { fr: 'Rampe de reprise de P', en: 'P recovery ramp' }, unit: 'pu/s', min: 0.2, max: 20, default: 5, scale: 'log', term: 'p' },
    {
      id: 'prot',
      symbol: '\\text{prot.}',
      name: { fr: 'Protection de découplage', en: 'Interface protection' },
      unit: '',
      min: 0,
      max: 1,
      default: PROTECTION.legacy,
      scale: 'lin',
      choices: [
        { value: PROTECTION.legacy, label: { fr: 'Ancienne (V < 0,8 pendant 0,1 s)', en: 'Legacy (V < 0.8 for 0.1 s)' } },
        { value: PROTECTION.frt, label: { fr: 'Conforme (sous le gabarit seulement)', en: 'Compliant (below the envelope only)' } },
      ],
    },
  ],

  signals: [
    { id: 'V', symbol: 'V', name: { fr: 'Tension au point de raccordement', en: 'Voltage at the PCC' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'env', symbol: 'V_{gabarit}', name: { fr: 'Gabarit de tenue', en: 'Ride-through envelope' }, unit: 'pu', color: '--warn', on: true, dash: true },
    { id: 'iq', symbol: 'i_q', name: { fr: 'Courant réactif injecté', en: 'Reactive current injected' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'ip', symbol: 'i_p', name: { fr: 'Courant actif', en: 'Active current' }, unit: 'pu', color: '--c-p', on: false, term: 'p' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'pu', color: '--c-p', on: false, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Gabarit tension–temps', en: 'Voltage–time envelope' },
      x: { label: 't − t₀', unit: 's', range: [-0.1, 2.5] },
      y: { label: 'V', unit: 'pu', range: [0, 1.1] },
      series: (lab) => {
        const env: [number, number][] = Array.from({ length: 131 }, (_, j) => [j * 0.02, frtEnvelope(j * 0.02)]);
        const dip: [number, number][] = Array.from({ length: 261 }, (_, j) => [-0.1 + j * 0.01, frtVoltage(lab.params, FRT.t0 - 0.1 + j * 0.01)]);
        return [
          { label: { fr: 'zone où le parc doit rester connecté', en: 'zone where the plant must stay connected' }, color: '--good', pts: [...env, [2.6, 0.9], [2.6, 1.1], [0, 1.1]], fill: true },
          { label: { fr: 'gabarit', en: 'envelope' }, color: '--warn', pts: env, width: 2 },
          { label: { fr: 'creux appliqué', en: 'applied dip' }, color: '--c-p', pts: dip, width: 2.2 },
        ];
      },
      note: (lab) =>
        (lab.info as FrtInfo).below
          ? { fr: 'Le creux passe sous le gabarit : le parc a le droit de se déconnecter.', en: 'The dip goes below the envelope: the plant is allowed to disconnect.' }
          : { fr: 'Le creux reste au-dessus du gabarit : le parc doit rester connecté et soutenir la tension.', en: 'The dip stays above the envelope: the plant must stay connected and support the voltage.' },
    },
    {
      title: { fr: 'Courant réactif selon la chute de tension', en: 'Reactive current versus voltage drop' },
      x: { label: 'ΔV', unit: 'pu', range: [0, 1] },
      y: { label: 'iq', unit: 'pu', range: [0, 1.3] },
      series: (lab) => [
        { label: { fr: `iq = K·(ΔV − ${FRT.db})`, en: `iq = K·(ΔV − ${FRT.db})` }, color: '--c-C', pts: Array.from({ length: 101 }, (_, j) => [j / 100, Math.min(FRT.Imax, lab.params.K * Math.max(0, j / 100 - FRT.db))] as [number, number]) },
        { label: { fr: 'limite de courant', en: 'current limit' }, color: '--warn', pts: [[0, FRT.Imax], [1, FRT.Imax]], dash: true, width: 1 },
      ],
      points: (lab) => {
        const k = lab.info as FrtInfo;
        return [{ x: 1 - lab.params.Vres, y: k.iqDip, color: '--accent' }];
      },
      vlines: () => [{ x: FRT.db, label: 'bande morte' }],
      note: () => ({ fr: 'Au-delà de la bande morte de 10 %, le parc injecte du courant réactif proportionnel à la chute de tension, pour la relever.', en: 'Beyond the 10 % dead band, the plant injects reactive current in proportion to the voltage drop, to lift it.' }),
    },
  ],

  predict: {
    signal: 'iq',
    yRange: () => [-0.2, 1.3],
    diagnose(pred) {
      const during = pred.filter(([t]) => t > FRT.t0 + 0.05 && t < FRT.t0 + 0.1).map(([, y]) => y);
      if (during.length && Math.max(...during) < 0.2)
        return {
          fr: 'Pendant un creux, on attend des parcs modernes qu’ils **injectent du courant réactif** pour soutenir la tension, au lieu de se faire discrets. Mais ici la protection ancienne coupe le parc au bout de 100 ms : le courant retombe à zéro, et le réseau perd la production au pire moment.',
          en: 'During a dip, modern plants are expected to **inject reactive current** to support the voltage, rather than keep quiet. But here the legacy protection trips the plant after 100 ms: the current drops to zero, and the grid loses the generation at the worst moment.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'envelope',
      title: { fr: 'Le gabarit de tenue', en: 'The ride-through envelope' },
      tex: () => `V(t) \\ge V_{gabarit}(t) \\;\\Rightarrow\\; \\text{rester connecté}`,
      note: (c) =>
        c.tr({
          fr: 'Gabarit générique inspiré du code européen RfG (parcs de type D) : tenue à 0 pu pendant 150 ms, puis retour progressif à 0,85 pu à 1,5 s. Chaque pays fixe ses valeurs exactes.',
          en: 'Generic envelope inspired by the European RfG code (type D plants): ride through 0 pu for 150 ms, then a gradual return to 0.85 pu at 1.5 s. Each country sets its exact values.',
        }),
    },
    {
      id: 'iq',
      title: { fr: 'Injection de courant réactif', en: 'Reactive-current injection' },
      tex: (c) => {
        const k = c.k as FrtInfo;
        return `\\begin{aligned} \\Delta i_q &= K\\,(\\Delta V - 0{,}1) \\le I_{max} \\\\ i_q &= ${c.q(k.iqDip, 'pu', 3)}\\ (\\text{exigé } ${c.q(k.iqRequired, 'pu', 3)}), \\quad t_{90} = ${isNaN(k.tRise) ? '\\text{—}' : c.q(k.tRise, 'ms', 3)} \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Typiquement K = 2 et un temps de montée de quelques dizaines de millisecondes. Le courant réactif relève la tension autour du défaut (leçon 4.6) et aide les protections à voir le défaut.',
          en: 'Typically K = 2 and a rise time of a few tens of milliseconds. Reactive current lifts the voltage around the fault (lesson 4.6) and helps protection see the fault.',
        }),
    },
    {
      id: 'limit',
      title: { fr: 'Priorité au réactif', en: 'Reactive priority' },
      tex: () => `i_p \\le \\sqrt{I_{max}^2 - i_q^2}`,
      note: (c) =>
        c.tr({
          fr: 'Le courant total reste limité (leçon 7.1) : pendant un creux profond, presque tout passe en réactif, et la puissance active chute. Elle doit revenir vite après le défaut, selon une rampe imposée.',
          en: 'Total current stays limited (lesson 7.1): during a deep dip almost all of it goes to reactive, and active power falls. It must come back quickly after the fault, at a prescribed ramp.',
        }),
    },
    {
      id: 'recovery',
      title: { fr: 'Reprise de la puissance active', en: 'Active-power recovery' },
      tex: (c) => {
        const k = c.k as FrtInfo;
        return `\\frac{dP}{dt} = ${c.q(c.p.ramp, 'pu/s', 3)}, \\qquad t_{90\\%} = ${k.tRecover === null ? '\\text{—}' : c.q(k.tRecover, 's', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Trop lente, la reprise prive le réseau de puissance après le défaut et fait chuter la fréquence ; trop rapide, elle peut exciter des oscillations sur un réseau faible.',
          en: 'Too slow, the recovery deprives the grid of power after the fault and makes frequency fall; too fast, it can excite oscillations on a weak grid.',
        }),
    },
    {
      id: 'history',
      title: { fr: 'Pourquoi ces règles', en: 'Why these rules' },
      personas: ['utility', 'research'],
      tex: () => `\\text{2016 Australie du Sud, 2016 Blue Cut (Californie), 2019 Royaume-Uni}`,
      note: (c) =>
        c.tr({
          fr: 'Lors de ces incidents, des centaines de MW d’éolien ou de solaire se sont déconnectés pendant des creux pourtant brefs, par des réglages de protection trop sensibles ou des PLL trompées (leçon 3.4). Les codes ont été durcis en conséquence (IEEE 2800, RfG).',
          en: 'In these incidents, hundreds of MW of wind or solar disconnected during brief dips, through over-sensitive protection settings or fooled PLLs (lesson 3.4). Codes were tightened as a result (IEEE 2800, RfG).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le courant réactif', en: 'Predict the reactive current' },
      body: {
        fr: `Un parc reçoit un creux à 0,5 pu pendant 150 ms (à $t = 0{,}5$ s). **Dessinez le courant réactif qu’il injecte**, puis révélez.`,
        en: `A plant sees a dip to 0.5 pu for 150 ms (at $t = 0.5$ s). **Sketch the reactive current it injects**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'legacy',
      title: { fr: 'Une protection trop sensible', en: 'Over-sensitive protection' },
      body: {
        fr: `Avec la protection ancienne, le parc se déconnecte alors que le creux reste **au-dessus du gabarit** : il n’est pas conforme.`,
        en: `With the legacy protection, the plant disconnects although the dip stays **above the envelope**: it is not compliant.`,
      },
      check: (lab) => lab.params.prot === PROTECTION.legacy && (lab.info as FrtInfo).tripped && !(lab.info as FrtInfo).below,
    },
    {
      id: 'compliant',
      title: { fr: 'Le réglage conforme', en: 'The compliant setting' },
      body: {
        fr: `Passez au réglage **conforme** : le parc reste connecté et injecte le courant réactif exigé en moins de 60 ms.`,
        en: `Switch to the **compliant** setting: the plant stays connected and injects the required reactive current in under 60 ms.`,
      },
      check: (lab) => lab.params.prot === PROTECTION.frt && (lab.info as FrtInfo).compliant && !(lab.info as FrtInfo).tripped,
    },
    {
      id: 'deep',
      title: { fr: 'Un creux profond', en: 'A deep dip' },
      body: {
        fr: `Descendez la tension résiduelle sous **0,2 pu** (en restant dans le gabarit) : le courant réactif atteint la limite, et la puissance active tombe presque à zéro.`,
        en: `Lower the residual voltage below **0.2 pu** (staying within the envelope): reactive current reaches the limit, and active power falls almost to zero.`,
      },
      check: (lab) => lab.params.Vres < 0.2 && !(lab.info as FrtInfo).below && (lab.info as FrtInfo).iqDip > FRT.Imax - 0.05,
    },
    {
      id: 'below',
      title: { fr: 'Sous le gabarit', en: 'Below the envelope' },
      body: {
        fr: `Allongez le creux profond au-delà de **0,4 s** : la tension passe sous le gabarit, et le parc a le droit de se déconnecter.`,
        en: `Lengthen the deep dip beyond **0.4 s**: the voltage crosses below the envelope, and the plant is allowed to disconnect.`,
      },
      check: (lab) => (lab.info as FrtInfo).below,
    },
    {
      id: 'ramp',
      title: { fr: 'Une reprise lente', en: 'A slow recovery' },
      body: {
        fr: `Revenez à un creux tenu (au-dessus du gabarit) et réduisez la rampe de reprise sous **1 pu/s** : la puissance met au moins **cinq fois plus de temps** à revenir après le défaut.`,
        en: `Go back to a dip that is ridden through (above the envelope) and reduce the recovery ramp below **1 pu/s**: power takes at least **five times longer** to come back after the fault.`,
      },
      check: (lab) => {
        const k = lab.info as FrtInfo;
        return lab.params.ramp < 1 && !k.below && !k.tripped && (k.tRecover === null || k.tRecover > 0.25);
      },
    },
  ],
};
