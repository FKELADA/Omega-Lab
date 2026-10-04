// Teaching notes for Module 6 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module6Note: ModuleNote = {
  summary: {
    fr: 'L’électronique de puissance transforme l’énergie en ouvrant et fermant des interrupteurs très vite. On découpe une tension, puis on filtre : c’est le cœur de tous les onduleurs solaires, éoliens, batteries et liaisons CCHT.',
    en: 'Power electronics converts energy by opening and closing switches very fast. A voltage is chopped, then filtered: this is the heart of every solar, wind, battery and HVDC converter.',
  },
  objective: {
    fr: 'Comprendre le découpage, la modulation et le filtrage, et savoir passer du modèle découpé au modèle moyen utilisé dans les études de réseau.',
    en: 'Understand switching, modulation and filtering, and know how to go from the switching model to the averaged model used in grid studies.',
  },
  path: {
    fr: '6.1 hacheurs → 6.2 redresseurs à thyristors → 6.3 MLI → 6.4 modèle moyen et filtre LCL.',
    en: '6.1 choppers → 6.2 thyristor rectifiers → 6.3 PWM → 6.4 averaged model and LCL filter.',
  },
};

export const module6Notes: Record<string, LessonNote> = {
  '6.1': {
    summary: {
      fr: 'Un hacheur change une tension continue en une autre en ouvrant et fermant un interrupteur. Une inductance lisse le courant ; la tension de sortie dépend du rapport cyclique D.',
      en: 'A chopper turns one DC voltage into another by opening and closing a switch. An inductor smooths the current; the output voltage depends on the duty cycle D.',
    },
    objective: {
      fr: 'Trouver le rapport de conversion par l’équilibre des volts-secondes, et comprendre ondulation et conduction discontinue.',
      en: 'Find the conversion ratio from volt-second balance, and understand ripple and discontinuous conduction.',
    },
    formulas: [
      { tex: r`\langle v_L\rangle = 0`, meaning: { fr: 'En régime établi, la tension moyenne aux bornes de l’inductance est nulle.', en: 'In steady state, the average inductor voltage is zero.' } },
      { tex: r`V_s = D V_e,\quad V_s = V_e/(1-D)`, meaning: { fr: 'Abaisseur et élévateur.', en: 'Buck and boost.' } },
      { tex: r`\Delta i_L = V_s(1-D)/(L f_s)`, meaning: { fr: 'L’ondulation de courant de l’abaisseur.', en: 'The buck’s current ripple.' } },
    ],
    exercises: [
      { fr: 'Découvrir le courant triangulaire dans l’inductance.', en: 'Discover the triangular inductor current.' },
      { fr: 'Régler la tension avec D.', en: 'Set the voltage with D.' },
      { fr: 'Élever la tension avec le boost.', en: 'Step up the voltage with the boost.' },
      { fr: 'Provoquer la conduction discontinue.', en: 'Cause discontinuous conduction.' },
      { fr: 'Réduire l’ondulation avec fs et L.', en: 'Reduce the ripple with fs and L.' },
      { fr: 'Utiliser l’inverseur pour monter ou descendre.', en: 'Use the buck-boost to step up or down.' },
    ],
    tests: [
      { what: { fr: 'Les trois montages donnent le rapport idéal en conduction continue.', en: 'All three topologies give the ideal ratio in continuous conduction.' }, why: { fr: 'Vérifie la simulation découpée.', en: 'Checks the switching simulation.' } },
      { what: { fr: 'L’ondulation de l’abaisseur vaut Vs(1 − D)/(L fs) ; la tension moyenne de L est nulle.', en: 'The buck ripple equals Vs(1 − D)/(L fs); the mean inductor voltage is zero.' }, why: { fr: 'Vérifie les formules affichées.', en: 'Checks the formulas shown.' } },
      { what: { fr: 'Sous L critique, le courant s’annule et le gain dépasse D.', en: 'Below the critical L, the current reaches zero and the gain exceeds D.' }, why: { fr: 'Garantit l’étape DCM.', en: 'Guarantees the DCM step.' } },
    ],
  },
  '6.2': {
    summary: {
      fr: 'Un pont de six thyristors redresse une tension triphasée. En retardant leur amorçage, on règle la tension continue, et on peut même la rendre négative : la puissance remonte vers le réseau. L’inductance de la source ralentit les commutations.',
      en: 'A bridge of six thyristors rectifies a three-phase voltage. Delaying their firing sets the DC voltage, and can even make it negative: power flows back to the grid. The source inductance slows the commutations.',
    },
    objective: {
      fr: 'Relier angle d’amorçage, tension continue, empiètement, facteur de puissance et harmoniques.',
      en: 'Relate firing angle, DC voltage, overlap, power factor and harmonics.',
    },
    formulas: [
      { tex: r`V_d = 1{,}35\,V_{LL}\cos\alpha - \tfrac{3}{\pi}\omega L_s I_d`, meaning: { fr: 'La tension continue moyenne.', en: 'The average DC voltage.' } },
      { tex: r`\cos\alpha - \cos(\alpha+\mu) = \tfrac{2\omega L_s I_d}{\sqrt2 V_{LL}}`, meaning: { fr: 'L’angle d’empiètement.', en: 'The overlap angle.' } },
      { tex: r`h = 6k \pm 1,\ I_h \approx I_1/h`, meaning: { fr: 'Les harmoniques du courant de ligne.', en: 'The line-current harmonics.' } },
    ],
    exercises: [
      { fr: 'Découvrir les six calottes de la tension redressée.', en: 'Discover the six caps of the rectified voltage.' },
      { fr: 'Retrouver 1,35 VLL avec un pont à diodes.', en: 'Find 1.35 VLL with a diode bridge.' },
      { fr: 'Régler la tension avec l’angle d’amorçage.', en: 'Set the voltage with the firing angle.' },
      { fr: 'Passer en onduleur au-delà de 90°.', en: 'Go to inverter mode beyond 90°.' },
      { fr: 'Voir l’empiètement et ses encoches.', en: 'See overlap and its notches.' },
      { fr: 'Provoquer un échec de commutation.', en: 'Cause a commutation failure.' },
    ],
    tests: [
      { what: { fr: 'Pont à diodes : 1,35 VLL ; formule de Vd avec empiètement ; Vd < 0 au-delà de 90°.', en: 'Diode bridge: 1.35 VLL; Vd formula with overlap; Vd < 0 beyond 90°.' }, why: { fr: 'Vérifie la construction des formes d’onde.', en: 'Checks how the waveforms are built.' } },
      { what: { fr: 'μ satisfait son équation ; pas de solution (échec) à 150° sous fort courant.', en: 'μ satisfies its equation; no solution (failure) at 150° with high current.' }, why: { fr: 'Garantit les étapes 5 et 6.', en: 'Guarantees steps 5 and 6.' } },
      { what: { fr: 'Harmoniques 5 et 7 à 20 % et 14 %, pas d’harmonique 3 ; cos φ₁ ≈ cos(α + μ/2).', en: 'Harmonics 5 and 7 at 20 % and 14 %, no 3rd; cos φ₁ ≈ cos(α + μ/2).' }, why: { fr: 'Vérifie le spectre et le facteur de puissance.', en: 'Checks the spectrum and power factor.' } },
    ],
  },
  '6.3': {
    summary: {
      fr: 'Un onduleur ne sait produire que deux tensions par bras. En comparant une référence sinusoïdale à une porteuse triangulaire, il fabrique des créneaux dont la moyenne glissante est la sinusoïde voulue.',
      en: 'An inverter can only produce two voltages per leg. By comparing a sinusoidal reference with a triangular carrier, it makes pulses whose moving average is the desired sine wave.',
    },
    objective: {
      fr: 'Comprendre la MLI sinus, la surmodulation, l’injection d’homopolaire et la MLI vectorielle.',
      en: 'Understand sine PWM, overmodulation, zero-sequence injection and space-vector PWM.',
    },
    formulas: [
      { tex: r`\hat V_{ab,1} = m\,\tfrac{\sqrt3}{2}V_{dc}`, meaning: { fr: 'Le fondamental en zone linéaire.', en: 'The fundamental in the linear range.' } },
      { tex: r`m_{max} = 2/\sqrt3`, meaning: { fr: 'La limite linéaire avec injection d’homopolaire ou MLI vectorielle.', en: 'The linear limit with zero-sequence injection or SVPWM.' } },
      { tex: r`d_1, d_2, d_0`, meaning: { fr: 'Les durées d’application des deux vecteurs voisins et du vecteur nul.', en: 'The dwell times of the two neighbouring vectors and the zero vector.' } },
    ],
    exercises: [
      { fr: 'Découvrir qu’un bras ne fait que deux niveaux.', en: 'Discover that a leg makes only two levels.' },
      { fr: 'Vérifier la zone linéaire à m = 1.', en: 'Check the linear range at m = 1.' },
      { fr: 'Voir la surmodulation et ses harmoniques 5 et 7.', en: 'See overmodulation and its 5th and 7th harmonics.' },
      { fr: 'Gagner 15 % de tension par injection.', en: 'Gain 15 % voltage by injection.' },
      { fr: 'Suivre la référence dans l’hexagone.', en: 'Follow the reference in the hexagon.' },
      { fr: 'Repousser les harmoniques en augmentant mf.', en: 'Push harmonics up by raising mf.' },
    ],
    tests: [
      { what: { fr: 'Fondamental = m√3/2·Vdc en zone linéaire.', en: 'Fundamental = m√3/2·Vdc in the linear range.' }, why: { fr: 'Vérifie la modulation.', en: 'Checks the modulation.' } },
      { what: { fr: 'À m = 1,15 : distorsion en sinus, pas avec injection ou SVPWM.', en: 'At m = 1.15: distortion with sine, none with injection or SVPWM.' }, why: { fr: 'Garantit les étapes 3 et 4.', en: 'Guarantees steps 3 and 4.' } },
      { what: { fr: 'Les durées SVPWM somment à 1 et d₀ = 0 au bord du cercle inscrit.', en: 'SVPWM dwell times sum to 1 and d₀ = 0 at the edge of the inscribed circle.' }, why: { fr: 'Vérifie l’hexagone.', en: 'Checks the hexagon.' } },
    ],
  },
  '6.4': {
    summary: {
      fr: 'Pour étudier un réseau, on remplace la tension découpée par sa moyenne : c’est le modèle moyen. Pour raccorder un onduleur, on filtre le découpage ; le filtre LCL filtre très bien mais résonne, et il faut l’amortir.',
      en: 'To study a grid, the switched voltage is replaced by its average: the averaged model. To connect an inverter, switching is filtered; the LCL filter works very well but resonates, so it must be damped.',
    },
    objective: {
      fr: 'Savoir quand le modèle moyen suffit, et dimensionner un filtre LCL : résonance, atténuation, amortissement.',
      en: 'Know when the averaged model is enough, and size an LCL filter: resonance, attenuation, damping.',
    },
    formulas: [
      { tex: r`\bar v = m\,V_{dc}`, meaning: { fr: 'Le modèle moyen sur une période de découpage.', en: 'The averaged model over a switching period.' } },
      { tex: r`f_{rés} = \tfrac{1}{2\pi}\sqrt{\tfrac{L_1+L_2}{L_1L_2C_f}}`, meaning: { fr: 'La fréquence de résonance du LCL.', en: 'The LCL resonant frequency.' } },
      { tex: r`R_d \approx 1/(3\omega_{rés}C_f)`, meaning: { fr: 'Une valeur usuelle de résistance d’amortissement.', en: 'A usual damping-resistor value.' } },
    ],
    exercises: [
      { fr: 'Comparer modèle moyen et modèle découpé.', en: 'Compare averaged and switching models.' },
      { fr: 'Voir l’ondulation avec un simple filtre L.', en: 'See the ripple with a plain L filter.' },
      { fr: 'Mesurer l’atténuation apportée par le condensateur.', en: 'Measure the attenuation brought by the capacitor.' },
      { fr: 'Exciter la résonance avec le découpage.', en: 'Excite the resonance with switching.' },
      { fr: 'Amortir la résonance.', en: 'Damp the resonance.' },
      { fr: 'Placer la résonance selon la règle de conception.', en: 'Place the resonance by the design rule.' },
    ],
    tests: [
      { what: { fr: 'f_rés conforme à la formule et pente en 1/f³ au-dessus.', en: 'f_res matches the formula and the slope is 1/f³ above it.' }, why: { fr: 'Vérifie la fonction de transfert.', en: 'Checks the transfer function.' } },
      { what: { fr: 'Atténuation à fs > 10 fois meilleure qu’un filtre L ; Rd optimal divise le pic par plus de 20.', en: 'Attenuation at fs over 10 times better than an L filter; optimal Rd cuts the peak by more than 20.' }, why: { fr: 'Garantit les étapes 3 et 5.', en: 'Guarantees steps 3 and 5.' } },
      { what: { fr: 'Les deux modèles donnent le courant de consigne ; le filtre L ondule plus de 2 fois plus que le LCL amorti.', en: 'Both models deliver the reference current; the L filter ripples over twice as much as the damped LCL.' }, why: { fr: 'Valide le modèle moyen.', en: 'Validates the averaged model.' } },
    ],
  },
};
