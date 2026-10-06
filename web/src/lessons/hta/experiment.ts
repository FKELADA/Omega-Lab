// Module 10.1 — Distribution architecture: an MV loop run open, its open point and its back-feed.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { num } from '../../lib/ui/format';
import { CABLES, FAULT, LOOP, loopInfo, loopModel, type LoopInfo } from '../../lib/models/module10';
import HtaCanvas from './HtaCanvas.svelte';

export const htaLesson: Experiment = {
  id: 'hta',
  path: [
    { fr: 'Module 10 · Le gestionnaire du réseau de distribution', en: 'Module 10 · The distribution system operator' },
    { fr: '10.1 Architecture : la boucle HTA', en: '10.1 Architecture: the MV loop' },
  ],
  title: { fr: 'Une boucle exploitée ouverte : du poste source au poste HTA/BT', en: 'A loop run open: from the primary substation to the MV/LV substation' },
  model: loopModel,
  info: loopInfo,
  canvas: HtaCanvas,
  instruments: [Chart0],
  axis: { label: { fr: 'Distance depuis le poste A', en: 'Distance from substation A' }, symbol: 'x', fmt: (v, d = 3) => `${num(v, d)} km` },

  params: [
    { id: 'open', symbol: 'k_o', name: { fr: 'Position du point d’ouverture (interrupteur)', en: 'Position of the open point (switch)' }, unit: '', min: 0, max: LOOP.sections - 1, default: 4, step: 1, scale: 'lin', term: 'S' },
    { id: 'load', symbol: 'P', name: { fr: 'Charge (% de la charge de référence)', en: 'Load (% of the reference load)' }, unit: '%', min: 40, max: 160, default: 100, scale: 'lin', term: 'p' },
    {
      id: 'cable',
      sweep: false,
      symbol: 'C',
      name: { fr: 'Conducteur', en: 'Conductor' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: CABLES.map((c, i) => ({ value: i, label: c.name })),
    },
    { id: 'fault', sweep: false, symbol: 'k_d', name: { fr: 'Tronçon en défaut (−1 : aucun)', en: 'Faulty section (−1: none)' }, unit: '', min: -1, max: LOOP.sections - 1, default: FAULT.none, step: 1, scale: 'lin', term: 'R' },
    {
      id: 'rescue',
      sweep: false,
      symbol: 'S',
      name: { fr: 'Reprise par l’autre poste', en: 'Back-feed from the other substation' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Point d’ouverture ouvert', en: 'Open point open' } },
        { value: 1, label: { fr: 'Fermer le point d’ouverture', en: 'Close the open point' } },
      ],
    },
  ],

  signals: [
    { id: 'v', symbol: 'V', name: { fr: 'Tension le long de la boucle', en: 'Voltage along the loop' }, unit: '%', color: '--c-S', on: true, term: 'S' },
    { id: 'i', symbol: 'I', name: { fr: 'Courant dans le tronçon', en: 'Current in the section' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
  ],

  charts: [
    {
      title: { fr: 'Chute maximale selon la position du point d’ouverture', en: 'Largest drop versus the open point’s position' },
      x: { label: 'k_o', unit: '', range: [0, LOOP.sections - 1] },
      y: { label: 'ΔV max', unit: '%', range: [0, 8] },
      series: (lab) => {
        const pts: [number, number][] = [];
        for (let o = 0; o < LOOP.sections; o++) pts.push([o, loopInfo({ ...lab.params, open: o, fault: FAULT.none }).worstDv]);
        return [
          { label: { fr: 'chute maximale', en: 'largest drop' }, color: '--c-S', pts },
          { label: { fr: 'limite (5 %)', en: 'limit (5 %)' }, color: '--c-R', pts: [[0, LOOP.dvMax], [LOOP.sections - 1, LOOP.dvMax]], dash: true, width: 1.2 },
        ];
      },
      points: (lab) => [{ x: lab.params.open, y: loopInfo({ ...lab.params, fault: FAULT.none }).worstDv, color: '--accent' }],
    },
  ],

  equations: [
    {
      id: 'drop',
      title: { fr: 'La chute le long d’un départ', en: 'The drop along a feeder' },
      tex: (c) => {
        const k = c.k as LoopInfo;
        return `\\Delta V_k = \\sum_{j \\le k} \\frac{R_j P_j + X_j Q_j}{U^2}, \\qquad \\Delta V_{max} = ${c.q(k.worstDv, '\\%', 3)}, \\quad I_{max} = ${c.q(k.worstI, 'A', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Chaque tronçon porte la charge de tous les postes HTA/BT situés en aval : la chute s’accumule vers le bout du départ.',
          en: 'Each section carries the load of every MV/LV substation downstream: the drop builds up towards the end of the feeder.',
        }),
    },
    {
      id: 'loop',
      title: { fr: 'Bouclé mais exploité en radial', en: 'Looped, but run radially' },
      tex: (c) => {
        const k = c.k as LoopInfo;
        return `k_o^{\\star} = ${k.bestOpen}, \\qquad \\Delta V_{max}(k_o^\\star) = ${c.q(k.bestDv, '\\%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le réseau HTA est construit en boucles (ou en coupure d’artère) mais exploité ouvert : un défaut ne coupe qu’une moitié, et les protections restent simples. Le point d’ouverture se place pour équilibrer les deux demi-boucles.',
          en: 'The MV grid is built in loops but run open: a fault cuts only one half, and protection stays simple. The open point is placed to balance the two half-loops.',
        }),
    },
    {
      id: 'orders',
      title: { fr: 'Ordres de grandeur (France)', en: 'Orders of magnitude (France)' },
      tex: () => `\\begin{aligned} &\\text{HTB/HTA} : 63\\,/\\,90 \\to 20\\ \\text{kV}, \\ 2\\text{–}3 \\times 20\\text{–}40\\ \\text{MVA} \\\\ &\\text{HTA/BT} : 20 \\to 0{,}4\\ \\text{kV}, \\ 100\\text{–}1000\\ \\text{kVA} \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Transformateurs normalisés : 20 MVA en 63 kV, 36 MVA en 90 kV, 40 à 100 MVA en 225 kV. Un poste source alimente typiquement une dizaine à une vingtaine de départs HTA de quelques MW chacun, longs de quelques km (urbain, souterrain) à plusieurs dizaines de km (rural). Ordres de grandeur.',
          en: 'Standard transformers: 20 MVA at 63 kV, 36 MVA at 90 kV, 40 to 100 MVA at 225 kV. A primary substation typically feeds ten to twenty MV feeders of a few MW each, from a few km long (urban, underground) to several tens of km (rural). Orders of magnitude.',
        }),
    },
  ],

  steps: [
    {
      id: 'balance',
      title: { fr: 'Placer le point d’ouverture', en: 'Placing the open point' },
      body: {
        fr: `Le point d’ouverture est près du poste A : le départ issu de B porte presque toute la boucle. Déplacez-le pour que la **chute maximale** soit la plus faible possible.`,
        en: `The open point is close to substation A: the feeder from B carries almost the whole loop. Move it so that the **largest drop** is as small as possible.`,
      },
      check: (lab) => lab.params.fault < 0 && Math.abs((lab.info as LoopInfo).worstDv - (lab.info as LoopInfo).bestDv) < 0.05,
    },
    {
      id: 'overhead',
      title: { fr: 'Aérien ou souterrain', en: 'Overhead or underground' },
      body: {
        fr: `Passez en **aérien** : à charge égale, la chute double presque (résistance et réactance plus fortes), et la limite de courant est plus basse.`,
        en: `Switch to **overhead**: for the same load the drop almost doubles (higher resistance and reactance), and the current limit is lower.`,
      },
      check: (lab) => lab.params.cable === 1 && lab.params.fault < 0,
    },
    {
      id: 'fault',
      title: { fr: 'Un défaut sur un tronçon', en: 'A fault on a section' },
      body: {
        fr: `Revenez en souterrain et mettez un défaut sur le **tronçon 2**. Le tronçon est isolé par ses interrupteurs : tous les postes situés au-delà sont **coupés**.`,
        en: `Go back to underground and put a fault on **section 2**. The section is isolated by its switches: every substation beyond it is **cut off**.`,
      },
      check: (lab) => lab.params.cable === 0 && lab.params.fault >= 0 && (lab.info as LoopInfo).lost > 0,
    },
    {
      id: 'rescue',
      title: { fr: 'La reprise par l’autre poste', en: 'Back-feeding from the other substation' },
      body: {
        fr: `**Fermez le point d’ouverture** : l’autre demi-boucle reprend les clients coupés. Vérifiez que tout le monde est réalimenté dans les limites (chute ≤ 7,5 % en secours, courant ≤ 400 A).`,
        en: `**Close the open point**: the other half-loop picks up the customers who were cut off. Check that everyone is back on supply within limits (drop ≤ 7.5 % in back-feed, current ≤ 400 A).`,
      },
      check: (lab) => lab.params.fault >= 0 && lab.params.rescue === 1 && (lab.info as LoopInfo).ok,
    },
    {
      id: 'capacity',
      title: { fr: 'Jusqu’où secourir ?', en: 'How far can back-feeding go?' },
      body: {
        fr: `Toujours en secours, montez la charge jusqu’à la **plus forte valeur encore secourable** (au moins 130 %). Au-delà, il faut renforcer ou délester.`,
        en: `Still back-feeding, raise the load to the **highest value that can still be back-fed** (at least 130 %). Beyond it, the grid must be reinforced or load shed.`,
      },
      check: (lab) => lab.params.fault >= 0 && lab.params.rescue === 1 && lab.params.load >= 130 && (lab.info as LoopInfo).ok,
    },
  ],
};
