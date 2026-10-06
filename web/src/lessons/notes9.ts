// Teaching notes for Module 9 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module9Note: ModuleNote = {
  summary: {
    fr: 'Le métier du gestionnaire du réseau de transport (GRT), vu à travers RTE : un réseau maillé de 63 à 400 kV, interconnecté à l’Europe, qu’il faut équilibrer à chaque seconde, garder sûr en N-1, tenir en tension, défendre contre les grands incidents, et ouvrir aux nouveaux producteurs. Les chiffres sont des ordres de grandeur pédagogiques, relus en octobre 2026 face aux publications de RTE, d’ENTSO-E et de la CRE (sources dans la documentation).',
    en: 'The job of the transmission system operator (TSO), seen through RTE: a meshed 63–400 kV grid, interconnected with Europe, that must be balanced every second, kept N-1 secure, held in voltage, defended against major incidents, and opened to new generators. Figures are teaching orders of magnitude, reviewed in October 2026 against RTE, ENTSO-E and CRE publications (sources in the documentation).',
  },
  objective: {
    fr: 'Comprendre les spécificités du transport face à la distribution et les études d’un ingénieur GRT : équilibre, sécurité, tension, défense, raccordement.',
    en: 'Understand what sets transmission apart from distribution, and the studies a TSO engineer runs: balancing, security, voltage, defence, connection.',
  },
  path: {
    fr: '9.1 niveaux de tension → 9.2 équilibre et réglages de fréquence → 9.3 sécurité N-1 → 9.4 plan de tension → 9.5 plan de défense → 9.6 études de raccordement.',
    en: '9.1 voltage levels → 9.2 balancing and frequency control → 9.3 N-1 security → 9.4 voltage plan → 9.5 defence plan → 9.6 connection studies.',
  },
};

