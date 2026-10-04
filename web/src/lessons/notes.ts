// Pedagogical notes: a plain-language companion to every module and lesson.
// For each lesson: what it is about, its objective, every formula in words,
// the objective of each guided exercise (same order as the lesson's steps),
// and the automated tests that guarantee the physics, with why each matters.

import type { L } from '../lib/ui/ui.svelte';
import { module4Note, module4Notes } from './notes4';
import { module5Note, module5Notes } from './notes5';

const r = String.raw;

export interface FormulaNote {
  tex: string;
  meaning: L;
}

export interface TestNote {
  what: L;
  why: L;
}

export interface LessonNote {
  summary: L;
  objective: L;
  formulas: FormulaNote[];
  /** One objective per guided step, in step order. */
  exercises: L[];
  tests: TestNote[];
}

export interface ModuleNote {
  summary: L;
  objective: L;
  path: L;
}

export const moduleNotes: Record<number, ModuleNote> = {
  0: {
    summary: {
      fr: 'Avant toute équation : ce que fait le réseau électrique à chaque seconde. Il équilibre production et consommation, transporte l’énergie en haute tension et résiste aux incidents.',
      en: 'Before any equation: what the power grid does every second. It balances generation and demand, carries energy at high voltage and rides through incidents.',
    },
    objective: {
      fr: 'Donner envie et donner le cadre : pourquoi l’équilibre, la tension et la fréquence comptent, et à quoi servira la suite du cours.',
      en: 'Spark interest and set the scene: why balance, voltage and frequency matter, and what the rest of the course will be for.',
    },
    path: {
      fr: '0.1 montre l’équilibre au fil d’une journée ; 0.2 montre ce qui arrive quand il se rompt brutalement.',
      en: '0.1 shows the balance over a day; 0.2 shows what happens when it breaks suddenly.',
    },
  },
  1: {
    summary: {
      fr: 'Les briques de base : résistance, bobine et condensateur. Comment ils se comportent en continu, en régime transitoire et en alternatif.',
      en: 'The building blocks: resistor, inductor and capacitor. How they behave under DC, during transients and under AC.',
    },
    objective: {
      fr: 'Savoir lire un circuit RLC : qui dissipe, qui stocke, pourquoi ça oscille, ce que signifient valeur efficace et résonance.',
      en: 'Be able to read an RLC circuit: what dissipates, what stores, why it oscillates, what RMS and resonance mean.',
    },
    path: {
      fr: '1.1 l’énergie de chaque élément → 1.2 la réponse à un échelon → 1.3 l’alternatif et la valeur efficace → 1.4 la résonance → 1.5 continu contre alternatif.',
      en: '1.1 each element’s energy → 1.2 the step response → 1.3 AC and RMS → 1.4 resonance → 1.5 DC versus AC.',
    },
  },
  2: {
    summary: {
      fr: 'Les outils qui rendent l’alternatif simple : nombres complexes, phaseurs, puissances, triphasé, repère tournant, per-unit, harmoniques et composantes symétriques.',
      en: 'The tools that make AC simple: complex numbers, phasors, power, three-phase, the rotating frame, per-unit, harmonics and symmetrical components.',
    },
    objective: {
      fr: 'Remplacer les équations différentielles par de l’algèbre sur des vecteurs, et maîtriser le langage de tout ingénieur réseau.',
      en: 'Replace differential equations with algebra on vectors, and master the language every power engineer uses.',
    },
    path: {
      fr: '2.1 Euler → 2.2 impédance → 2.3 puissances → 2.4 triphasé → 2.5 Park → 2.6 per-unit → 2.7 harmoniques → 2.8 composantes symétriques.',
      en: '2.1 Euler → 2.2 impedance → 2.3 power → 2.4 three-phase → 2.5 Park → 2.6 per-unit → 2.7 harmonics → 2.8 symmetrical components.',
    },
  },
  4: module4Note,
  5: module5Note,
  3: {
    summary: {
      fr: 'La colonne vertébrale de la commande : pôles, marges de stabilité, linéarisation et régulateurs. Indispensable pour comprendre machines et onduleurs.',
      en: 'The backbone of control: poles, stability margins, linearisation and controllers. Essential for understanding machines and inverters.',
    },
    objective: {
      fr: 'Lire la stabilité d’un système dans le plan s et en fréquence, et régler un régulateur PI réel (la PLL des onduleurs).',
      en: 'Read a system’s stability in the s-plane and in frequency, and tune a real PI controller (the inverter PLL).',
    },
    path: {
      fr: '3.1 pôles et zéros → 3.2 Bode et Nyquist → 3.3 linéarisation d’un alternateur → 3.4 PI et PLL.',
      en: '3.1 poles and zeros → 3.2 Bode and Nyquist → 3.3 linearising a generator → 3.4 PI and PLL.',
    },
  },
};

