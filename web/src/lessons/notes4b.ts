// Teaching notes for Module 4, second part: 4.3, 4.5, 4.7 (merged into notes.ts).

import type { LessonNote } from './notes';

const r = String.raw;

export const module4bNotes: Record<string, LessonNote> = {
  '4.3': {
    summary: {
      fr: 'Un transformateur ne fait pas que changer de tension : avec un régleur en charge, il la règle ; avec un déphaseur, il oriente les transits ; son couplage fixe le déphasage et le chemin des courants homopolaires.',
      en: 'A transformer does more than change voltage: with an on-load tap changer it regulates it; as a phase shifter it steers flows; its vector group sets the phase shift and the path of zero-sequence currents.',
    },
    objective: {
      fr: 'Régler un régleur en charge (bande, temporisation, butée), dimensionner un déphaseur, lire un couplage.',
      en: 'Set an on-load tap changer (band, delay, limit), size a phase shifter, read a vector group.',
    },
    formulas: [
      { tex: r`V_{BT} = V_{HT}(1 + n\Delta) - \varepsilon`, meaning: { fr: 'La tension réglée selon la prise $n$, pas $\\Delta$ = 1,25 %.', en: 'The regulated voltage at tap $n$, step $\\Delta$ = 1.25 %.' } },
      { tex: r`DB > \Delta`, meaning: { fr: 'Une bande morte plus large qu’un pas, sinon le régulateur pompe.', en: 'A dead band wider than one step, or the regulator hunts.' } },
      { tex: r`P_1 = \frac{P X_2 + \alpha}{X_1 + X_2}`, meaning: { fr: 'Le transit d’une ligne équipée d’un déphaseur d’angle $\\alpha$.', en: 'The flow on a line fitted with a phase shifter of angle $\\alpha$.' } },
      { tex: r`\underline V_a = \underline V_A\,e^{-jh\cdot30^\circ}`, meaning: { fr: 'L’indice horaire $h$ : le retard de la BT sur la HT.', en: 'The clock number $h$: how far LV lags HV.' } },
    ],
    exercises: [
      { fr: 'Prédire la remontée en escalier de la tension réglée.', en: 'Predict the stair-step recovery of the regulated voltage.' },
      { fr: 'Trouver la limite de la plage de réglage.', en: 'Find the limit of the regulating range.' },
      { fr: 'Provoquer le pompage avec une bande trop étroite.', en: 'Cause hunting with a band that is too narrow.' },
      { fr: 'Accélérer le réglage sans pomper, et comprendre l’échelonnement.', en: 'Speed up regulation without hunting, and understand grading.' },
      { fr: 'Soulager une ligne surchargée avec le déphaseur.', en: 'Relieve an overloaded line with the phase shifter.' },
      { fr: 'Choisir le couplage d’un poste HTA/BT.', en: 'Choose the vector group of an MV/LV substation.' },
    ],
    tests: [
      { what: { fr: 'Après un creux à 0,92 pu, le régleur fait 7 prises et revient dans la bande.', en: 'After a dip to 0.92 pu, the tap changer makes 7 taps and gets back into the band.' }, why: { fr: 'Vérifie la logique bande + temporisations.', en: 'Checks the band + delays logic.' } },
      { what: { fr: 'Sous 0,887 pu, il reste en butée hors de la bande ; une bande de 0,8 % pompe.', en: 'Below 0.887 pu it stays at its limit outside the band; a 0.8 % band hunts.' }, why: { fr: 'Vérifie les deux limites présentées.', en: 'Checks both limits shown.' } },
      { what: { fr: 'Le déphaseur de −4,6° ramène la ligne 1 à 0,45 pu, et $P_1 + P_2 = P$.', en: 'A −4.6° shift brings line 1 to 0.45 pu, and $P_1 + P_2 = P$.' }, why: { fr: 'Vérifie la formule du transit.', en: 'Checks the flow formula.' } },
      { what: { fr: 'Dyn11 met la BT à +30° de la HT ; Dyn5 à −150°.', en: 'Dyn11 puts LV at +30° from HV; Dyn5 at −150°.' }, why: { fr: 'Vérifie la convention d’indice horaire.', en: 'Checks the clock-number convention.' } },
    ],
  },
  '4.5': {
    summary: {
      fr: 'Un alternateur, c’est une masse tournante, un circuit d’excitation et deux régulateurs : la vitesse (puissance mécanique) et la tension (excitation). Le modèle à choisir dépend de ce qu’on étudie.',
      en: 'A generator is a rotating mass, a field circuit and two regulators: speed (mechanical power) and voltage (field). Which model to use depends on what is studied.',
    },
    objective: {
      fr: 'Comprendre le statisme, la hiérarchie des modèles (classique, un axe) et l’effet de l’AVR sur la tension et l’amortissement.',
      en: 'Understand droop, the model hierarchy (classical, one-axis) and the effect of the AVR on voltage and damping.',
    },
    formulas: [
      { tex: r`2H\,\dot{\Delta\omega} = P_m - P_e - D\,\Delta\omega`, meaning: { fr: 'L’équation du mouvement, commune à tous les modèles.', en: 'The swing equation, shared by every model.' } },
      { tex: r`\Delta f_\infty = -\frac{\Delta P\,f_0}{1/s + D}`, meaning: { fr: 'L’écart de fréquence permanent laissé par un régulateur à statisme $s$.', en: 'The standing frequency error left by a governor with droop $s$.' } },
      { tex: r`T'_{d0}\,\dot E'_q = E_{fd} - E'_q - (X_d - X'_d)\,i_d`, meaning: { fr: 'Le flux d’excitation : l’état ajouté par le modèle à un axe.', en: 'The field flux: the state the one-axis model adds.' } },
      { tex: r`T_A\,\dot E_{fd} = K_A(V_{ref} - V_t) - E_{fd}`, meaning: { fr: 'Le régulateur de tension, avec ses plafonds.', en: 'The voltage regulator, with its ceilings.' } },
    ],
    exercises: [
      { fr: 'Prédire que la fréquence ne revient pas à 50 Hz.', en: 'Predict that the frequency does not return to 50 Hz.' },
      { fr: 'Choisir un statisme pour tenir 49,8 Hz.', en: 'Choose a droop to hold 49.8 Hz.' },
      { fr: 'Voir le modèle classique après un défaut et une perte de ligne.', en: 'See the classical model after a fault and a line loss.' },
      { fr: 'Voir le flux s’affaisser avec le modèle à un axe.', en: 'See the flux sag with the one-axis model.' },
      { fr: 'Ramener la tension avec l’AVR.', en: 'Bring the voltage back with the AVR.' },
      { fr: 'Voir un AVR rapide déstabiliser un réseau faible.', en: 'See a fast AVR destabilise a weak grid.' },
    ],
    tests: [
      { what: { fr: 'L’écart final de fréquence suit $\\Delta P f_0/(1/s + D)$ à 1 mHz près.', en: 'The final frequency error matches $\\Delta P f_0/(1/s + D)$ within 1 mHz.' }, why: { fr: 'Vérifie le régulateur de vitesse.', en: 'Checks the governor.' } },
      { what: { fr: 'L’initialisation donne $P_e = P_0$ et $V_t = 1$ pour les deux modèles.', en: 'Initialisation gives $P_e = P_0$ and $V_t = 1$ for both models.' }, why: { fr: 'Sans défaut, rien ne doit bouger.', en: 'Without a fault, nothing should move.' } },
      { what: { fr: 'Sans AVR la tension finale reste sous 0,98 pu ; avec $K_A$ = 20–50 elle dépasse 0,99 et l’oscillation s’amortit.', en: 'Without AVR the final voltage stays below 0.98 pu; with $K_A$ = 20–50 it exceeds 0.99 and the swing dies out.' }, why: { fr: 'Vérifie le rôle de l’AVR.', en: 'Checks what the AVR does.' } },
      { what: { fr: 'Avec $K_A$ = 100 et $X_e$ = 0,5 pu, l’oscillation croît.', en: 'With $K_A$ = 100 and $X_e$ = 0.5 pu, the swing grows.' }, why: { fr: 'Vérifie l’amortissement négatif montré à l’étape 6.', en: 'Checks the negative damping shown in step 6.' } },
    ],
  },
  '4.7': {
    summary: {
      fr: 'Un exposant suffit à décrire comment une charge réagit à la tension ($\\alpha$ pour P, $\\beta$ pour Q), un coefficient comment elle réagit à la fréquence. Ce sont les modèles des études de réseau.',
      en: 'One exponent is enough to describe how a load reacts to voltage ($\\alpha$ for P, $\\beta$ for Q), and one coefficient how it reacts to frequency. These are the models used in grid studies.',
    },
    objective: {
      fr: 'Passer du ZIP à l’exponentiel, voir la sensibilité du réactif et l’autoréglage de la charge en fréquence.',
      en: 'Go from ZIP to exponential, see the sensitivity of reactive power and load self-regulation with frequency.',
    },
    formulas: [
      { tex: r`P = P_0 V^\alpha (1 + K_{pf}\,\Delta f/f_0)`, meaning: { fr: 'La puissance active selon la tension et la fréquence.', en: 'Active power versus voltage and frequency.' } },
      { tex: r`\alpha \approx 2a_Z + a_I`, meaning: { fr: 'L’exposant équivalent d’un mélange ZIP autour de 1 pu.', en: 'The equivalent exponent of a ZIP mix around 1 pu.' } },
      { tex: r`\Delta f_\infty = -\frac{\Delta P\,f_0}{K_{pf} + 1/s}`, meaning: { fr: 'L’écart de fréquence, avec l’aide de la charge et des régulateurs.', en: 'The frequency deviation, with help from the load and the governors.' } },
    ],
    exercises: [
      { fr: 'Retrouver l’impédance constante ($\\alpha = 2$).', en: 'Recover constant impedance ($\\alpha = 2$).' },
      { fr: 'Retrouver la puissance constante ($\\alpha = 0$).', en: 'Recover constant power ($\\alpha = 0$).' },
      { fr: 'Trouver l’exposant équivalent au ZIP de la leçon 4.6.', en: 'Find the exponent equivalent to the ZIP of lesson 4.6.' },
      { fr: 'Voir le réactif réagir plus fort que l’actif.', en: 'See reactive power react more strongly than active power.' },
      { fr: 'Mesurer l’autoréglage en fréquence.', en: 'Measure frequency self-regulation.' },
    ],
    tests: [
      { what: { fr: '$\\alpha$ = 0, 1, 2 redonnent P, I et Z constants.', en: '$\\alpha$ = 0, 1, 2 give back constant P, I and Z.' }, why: { fr: 'Vérifie que l’exponentiel contient le ZIP pur.', en: 'Checks that the exponential model contains pure ZIP.' } },
      { what: { fr: 'L’exposant 1,1 colle au ZIP (0,4 ; 0,3 ; 0,3) à 0,1 % près entre 0,95 et 1,05 pu.', en: 'Exponent 1.1 matches the ZIP (0.4; 0.3; 0.3) within 0.1 % between 0.95 and 1.05 pu.' }, why: { fr: 'Vérifie l’équivalence annoncée.', en: 'Checks the stated equivalence.' } },
      { what: { fr: '$K_{pf}$ = 2 et −0,5 Hz donnent −2 % de puissance.', en: '$K_{pf}$ = 2 and −0.5 Hz give −2 % power.' }, why: { fr: 'Vérifie le coefficient de fréquence.', en: 'Checks the frequency coefficient.' } },
    ],
  },
};
