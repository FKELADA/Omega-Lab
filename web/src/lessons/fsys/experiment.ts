// Module 8.4 — Frequency stability: inertia, RoCoF and nadir as inverters
// replace synchronous machines; grid-forming inertia and fast frequency response.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { FSYS, fsysCurve, fsysInfo, fsysModel, type FsysInfo } from '../../lib/models/module8';
import StabilityTree from '../eac/StabilityTree.svelte';
import FsysCanvas from './FsysCanvas.svelte';

export const fsysLesson: Experiment = {
  id: 'fsys',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.4 Stabilité de fréquence', en: '8.4 Frequency stability' },
  ],
  title: { fr: 'Stabilité de fréquence : inertie, RoCoF et nadir quand les onduleurs remplacent les machines', en: 'Frequency stability: inertia, RoCoF and nadir as inverters replace machines' },
  model: fsysModel,
  info: fsysInfo,
  canvas: FsysCanvas,
  instruments: [Chart0, Chart1, StabilityTree],

  params: [
    { id: 'share', symbol: 's_{IBR}', name: { fr: 'Part de la production par onduleurs', en: 'Share of inverter-based generation' }, unit: '', min: 0, max: 0.9, default: 0.3, scale: 'lin', step: 0.05, term: 'L' },
    { id: 'gfm', symbol: 's_{GFM}', name: { fr: 'Part des onduleurs en formeur de réseau', en: 'Share of inverters that are grid-forming' }, unit: '', min: 0, max: 1, default: 0, scale: 'lin', step: 0.05, term: 'C' },
    { id: 'ffr', symbol: 'P_{FFR}', name: { fr: 'Réserve rapide (batteries)', en: 'Fast frequency response (batteries)' }, unit: 'MW', min: 0, max: 1500, default: 0, scale: 'lin', step: 50, term: 'p' },
  ],

  signals: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence du réseau', en: 'Grid frequency' }, unit: 'Hz', color: '--c-p', on: true, term: 'p' },
    { id: 'f0', symbol: 'f_{100\\%\\,SM}', name: { fr: 'Référence : 100 % machines synchrones', en: 'Reference: 100 % synchronous machines' }, unit: 'Hz', color: '--muted', on: true, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Nadir selon la part d’onduleurs', en: 'Nadir versus inverter share' },
      x: { label: 's IBR', unit: '%', range: [0, 90] },
      y: { label: 'f min', unit: 'Hz', range: [47.5, 50] },
      bands: () => [{ y0: FSYS.ufls, y1: 50 }],
      series: (lab) => [
        { label: { fr: 'nadir, réglages actuels', en: 'nadir, current settings' }, color: '--c-p', pts: fsysCurve(lab.params).nadir },
        { label: { fr: 'nadir, onduleurs suiveurs seuls', en: 'nadir, grid-following only' }, color: '--c-R', pts: fsysCurve({ ...lab.params, gfm: 0, ffr: 0 }).nadir, dash: true, width: 1.3 },
        { label: { fr: 'délestage (48,8 Hz)', en: 'load shedding (48.8 Hz)' }, color: '--warn', pts: [[0, FSYS.ufls], [90, FSYS.ufls]], width: 1 },
      ],
      points: (lab) => [{ x: 100 * lab.params.share, y: (lab.info as FsysInfo).nadir, color: '--accent' }],
      note: (lab) => {
        const k = lab.info as FsysInfo;
        return k.ufls
          ? { fr: `Nadir ${k.nadir.toFixed(2)} Hz : sous 48,8 Hz, le délestage automatique coupe des clients.`, en: `Nadir ${k.nadir.toFixed(2)} Hz: below 48.8 Hz, automatic load shedding disconnects customers.` }
          : { fr: `Nadir ${k.nadir.toFixed(2)} Hz : le délestage n’est pas atteint.`, en: `Nadir ${k.nadir.toFixed(2)} Hz: load shedding is not reached.` };
      },
    },
    {
      title: { fr: 'RoCoF initial selon la part d’onduleurs', en: 'Initial RoCoF versus inverter share' },
      x: { label: 's IBR', unit: '%', range: [0, 90] },
      y: { label: '|df/dt|', unit: 'Hz/s', range: [0, 2.5] },
      bands: () => [{ y0: 0, y1: FSYS.rocofRelay }],
      series: (lab) => [
        { label: { fr: 'réglages actuels', en: 'current settings' }, color: '--c-p', pts: fsysCurve(lab.params).rocof },
        { label: { fr: 'relais RoCoF (1 Hz/s)', en: 'RoCoF relays (1 Hz/s)' }, color: '--warn', pts: [[0, FSYS.rocofRelay], [90, FSYS.rocofRelay]], width: 1 },
      ],
      points: (lab) => [{ x: 100 * lab.params.share, y: -(lab.info as FsysInfo).rocof, color: '--accent' }],
      note: () => ({
        fr: 'Le RoCoF initial ne dépend que de l’inertie : ni les régulateurs ni les batteries n’ont le temps d’agir dans les premières centaines de millisecondes.',
        en: 'The initial RoCoF depends only on inertia: neither governors nor batteries have time to act in the first few hundred milliseconds.',
      }),
    },
  ],

  predict: {
    signal: 'f',
    yRange: () => [48.5, 50.2],
    diagnose(pred, run) {
      const end = (a: [number, number][]) => {
        const ys = a.filter(([t]) => t > FSYS.window - 8).map(([, y]) => y);
        return ys.length ? ys.reduce((s, v) => s + v, 0) / ys.length : NaN;
      };
      const truth: [number, number][] = Array.from(run.t, (t, j) => [t, run.s.f[j]]);
      if (end(truth) < 49.85 && end(pred) > 49.93)
        return {
          fr: 'Le réglage **primaire** arrête la chute mais **ne ramène pas** la fréquence à 50 Hz : chaque régulateur produit en proportion de l’écart (statisme), il faut donc un écart pour qu’ils produisent. C’est le réglage **secondaire** (automatique, en quelques minutes) qui rétablit 50 Hz.',
          en: '**Primary** control stops the fall but **does not bring** frequency back to 50 Hz: each governor produces in proportion to the deviation (droop), so a deviation must remain for them to keep producing. **Secondary** control (automatic, over a few minutes) restores 50 Hz.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'swing',
      title: { fr: 'L’équation du mouvement du réseau', en: 'The system swing equation' },
      tex: (c) => {
        const k = c.k as FsysInfo;
        return `\\frac{2H_{sys}S}{f_0}\\frac{df}{dt} = P_m - P_e, \\qquad H_{sys} = H_{SM}(1 - s_{IBR}) + H_{GFM}\\,s_{IBR}\\,s_{GFM} = ${c.q(k.H, 's', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Toutes les machines synchrones tournent ensemble : leur énergie cinétique freine la chute de fréquence. Un onduleur suiveur n’en apporte aucune ; un formeur peut en émuler, à condition d’avoir une réserve d’énergie et de la marge en courant.',
          en: 'All synchronous machines spin together: their kinetic energy slows the frequency fall. A grid-following inverter adds none; a grid-forming one can emulate it, provided it has energy in reserve and current headroom.',
        }),
    },
    {
      id: 'rocof',
      title: { fr: 'RoCoF', en: 'RoCoF' },
      tex: (c) => {
        const k = c.k as FsysInfo;
        return `\\left.\\frac{df}{dt}\\right|_{0^+} = -\\frac{\\Delta P\\,f_0}{2H_{sys}S} = ${c.q(k.rocof, 'Hz/s', 3)}, \\qquad \\Delta P = ${FSYS.loss}\\ \\text{MW},\\ S = ${FSYS.S / 1000}\\ \\text{GW}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Au-delà d’environ 1 Hz/s, des protections « anti-îlotage » déconnectent des productions décentralisées, ce qui aggrave le déséquilibre. L’Irlande et le Royaume-Uni ont relevé ces seuils pour pouvoir accepter plus d’éolien.',
          en: 'Beyond about 1 Hz/s, “anti-islanding” protection disconnects distributed generation, worsening the imbalance. Ireland and Great Britain raised these thresholds so they could accept more wind.',
        }),
    },
    {
      id: 'nadir',
      title: { fr: 'Nadir et réglage primaire', en: 'Nadir and primary control' },
      tex: (c) => {
        const k = c.k as FsysInfo;
        return `f_{min} = ${c.q(k.nadir, 'Hz', 4)}, \\qquad \\Delta f_{\\infty} \\approx -\\frac{\\Delta P}{K_{gov}(1 - s_{IBR}) + D}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le nadir résulte d’une course : l’inertie ralentit la chute pendant que les régulateurs (quelques secondes) et les batteries (quelques centaines de ms) montent en puissance. Moins d’inertie et moins de régulateurs : la fréquence descend plus bas, plus vite.',
          en: 'The nadir is the result of a race: inertia slows the fall while governors (a few seconds) and batteries (a few hundred ms) ramp up. Less inertia and fewer governors: frequency goes lower, faster.',
        }),
    },
    {
      id: 'codes',
      title: { fr: 'Ce que font les gestionnaires', en: 'What operators do' },
      personas: ['utility', 'research'],
      tex: () => `\\text{incident de référence} \\cdot \\text{inertie minimale} \\cdot \\text{FFR / DC} \\cdot \\text{compensateurs synchrones} \\cdot \\text{GFM}`,
      note: (c) =>
        c.tr({
          fr: 'Le 9 août 2019, la Grande-Bretagne a perdu environ 1,9 GW et est descendue à 48,8 Hz : 1,1 million de clients délestés (leçon 0.2). Depuis, National Grid achète de l’inertie (compensateurs synchrones) et des réserves très rapides, et l’Australie impose des onduleurs formeurs.',
          en: 'On 9 August 2019 Great Britain lost about 1.9 GW and fell to 48.8 Hz: 1.1 million customers were shed (lesson 0.2). Since then National Grid buys inertia (synchronous condensers) and very fast reserves, and Australia requires grid-forming inverters.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence', en: 'Predict the frequency' },
      body: {
        fr: `Un réseau de 30 GW, dont 30 % de production par onduleurs, perd brutalement **${FSYS.loss} MW** à $t = 1$ s. **Dessinez la fréquence** sur 40 s, puis révélez.`,
        en: `A 30 GW grid, 30 % of it inverter-based, suddenly loses **${FSYS.loss} MW** at $t = 1$ s. **Sketch the frequency** over 40 s, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'shed',
      title: { fr: 'Jusqu’au délestage', en: 'Down to load shedding' },
      body: {
        fr: `Augmentez la part d’onduleurs (suiveurs) jusqu’à ce que le nadir passe sous **48,8 Hz** : le délestage se déclenche.`,
        en: `Raise the share of (grid-following) inverters until the nadir falls below **48.8 Hz**: load shedding starts.`,
      },
      check: (lab) => lab.params.gfm < 0.05 && lab.params.ffr < 50 && (lab.info as FsysInfo).ufls,
    },
    {
      id: 'rocof',
      title: { fr: 'Les relais RoCoF', en: 'RoCoF relays' },
      body: {
        fr: `Continuez jusqu’à ce que le RoCoF dépasse **1 Hz/s** : les protections des productions décentralisées se déclenchent dès les premières centaines de millisecondes.`,
        en: `Carry on until the RoCoF exceeds **1 Hz/s**: distributed-generation protection trips within the first few hundred milliseconds.`,
      },
      check: (lab) => lab.params.gfm < 0.05 && (lab.info as FsysInfo).rocofTrip,
    },
    {
      id: 'ffr',
      title: { fr: 'Des batteries rapides', en: 'Fast batteries' },
      body: {
        fr: `À 80 % d’onduleurs, sans formeurs, ajoutez de la réserve rapide jusqu’à éviter le délestage. Regardez le RoCoF : il **ne change pas**.`,
        en: `At 80 % inverters, with no grid-forming, add fast reserve until load shedding is avoided. Look at the RoCoF: it **does not change**.`,
      },
      check: (lab) => lab.params.share >= 0.8 && lab.params.gfm < 0.05 && !(lab.info as FsysInfo).ufls,
    },
    {
      id: 'gfm',
      title: { fr: 'Des onduleurs formeurs', en: 'Grid-forming inverters' },
      body: {
        fr: `Toujours à 80 %, retirez la réserve rapide et passez une partie des onduleurs en **formeurs** jusqu’à respecter **les deux** limites : nadir au-dessus de 48,8 Hz et RoCoF sous 1 Hz/s.`,
        en: `Still at 80 %, remove the fast reserve and make part of the inverters **grid-forming** until **both** limits hold: nadir above 48.8 Hz and RoCoF below 1 Hz/s.`,
      },
      check: (lab) => {
        const k = lab.info as FsysInfo;
        return lab.params.share >= 0.8 && lab.params.ffr < 50 && !k.ufls && !k.rocofTrip;
      },
    },
  ],
};