export const lessonNotes: Record<string, LessonNote> = {
  '0.1': {
    summary: {
      fr: 'Une journée sur un grand réseau : la consommation varie sans cesse, et la production doit la suivre à chaque instant. On découvre aussi pourquoi l’électricité voyage en très haute tension.',
      en: 'A day on a large grid: demand changes all the time, and generation must follow it at every instant. You also find out why electricity travels at very high voltage.',
    },
    objective: {
      fr: 'Comprendre l’équilibre production–consommation, le rôle de la haute tension et la difficulté posée par beaucoup de solaire.',
      en: 'Understand the generation–demand balance, the role of high voltage, and the challenge of lots of solar.',
    },
    formulas: [
      { tex: r`P_{nuc} + P_{wind} + P_{PV} + P_{flex} = P_{load}`, meaning: { fr: 'La somme des productions égale la consommation, à chaque instant.', en: 'Total generation equals demand, at every instant.' } },
      { tex: r`I = \frac{P}{\sqrt3\,U}`, meaning: { fr: 'Pour une même puissance, plus la tension est haute, plus le courant est faible.', en: 'For the same power, the higher the voltage, the smaller the current.' } },
      { tex: r`P_{loss} = 3RI^2 \propto \frac{1}{U^2}`, meaning: { fr: 'Les pertes suivent le carré du courant : diviser la tension par 2 multiplie les pertes par 4.', en: 'Losses follow the square of the current: halving the voltage multiplies losses by 4.' } },
    ],
    exercises: [
      { fr: 'Confronter son intuition à la vraie forme de la consommation : creux de nuit, pointe du soir.', en: 'Test your intuition against the real shape of demand: night trough, evening peak.' },
      { fr: 'Voir la production flexible combler l’écart, heure par heure.', en: 'Watch flexible generation fill the gap, hour by hour.' },
      { fr: 'Constater l’effet de $1/U^2$ sur les pertes de transport.', en: 'See the $1/U^2$ effect on transmission losses.' },
      { fr: 'Découvrir l’excédent solaire de midi et la rampe du soir (courbe du canard).', en: 'Discover the midday solar surplus and the evening ramp (duck curve).' },
      { fr: 'Chercher un réglage réalisable, et comprendre pourquoi le stockage devient nécessaire.', en: 'Find a workable setting, and understand why storage becomes necessary.' },
    ],
    tests: [
      { what: { fr: 'Le bilan production = consommation est exact à chaque instant.', en: 'The generation = demand balance is exact at every instant.' }, why: { fr: 'Garantit que la courbe « flexible » est bien ce qui manque, ni plus ni moins.', en: 'Guarantees the “flexible” curve is exactly what is missing, no more, no less.' } },
      { what: { fr: 'Pertes de 1,9 % à 400 kV, plus de 100 % à 20 kV, et rapport $(400/225)^2$.', en: 'Losses of 1.9 % at 400 kV, over 100 % at 20 kV, and the $(400/225)^2$ ratio.' }, why: { fr: 'Vérifie la formule des pertes et la loi en $1/U^2$.', en: 'Checks the loss formula and the $1/U^2$ law.' } },
      { what: { fr: 'Un réglage connu équilibre la journée ; 30 GW de solaire la déséquilibre.', en: 'A known setting balances the day; 30 GW of solar unbalances it.' }, why: { fr: 'S’assure que l’exercice final est faisable et que le piège solaire existe bien.', en: 'Makes sure the final exercise is feasible and the solar trap really exists.' } },
    ],
  },
  '0.2': {
    summary: {
      fr: 'Que se passe-t-il quand une grosse centrale décroche ? La fréquence chute, les réserves réagissent, et parfois les protections aggravent tout. On rejoue, en simplifié, l’incident britannique du 9 août 2019.',
      en: 'What happens when a large power plant trips? Frequency falls, reserves react, and sometimes protection makes things worse. We replay, simplified, the British incident of 9 August 2019.',
    },
    objective: {
      fr: 'Comprendre inertie, vitesse de chute (RoCoF), réserve primaire et délestage, et pourquoi les réseaux à faible inertie sont plus fragiles.',
      en: 'Understand inertia, rate of change of frequency (RoCoF), primary reserve and load shedding, and why low-inertia grids are more fragile.',
    },
    formulas: [
      { tex: r`\frac{2HS}{f_0}\frac{df}{dt} = P_{gen} - P_{load}`, meaning: { fr: 'Le réseau se comporte comme un seul volant d’inertie : tout déséquilibre change sa vitesse, donc la fréquence.', en: 'The grid behaves like a single flywheel: any imbalance changes its speed, hence the frequency.' } },
      { tex: r`\left.\frac{df}{dt}\right|_{0^+} = \frac{f_0\,\Delta P}{2HS}`, meaning: { fr: 'Juste après la perte, la fréquence chute d’autant plus vite que l’inertie $H$ est faible.', en: 'Right after the loss, frequency falls faster when inertia $H$ is low.' } },
      { tex: r`E = H\,S`, meaning: { fr: 'L’énergie cinétique stockée dans toutes les machines tournantes : le « coussin » du réseau.', en: 'The kinetic energy stored in all spinning machines: the grid’s “cushion”.' } },
    ],
    exercises: [
      { fr: 'Comprendre que la fréquence glisse progressivement, puis remonte : elle ne saute pas.', en: 'Understand that frequency slides gradually, then recovers: it does not jump.' },
      { fr: 'Suivre l’enchaînement perte → protection RoCoF → délestage.', en: 'Follow the sequence loss → RoCoF protection → load shedding.' },
      { fr: 'Voir qu’une inertie faible rend la chute plus rapide et plus profonde.', en: 'See that low inertia makes the fall faster and deeper.' },
      { fr: 'Comprendre qu’un simple réglage de protection peut éviter la cascade.', en: 'Understand that a simple protection setting can prevent the cascade.' },
      { fr: 'Combiner inertie et réserve rapide pour tenir la fréquence : le défi des réseaux renouvelables.', en: 'Combine inertia and fast reserve to hold frequency: the challenge of renewable grids.' },
    ],
    tests: [
      { what: { fr: 'Le RoCoF initial vaut $f_0\\Delta P/(2HS)$.', en: 'The initial RoCoF equals $f_0\\Delta P/(2HS)$.' }, why: { fr: 'Vérifie le cœur du modèle d’inertie.', en: 'Checks the core of the inertia model.' } },
      { what: { fr: 'Les réglages par défaut donnent perte → déclenchement RoCoF → délestage, dans cet ordre.', en: 'The defaults give loss → RoCoF trip → load shedding, in that order.' }, why: { fr: 'Garantit que la leçon montre bien la cascade annoncée.', en: 'Guarantees the lesson really shows the promised cascade.' } },
      { what: { fr: 'Sans protection RoCoF, la même perte reste au-dessus de 48,8 Hz.', en: 'Without RoCoF protection, the same loss stays above 48.8 Hz.' }, why: { fr: 'Confirme que la protection est bien la cause de la cascade.', en: 'Confirms the protection really is the cause of the cascade.' } },
      { what: { fr: 'Moins d’inertie donne un creux plus profond ; le régime final équilibre réserve et charge.', en: 'Less inertia gives a deeper nadir; the final state balances reserve and load.' }, why: { fr: 'Vérifie les deux tendances physiques que l’élève doit retenir.', en: 'Checks the two physical trends the learner should remember.' } },
    ],
  },
  '1.1': {
    summary: {
      fr: 'Trois éléments, trois comportements : la résistance transforme l’énergie en chaleur, la bobine et le condensateur la stockent puis la rendent.',
      en: 'Three elements, three behaviours: the resistor turns energy into heat, the inductor and capacitor store it and give it back.',
    },
    objective: {
      fr: 'Savoir que la tension d’une bobine suit la pente du courant, et distinguer dissipation et stockage.',
      en: 'Know that an inductor’s voltage follows the slope of its current, and tell dissipation from storage.',
    },
    formulas: [
      { tex: r`v = R\,i`, meaning: { fr: 'Résistance : tension et courant sont proportionnels, sans mémoire.', en: 'Resistor: voltage and current are proportional, with no memory.' } },
      { tex: r`v = L\,\frac{di}{dt}`, meaning: { fr: 'Bobine : la tension dépend de la vitesse de variation du courant.', en: 'Inductor: the voltage depends on how fast the current changes.' } },
      { tex: r`i = C\,\frac{dv}{dt}`, meaning: { fr: 'Condensateur : le courant dépend de la vitesse de variation de la tension.', en: 'Capacitor: the current depends on how fast the voltage changes.' } },
      { tex: r`w_L = \tfrac12 L i^2,\quad w_C = \tfrac12 C v^2`, meaning: { fr: 'L’énergie stockée, magnétique ou électrique.', en: 'The stored energy, magnetic or electric.' } },
    ],
    exercises: [
      { fr: 'Découvrir qu’un courant triangulaire donne une tension carrée dans une bobine.', en: 'Discover that a triangular current gives a square voltage across an inductor.' },
      { fr: 'Voir l’énergie entrer, être stockée, puis revenir à la source.', en: 'Watch energy flow in, be stored, then return to the source.' },
      { fr: 'Retrouver le même comportement, en miroir, pour le condensateur.', en: 'Find the same behaviour, mirrored, for the capacitor.' },
      { fr: 'Constater qu’une résistance ne rend jamais d’énergie.', en: 'See that a resistor never gives energy back.' },
      { fr: 'Comprendre la surtension créée en coupant brutalement un courant inductif.', en: 'Understand the overvoltage created by cutting an inductive current abruptly.' },
    ],
    tests: [
      { what: { fr: 'Un courant triangulaire donne exactement $\\pm 4LAf$.', en: 'A triangular current gives exactly $\\pm 4LAf$.' }, why: { fr: 'Vérifie la loi de la bobine avec une dérivée exacte.', en: 'Checks the inductor law with an exact derivative.' } },
      { what: { fr: 'Sur une période, L et C rendent toute leur énergie ; R a toujours $p \\ge 0$.', en: 'Over one period, L and C return all their energy; R always has $p \\ge 0$.' }, why: { fr: 'Garantit le message central : stocker n’est pas dissiper.', en: 'Guarantees the core message: storing is not dissipating.' } },
      { what: { fr: 'Un front de durée $t_r$ donne $v_{max} = LA/t_r$.', en: 'An edge of duration $t_r$ gives $v_{max} = LA/t_r$.' }, why: { fr: 'Vérifie le calcul de la surtension de coupure.', en: 'Checks the switching-overvoltage calculation.' } },
    ],
  },
  '1.2': {
    summary: {
      fr: 'On ferme un interrupteur sur un circuit RLC : le courant oscille ou non selon l’amortissement. C’est la première rencontre avec les pôles, qui reviendront jusqu’à la stabilité des réseaux.',
      en: 'Close a switch on an RLC circuit: the current oscillates or not depending on damping. This is the first meeting with poles, which come back all the way to grid stability.',
    },
    objective: {
      fr: 'Relier la forme de la réponse à l’amortissement $\\zeta$ et à la position des pôles, et suivre l’énergie entre L et C.',
      en: 'Link the shape of the response to damping $\\zeta$ and to the pole positions, and follow energy between L and C.',
    },
    formulas: [
      { tex: r`V = Ri + L\frac{di}{dt} + v_C`, meaning: { fr: 'La tension de la source se répartit entre les trois éléments (loi des mailles).', en: 'The source voltage splits between the three elements (Kirchhoff’s voltage law).' } },
      { tex: r`\zeta = \frac{R}{2}\sqrt{\frac{C}{L}}`, meaning: { fr: 'L’amortissement : sous 1, ça oscille ; au-dessus, non.', en: 'Damping: below 1 it oscillates; above, it does not.' } },
      { tex: r`s_{1,2} = -\alpha \pm \sqrt{\alpha^2 - \omega_0^2}`, meaning: { fr: 'Les pôles : leur partie réelle fixe la décroissance, leur partie imaginaire l’oscillation.', en: 'The poles: their real part sets the decay, their imaginary part the oscillation.' } },
      { tex: r`v_{C,\max} = V\left(1 + e^{-\pi\zeta/\sqrt{1-\zeta^2}}\right)`, meaning: { fr: 'La surtension à l’enclenchement d’un condensateur, jusqu’à 2 fois la tension.', en: 'The overvoltage when energising a capacitor, up to twice the voltage.' } },
    ],
    exercises: [
      { fr: 'Prédire avant de voir : le courant oscille-t-il ? peut-il sauter ?', en: 'Predict before looking: does the current oscillate? can it jump?' },
      { fr: 'Comprendre où va la tension à chaque instant : d’abord dans L, à la fin dans C.', en: 'See where the voltage goes at each instant: first across L, finally across C.' },
      { fr: 'Trouver l’amortissement critique et voir les pôles se rejoindre.', en: 'Find critical damping and watch the poles meet.' },
      { fr: 'Voir l’énergie faire des allers-retours entre L et C.', en: 'Watch energy swing back and forth between L and C.' },
      { fr: 'Comparer deux réglages et relier fréquence et position des pôles.', en: 'Compare two settings and link frequency to pole position.' },
      { fr: 'Comprendre que les pôles sont les valeurs propres du modèle.', en: 'Understand that poles are the eigenvalues of the model.' },
    ],
    tests: [
      { what: { fr: 'Le courant simulé égale la formule exacte à $10^{-9}$ près, dans les trois régimes.', en: 'The simulated current matches the exact formula to $10^{-9}$, in all three regimes.' }, why: { fr: 'Prouve que le solveur est exact : les courbes sont fiables.', en: 'Proves the solver is exact: the curves can be trusted.' } },
      { what: { fr: 'L’énergie fournie égale énergie stockée + dissipée.', en: 'Energy supplied equals energy stored + dissipated.' }, why: { fr: 'Vérifie la conservation de l’énergie affichée.', en: 'Checks the energy conservation shown on screen.' } },
      { what: { fr: 'Le condensateur finit chargé à $V$, le courant à zéro.', en: 'The capacitor ends charged to $V$, the current at zero.' }, why: { fr: 'Vérifie le régime établi en continu.', en: 'Checks the DC steady state.' } },
    ],
  },
  '1.3': {
    summary: {
      fr: 'Pourquoi dit-on « 230 V » alors que la tension monte à 325 V ? La valeur efficace est la tension continue qui chaufferait autant.',
      en: 'Why do we say “230 V” when the voltage peaks at 325 V? The RMS value is the DC voltage that would heat just as much.',
    },
    objective: {
      fr: 'Comprendre la puissance instantanée, la valeur efficace et les pièges de mesure.',
      en: 'Understand instantaneous power, the RMS value, and measurement pitfalls.',
    },
    formulas: [
      { tex: r`p(t) = \frac{v^2}{R} \ge 0`, meaning: { fr: 'Une résistance reçoit toujours de l’énergie, à deux fois la fréquence du réseau.', en: 'A resistor always receives energy, at twice the supply frequency.' } },
      { tex: r`V_{rms} = \sqrt{\frac1T\int_0^T v^2\,dt} = \frac{\hat V}{\sqrt2}`, meaning: { fr: 'La valeur efficace d’un sinus : 325 V crête donnent 230 V efficaces.', en: 'The RMS value of a sine: 325 V peak gives 230 V RMS.' } },
      { tex: r`\bar P = \frac{V_{rms}^2}{R}`, meaning: { fr: 'La puissance moyenne se calcule avec la valeur efficace, comme en continu.', en: 'Average power uses the RMS value, just as with DC.' } },
    ],
    exercises: [
      { fr: 'Découvrir que la puissance pulse à 100 Hz et ne devient jamais négative.', en: 'Discover that power pulses at 100 Hz and never goes negative.' },
      { fr: 'Comprendre d’où vient le facteur $\\sqrt2$.', en: 'See where the $\\sqrt2$ factor comes from.' },
      { fr: 'Retrouver 230 V comme tension continue équivalente.', en: 'Find 230 V as the equivalent DC voltage.' },
      { fr: 'Voir qu’un multimètre bon marché se trompe sur un signal non sinusoïdal.', en: 'See that a cheap multimeter is wrong on a non-sinusoidal signal.' },
    ],
    tests: [
      { what: { fr: 'La valeur efficace calculée égale la formule pour sinus, carré, triangle et continu.', en: 'The computed RMS matches the formula for sine, square, triangle and DC.' }, why: { fr: 'Garantit les valeurs affichées par les multimètres.', en: 'Guarantees the values shown by the multimeters.' } },
      { what: { fr: 'Le multimètre à valeur moyenne lit un carré 11 % trop haut.', en: 'The average-responding meter reads a square wave 11 % high.' }, why: { fr: 'Vérifie le piège de mesure présenté dans la leçon.', en: 'Checks the measurement pitfall shown in the lesson.' } },
    ],
  },
  '1.4': {
    summary: {
      fr: 'Un circuit RLC alimenté en sinus a une fréquence préférée : la résonance. Le courant y est maximal, et la tension du condensateur peut dépasser largement celle de la source.',
      en: 'An RLC circuit fed by a sine has a favourite frequency: resonance. The current peaks there, and the capacitor voltage can far exceed the source voltage.',
    },
    objective: {
      fr: 'Trouver la résonance, comprendre le facteur de qualité $Q$ et ses surtensions, et faire le lien entre transitoire et régime établi.',
      en: 'Find resonance, understand the quality factor $Q$ and its overvoltages, and link transient to steady state.',
    },
    formulas: [
      { tex: r`\underline Z = R + j\left(\omega L - \frac{1}{\omega C}\right)`, meaning: { fr: 'L’impédance : sa partie imaginaire s’annule à la résonance.', en: 'The impedance: its imaginary part vanishes at resonance.' } },
      { tex: r`f_0 = \frac{1}{2\pi\sqrt{LC}}`, meaning: { fr: 'La fréquence de résonance.', en: 'The resonant frequency.' } },
      { tex: r`Q = \frac{\omega_0 L}{R},\qquad |V_C(f_0)| = Q\,\hat V`, meaning: { fr: 'Le facteur de qualité : la surtension sur le condensateur à la résonance.', en: 'The quality factor: the capacitor overvoltage at resonance.' } },
      { tex: r`\Delta f = \frac{f_0}{Q}`, meaning: { fr: 'La bande passante : plus $Q$ est grand, plus la résonance est étroite.', en: 'The bandwidth: the higher $Q$, the narrower the resonance.' } },
    ],
    exercises: [
      { fr: 'Voir le transitoire mourir et le courant rejoindre la prévision des phaseurs.', en: 'Watch the transient die out and the current lock onto the phasor prediction.' },
      { fr: 'Trouver la résonance : réactances qui s’annulent, courant maximal et en phase.', en: 'Find resonance: reactances cancel, current maximal and in phase.' },
      { fr: 'Créer une surtension $Q$ fois plus grande que la source.', en: 'Create an overvoltage $Q$ times the source.' },
      { fr: 'Relier sélectivité et résistance.', en: 'Link selectivity to resistance.' },
      { fr: 'Voir le circuit devenir inductif au-dessus de $f_0$.', en: 'See the circuit become inductive above $f_0$.' },
    ],
    tests: [
      { what: { fr: 'Le courant simulé rejoint la solution des phaseurs (écart < 0,2 %).', en: 'The simulated current settles on the phasor solution (error < 0.2 %).' }, why: { fr: 'Prouve que transitoire et phaseurs racontent la même histoire.', en: 'Proves the transient and the phasors tell the same story.' } },
      { what: { fr: 'À $f_0$ : $|I| = V/R$ et $|V_C|/V = Q$.', en: 'At $f_0$: $|I| = V/R$ and $|V_C|/V = Q$.' }, why: { fr: 'Vérifie les formules de la résonance.', en: 'Checks the resonance formulas.' } },
      { what: { fr: 'Aux fréquences de coupure, $|I| = I_{max}/\\sqrt2$.', en: 'At the band edges, $|I| = I_{max}/\\sqrt2$.' }, why: { fr: 'Vérifie la bande passante affichée.', en: 'Checks the bandwidth shown.' } },
    ],
  },
  '1.5': {
    summary: {
      fr: 'L’alternatif a gagné au XIXᵉ siècle grâce au transformateur. Le continu revient pour les très longues distances et les câbles sous-marins.',
      en: 'AC won in the 19th century thanks to the transformer. DC is coming back for very long distances and subsea cables.',
    },
    objective: {
      fr: 'Comprendre quand choisir l’alternatif ou le continu : isolation, courant de charge des câbles et coûts.',
      en: 'Understand when to choose AC or DC: insulation, cable charging current and cost.',
    },
    formulas: [
      { tex: r`\frac{P_{DC}}{P_{AC}} = \sqrt2`, meaning: { fr: 'À isolation égale (même tension crête), le continu transporte 40 % de plus.', en: 'For the same insulation (same peak voltage), DC carries 40 % more.' } },
      { tex: r`I_c = \omega C'\frac{U}{\sqrt3}\,d`, meaning: { fr: 'Le courant de charge d’une liaison alternative grandit avec sa longueur.', en: 'An AC link’s charging current grows with its length.' } },
      { tex: r`d^* = \frac{T_{DC} - T_{AC}}{c_{AC} - c_{DC}}`, meaning: { fr: 'La distance à partir de laquelle le continu devient moins cher.', en: 'The distance beyond which DC becomes cheaper.' } },
    ],
    exercises: [
      { fr: 'Comprendre que l’isolation est dimensionnée pour la crête.', en: 'Understand that insulation is sized for the peak.' },
      { fr: 'Voir pourquoi l’alternatif gagne sur les courtes distances.', en: 'See why AC wins over short distances.' },
      { fr: 'Trouver le seuil de rentabilité du continu en aérien.', en: 'Find DC’s break-even distance overhead.' },
      { fr: 'Voir un câble alternatif saturé par son propre courant de charge.', en: 'See an AC cable saturated by its own charging current.' },
    ],
    tests: [
      { what: { fr: 'Seuil de rentabilité de 500 km en aérien et 100 km en câble.', en: 'Break-even of 500 km overhead and 100 km in cable.' }, why: { fr: 'Vérifie le modèle de coûts utilisé.', en: 'Checks the cost model used.' } },
      { what: { fr: 'Un câble 400 kV atteint sa longueur critique vers 105 km.', en: 'A 400 kV cable reaches its critical length around 105 km.' }, why: { fr: 'Vérifie le calcul du courant de charge.', en: 'Checks the charging-current calculation.' } },
    ],
  },
  '2.1': {
    summary: {
      fr: 'Une sinusoïde est l’ombre d’un vecteur qui tourne. Cette idée, la formule d’Euler, rend l’addition de sinusoïdes aussi simple qu’une addition de flèches.',
      en: 'A sinusoid is the shadow of a rotating vector. This idea, Euler’s formula, makes adding sinusoids as easy as adding arrows.',
    },
    objective: {
      fr: 'Passer d’une sinusoïde à un phaseur, et additionner des signaux de même fréquence sans trigonométrie.',
      en: 'Go from a sinusoid to a phasor, and add signals of the same frequency without trigonometry.',
    },
    formulas: [
      { tex: r`e^{j\theta} = \cos\theta + j\sin\theta`, meaning: { fr: 'Un vecteur unité qui tourne : son ombre sur l’axe réel est le cosinus.', en: 'A rotating unit vector: its shadow on the real axis is the cosine.' } },
      { tex: r`v(t) = \operatorname{Re}\{\underline V e^{j\omega t}\},\quad \underline V = A\angle\varphi`, meaning: { fr: 'Le phaseur garde amplitude et phase, et oublie la rotation commune.', en: 'The phasor keeps amplitude and phase, and drops the shared rotation.' } },
      { tex: r`v_1 + v_2 \;\leftrightarrow\; \underline V_1 + \underline V_2`, meaning: { fr: 'Additionner deux sinusoïdes = additionner deux vecteurs.', en: 'Adding two sinusoids = adding two vectors.' } },
    ],
    exercises: [
      { fr: 'Découvrir que des amplitudes ne s’additionnent pas si les phases diffèrent.', en: 'Discover that amplitudes do not add when phases differ.' },
      { fr: 'Voir sinus, cosinus et cercle comme trois vues d’une même hélice.', en: 'See sine, cosine and circle as three views of one helix.' },
      { fr: 'Obtenir la somme maximale : phaseurs alignés.', en: 'Get the largest sum: aligned phasors.' },
      { fr: 'Annuler deux signaux en opposition de phase.', en: 'Cancel two signals in phase opposition.' },
      { fr: 'Entrevoir pourquoi trois phases équilibrées s’annulent.', en: 'Glimpse why three balanced phases cancel.' },
    ],
    tests: [
      { what: { fr: 'La somme échantillonnée égale la sinusoïde du phaseur somme ($10^{-12}$).', en: 'The sampled sum equals the sinusoid of the summed phasor ($10^{-12}$).' }, why: { fr: 'Prouve que l’addition de phaseurs est exacte.', en: 'Proves phasor addition is exact.' } },
      { what: { fr: 'Deux phaseurs à 120° et 240° ont pour somme $1\\angle 180°$.', en: 'Phasors at 120° and 240° sum to $1\\angle 180°$.' }, why: { fr: 'Vérifie la base du triphasé.', en: 'Checks the basis of three-phase.' } },
    ],
  },
  '2.2': {
    summary: {
      fr: 'En alternatif, R, L et C décalent plus ou moins le courant par rapport à la tension. L’impédance, un nombre complexe, résume tout.',
      en: 'Under AC, R, L and C shift the current relative to the voltage by different amounts. Impedance, a complex number, sums it all up.',
    },
    objective: {
      fr: 'Savoir que le courant est en phase dans R, en retard dans L, en avance dans C, et calculer $\\underline Z$ et $\\underline I$.',
      en: 'Know that the current is in phase in R, lags in L, leads in C, and compute $\\underline Z$ and $\\underline I$.',
    },
    formulas: [
      { tex: r`\underline V = R\underline I,\quad \underline V = j\omega L\,\underline I,\quad \underline V = \frac{\underline I}{j\omega C}`, meaning: { fr: 'Les lois des éléments, en phaseurs : la dérivée devient $j\omega$.', en: 'The element laws, in phasors: the derivative becomes $j\omega$.' } },
      { tex: r`\underline I = \frac{\underline V}{\underline Z}`, meaning: { fr: 'La loi d’Ohm en alternatif.', en: 'Ohm’s law under AC.' } },
      { tex: r`f_c = \frac{R}{2\pi L}`, meaning: { fr: 'Fréquence où $X_L = R$ : déphasage de 45°.', en: 'Frequency where $X_L = R$: 45° phase shift.' } },
    ],
    exercises: [
      { fr: 'Découvrir que le courant d’une bobine est en retard de 90°.', en: 'Discover that an inductor’s current lags by 90°.' },
      { fr: 'Voir le condensateur faire l’inverse.', en: 'See the capacitor do the opposite.' },
      { fr: 'Constater que la réactance dépend de la fréquence.', en: 'See that reactance depends on frequency.' },
      { fr: 'Trouver le point à 45°, où $X = R$.', en: 'Find the 45° point, where $X = R$.' },
      { fr: 'Lire le lieu de $Z$ dans le plan des impédances.', en: 'Read the locus of $Z$ in the impedance plane.' },
    ],
    tests: [
      { what: { fr: 'Déphasages de +90°, −90° et 0° pour L, C et R.', en: 'Phase shifts of +90°, −90° and 0° for L, C and R.' }, why: { fr: 'Vérifie les lois de base.', en: 'Checks the basic laws.' } },
      { what: { fr: 'Un circuit RL est à 45° à sa fréquence de coupure.', en: 'An RL circuit is at 45° at its corner frequency.' }, why: { fr: 'Vérifie la formule de $f_c$.', en: 'Checks the $f_c$ formula.' } },
      { what: { fr: 'L’analyse de phase d’un dessin retrouve la phase réelle.', en: 'The phase analysis of a sketch recovers the true phase.' }, why: { fr: 'Garantit que le retour sur vos prédictions est juste.', en: 'Guarantees the feedback on your predictions is fair.' } },
    ],
  },
  '2.3': {
    summary: {
      fr: 'Avec une charge comme un moteur, une partie de l’énergie fait des allers-retours sans travailler : c’est la puissance réactive. On apprend à la compenser.',
      en: 'With a load like a motor, part of the energy goes back and forth without doing work: that is reactive power. You learn to compensate it.',
    },
    objective: {
      fr: 'Distinguer $P$, $Q$ et $S$, comprendre le facteur de puissance et dimensionner une compensation.',
      en: 'Tell $P$, $Q$ and $S$ apart, understand power factor, and size a compensation.',
    },
    formulas: [
      { tex: r`\underline S = \underline V\,\underline I^* = P + jQ`, meaning: { fr: 'La puissance complexe : active (utile) et réactive (qui oscille).', en: 'Complex power: active (useful) and reactive (oscillating).' } },
      { tex: r`p(t) = P(1 + \cos2\omega t) + Q\sin2\omega t`, meaning: { fr: 'La puissance instantanée : une partie qui travaille, une partie qui va et vient.', en: 'Instantaneous power: one part that works, one part that comes and goes.' } },
      { tex: r`C = \frac{P(\tan\varphi_1 - \tan\varphi_2)}{\omega V^2}`, meaning: { fr: 'Le condensateur qui ramène le facteur de puissance à la valeur voulue.', en: 'The capacitor that brings the power factor to the target.' } },
    ],
    exercises: [
      { fr: 'Découvrir que la puissance d’un moteur devient négative par moments.', en: 'Discover that a motor’s power goes negative at times.' },
      { fr: 'Séparer partie active et partie réactive.', en: 'Separate the active and reactive parts.' },
      { fr: 'Relever le facteur de puissance à 0,95.', en: 'Raise the power factor to 0.95.' },
      { fr: 'Voir les pertes du câble baisser.', en: 'See cable losses fall.' },
      { fr: 'Comprendre qu’il ne faut pas trop compenser.', en: 'Understand that overcompensating is harmful.' },
    ],
    tests: [
      { what: { fr: '$p = p_P + p_Q$ et la moyenne de $p$ vaut $P$.', en: '$p = p_P + p_Q$ and the mean of $p$ is $P$.' }, why: { fr: 'Vérifie la décomposition affichée.', en: 'Checks the decomposition shown.' } },
      { what: { fr: 'Le condensateur calculé donne exactement 0,95.', en: 'The computed capacitor gives exactly 0.95.' }, why: { fr: 'Vérifie la formule de compensation.', en: 'Checks the compensation formula.' } },
      { what: { fr: 'Compenser ne change pas $P$ et réduit les pertes en $(0{,}7/0{,}95)^2$.', en: 'Compensation leaves $P$ unchanged and cuts losses by $(0.7/0.95)^2$.' }, why: { fr: 'Prouve l’intérêt économique de la compensation.', en: 'Proves the economic benefit of compensation.' } },
    ],
  },
  '2.4': {
    summary: {
      fr: 'Trois tensions décalées de 120° : la puissance totale devient constante, le neutre ne transporte rien… tant que tout est équilibré.',
      en: 'Three voltages 120° apart: total power becomes constant, the neutral carries nothing… as long as everything is balanced.',
    },
    objective: {
      fr: 'Comprendre l’intérêt du triphasé, le rôle du neutre et le danger d’un neutre coupé.',
      en: 'Understand why three-phase is used, the role of the neutral, and the danger of a broken neutral.',
    },
    formulas: [
      { tex: r`v_a + v_b + v_c = 0`, meaning: { fr: 'Trois tensions équilibrées s’annulent à chaque instant.', en: 'Three balanced voltages cancel at every instant.' } },
      { tex: r`p = 3VI\cos\varphi = \text{const.}`, meaning: { fr: 'La puissance totale est constante : couple régulier pour les moteurs.', en: 'Total power is constant: smooth torque for motors.' } },
      { tex: r`\underline V_{N'} = \frac{\sum \underline V_k/R_k}{\sum 1/R_k}`, meaning: { fr: 'Neutre coupé : le point étoile dérive (théorème de Millman).', en: 'Broken neutral: the star point drifts (Millman’s theorem).' } },
      { tex: r`V_{ab} = \sqrt3\,V`, meaning: { fr: '230 V entre phase et neutre, 400 V entre phases.', en: '230 V phase to neutral, 400 V between phases.' } },
    ],
    exercises: [
      { fr: 'Découvrir que la puissance triphasée est constante.', en: 'Discover that three-phase power is constant.' },
      { fr: 'Comparer avec une seule phase, qui pulse.', en: 'Compare with a single phase, which pulses.' },
      { fr: 'Voir apparaître le courant de neutre avec un déséquilibre.', en: 'See neutral current appear with an unbalance.' },
      { fr: 'Comprendre la surtension d’un neutre coupé.', en: 'Understand the overvoltage of a broken neutral.' },
      { fr: 'Relier tension simple et tension composée.', en: 'Link phase and line voltages.' },
    ],
    tests: [
      { what: { fr: 'Équilibré : courant de neutre nul et puissance constante.', en: 'Balanced: zero neutral current and constant power.' }, why: { fr: 'Vérifie les deux propriétés clés du triphasé.', en: 'Checks the two key properties of three-phase.' } },
      { what: { fr: 'Monophasé : puissance entre 0 et $2P$.', en: 'Single-phase: power between 0 and $2P$.' }, why: { fr: 'Vérifie la comparaison avec 1.3.', en: 'Checks the comparison with 1.3.' } },
      { what: { fr: 'Neutre coupé : une phase dépasse 300 V.', en: 'Broken neutral: one phase exceeds 300 V.' }, why: { fr: 'Vérifie le scénario de défaut.', en: 'Checks the fault scenario.' } },
    ],
  },
  '2.5': {
    summary: {
      fr: 'Les trois phases sont les ombres d’un seul vecteur tournant. Si l’on tourne avec lui, il paraît immobile : l’alternatif devient continu.',
      en: 'The three phases are the shadows of one rotating vector. Turn with it and it seems to stand still: AC becomes DC.',
    },
    objective: {
      fr: 'Comprendre les transformations de Clarke et de Park, base de la commande des machines et des onduleurs.',
      en: 'Understand the Clarke and Park transforms, the basis of machine and inverter control.',
    },
    formulas: [
      { tex: r`v_\alpha + jv_\beta = \tfrac23\left(v_a + a\,v_b + a^2 v_c\right)`, meaning: { fr: 'Clarke : trois phases → un vecteur du plan.', en: 'Clarke: three phases → one vector in the plane.' } },
      { tex: r`v_d + jv_q = (v_\alpha + jv_\beta)\,e^{-j\theta}`, meaning: { fr: 'Park : on regarde ce vecteur depuis un repère qui tourne avec lui.', en: 'Park: look at that vector from a frame turning with it.' } },
      { tex: r`p = \tfrac32(v_d i_d + v_q i_q)`, meaning: { fr: 'La puissance dans le repère tournant.', en: 'Power in the rotating frame.' } },
    ],
    exercises: [
      { fr: 'Découvrir que $v_d$ est constant dans le repère synchrone.', en: 'Discover that $v_d$ is constant in the synchronous frame.' },
      { fr: 'Revenir au repère fixe : les composantes redeviennent sinusoïdales.', en: 'Go back to the fixed frame: components become sinusoidal again.' },
      { fr: 'Aligner l’axe d sur la tension, comme une PLL.', en: 'Align the d axis with the voltage, like a PLL.' },
      { fr: 'Repérer un déséquilibre à son ondulation à $2f$.', en: 'Spot an unbalance from its $2f$ ripple.' },
      { fr: 'Repérer l’harmonique 5 à son ondulation à $6f$.', en: 'Spot the 5th harmonic from its $6f$ ripple.' },
    ],
    tests: [
      { what: { fr: 'Équilibré et synchrone : $v_d$ constant et $v_q = 0$.', en: 'Balanced and synchronous: $v_d$ constant and $v_q = 0$.' }, why: { fr: 'Vérifie le résultat central de la leçon.', en: 'Checks the central result of the lesson.' } },
      { what: { fr: 'La phase du système se lit dans l’angle $(v_d, v_q)$.', en: 'The set’s phase reads as the $(v_d, v_q)$ angle.' }, why: { fr: 'Vérifie la base du fonctionnement d’une PLL.', en: 'Checks the basis of how a PLL works.' } },
      { what: { fr: 'L’ondulation de $v_d$ égale l’amplitude de la composante inverse.', en: 'The $v_d$ ripple equals the negative-sequence amplitude.' }, why: { fr: 'Relie 2.5 à 2.8 de façon vérifiée.', en: 'Links 2.5 to 2.8 in a verified way.' } },
    ],
  },
  '2.6': {
    summary: {
      fr: 'Un réseau mélange 11, 132 et 33 kV. En per-unit, tout s’exprime autour de 1 et les transformateurs idéaux disparaissent : un seul calcul suffit.',
      en: 'A grid mixes 11, 132 and 33 kV. In per-unit, everything sits around 1 and ideal transformers vanish: one calculation is enough.',
    },
    objective: {
      fr: 'Choisir des bases, convertir des impédances et lire un profil de tension.',
      en: 'Choose bases, convert impedances and read a voltage profile.',
    },
    formulas: [
      { tex: r`I_b = \frac{S_b}{\sqrt3\,V_b},\quad Z_b = \frac{V_b^2}{S_b}`, meaning: { fr: 'Les bases dérivées de la puissance et de la tension de base.', en: 'The bases derived from the power and voltage bases.' } },
      { tex: r`z_{new} = z_{old}\frac{S_{new}}{S_{old}}\left(\frac{V_{old}}{V_{new}}\right)^2`, meaning: { fr: 'Ramener une donnée constructeur à la base commune.', en: 'Bring nameplate data to the common base.' } },
      { tex: r`\Delta V \approx \frac{RP + XQ}{V}`, meaning: { fr: 'La chute de tension dépend surtout de la puissance réactive.', en: 'Voltage drop depends mainly on reactive power.' } },
    ],
    exercises: [
      { fr: 'Constater que le choix de la base ne change pas le résultat.', en: 'See that the choice of base does not change the result.' },
      { fr: 'Faire sortir la tension de sa plage en chargeant la ligne.', en: 'Push the voltage out of its band by loading the line.' },
      { fr: 'La corriger avec le régleur en charge.', en: 'Correct it with the tap changer.' },
      { fr: 'Voir l’effet du facteur de puissance sur la tension.', en: 'See the effect of power factor on voltage.' },
    ],
    tests: [
      { what: { fr: 'La tension de la charge est identique sur deux bases différentes.', en: 'The load voltage is identical on two different bases.' }, why: { fr: 'Prouve que la base est un choix libre.', en: 'Proves the base is a free choice.' } },
      { what: { fr: 'Bases de zone de 11, 132 et 33 kV ; T1 vaut 0,2 pu sur 100 MVA.', en: 'Zone bases of 11, 132 and 33 kV; T1 is 0.2 pu on 100 MVA.' }, why: { fr: 'Vérifie le changement de base.', en: 'Checks the change of base.' } },
      { what: { fr: 'Monter la prise monte la tension.', en: 'Raising the tap raises the voltage.' }, why: { fr: 'Vérifie le modèle du régleur.', en: 'Checks the tap-changer model.' } },
    ],
  },
  '2.7': {
    summary: {
      fr: 'Toute onde périodique est une somme de sinusoïdes. Les épicycles de Fourier les montrent tourner ensemble ; le spectre les mesure ; on peut même les entendre.',
      en: 'Any periodic wave is a sum of sinusoids. Fourier epicycles show them turning together; the spectrum measures them; you can even hear them.',
    },
    objective: {
      fr: 'Lire un spectre, calculer un THD et reconnaître la signature d’un redresseur.',
      en: 'Read a spectrum, compute a THD, and recognise a rectifier’s signature.',
    },
    formulas: [
      { tex: r`v(\theta) = \sum_n b_n \sin n\theta`, meaning: { fr: 'Une onde = une somme d’harmoniques.', en: 'A wave = a sum of harmonics.' } },
      { tex: r`\mathrm{THD} = \frac{\sqrt{\sum_{n\ge2}V_n^2}}{V_1}`, meaning: { fr: 'La part des harmoniques par rapport au fondamental.', en: 'The share of harmonics relative to the fundamental.' } },
      { tex: r`h = 6k \pm 1`, meaning: { fr: 'Les rangs produits par un redresseur 6 pulses : 5, 7, 11, 13…', en: 'The orders produced by a 6-pulse rectifier: 5, 7, 11, 13…' } },
    ],
    exercises: [
      { fr: 'Construire un carré en ajoutant des harmoniques.', en: 'Build a square wave by adding harmonics.' },
      { fr: 'Constater que le dépassement de Gibbs ne disparaît pas.', en: 'See that the Gibbs overshoot does not go away.' },
      { fr: 'Voir qu’une onde lisse converge bien plus vite.', en: 'See that a smooth wave converges much faster.' },
      { fr: 'Reconnaître le spectre d’un redresseur.', en: 'Recognise a rectifier’s spectrum.' },
      { fr: 'Entendre que le timbre est un spectre.', en: 'Hear that timbre is a spectrum.' },
    ],
    tests: [
      { what: { fr: 'Avec 49 harmoniques, chaque onde est reconstruite à 6 % près hors des fronts.', en: 'With 49 harmonics, each wave is rebuilt to within 6 % away from edges.' }, why: { fr: 'Vérifie les coefficients de Fourier.', en: 'Checks the Fourier coefficients.' } },
      { what: { fr: 'THD : carré 48,3 %, triangle 12,1 %, redresseur 31,1 %.', en: 'THD: square 48.3 %, triangle 12.1 %, rectifier 31.1 %.' }, why: { fr: 'Vérifie les valeurs affichées.', en: 'Checks the values shown.' } },
      { what: { fr: 'Le redresseur n’a ni rangs pairs, ni multiples de 3.', en: 'The rectifier has no even orders and no multiples of 3.' }, why: { fr: 'Vérifie la signature $6k \\pm 1$.', en: 'Checks the $6k \\pm 1$ signature.' } },
    ],
  },
  '2.8': {
    summary: {
      fr: 'N’importe quel système triphasé déséquilibré est la somme de trois systèmes équilibrés : direct, inverse et homopolaire. C’est l’outil de base des calculs de défaut.',
      en: 'Any unbalanced three-phase set is the sum of three balanced ones: positive, negative and zero sequence. It is the basic tool of fault studies.',
    },
    objective: {
      fr: 'Décomposer un système, relier chaque séquence à son effet, et mesurer un déséquilibre.',
      en: 'Decompose a set, link each sequence to its effect, and measure an unbalance.',
    },
    formulas: [
      { tex: r`a = e^{j120^\circ},\quad 1 + a + a^2 = 0`, meaning: { fr: 'L’opérateur qui fait tourner de 120°.', en: 'The operator that turns by 120°.' } },
      { tex: r`\underline V_1 = \tfrac13(\underline V_a + a\underline V_b + a^2\underline V_c)`, meaning: { fr: 'La composante directe (et de même pour l’inverse et l’homopolaire).', en: 'The positive sequence (and likewise for negative and zero).' } },
      { tex: r`\mathrm{VUF} = \frac{|\underline V_2|}{|\underline V_1|}`, meaning: { fr: 'Le taux de déséquilibre, limité à 2 % par la norme.', en: 'The unbalance factor, limited to 2 % by the standard.' } },
    ],
    exercises: [
      { fr: 'Rééquilibrer : il ne reste que la composante directe.', en: 'Rebalance: only the positive sequence remains.' },
      { fr: 'Inverser deux phases : tout passe en inverse.', en: 'Swap two phases: everything becomes negative sequence.' },
      { fr: 'Isoler une composante homopolaire pure.', en: 'Isolate a pure zero sequence.' },
      { fr: 'Lire la signature d’un défaut phase-terre.', en: 'Read the signature of a phase-to-ground fault.' },
      { fr: 'Atteindre la limite de déséquilibre de la norme.', en: 'Reach the standard’s unbalance limit.' },
    ],
    tests: [
      { what: { fr: 'Équilibré : uniquement du direct ; inversé : uniquement de l’inverse.', en: 'Balanced: positive only; swapped: negative only.' }, why: { fr: 'Vérifie la transformation de Fortescue.', en: 'Checks the Fortescue transform.' } },
      { what: { fr: 'Les trois séquences recomposent exactement la phase a.', en: 'The three sequences rebuild phase a exactly.' }, why: { fr: 'Prouve que rien ne se perd dans la décomposition.', en: 'Proves nothing is lost in the decomposition.' } },
    ],
  },
  '3.1': {
    summary: {
      fr: 'Chaque pôle est un mode $e^{pt}$ : sa position dans le plan s fixe la vitesse et l’oscillation de la réponse. On les déplace à la main pour tenir un cahier des charges.',
      en: 'Each pole is a mode $e^{pt}$: its position in the s-plane sets the speed and oscillation of the response. You move them by hand to meet a specification.',
    },
    objective: {
      fr: 'Relier position des pôles et performances, et concevoir à l’envers : du cahier des charges aux pôles.',
      en: 'Link pole position to performance, and design backwards: from the specification to the poles.',
    },
    formulas: [
      { tex: r`H(s) = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}`, meaning: { fr: 'Le système du deuxième ordre, modèle de nombreux phénomènes.', en: 'The second-order system, a model of many phenomena.' } },
      { tex: r`D = e^{-\pi\zeta/\sqrt{1-\zeta^2}}`, meaning: { fr: 'Le dépassement ne dépend que de l’amortissement.', en: 'Overshoot depends only on damping.' } },
      { tex: r`t_{r,2\%} \approx \frac{4}{|\sigma|}`, meaning: { fr: 'Le temps de réponse dépend de la partie réelle des pôles.', en: 'Settling time depends on the poles’ real part.' } },
    ],
    exercises: [
      { fr: 'Prédire la réponse de pôles peu amortis.', en: 'Predict the response of lightly damped poles.' },
      { fr: 'Voir l’effet de chaque déplacement, jusqu’à l’instabilité.', en: 'See the effect of each move, up to instability.' },
      { fr: 'Placer les pôles pour tenir dépassement et temps de réponse.', en: 'Place the poles to meet overshoot and settling targets.' },
      { fr: 'Découvrir la réponse « à l’envers » d’un zéro instable.', en: 'Discover the “wrong-way” response of an unstable zero.' },
    ],
    tests: [
      { what: { fr: 'La réponse simulée égale la formule exacte à $10^{-9}$.', en: 'The simulated response matches the exact formula to $10^{-9}$.' }, why: { fr: 'Prouve que le solveur est exact.', en: 'Proves the solver is exact.' } },
      { what: { fr: 'Le dépassement mesuré égale la formule.', en: 'The measured overshoot equals the formula.' }, why: { fr: 'Vérifie le lien pôles ↔ performances.', en: 'Checks the poles ↔ performance link.' } },
      { what: { fr: 'Un zéro à droite donne plus de 10 % de contre-réaction initiale.', en: 'A right-half-plane zero gives more than 10 % initial undershoot.' }, why: { fr: 'Garantit le dernier exercice.', en: 'Guarantees the last exercise.' } },
    ],
  },
  '3.2': {
    summary: {
      fr: 'Une boucle de régulation peut devenir instable si son gain est trop fort. Bode et Nyquist mesurent la marge qui reste avant l’instabilité.',
      en: 'A control loop can go unstable if its gain is too high. Bode and Nyquist measure how much margin is left before instability.',
    },
    objective: {
      fr: 'Lire marges de gain et de phase, appliquer le critère de Nyquist, et arbitrer précision contre stabilité.',
      en: 'Read gain and phase margins, apply the Nyquist criterion, and trade accuracy against stability.',
    },
    formulas: [
      { tex: r`T(s) = \frac{L(s)}{1 + L(s)}`, meaning: { fr: 'La boucle fermée, à partir de la boucle ouverte.', en: 'The closed loop, from the open loop.' } },
      { tex: r`\mathrm{PM} = 180^\circ + \angle L(j\omega_c),\quad \mathrm{GM} = \frac{1}{|L(j\omega_{180})|}`, meaning: { fr: 'Les deux marges de stabilité.', en: 'The two stability margins.' } },
      { tex: r`e_\infty = \frac{1}{1 + K}`, meaning: { fr: 'L’erreur statique d’une boucle sans intégrateur.', en: 'The steady-state error of a loop without an integrator.' } },
    ],
    exercises: [
      { fr: 'Découvrir l’erreur statique d’une boucle proportionnelle.', en: 'Discover the steady-state error of a proportional loop.' },
      { fr: 'Voir les marges fondre quand le gain augmente.', en: 'Watch the margins shrink as gain rises.' },
      { fr: 'Franchir l’instabilité et la reconnaître sur les trois instruments.', en: 'Cross into instability and recognise it on all three instruments.' },
      { fr: 'Régler une marge de phase de 45°.', en: 'Tune for a 45° phase margin.' },
      { fr: 'Arbitrer entre précision et stabilité.', en: 'Trade accuracy against stability.' },
    ],
    tests: [
      { what: { fr: 'Marge de gain = gain critique de Routh / K.', en: 'Gain margin = Routh critical gain / K.' }, why: { fr: 'Trois méthodes, un même résultat.', en: 'Three methods, one result.' } },
      { what: { fr: 'Au gain critique, les pôles touchent l’axe imaginaire.', en: 'At the critical gain, the poles touch the imaginary axis.' }, why: { fr: 'Vérifie la frontière de stabilité.', en: 'Checks the stability boundary.' } },
      { what: { fr: 'La sortie se stabilise à $K/(1+K)$.', en: 'The output settles at $K/(1+K)$.' }, why: { fr: 'Vérifie l’erreur statique annoncée.', en: 'Checks the stated steady-state error.' } },
    ],
  },
  '3.3': {
    summary: {
      fr: 'L’équation du mouvement d’un alternateur est non linéaire. En la remplaçant par sa tangente, on obtient un modèle linéaire, ses valeurs propres et le mode d’oscillation de 1 Hz.',
      en: 'A generator’s swing equation is nonlinear. Replacing it by its tangent gives a linear model, its eigenvalues, and the 1 Hz oscillation mode.',
    },
    objective: {
      fr: 'Linéariser autour d’un équilibre, calculer un mode électromécanique, et savoir quand la linéarisation échoue.',
      en: 'Linearise around an equilibrium, compute an electromechanical mode, and know when linearisation fails.',
    },
    formulas: [
      { tex: r`2H\frac{d\Delta\omega}{dt} = P_m - P_{max}\sin\delta - D\,\Delta\omega`, meaning: { fr: 'L’équation du mouvement : couple moteur contre couple électrique.', en: 'The swing equation: driving torque against electrical torque.' } },
      { tex: r`K_s = P_{max}\cos\delta_0`, meaning: { fr: 'La pente de la courbe P–δ : le « ressort » qui ramène le rotor.', en: 'The slope of the P–δ curve: the “spring” pulling the rotor back.' } },
      { tex: r`\omega_n = \sqrt{\frac{\omega_b K_s}{2H}}`, meaning: { fr: 'La pulsation du mode électromécanique.', en: 'The frequency of the electromechanical mode.' } },
    ],
    exercises: [
      { fr: 'Découvrir que le rotor oscille autour de son nouvel équilibre.', en: 'Discover that the rotor swings around its new equilibrium.' },
      { fr: 'Voir le modèle linéaire suivre le vrai pour une petite perturbation.', en: 'See the linear model follow the real one for a small disturbance.' },
      { fr: 'Voir les deux modèles se séparer pour une grande perturbation.', en: 'See the two models part ways for a large disturbance.' },
      { fr: 'Provoquer une perte de synchronisme.', en: 'Cause a loss of synchronism.' },
      { fr: 'Voir l’effet d’un réseau plus faible.', en: 'See the effect of a weaker grid.' },
      { fr: 'Ajouter de l’amortissement et déplacer les pôles.', en: 'Add damping and move the poles.' },
    ],
    tests: [
      { what: { fr: 'Le calcul démarre exactement à l’équilibre de 30°.', en: 'The run starts exactly at the 30° equilibrium.' }, why: { fr: 'Vérifie le point de fonctionnement.', en: 'Checks the operating point.' } },
      { what: { fr: 'Linéaire et non linéaire concordent à 8 % sur la première oscillation.', en: 'Linear and nonlinear agree within 8 % over the first swing.' }, why: { fr: 'Quantifie honnêtement la validité de la linéarisation.', en: 'Honestly quantifies how valid linearisation is.' } },
      { what: { fr: 'La fréquence mesurée égale celle des valeurs propres ; un grand échelon fait perdre le synchronisme.', en: 'The measured frequency matches the eigenvalues; a large step causes loss of synchronism.' }, why: { fr: 'Relie valeurs propres et réalité, et vérifie la limite non linéaire.', en: 'Links eigenvalues to reality, and checks the nonlinear limit.' } },
    ],
  },
  '3.4': {
    summary: {
      fr: 'Une PLL estime en permanence la phase du réseau. C’est un régulateur PI dans une boucle : on le règle, on le piège avec des sauts de phase et on évite l’emballement.',
      en: 'A PLL constantly estimates the grid phase. It is a PI controller in a loop: you tune it, trick it with phase jumps, and prevent windup.',
    },
    objective: {
      fr: 'Comprendre la PLL comme une boucle de régulation, régler un PI, et connaître ses pièges.',
      en: 'Understand the PLL as a control loop, tune a PI, and know its pitfalls.',
    },
    formulas: [
      { tex: r`v_q = V\sin(\theta_g - \hat\theta) \approx V\varepsilon`, meaning: { fr: 'Le détecteur de phase : nul quand l’estimation est juste.', en: 'The phase detector: zero when the estimate is right.' } },
      { tex: r`\Delta\hat\omega = K_p v_q + K_i\int v_q\,dt`, meaning: { fr: 'Le régulateur PI qui corrige la fréquence estimée.', en: 'The PI controller that corrects the estimated frequency.' } },
      { tex: r`K_p = 2\zeta\omega_n,\quad K_i = \omega_n^2`, meaning: { fr: 'Le réglage à partir de la bande passante et de l’amortissement.', en: 'Tuning from bandwidth and damping.' } },
    ],
    exercises: [
      { fr: 'Découvrir qu’un saut de phase fait croire à un saut de fréquence.', en: 'Discover that a phase jump looks like a frequency jump.' },
      { fr: 'Voir le compromis rapidité / robustesse.', en: 'See the speed / robustness trade-off.' },
      { fr: 'Voir l’intégrateur annuler l’erreur après un changement de fréquence.', en: 'See the integrator cancel the error after a frequency change.' },
      { fr: 'Constater l’erreur permanente sans intégrateur.', en: 'See the permanent error without an integrator.' },
      { fr: 'Provoquer l’emballement de l’intégrateur.', en: 'Cause integrator windup.' },
      { fr: 'Le corriger avec l’anti-emballement.', en: 'Fix it with anti-windup.' },
    ],
    tests: [
      { what: { fr: 'Avec un PI, les erreurs de phase et de fréquence s’annulent.', en: 'With a PI, phase and frequency errors go to zero.' }, why: { fr: 'Vérifie le rôle de l’intégrateur.', en: 'Checks the role of the integrator.' } },
      { what: { fr: 'Sans terme intégral, l’erreur vaut $\\Delta\\omega/K_p$.', en: 'Without the integral term, the error is $\\Delta\\omega/K_p$.' }, why: { fr: 'Vérifie la formule affichée.', en: 'Checks the formula shown.' } },
      { what: { fr: 'Un saut de 30° fait bondir la fréquence estimée de plus de 2 Hz.', en: 'A 30° jump makes the estimated frequency leap by more than 2 Hz.' }, why: { fr: 'Garantit le phénomène au cœur de la leçon.', en: 'Guarantees the phenomenon at the heart of the lesson.' } },
    ],
  },
  ...module4Notes,
  ...module5Notes,
};