export const module9Notes: Record<string, LessonNote> = {
  '9.1': {
    summary: {
      fr: 'Pourquoi transporter en 400 kV et distribuer en 20 kV et 400 V : les pertes en $1/U^2$, la chute de tension et le rapport $R/X$, qui sépare le monde du transport (réactif) de celui de la distribution (actif).',
      en: 'Why transmit at 400 kV and distribute at 20 kV and 400 V: losses as $1/U^2$, the voltage drop and the $R/X$ ratio, which separates transmission (reactive) from distribution (active).',
    },
    objective: {
      fr: 'Choisir un niveau de tension pour un transit, et connaître les ordres de grandeur de chaque niveau.',
      en: 'Choose a voltage level for a given transfer, and know the orders of magnitude of each level.',
    },
    formulas: [
      { tex: r`I = \frac{P}{n\sqrt3\,U\cos\varphi}`, meaning: { fr: 'Le courant par circuit.', en: 'The current per circuit.' } },
      { tex: r`\frac{p_J}{P} = \frac{R\,P}{U^2\cos^2\varphi}`, meaning: { fr: 'Les pertes relatives, en $1/U^2$.', en: 'Relative losses, as $1/U^2$.' } },
      { tex: r`\frac{\Delta V}{V} \approx \frac{RP + XQ}{U^2}`, meaning: { fr: 'La chute de tension, dominée par $Q$ en transport et par $P$ en distribution.', en: 'The voltage drop, dominated by $Q$ in transmission and by $P$ in distribution.' } },
    ],
    exercises: [
      { fr: 'Trouver le niveau et le nombre de circuits pour 1 000 MW sur 200 km.', en: 'Find the level and number of circuits for 1,000 MW over 200 km.' },
      { fr: 'Mesurer l’effet du carré de la tension sur les pertes.', en: 'Measure the effect of the voltage squared on losses.' },
      { fr: 'Voir qu’en HTA la chute vient surtout de $P$.', en: 'See that in MV the drop comes mostly from $P$.' },
      { fr: 'Trouver la portée d’un départ BT.', en: 'Find the reach of an LV feeder.' },
    ],
    tests: [
      { what: { fr: '1 000 MW sur 200 km : deux circuits 400 kV conviennent, un seul non, et aucune solution en 225 kV.', en: '1,000 MW over 200 km: two 400 kV circuits work, one does not, and no 225 kV solution does.' }, why: { fr: 'Vérifie la réponse de l’étape 1.', en: 'Checks the answer of step 1.' } },
      { what: { fr: 'Le rapport des pertes 225/400 kV vaut $(400/225)^2 \\times r_{225}/r_{400}$, et $p_J = 3RI^2$.', en: 'The 225/400 kV loss ratio is $(400/225)^2 \\times r_{225}/r_{400}$, and $p_J = 3RI^2$.' }, why: { fr: 'Vérifie les formules affichées.', en: 'Checks the formulas shown.' } },
      { what: { fr: 'En 20 kV le terme en $P$ domine ; en 400 kV le terme en $Q$ ; 100 kW en 400 V atteignent 8 % vers 540 m.', en: 'At 20 kV the $P$ term dominates; at 400 kV the $Q$ term; 100 kW at 400 V reach 8 % at about 540 m.' }, why: { fr: 'Vérifie les étapes 3 et 4.', en: 'Checks steps 3 and 4.' } },
    ],
  },
  '9.2': {
    summary: {
      fr: 'Quand une centrale déclenche, toute l’Europe continentale freine la chute de fréquence (réglage primaire, FCR), puis la zone en déficit rétablit 50 Hz et ses échanges (réglage secondaire, aFRR), enfin le dispatcher libère le secondaire avec l’ajustement (mFRR).',
      en: 'When a plant trips, all of continental Europe stops the frequency drop (primary control, FCR), then the area in deficit restores 50 Hz and its exchanges (secondary control, aFRR), and finally the dispatcher frees the secondary reserve with balancing energy (mFRR).',
    },
    objective: {
      fr: 'Distinguer les trois réglages, leurs échelles de temps et leurs rôles, et comprendre l’écart de réglage de zone.',
      en: 'Tell the three controls apart, with their time scales and roles, and understand the area control error.',
    },
    formulas: [
      { tex: r`\Delta f_\infty \approx -\frac{\Delta P}{\lambda}`, meaning: { fr: 'L’écart quasi stationnaire laissé par le réglage primaire, avec l’énergie réglante $\\lambda$.', en: 'The quasi-steady deviation left by primary control, with the network power frequency characteristic $\\lambda$.' } },
      { tex: r`\text{ACE} = \Delta P_{ech} + \lambda_{zone}\,\Delta f`, meaning: { fr: 'L’écart de réglage de zone, que le secondaire annule.', en: 'The area control error, which secondary control cancels.' } },
      { tex: r`\text{aFRR} = -\frac{1}{T_r}\int \text{ACE}\,dt`, meaning: { fr: 'Le réglage secondaire, intégral.', en: 'Secondary control, integral.' } },
    ],
    exercises: [
      { fr: 'Prédire la fréquence après la perte d’une tranche.', en: 'Predict the frequency after a unit trips.' },
      { fr: 'Voir la solidarité européenne sans réglage secondaire.', en: 'See European solidarity without secondary control.' },
      { fr: 'Vérifier le principe de non-intervention.', en: 'Check the non-intervention principle.' },
      { fr: 'Tenir l’incident de référence de 3 000 MW.', en: 'Withstand the 3,000 MW reference incident.' },
      { fr: 'Libérer la réserve secondaire par l’ajustement.', en: 'Free the secondary reserve with balancing energy.' },
    ],
    tests: [
      { what: { fr: 'Sans secondaire, l’écart vaut $-\\Delta P/\\lambda$.', en: 'Without secondary control, the deviation is $-\\Delta P/\\lambda$.' }, why: { fr: 'Vérifie le réglage primaire.', en: 'Checks primary control.' } },
      { what: { fr: 'La France importe plus de 700 MW puis la fréquence revient à 50 Hz à 5 mHz près.', en: 'France imports over 700 MW, then the frequency returns to 50 Hz within 5 mHz.' }, why: { fr: 'Vérifie la solidarité puis le secondaire.', en: 'Checks solidarity, then secondary control.' } },
      { what: { fr: 'Un incident à l’étranger laisse l’aFRR français sous 20 MW ; 3 000 MW laissent la fréquence quasi stationnaire au-dessus de 49,8 Hz.', en: 'An incident abroad leaves France’s aFRR below 20 MW; 3,000 MW leave the quasi-steady frequency above 49.8 Hz.' }, why: { fr: 'Vérifie les étapes 3 et 4.', en: 'Checks steps 3 and 4.' } },
    ],
  },
  '9.3': {
    summary: {
      fr: 'La règle du N-1 : le réseau doit supporter la perte de n’importe quel ouvrage. La veille, le GRT simule chaque heure et chaque perte, repère les contraintes et prépare les parades : topologie, déphaseurs, redispatching.',
      en: 'The N-1 rule: the grid must withstand the loss of any element. The day before, the TSO simulates every hour and every outage, spots the constraints and prepares remedies: topology, phase shifters, redispatch.',
    },
    objective: {
      fr: 'Mener une analyse N-1 simple et choisir la parade la moins chère.',
      en: 'Run a simple N-1 analysis and choose the cheapest remedy.',
    },
    formulas: [
      { tex: r`\mathbf P = \mathbf B\,\boldsymbol\theta`, meaning: { fr: 'La répartition de charge en courant continu.', en: 'The DC power flow.' } },
      { tex: r`\max_{h,c}\ |F_\ell^{(c)}(h)|/F_\ell^{max} \le 1`, meaning: { fr: 'Le critère N-1, sur toutes les heures et toutes les pertes.', en: 'The N-1 criterion, over all hours and all outages.' } },
    ],
    exercises: [
      { fr: 'Trouver l’heure et la ligne en contrainte.', en: 'Find the constrained hour and line.' },
      { fr: 'Lever la contrainte par redispatching.', en: 'Remove the constraint by redispatch.' },
      { fr: 'La lever par le déphaseur.', en: 'Remove it with the phase shifter.' },
      { fr: 'La lever par la topologie.', en: 'Remove it by switching.' },
      { fr: 'Combiner les parades en vague de froid.', en: 'Combine remedies during a cold spell.' },
    ],
    tests: [
      { what: { fr: 'Les flux continus respectent le bilan à chaque nœud.', en: 'DC flows balance at every node.' }, why: { fr: 'Vérifie le calcul de base.', en: 'Checks the core computation.' } },
      { what: { fr: 'Sûr en N, contraint en N-1 vers 19 h sur L4.', en: 'Secure in N, constrained in N-1 around 7 pm on L4.' }, why: { fr: 'Vérifie le scénario.', en: 'Checks the scenario.' } },
      { what: { fr: 'Chaque parade seule suffit ; ouvrir L5 aggrave ; à +10 % seule la combinaison passe.', en: 'Each remedy works alone; opening L5 is worse; at +10 % only the combination works.' }, why: { fr: 'Vérifie que chaque étape a une solution.', en: 'Checks that each step has a solution.' } },
    ],
  },
  '9.4': {
    summary: {
      fr: 'Le plan de tension du transport à trois étages : réglage primaire (les régulateurs des alternateurs), secondaire (un nœud pilote par zone et un niveau commun aux groupes), tertiaire (les consignes du dispatcher), complétés par des condensateurs et des inductances.',
      en: 'The three-level transmission voltage plan: primary (the generators’ regulators), secondary (one pilot node per zone and a level shared by its generators), tertiary (the dispatcher’s setpoints), with capacitors and reactors.',
    },
    objective: {
      fr: 'Comprendre le rôle de chaque étage et la gestion de la réserve réactive.',
      en: 'Understand each level’s role and how the reactive reserve is managed.',
    },
    formulas: [
      { tex: r`\Delta V \approx \frac{V}{S_{cc}}\,\Delta Q`, meaning: { fr: 'En transport, la tension suit le réactif.', en: 'In transmission, voltage follows reactive power.' } },
      { tex: r`Q_i = N\,Q_{r,i}`, meaning: { fr: 'L’alignement des groupes par le réglage secondaire.', en: 'Generator alignment by secondary control.' } },
    ],
    exercises: [
      { fr: 'Voir la tension pilote décrocher à la pointe sans secondaire.', en: 'See the pilot voltage sag at the peak without secondary control.' },
      { fr: 'Voir le secondaire tenir la tension jusqu’à la butée.', en: 'See secondary control hold the voltage until the limit.' },
      { fr: 'Rendre de la marge avec des condensateurs.', en: 'Restore margin with capacitors.' },
      { fr: 'Voir l’excès de compensation fixe.', en: 'See the excess of fixed compensation.' },
      { fr: 'Relever la consigne sans épuiser la réserve.', en: 'Raise the setpoint without exhausting the reserve.' },
    ],
    tests: [
      { what: { fr: 'Sans secondaire, la tension pilote passe sous 397 kV à 19 h et varie de plus de 10 kV.', en: 'Without secondary control the pilot voltage drops below 397 kV at 7 pm and swings by more than 10 kV.' }, why: { fr: 'Vérifie l’étape 1.', en: 'Checks step 1.' } },
      { what: { fr: 'Avec le secondaire, les groupes sont alignés et saturent à la pointe ; 300 Mvar de condensateurs ramènent $N \\le 0{,}6$.', en: 'With secondary control the generators are aligned and saturate at the peak; 300 Mvar of capacitors bring $N \\le 0.6$.' }, why: { fr: 'Vérifie les étapes 2 et 3.', en: 'Checks steps 2 and 3.' } },
      { what: { fr: '600 Mvar font absorber les groupes à fond ; 410 kV tiennent avec 300 Mvar sous 420 kV.', en: '600 Mvar drive the generators to absorb flat out; 410 kV is held with 300 Mvar, under 420 kV.' }, why: { fr: 'Vérifie les étapes 4 et 5.', en: 'Checks steps 4 and 5.' } },
    ],
  },
  '9.5': {
    summary: {
      fr: 'Quand le déficit dépasse les réserves (séparation de réseau), seul le délestage automatique sur seuil de fréquence évite la panne généralisée. Trop délester est aussi dangereux que pas assez, et la baisse de l’inertie rend le réglage plus délicat.',
      en: 'When the deficit exceeds the reserves (a system split), only automatic under-frequency load shedding prevents a blackout. Shedding too much is as dangerous as too little, and falling inertia makes the setting harder.',
    },
    objective: {
      fr: 'Comprendre le plan de défense et le réglage des échelons de délestage.',
      en: 'Understand the defence plan and the setting of shedding stages.',
    },
    formulas: [
      { tex: r`\frac{df}{dt} = -\frac{\Delta P}{2H}\,f_0`, meaning: { fr: 'La vitesse de chute initiale.', en: 'The initial rate of fall.' } },
      { tex: r`47{,}5 \le f \le 51{,}5\ \text{Hz}`, meaning: { fr: 'La plage où les groupes restent couplés.', en: 'The range in which generators stay connected.' } },
    ],
    exercises: [
      { fr: 'Prédire la fréquence avec délestage.', en: 'Predict the frequency with shedding.' },
      { fr: 'Voir la panne sans délestage.', en: 'See the blackout without shedding.' },
      { fr: 'Voir le sur-délestage.', en: 'See over-shedding.' },
      { fr: 'Sauver un déficit de 30 %.', en: 'Save a 30 % deficit.' },
      { fr: 'Adapter les échelons à une faible inertie.', en: 'Adapt the stages to low inertia.' },
    ],
    tests: [
      { what: { fr: 'Le plan par défaut sauve le système ; sans délestage, c’est la panne.', en: 'The default plan saves the system; without shedding, a blackout.' }, why: { fr: 'Vérifie les étapes 1 et 2.', en: 'Checks steps 1 and 2.' } },
      { what: { fr: 'Le RoCoF initial vaut $\\Delta P f_0/2H$ ; des échelons de 15 % pour 10 % de déficit dépassent 51 Hz.', en: 'The initial RoCoF is $\\Delta P f_0/2H$; 15 % stages for a 10 % deficit exceed 51 Hz.' }, why: { fr: 'Vérifie la formule et l’étape 3.', en: 'Checks the formula and step 3.' } },
      { what: { fr: '30 % sont sauvés par des échelons de 7,5 % ; à $H = 1{,}5$ s et 25 % de déficit, 7,5 % sur-délestent mais 5 % sauvent.', en: '30 % is saved by 7.5 % stages; at $H = 1.5$ s and a 25 % deficit, 7.5 % over-sheds but 5 % saves.' }, why: { fr: 'Vérifie les étapes 4 et 5.', en: 'Checks steps 4 and 5.' } },
    ],
  },
  '9.6': {
    summary: {
      fr: 'Une étude de raccordement vue par l’ingénieur : capacité d’accueil en N-1, force du réseau (SCR) pour les onduleurs, pouvoir de coupure pour les machines synchrones. Le meilleur poste dépend de la technologie.',
      en: 'A connection study from the engineer’s side: N-1 hosting capacity, grid strength (SCR) for inverters, breaking capacity for synchronous machines. The best substation depends on the technology.',
    },
    objective: {
      fr: 'Savoir quels critères limitent un raccordement et pourquoi.',
      en: 'Know which criteria limit a connection, and why.',
    },
    formulas: [
      { tex: r`\text{SCR} = S_{cc}/P \ge 3`, meaning: { fr: 'La force du réseau vue par un onduleur.', en: 'Grid strength as seen by an inverter.' } },
      { tex: r`\Delta I_{cc} \approx \frac{S}{\sqrt3\,U\,(X''_d + X_t)}`, meaning: { fr: 'L’apport d’une machine synchrone au courant de court-circuit.', en: 'A synchronous machine’s contribution to short-circuit current.' } },
    ],
    exercises: [
      { fr: 'Trouver la limite d’un parc éolien sur un poste 63 kV.', en: 'Find the limit of a wind farm on a 63 kV substation.' },
      { fr: 'Trouver un poste pour 400 MW.', en: 'Find a substation for 400 MW.' },
      { fr: 'Voir une centrale synchrone refusée pour le courant de court-circuit.', en: 'See a synchronous plant refused for short-circuit current.' },
      { fr: 'Voir la même puissance en onduleurs acceptée.', en: 'See the same power in inverters accepted.' },
    ],
    tests: [
      { what: { fr: 'Poste C : 200 MW d’éolien, limités par le SCR.', en: 'Substation C: 200 MW of wind, limited by the SCR.' }, why: { fr: 'Vérifie l’étape 1.', en: 'Checks step 1.' } },
      { what: { fr: 'Poste B : 400 MW, limités par la capacité.', en: 'Substation B: 400 MW, limited by capacity.' }, why: { fr: 'Vérifie l’étape 2.', en: 'Checks step 2.' } },
      { what: { fr: 'Poste A : 1 000 MW synchrones dépassent 63 kA, pas 1 000 MW d’onduleurs.', en: 'Substation A: 1,000 MW synchronous exceeds 63 kA, 1,000 MW of inverters does not.' }, why: { fr: 'Vérifie les étapes 3 et 4.', en: 'Checks steps 3 and 4.' } },
    ],
  },
};
