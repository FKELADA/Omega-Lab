// Module 9.6 — The engineer's view: a connection study for a new plant.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { num } from '../../lib/ui/format';
import { SCR_MIN, SITES, TECH, studyInfo, studyModel, type StudyInfo } from '../../lib/models/module9';
import ConnectCanvas from './ConnectCanvas.svelte';

export const connectLesson: Experiment = {
  id: 'connect',
  path: [
    { fr: 'Module 9 · Le gestionnaire du réseau de transport', en: 'Module 9 · The transmission system operator' },
    { fr: '9.6 Études de raccordement', en: '9.6 Connection studies' },
  ],
  title: { fr: 'Où raccorder une nouvelle centrale ? L’étude de l’ingénieur', en: 'Where to connect a new plant? The engineer’s study' },
  model: studyModel,
  info: studyInfo,
  canvas: ConnectCanvas,
  instruments: [Chart0],
  axis: { label: { fr: 'Puissance du projet', en: 'Project size' }, symbol: 'P', fmt: (v, d = 3) => `${num(v, d)} MW` },

  params: [
    {
      id: 'site',
      sweep: false,
      symbol: '\\text{P}',
      name: { fr: 'Poste de raccordement', en: 'Connection substation' },
      unit: '',
      min: 0,
      max: SITES.length - 1,
      default: 2,
      scale: 'lin',
      choices: SITES.map((s, i) => ({ value: i, label: { fr: s.name, en: s.name.replace('Poste', 'Substation') } })),
    },
    {
      id: 'tech',
      sweep: false,
      symbol: '\\text{T}',
      name: { fr: 'Technologie', en: 'Technology' },
      unit: '',
      min: 0,
      max: 1,
      default: TECH.ibr,
      scale: 'lin',
      choices: [
        { value: TECH.ibr, label: { fr: 'Éolien / PV (onduleurs)', en: 'Wind / PV (inverters)' } },
        { value: TECH.sync, label: { fr: 'Centrale synchrone', en: 'Synchronous plant' } },
      ],
    },
    { id: 'P', sweep: false, symbol: 'P', name: { fr: 'Puissance du projet', en: 'Project size' }, unit: 'MW', min: 10, max: 1500, default: 300, scale: 'log', term: 'p' },
  ],

  signals: [
    { id: 'load', symbol: 'P/P_{N-1}', name: { fr: 'Part de la capacité d’accueil en N-1', en: 'Share of the N-1 hosting capacity' }, unit: '%', color: '--c-p', on: true, term: 'p' },
    { id: 'scr', symbol: 'SCR', name: { fr: 'Rapport de court-circuit S_cc / P', en: 'Short-circuit ratio S_sc / P' }, unit: '', color: '--c-L', on: true, term: 'L' },
    { id: 'icc', symbol: 'I_{cc}', name: { fr: 'Courant de court-circuit du poste', en: 'Substation short-circuit current' }, unit: 'kA', color: '--c-R', on: true, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Puissance maximale raccordable', en: 'Largest connectable power' },
      x: { label: 'poste', unit: '', range: [0.5, 3.5] },
      y: { label: 'P_max', unit: 'MW', range: [0, 1600] },
      series: () => [],
      points: (lab) =>
        SITES.flatMap((_, i) => [
          { x: i + 0.85, y: studyInfo({ site: i, tech: TECH.ibr, P: 10 }).pMax, color: '--c-L', label: 'IBR', hollow: i !== Math.round(lab.params.site) || lab.params.tech !== TECH.ibr },
          { x: i + 1.15, y: studyInfo({ site: i, tech: TECH.sync, P: 10 }).pMax, color: '--c-a', label: 'sync', hollow: i !== Math.round(lab.params.site) || lab.params.tech !== TECH.sync },
        ]),
      note: () => ({ fr: '1 : poste A 400 kV · 2 : poste B 225 kV · 3 : poste C 63 kV. Point plein : votre choix.', en: '1: substation A 400 kV · 2: B 225 kV · 3: C 63 kV. Solid dot: your choice.' }),
    },
  ],

  equations: [
    {
      id: 'capacity',
      title: { fr: 'La capacité d’accueil', en: 'Hosting capacity' },
      tex: (c) => {
        const k = c.k as StudyInfo;
        return `\\frac{P}{P_{N-1}} = \\frac{${num(c.p.P, 4)}}{${k.site.cap}} = ${c.q(k.load, '\\%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La puissance que le réseau peut évacuer même après la perte d’un ouvrage. Au-delà, il faut renforcer (des années de travaux) ou accepter une limitation de production.',
          en: 'The power the grid can carry away even after losing one element. Beyond it, the grid must be reinforced (years of work) or production limits accepted.',
        }),
    },
    {
      id: 'scr',
      title: { fr: 'La force du réseau (SCR)', en: 'Grid strength (SCR)' },
      tex: (c) => {
        const k = c.k as StudyInfo;
        return `\\text{SCR} = \\frac{S_{cc}}{P} = \\frac{${num(k.site.Scc, 4)}}{${num(c.p.P, 4)}} = ${c.q(k.scr, '', 3)} \\quad (\\ge ${SCR_MIN} \\text{ ${c.tr({ fr: 'pour un onduleur standard', en: 'for a standard inverter' })}})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un onduleur suiveur de réseau se cale sur la tension qu’il mesure. Sur un réseau faible, sa propre injection la déforme et sa PLL peut décrocher (leçon 8.5). Les études fines (EMT) commencent quand le SCR passe sous 3 à 5.',
          en: 'A grid-following inverter locks onto the voltage it measures. On a weak grid its own injection distorts that voltage and its PLL can lose lock (lesson 8.5). Detailed (EMT) studies start when the SCR drops below 3 to 5.',
        }),
    },
    {
      id: 'icc',
      title: { fr: 'Le pouvoir de coupure', en: 'Breaking capacity' },
      tex: (c) => {
        const k = c.k as StudyInfo;
        return `I_{cc} = I_{cc,0} + \\Delta I_{cc} = ${c.q(k.icc, 'kA', 3)} \\le ${k.site.Ibreak}\\ \\text{kA}, \\qquad \\Delta I_{cc} \\approx ${c.p.tech === TECH.sync ? '\\frac{S}{\\sqrt3\\,U\\,(X\'\'_d + X_t)}' : '1{,}1\\,\\frac{S}{\\sqrt3\\,U}'}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une machine synchrone apporte plusieurs fois son courant nominal au défaut, un onduleur à peine plus que le sien. Dans un poste déjà proche de 63 kA (le maximum courant en 400 kV), une grosse centrale synchrone impose de remplacer les disjoncteurs ou de modifier la topologie.',
          en: 'A synchronous machine feeds several times its rated current into a fault, an inverter barely more than its own. In a substation already close to 63 kA (the usual maximum at 400 kV), a large synchronous plant means replacing the breakers or changing the topology.',
        }),
    },
  ],

  steps: [
    {
      id: 'weak',
      title: { fr: 'Un parc éolien sur un poste 63 kV', en: 'A wind farm on a 63 kV substation' },
      body: {
        fr: `Au **poste C (63 kV)**, trouvez la **plus grande puissance** d’éolien raccordable. Quel critère limite : la capacité ou la force du réseau ?`,
        en: `At **substation C (63 kV)**, find the **largest** wind farm that can be connected. Which criterion binds: capacity or grid strength?`,
      },
      check: (lab) => {
        const k = lab.info as StudyInfo;
        return Math.round(lab.params.site) === 2 && lab.params.tech === TECH.ibr && k.ok && lab.params.P >= 0.95 * k.pMax;
      },
    },
    {
      id: 'stronger',
      title: { fr: 'Plus haut, plus fort', en: 'Higher voltage, stronger grid' },
      body: {
        fr: `Le même porteur de projet vise **400 MW**. Trouvez le poste qui l’accepte.`,
        en: `The same developer now aims for **400 MW**. Find the substation that accepts it.`,
      },
      check: (lab) => lab.params.tech === TECH.ibr && lab.params.P >= 390 && (lab.info as StudyInfo).ok,
    },
    {
      id: 'sync',
      title: { fr: 'Une centrale synchrone de 1 000 MW', en: 'A 1,000 MW synchronous plant' },
      body: {
        fr: `Au **poste A (400 kV)**, essayez une **centrale synchrone de 1 000 MW**. Elle est refusée : par quel critère ?`,
        en: `At **substation A (400 kV)**, try a **1,000 MW synchronous plant**. It is refused: by which criterion?`,
      },
      check: (lab) => Math.round(lab.params.site) === 0 && lab.params.tech === TECH.sync && lab.params.P >= 990 && (lab.info as StudyInfo).why.includes('icc'),
    },
    {
      id: 'ibr',
      title: { fr: 'Le même poste, des onduleurs', en: 'Same substation, inverters' },
      body: {
        fr: `Gardez le poste A et 1 000 MW, mais en **éolien ou PV**. Le projet passe : les onduleurs apportent peu de courant de court-circuit.`,
        en: `Keep substation A and 1,000 MW, but as **wind or PV**. The project goes through: inverters add little short-circuit current.`,
      },
      check: (lab) => Math.round(lab.params.site) === 0 && lab.params.tech === TECH.ibr && lab.params.P >= 990 && (lab.info as StudyInfo).ok,
    },
  ],
};
