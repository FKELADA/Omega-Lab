// Module 6.2 — Line-commutated rectifier: the six-pulse thyristor bridge,
// firing angle, inverter operation, commutation overlap and current harmonics.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { BRIDGE, bridge, bridgeInfo, type BridgeInfo } from '../../lib/models/module6';
import BridgeCanvas from './BridgeCanvas.svelte';

const Vd0 = (3 * Math.SQRT2 * BRIDGE.VLL) / Math.PI;
const W = 2 * Math.PI * BRIDGE.f;
/** Average DC voltage with overlap: Vd0 cos α − 3ωLs·Id/π. */
const VdOf = (alpha: number, Ls: number, Id: number) => Vd0 * Math.cos((alpha * Math.PI) / 180) - (3 * W * Ls * 1e-3 * Id) / Math.PI;

export const rectifierLesson: Experiment = {
  id: 'rectifier',
  path: [
    { fr: 'Module 6 · Électronique de puissance', en: 'Module 6 · Power electronics' },
    { fr: '6.2 Redresseurs', en: '6.2 Rectifiers' },
  ],
  title: { fr: 'Le pont à thyristors : angle d’amorçage, empiètement, harmoniques', en: 'The thyristor bridge: firing angle, overlap, harmonics' },
  model: bridge,
  info: bridgeInfo,
  canvas: BridgeCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'alpha', symbol: '\\alpha', name: { fr: 'Angle d’amorçage', en: 'Firing angle' }, unit: '°', min: 0, max: 165, default: 30, scale: 'lin', term: 'S' },
    { id: 'Ls', symbol: 'L_s', name: { fr: 'Inductance de la source', en: 'Source inductance' }, unit: 'mH', min: 0, max: 2, default: 0.2, scale: 'lin', term: 'L' },
    { id: 'Id', symbol: 'I_d', name: { fr: 'Courant continu', en: 'DC current' }, unit: 'A', min: 50, max: 1000, default: 400, scale: 'lin', term: 'i' },
  ],

  signals: [
    { id: 'vd', symbol: 'v_d', name: { fr: 'Tension continue', en: 'DC voltage' }, unit: 'V', color: '--c-C', on: true, term: 'C' },
    { id: 'vdAvg', symbol: 'V_d', name: { fr: 'Valeur moyenne', en: 'Average' }, unit: 'V', color: '--c-C', on: true, dash: true },
    { id: 'va', symbol: 'v_a', name: { fr: 'Tension simple phase a', en: 'Phase a voltage' }, unit: 'V', color: '--c-a', on: false, term: 'a' },
    { id: 'ia', symbol: 'i_a', name: { fr: 'Courant de ligne phase a', en: 'Phase a line current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
  ],

  charts: [
    {
      title: { fr: 'Tension continue selon α', en: 'DC voltage versus α' },
      x: { label: 'α', unit: '°', range: [0, 180] },
      y: { label: 'Vd', unit: 'V', range: [-600, 600] },
      bands: () => [{ y0: 0, y1: 600 }],
      series: (lab) => {
        const pts = (Ls: number): [number, number][] => Array.from({ length: 91 }, (_, j) => [2 * j, VdOf(2 * j, Ls, lab.params.Id)]);
        return [
          { label: { fr: 'sans empiètement', en: 'no overlap' }, color: '--c-C', pts: pts(0), dash: true, width: 1.4 },
          { label: { fr: 'avec Ls', en: 'with Ls' }, color: '--c-p', pts: pts(lab.params.Ls) },
        ];
      },
      points: (lab) => [{ x: lab.params.alpha, y: (lab.info as BridgeInfo).Vd, color: '--accent' }],
      note: (lab) =>
        (lab.info as BridgeInfo).Vd >= 0
          ? { fr: 'Zone verte : redresseur (la puissance va du réseau alternatif vers le continu).', en: 'Green zone: rectifier (power flows from the AC grid to the DC side).' }
          : { fr: 'Vd < 0 avec Id > 0 : onduleur assisté par le réseau, la puissance remonte vers le réseau alternatif.', en: 'Vd < 0 with Id > 0: line-commutated inverter, power flows back to the AC grid.' },
    },
    {
      title: { fr: 'Harmoniques du courant de ligne', en: 'Line-current harmonics' },
      x: { label: 'h', range: [0, 27] },
      y: { label: 'Ih/I1', unit: '%', range: [0, 25] },
      series: (lab) => {
        const k = lab.info as BridgeInfo;
        const bars: [number, number][] = [[0, 0]];
        for (const { h, pct } of k.h) bars.push([h, 0], [h, pct], [h, 0]);
        bars.push([27, 0]);
        return [
          { label: { fr: 'mesuré', en: 'measured' }, color: '--c-i', pts: bars, width: 4 },
          { label: { fr: '100/h (sans empiètement)', en: '100/h (no overlap)' }, color: '--muted', pts: Array.from({ length: 23 }, (_, j) => [j + 4, 100 / (j + 4)] as [number, number]), dash: true, width: 1 },
        ];
      },
      note: (lab) => {
        const k = lab.info as BridgeInfo;
        return {
          fr: `Rangs 6k ± 1 seulement. DHT ≈ ${(100 * k.thd).toFixed(0)} %. L’empiètement arrondit le courant et réduit les harmoniques élevés.`,
          en: `Orders 6k ± 1 only. THD ≈ ${(100 * k.thd).toFixed(0)} %. Overlap rounds the current and reduces high harmonics.`,
        };
      },
    },
  ],

  predict: {
    signal: 'vd',
    yRange: () => [-700, 700],
    diagnose(pred, run) {
      const ys = pred.map(([, y]) => y);
      const truth = Array.from(run.s.vd);
      const spread = Math.max(...truth) - Math.min(...truth);
      if (ys.length > 5 && Math.max(...ys) - Math.min(...ys) < 0.3 * spread)
        return {
          fr: 'La tension redressée n’est pas lisse : elle est faite de **six calottes de sinusoïdes par période** (les tensions composées les plus favorables), d’où une ondulation à 300 Hz. Avec un retard α, chaque calotte est prise plus tard et la moyenne baisse comme $\\cos\\alpha$.',
          en: 'The rectified voltage is not smooth: it is made of **six sine-wave caps per period** (the most favourable line-to-line voltages), hence a 300 Hz ripple. With a delay α, each cap is taken later and the mean falls as $\\cos\\alpha$.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'vd',
      title: { fr: 'Tension continue moyenne', en: 'Average DC voltage' },
      tex: (c) => {
        const k = c.k as BridgeInfo;
        return `V_d = \\frac{3\\sqrt2}{\\pi}V_{LL}\\cos\\alpha - \\frac{3}{\\pi}\\omega L_s I_d = ${c.q(Vd0, 'V', 3)}\\cos\\alpha - ${c.q((3 * W * c.p.Ls * 1e-3 * c.p.Id) / Math.PI, 'V', 3)} = ${c.q(k.Vd, 'V', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le thyristor ne s’amorce que sur ordre : en retardant l’ordre d’un angle α après la commutation naturelle, on règle la tension continue. Au-delà de 90°, elle devient négative.',
          en: 'A thyristor turns on only when fired: delaying the firing by an angle α after natural commutation sets the DC voltage. Beyond 90°, it becomes negative.',
        }),
    },
    {
      id: 'overlap',
      title: { fr: 'L’empiètement', en: 'Commutation overlap' },
      tex: (c) => {
        const k = c.k as BridgeInfo;
        return `\\cos\\alpha - \\cos(\\alpha + \\mu) = \\frac{2\\omega L_s I_d}{\\sqrt2\\,V_{LL}} \\;\\Rightarrow\\; \\mu = ${k.failed ? '\\text{—}' : c.q(k.mu, '°', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'L’inductance de la source empêche le courant de passer instantanément d’une phase à l’autre : pendant μ, trois thyristors conduisent et la tension continue suit la moyenne des deux phases qui commutent (les « encoches »).',
          en: 'The source inductance stops the current from moving instantly from one phase to the next: during μ, three thyristors conduct and the DC voltage follows the mean of the two commutating phases (the “notches”).',
        }),
    },
    {
      id: 'pf',
      title: { fr: 'Facteur de puissance', en: 'Power factor' },
      tex: (c) => {
        const k = c.k as BridgeInfo;
        return `\\cos\\varphi_1 \\approx \\cos\\!\\big(\\alpha + \\tfrac{\\mu}{2}\\big) = ${c.q(k.dpf, '', 3)}, \\qquad \\lambda = \\frac{\\cos\\varphi_1}{\\sqrt{1 + \\mathrm{DHT}^2}} = ${c.q(k.pf, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le courant de ligne est en retard d’environ α sur la tension : un pont à thyristors consomme beaucoup de réactif, d’où les batteries de condensateurs et filtres des postes CCHT classiques.',
          en: 'The line current lags the voltage by about α: a thyristor bridge absorbs a lot of reactive power, hence the capacitor banks and filters of classic HVDC stations.',
        }),
    },
    {
      id: 'harmonics',
      title: { fr: 'Harmoniques caractéristiques', en: 'Characteristic harmonics' },
      tex: () => `h = 6k \\pm 1, \\qquad \\frac{I_h}{I_1} \\approx \\frac{1}{h}`,
      note: (c) =>
        c.tr({
          fr: 'Deux ponts décalés de 30° (transformateurs étoile et triangle) forment un pont à 12 impulsions : les rangs 5, 7, 17, 19 s’annulent. C’est la configuration des liaisons CCHT à thyristors.',
          en: 'Two bridges shifted by 30° (star and delta transformers) make a 12-pulse bridge: orders 5, 7, 17, 19 cancel. This is how thyristor HVDC links are built.',
        }),
    },
    {
      id: 'lcc',
      title: { fr: 'Liaisons CCHT à thyristors (LCC)', en: 'Thyristor HVDC (LCC)' },
      personas: ['utility', 'research'],
      tex: () => `\\text{redresseur: } \\alpha \\approx 15^\\circ, \\qquad \\text{onduleur: } \\gamma = 180^\\circ - \\alpha - \\mu \\ge 15^\\circ`,
      note: (c) =>
        c.tr({
          fr: 'L’onduleur doit garder une marge d’extinction γ pour que le thyristor qui s’éteint se bloque avant que sa tension ne redevienne positive ; sinon : échec de commutation, fréquent sur réseau faible ou lors d’un creux.',
          en: 'The inverter must keep an extinction margin γ so the thyristor turning off can block before its voltage goes positive again; otherwise: commutation failure, common on weak grids or during dips.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension continue', en: 'Predict the DC voltage' },
      body: {
        fr: `Un pont à thyristors alimenté en ${BRIDGE.VLL} V est amorcé à α = 30°. **Dessinez la tension côté continu** sur deux périodes, puis révélez.`,
        en: `A thyristor bridge fed at ${BRIDGE.VLL} V is fired at α = 30°. **Sketch the DC-side voltage** over two periods, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'diode',
      title: { fr: 'Le pont à diodes', en: 'The diode bridge' },
      body: {
        fr: `Réglez α = 0 et $L_s$ = 0 : le pont se comporte comme un pont à diodes et $V_d = 1{,}35\\,V_{LL} \\approx 540$ V.`,
        en: `Set α = 0 and $L_s$ = 0: the bridge behaves like a diode bridge and $V_d = 1.35\\,V_{LL} \\approx 540$ V.`,
      },
      check: (lab) => lab.params.alpha <= 1 && lab.params.Ls <= 0.01,
    },
    {
      id: 'delay',
      title: { fr: 'Retarder l’amorçage', en: 'Delaying the firing' },
      body: {
        fr: `Retardez l’amorçage jusqu’à diviser la tension continue par deux (α ≈ 60°). Regardez le courant de ligne se décaler par rapport à la tension.`,
        en: `Delay the firing until the DC voltage is halved (α ≈ 60°). See the line current shift relative to the voltage.`,
      },
      check: (lab) => {
        const k = lab.info as BridgeInfo;
        return k.Vd > 0.4 * Vd0 && k.Vd < 0.6 * Vd0;
      },
    },
    {
      id: 'inverter',
      title: { fr: 'Fonctionnement en onduleur', en: 'Inverter operation' },
      body: {
        fr: `Dépassez 90° : $V_d$ devient **négative** alors que le courant garde son sens. La puissance remonte du continu vers le réseau : c’est le poste onduleur d’une liaison CCHT.`,
        en: `Go beyond 90°: $V_d$ becomes **negative** while the current keeps its direction. Power flows back from DC to the grid: this is the inverter station of an HVDC link.`,
      },
      check: (lab) => (lab.info as BridgeInfo).Vd < -50 && !(lab.info as BridgeInfo).failed,
    },
    {
      id: 'overlap',
      title: { fr: 'L’empiètement', en: 'Overlap' },
      body: {
        fr: `Revenez en redresseur (α < 90°) et augmentez $L_s$ ou $I_d$ jusqu’à un empiètement d’au moins **20°**. Trois thyristors conduisent pendant chaque commutation, et la tension continue présente des encoches.`,
        en: `Go back to rectifier mode (α < 90°) and increase $L_s$ or $I_d$ until the overlap reaches at least **20°**. Three thyristors conduct during each commutation, and the DC voltage shows notches.`,
      },
      check: (lab) => lab.params.alpha < 90 && (lab.info as BridgeInfo).mu >= 20,
    },
    {
      id: 'failure',
      title: { fr: 'L’échec de commutation', en: 'Commutation failure' },
      body: {
        fr: `En onduleur, poussez α vers 150° avec un fort courant et une forte inductance : l’empiètement ne tient plus avant l’inversion de tension, c’est l’**échec de commutation**.`,
        en: `In inverter mode, push α towards 150° with a large current and a large inductance: the overlap no longer fits before the voltage reverses, this is **commutation failure**.`,
      },
      check: (lab) => (lab.info as BridgeInfo).failed || lab.params.alpha + ((lab.info as BridgeInfo).mu || 0) > 180,
    },
  ],
};

