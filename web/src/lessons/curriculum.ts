// The course map, from plan.md §5. Lessons without an experiment are listed as coming soon.

import type { Experiment } from '../lib/lab/types';
import type { L } from '../lib/ui/ui.svelte';
import { acRms } from './ac-rms/experiment';
import { euler } from './euler/experiment';
import { fourierLesson } from './fourier/experiment';
import { impedanceLesson } from './impedance/experiment';
import { parkLesson } from './park/experiment';
import { perUnitLesson } from './per-unit/experiment';
import { sequencesLesson } from './sequences/experiment';
import { powerLesson } from './power/experiment';
import { threePhaseLesson } from './three-phase/experiment';
import { resonance } from './resonance/experiment';
import { rlcStep } from './rlc-step/experiment';

export interface LessonEntry {
  id: string;
  title: L;
  experiment?: Experiment;
}

export interface ModuleEntry {
  n: number;
  title: L;
  lessons: LessonEntry[];
}

const soon = (id: string, fr: string, en: string): LessonEntry => ({ id, title: { fr, en } });

export const curriculum: ModuleEntry[] = [
  {
    n: 0,
    title: { fr: 'Le réseau en 10 minutes', en: 'The grid in 10 minutes' },
    lessons: [soon('0.1', 'De la turbine à la prise', 'From turbine to socket'), soon('0.2', 'Rejouer un blackout', 'Replay a blackout')],
  },
  {
    n: 1,
    title: { fr: 'Circuits, continu et alternatif', en: 'Circuits, DC vs AC' },
    lessons: [
      soon('1.1', 'R, L, C : éléments d’énergie', 'R, L, C as energy elements'),
      { id: '1.2', title: { fr: 'Régimes transitoires RLC', en: 'RLC transients' }, experiment: rlcStep },
      { id: '1.3', title: { fr: 'Sources alternatives, valeur efficace', en: 'AC sources and RMS' }, experiment: acRms },
      { id: '1.4', title: { fr: 'Résonance', en: 'Resonance' }, experiment: resonance },
      soon('1.5', 'Continu contre alternatif', 'DC versus AC'),
    ],
  },
  {
    n: 2,
    title: { fr: 'La boîte à outils de l’alternatif', en: 'The AC toolbox' },
    lessons: [
      { id: '2.1', title: { fr: 'Euler et le vecteur tournant', en: 'Euler and the rotating vector' }, experiment: euler },
      { id: '2.2', title: { fr: 'Phaseurs et impédance', en: 'Phasors and impedance' }, experiment: impedanceLesson },
      { id: '2.3', title: { fr: 'Puissances P, Q, S', en: 'AC power: P, Q, S' }, experiment: powerLesson },
      { id: '2.4', title: { fr: 'Systèmes triphasés', en: 'Three-phase systems' }, experiment: threePhaseLesson },
      { id: '2.5', title: { fr: 'Clarke et Park', en: 'Clarke and Park' }, experiment: parkLesson },
      { id: '2.6', title: { fr: 'Système per-unit', en: 'Per-unit system' }, experiment: perUnitLesson },
      { id: '2.7', title: { fr: 'Harmoniques et Fourier', en: 'Harmonics and Fourier' }, experiment: fourierLesson },
      { id: '2.8', title: { fr: 'Composantes symétriques', en: 'Symmetrical components' }, experiment: sequencesLesson },
    ],
  },
  {
    n: 3,
    title: { fr: 'Signaux et commande', en: 'Signals & control' },
    lessons: [
      soon('3.1', 'Laplace, pôles et zéros', 'Laplace, poles and zeros'),
      soon('3.2', 'Bode et Nyquist', 'Bode and Nyquist'),
      soon('3.3', 'Espace d’état et linéarisation', 'State space and linearisation'),
      soon('3.4', 'Régulateur PI, PLL', 'PI control, PLL'),
    ],
  },
  {
    n: 4,
    title: { fr: 'Éléments conventionnels', en: 'Conventional elements' },
    lessons: [
      soon('4.1', 'Lignes', 'Lines'),
      soon('4.2', 'Transformateurs', 'Transformers'),
      soon('4.3', 'Machine synchrone', 'Synchronous machine'),
      soon('4.4', 'Charges', 'Loads'),
      soon('4.5', 'Machine asynchrone', 'Induction motor'),
      soon('4.6', 'Compensation', 'Compensation'),
      soon('4.7', 'FACTS', 'FACTS'),
    ],
  },
  {
    n: 5,
    title: { fr: 'Le réseau en régime permanent', en: 'The network in steady state' },
    lessons: [
      soon('5.1', 'Matrice Y et répartition de charge', 'Y-bus and power flow'),
      soon('5.2', 'Courbes P–V, Q–V', 'P–V and Q–V curves'),
      soon('5.3', 'Défauts et courts-circuits', 'Faults and short circuits'),
    ],
  },
  {
    n: 6,
    title: { fr: 'Électronique de puissance', en: 'Power electronics' },
    lessons: [
      soon('6.1', 'Hacheurs', 'Choppers'),
      soon('6.2', 'Redresseurs', 'Rectifiers'),
      soon('6.3', 'MLI', 'PWM'),
      soon('6.4', 'Modèles moyens, filtres LCL', 'Averaging, LCL filters'),
    ],
  },
  {
    n: 7,
    title: { fr: 'Ressources à onduleurs et CCHT', en: 'Inverter-based resources and HVDC' },
    lessons: [
      soon('7.1', 'Commande des VSC', 'VSC control'),
      soon('7.2', 'Grid-following contre grid-forming', 'Grid-following vs grid-forming'),
      soon('7.3', 'Photovoltaïque', 'PV'),
      soon('7.4', 'Éolien', 'Wind'),
      soon('7.5', 'Stockage', 'Storage'),
      soon('7.6', 'CCHT et MMC', 'HVDC and MMC'),
      soon('7.7', 'Codes de réseau', 'Grid codes'),
    ],
  },
  {
    n: 8,
    title: { fr: 'Stabilité des réseaux', en: 'Power system stability' },
    lessons: [
      soon('8.1', 'Stabilité angulaire', 'Rotor-angle stability'),
      soon('8.2', 'Stabilité de tension', 'Voltage stability'),
      soon('8.3', 'Stabilité de fréquence', 'Frequency stability'),
      soon('8.4', 'Stabilité liée aux convertisseurs', 'Converter-driven stability'),
      soon('8.5', 'Résonances', 'Resonance stability'),
    ],
  },
];

/** Lessons that can be opened, in course order. */
export const lessons = curriculum.flatMap((m) => m.lessons.filter((l) => l.experiment));
