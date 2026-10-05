// Module 1.5 — DC versus AC: why AC won, and why DC is coming back.

import type { Experiment } from '../../lib/lab/types';
import { MEDIA, dcAc, dcAcInfo, type DcAcInfo } from '../../lib/models/module1b';
import ChargingChart from './ChargingChart.svelte';
import CostChart from './CostChart.svelte';
import DcAcCanvas from './DcAcCanvas.svelte';

export const dcAcLesson: Experiment = {
  id: 'dc-ac',
  path: [
    { fr: 'Module 1 · Circuits', en: 'Module 1 · Circuits' },
    { fr: '1.5 Continu contre alternatif', en: '1.5 DC versus AC' },
  ],
  title: { fr: 'La guerre des courants, et sa revanche', en: 'The war of the currents, and its rematch' },
  model: dcAc,
  info: dcAcInfo,
  canvas: DcAcCanvas,
  instruments: [CostChart, ChargingChart],

  params: [
    { id: 'km', sweep: false, symbol: 'd', name: { fr: 'Distance', en: 'Distance' }, unit: 'km', min: 10, max: 2000, default: 300, scale: 'log', term: 'R' },
    {
      id: 'medium',
      symbol: '',
      name: { fr: 'Type de liaison', en: 'Link type' },
      unit: '',
      min: 0,
      max: 1,
      default: MEDIA.overhead,
      scale: 'lin',
      choices: [
        { value: MEDIA.overhead, label: { fr: 'Ligne aérienne', en: 'Overhead line' } },
        { value: MEDIA.cable, label: { fr: 'Câble (sous-marin, souterrain)', en: 'Cable (subsea, underground)' } },
      ],
    },
    {
      id: 'kV',
      symbol: 'U',
      name: { fr: 'Niveau d’isolement', en: 'Insulation level' },
      unit: '',
      min: 225,
      max: 525,
      default: 400,
      scale: 'lin',
      choices: [225, 400, 525].map((v) => ({ value: v, label: { fr: `${v} kV`, en: `${v} kV` } })),
    },
  ],

  signals: [
    { id: 'vac', symbol: 'v_{AC}', name: { fr: 'Tension alternative', en: 'AC voltage' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'vacRms', symbol: 'V_{AC,rms}', name: { fr: 'Valeur efficace AC', en: 'AC RMS value' }, unit: 'V', color: '--c-S', on: true, term: 'S', dash: true },
    { id: 'vdc', symbol: 'V_{DC}', name: { fr: 'Tension continue', en: 'DC voltage' }, unit: 'V', color: '--c-C', on: true, term: 'C' },
  ],

  equations: [
    {
      id: 'insulation',
      title: { fr: 'Même isolation, plus de puissance', en: 'Same insulation, more power' },
      tex: (c) => `\\begin{aligned}
        P_{AC} &= U_{rms}\\,I\\cos\\varphi \\le \\frac{\\hat U}{\\sqrt2}\\,I \\\\
        P_{DC} &= \\hat U\\,I \\;\\Rightarrow\\; \\frac{P_{DC}}{P_{AC}} = \\sqrt2 \\approx 1{,}41 \\quad (\\hat U = ${c.q(c.p.kV * 1e3, 'V')})
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Isolateurs et câbles sont dimensionnés pour la tension **crête**. En continu, la tension reste à sa crête : à isolation égale, on transporte environ 40 % de puissance en plus, sans puissance réactive.',
          en: 'Insulators and cables are sized for the **peak** voltage. In DC the voltage sits at its peak all the time: for the same insulation, about 40 % more power, and no reactive power.',
        }),
    },
    {
      id: 'charging',
      title: { fr: 'Le courant de charge', en: 'Charging current' },
      tex: (c) => {
        const k = c.k as DcAcInfo;
        return `\\begin{aligned}
          I_c &= \\omega C' \\frac{U}{\\sqrt3}\\,d = ${c.q(k.chargingPerKm, 'A', 3)}/\\mathrm{km} \\times d \\\\
          d_{crit} &= \\frac{I_{max}}{\\omega C' U/\\sqrt3} = ${c.q(k.criticalKm, 'km')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'En alternatif, la capacité de la liaison se charge et se décharge 100 fois par seconde. Dans un câble, elle est environ 15 fois plus grande que dans une ligne aérienne : au-delà d’une centaine de kilomètres, tout le courant admissible sert à charger le câble. En continu, ce courant disparaît.',
          en: 'In AC the link’s capacitance charges and discharges 100 times a second. In a cable it is about 15 times larger than on an overhead line: beyond about a hundred kilometres, the whole current rating goes into charging the cable. In DC this current disappears.',
        }),
    },
    {
      id: 'breakeven',
      title: { fr: 'Le seuil de rentabilité', en: 'The break-even distance' },
      tex: (c) => {
        const k = c.k as DcAcInfo;
        return `d^* = \\frac{T_{DC} - T_{AC}}{c_{AC} - c_{DC}} = ${c.q(k.breakEven, 'km')} \\qquad \\text{(${c.tr({ fr: 'coûts relatifs', en: 'relative costs' })})}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les stations de conversion coûtent cher ($T_{DC}$), mais chaque kilomètre de ligne continue coûte moins cher ($c_{DC}$) : moins de conducteurs, pas de compensation réactive. Ordres de grandeur couramment cités : 500 à 800 km en aérien, 50 à 100 km en câble.',
          en: 'Converter stations are expensive ($T_{DC}$), but each kilometre of DC line is cheaper ($c_{DC}$): fewer conductors, no reactive compensation. Commonly quoted ranges: 500–800 km overhead, 50–100 km in cable.',
        }),
    },
    {
      id: 'history',
      title: { fr: 'Un peu d’histoire', en: 'A little history' },
      tex: () => `\\text{1880s: Edison (DC)} \\;\\text{vs}\\; \\text{Tesla, Westinghouse (AC)}`,
      note: (c) =>
        c.tr({
          fr: 'L’alternatif a gagné grâce au **transformateur**, qui change la tension sans pièce mobile : on transporte en haute tension (peu de pertes, leçon 0.1) et on distribue en basse tension. Il a fallu attendre l’électronique de puissance (thyristors, puis IGBT) pour convertir le continu aussi facilement. Aujourd’hui, liaisons sous-marines, raccordement de l’éolien en mer et très longues lignes se font en continu (modules 6 et 7).',
          en: 'AC won thanks to the **transformer**, which changes voltage with no moving parts: transmit at high voltage (few losses, lesson 0.1), distribute at low voltage. Converting DC as easily had to wait for power electronics (thyristors, then IGBTs). Today, subsea links, offshore wind connections and very long lines are DC (Modules 6 and 7).',
        }),
    },
    {
      id: 'examples',
      title: { fr: 'Exemples', en: 'Examples' },
      personas: ['utility', 'research'],
      tex: () => `\\begin{array}{ll}
        \\text{IFA (FR–UK, 1986)} & 2\\ \\mathrm{GW},\\ \\pm 270\\ \\mathrm{kV},\\ \\text{subsea} \\\\
        \\text{Changji–Guquan (CN, 2019)} & 12\\ \\mathrm{GW},\\ \\pm 1100\\ \\mathrm{kV},\\ \\approx 3300\\ \\mathrm{km}
      \\end{array}`,
      note: (c) =>
        c.tr({
          fr: 'Une liaison continue relie aussi deux réseaux non synchrones, ou de fréquences différentes, et sa puissance se règle directement par les convertisseurs.',
          en: 'A DC link can also join two asynchronous grids, or grids at different frequencies, and its power is set directly by the converters.',
        }),
    },
  ],

  steps: [
    {
      id: 'peak',
      title: { fr: 'Même isolation', en: 'Same insulation' },
      body: {
        fr: `L’oscilloscope montre une tension alternative et une tension continue qui sollicitent l’isolation **de la même façon** (même crête). Parcourez le temps : l’alternatif ne passe qu’un instant à sa crête, et sa valeur efficace n’en est que 71 %.`,
        en: `The oscilloscope shows an AC and a DC voltage that stress the insulation **the same way** (same peak). Scrub through time: AC only touches its peak for an instant, and its RMS value is just 71 % of it.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'short',
      title: { fr: 'Pourquoi l’alternatif a gagné', en: 'Why AC won' },
      body: {
        fr: `Réduisez la distance sous **50 km** : l’alternatif est bien moins cher. Sans conversion coûteuse, il suffit de transformateurs pour monter et baisser la tension. C’était le cas de tous les réseaux du XXᵉ siècle.`,
        en: `Bring the distance below **50 km**: AC is far cheaper. No expensive conversion, just transformers to step the voltage up and down. That described every 20th-century grid.`,
      },
      check: (lab) => lab.params.km < 50 && !(lab.info as DcAcInfo).dcWins,
    },
    {
      id: 'long',
      title: { fr: 'Très longue distance', en: 'Very long distance' },
      body: {
        fr: `En ligne aérienne, allongez la liaison au-delà du **seuil de rentabilité**. Le continu devient moins cher : les stations de conversion sont amorties par les économies sur chaque kilomètre.`,
        en: `On an overhead line, stretch the link beyond the **break-even distance**. DC becomes cheaper: the converter stations pay for themselves through savings on every kilometre.`,
      },
      check: (lab) => {
        const k = lab.info as DcAcInfo;
        return lab.params.medium === MEDIA.overhead && lab.params.km > k.breakEven && k.dcWins;
      },
    },
    {
      id: 'cable',
      title: { fr: 'Sous la mer', en: 'Under the sea' },
      body: {
        fr: `Passez en **câble** et dépassez la **longueur critique** (environ 100 km à 400 kV). En alternatif, le câble ne transporte plus aucune puissance utile : tout son courant sert à se charger lui-même. C’est pourquoi les parcs éoliens en mer lointains et les interconnexions sous-marines sont en continu.`,
        en: `Switch to **cable** and go beyond the **critical length** (about 100 km at 400 kV). In AC the cable no longer carries any useful power: its whole current goes into charging itself. That is why distant offshore wind farms and subsea interconnectors are DC.`,
      },
      check: (lab) => lab.params.medium === MEDIA.cable && lab.params.km > (lab.info as DcAcInfo).criticalKm,
    },
  ],
};
