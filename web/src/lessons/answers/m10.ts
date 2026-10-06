// Module 10 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers10: Answers = {
  hta: {
    balance: {
      hint: { fr: r`Regardez le graphique : la chute maximale est la plus faible quand les deux demi-boucles portent à peu près la même charge.`, en: r`Look at the chart: the largest drop is smallest when both half-loops carry about the same load.` },
      answer: {
        fr: r`Avec le point d’ouverture au milieu (vers le tronçon 9 ou 10), chaque poste source alimente la moitié des postes HTA/BT. La chute croît comme le produit de la longueur par la charge : $$\Delta V \approx \frac{(R + X\tan\varphi)}{U^2}\sum_k L_k P_k \propto L^2$$ Couper la boucle en deux moitiés égales divise donc la chute maximale par environ 2 à 4. En exploitation, le point d’ouverture se déplace au fil des saisons et des travaux, par télécommande des interrupteurs.`,
        en: r`With the open point in the middle (around section 9 or 10), each primary substation feeds half the MV/LV substations. The drop grows like length times load: $$\Delta V \approx \frac{(R + X\tan\varphi)}{U^2}\sum_k L_k P_k \propto L^2$$ Cutting the loop into two equal halves therefore divides the largest drop by about 2 to 4. In operation the open point moves with the seasons and works, by remote-controlled switches.`,
      },
    },
    overhead: {
      hint: { fr: r`Choisissez le conducteur aérien.`, en: r`Choose the overhead conductor.` },
      answer: {
        fr: r`L’aérien 148 mm² a une résistance plus forte ($0{,}22$ contre $0{,}125\ \Omega$/km) et surtout une réactance trois fois plus grande ($0{,}35$ contre $0{,}11\ \Omega$/km) : $$\Delta V \propto r + x\tan\varphi$$ La chute double presque. Le rural aérien, avec de longs départs, est donc le plus contraint en tension ; l’urbain souterrain, court et chargé, plutôt en courant. Les réseaux aériens sont aussi les plus exposés aux défauts (vent, végétation) : beaucoup sont progressivement enfouis.`,
        en: r`The 148 mm² overhead conductor has higher resistance ($0.22$ against $0.125\ \Omega$/km) and above all three times the reactance ($0.35$ against $0.11\ \Omega$/km): $$\Delta V \propto r + x\tan\varphi$$ The drop nearly doubles. Long rural overhead feeders are therefore the most voltage-constrained; short, heavily loaded urban cables are rather current-constrained. Overhead networks are also the most exposed to faults (wind, vegetation): many are being put underground.`,
      },
    },
    fault: {
      hint: { fr: r`Conducteur souterrain, tronçon en défaut : 2.`, en: r`Underground conductor, faulty section: 2.` },
      answer: {
        fr: r`Le tronçon 2 est isolé par ses deux interrupteurs. Tous les postes HTA/BT entre lui et le point d’ouverture n’ont plus de chemin vers une source : ici 8 postes sont coupés. Le disjoncteur du départ a d’abord tout coupé ; la recherche du défaut, souvent automatisée (détecteurs de défaut, interrupteurs télécommandés), permet ensuite d’isoler le tronçon et de réalimenter en amont en quelques minutes.`,
        en: r`Section 2 is isolated by its two switches. Every MV/LV substation between it and the open point has lost its path to a source: 8 substations are cut off here. The feeder breaker first tripped everything; fault location, often automated (fault passage indicators, remote-controlled switches), then isolates the section and restores the upstream part within minutes.`,
      },
    },
    rescue: {
      hint: { fr: r`Choisissez « Fermer le point d’ouverture ».`, en: r`Choose “Close the open point”.` },
      answer: {
        fr: r`En fermant le point d’ouverture, le départ de B reprend les postes coupés : c’est le **secours** par la boucle. Ce départ porte alors bien plus que sa charge normale : $$I_{secours} \approx I_B + I_{repris}, \qquad \Delta V_{secours} \le 7{,}5\,\%$$ Le N-1 du réseau HTA repose sur ce principe : chaque demi-boucle doit pouvoir reprendre l’autre, ce qui fixe la section des câbles et la longueur des départs dès la conception.`,
        en: r`Closing the open point lets feeder B pick up the cut-off substations: this is **back-feeding** through the loop. That feeder then carries far more than its normal load: $$I_{backfeed} \approx I_B + I_{picked\ up}, \qquad \Delta V_{backfeed} \le 7.5\,\%$$ MV N-1 rests on this principle: each half-loop must be able to take over the other, which sets cable sizes and feeder lengths at the design stage.`,
      },
    },
    capacity: {
      hint: { fr: r`Montez la charge par pas, en surveillant la chute et le courant : la limite est entre 130 et 140 %.`, en: r`Raise the load in steps, watching drop and current: the limit is between 130 and 140 %.` },
      answer: {
        fr: r`Vers 140 %, le courant du premier tronçon atteint 400 A, la limite du câble. Au-delà, le secours n’est plus possible pour toute la boucle : il faut **délester** une partie des clients le temps de la réparation, ou **renforcer** (câble plus gros, nouveau départ, nouveau poste). $$I_{max} = \frac{P_{boucle}}{\sqrt3\,U\cos\varphi} \le I_{admissible}$$ La croissance de la charge consomme d’abord cette marge de secours, bien avant de poser problème en régime normal.`,
        en: r`Around 140 %, the first section’s current reaches 400 A, the cable’s limit. Beyond it the whole loop can no longer be back-fed: part of the customers must be **shed** during the repair, or the grid **reinforced** (larger cable, new feeder, new substation). $$I_{max} = \frac{P_{loop}}{\sqrt3\,U\cos\varphi} \le I_{rated}$$ Load growth eats into this back-feed margin first, long before it causes trouble in normal operation.`,
      },
    },
  },

  dvplan: {
    winter: {
      hint: { fr: r`Prise à vide du transformateur HTA/BT : +2,5 %.`, en: r`MV/LV transformer off-load tap: +2.5 %.` },
      answer: {
        fr: r`La prise à vide décale toute la BT vers le haut : $$V_{BT} = V_{HTA} + n_{BT} - \Delta V_{transfo} - \Delta V_{BT}$$ Avec +2,5 %, le dernier client remonte vers 92 % à la pointe. Mais cette prise ne se change que hors tension, par un agent sur place : elle est choisie une fois pour toutes, et relève aussi la tension aux heures creuses. C’est tout l’art du plan de tension : partager les ±10 % entre chute HTA, transformateur et chute BT.`,
        en: r`The off-load tap shifts the whole LV side up: $$V_{LV} = V_{MV} + n_{LV} - \Delta V_{transformer} - \Delta V_{LV}$$ With +2.5 %, the last customer comes back to about 92 % at the peak. But the tap can only be changed de-energised, by someone on site: it is set once and for all, and also raises the voltage off-peak. That is the whole art of the voltage plan: sharing the ±10 % between MV drop, transformer and LV drop.`,
      },
    },
    pv: {
      hint: { fr: r`PV à 10 MW ; regardez le dernier client vers 13 h.`, en: r`PV at 10 MW; look at the last customer around 1 pm.` },
      answer: {
        fr: r`À midi, le PV dépasse la consommation : le transit s’inverse et les chutes deviennent des **hausses**. $$\Delta V \approx \frac{R\,(P_L - P_{PV}) + X\,Q}{U^2} < 0$$ Le dernier client dépasse 110 % : ses onduleurs (et ceux de ses voisins) peuvent se découpler par protection, et ses appareils souffrent. La surtension, plus que la surcharge, limite souvent l’accueil du PV en distribution.`,
        en: r`At noon PV exceeds consumption: the flow reverses and drops turn into **rises**. $$\Delta V \approx \frac{R\,(P_L - P_{PV}) + X\,Q}{U^2} < 0$$ The last customer exceeds 110 %: their inverters (and their neighbours’) may disconnect on protection, and appliances suffer. Overvoltage, more than overload, often limits PV hosting in distribution.`,
      },
    },
    tan: {
      hint: { fr: r`Réactif des producteurs : tan φ = −0,35.`, en: r`Producers’ reactive power: tan φ = −0.35.` },
      answer: {
        fr: r`En absorbant $Q = -0{,}35\,P$, chaque producteur compense une partie de sa propre hausse : $$\Delta V_{PV} \approx -\frac{P_{PV}\,(R - 0{,}35\,X)}{U^2}$$ Avec $R \approx X$ en HTA, il n’en efface qu’environ un tiers, et rien du tout pour la hausse due au PV BT. L’absorption de réactif augmente aussi le courant et les pertes, et doit être fournie par le réseau amont. Les gestionnaires imposent ce type de loi aux producteurs raccordés en HTA (valeur indicative, à vérifier).`,
        en: r`By absorbing $Q = -0.35\,P$, each producer cancels part of its own rise: $$\Delta V_{PV} \approx -\frac{P_{PV}\,(R - 0.35\,X)}{U^2}$$ With $R \approx X$ in MV it removes only about a third of it, and nothing of the rise due to LV PV. Absorbing reactive power also raises current and losses, and must be supplied by the upstream grid. DSOs impose this kind of rule on MV-connected producers (indicative value, to be checked).`,
      },
    },
    ldc: {
      hint: { fr: r`Compoundage vers 3 %.`, en: r`Line-drop compensation around 3 %.` },
      answer: {
        fr: r`Le compoundage fait varier la consigne du poste source avec le transit : $$V_{PS} = V_c + k_c\,\frac{P_{net}}{P_{max}}$$ À la pointe du soir, la tension monte pour compenser les chutes ; à midi, le transit étant inversé, elle baisse et absorbe la hausse due au PV. Tous les clients restent dans la plage. Mais le poste source alimente plusieurs départs : un départ très producteur et un départ très consommateur voisins ne peuvent pas être satisfaits par une seule consigne. D’où les régleurs, voire les postes, dédiés aux producteurs.`,
        en: r`Line-drop compensation moves the substation setpoint with the flow: $$V_{PS} = V_c + k_c\,\frac{P_{net}}{P_{max}}$$ At the evening peak the voltage rises to offset the drops; at noon, with reverse flow, it falls and absorbs the rise due to PV. Every customer stays in range. But a primary substation feeds several feeders: a heavily producing and a heavily consuming feeder side by side cannot both be satisfied by one setpoint. Hence dedicated tap changers, or even substations, for producers.`,
      },
    },
    qu: {
      hint: { fr: r`Réactif des producteurs : Q(U), en gardant le compoundage.`, en: r`Producers’ reactive power: Q(U), keeping line-drop compensation.` },
      answer: {
        fr: r`Avec la loi Q(U), le producteur n’absorbe que lorsque la tension à son point de raccordement dépasse un seuil (ici 102 %), progressivement jusqu’à $\tan\varphi = -0{,}35$ à 104 % : $$Q = -0{,}35\,P\cdot\min\!\left(1, \max\!\left(0, \frac{V - 102}{2}\right)\right)$$ La plage est tenue, avec une énergie réactive absorbée plusieurs fois plus faible qu’avec un $\tan\varphi$ fixe : moins de pertes et moins de réactif à fournir par l’amont. C’est le sens des évolutions récentes des règles de raccordement.`,
        en: r`With the Q(U) rule, the producer absorbs only when the voltage at its connection point exceeds a threshold (here 102 %), progressively up to $\tan\varphi = -0.35$ at 104 %: $$Q = -0.35\,P\cdot\min\!\left(1, \max\!\left(0, \frac{V - 102}{2}\right)\right)$$ The range is held with several times less reactive energy absorbed than with a fixed $\tan\varphi$: fewer losses and less reactive power from upstream. That is where connection rules have been heading recently.`,
      },
    },
  },

  neutral: {
    isolated: {
      hint: { fr: r`Neutre isolé, longueur de câbles vers 200 km.`, en: r`Isolated neutral, cable length around 200 km.` },
      answer: {
        fr: r`Avec le neutre isolé, le seul chemin de retour du courant de défaut passe par les capacités phase-terre de tout le réseau : $$I_d = 3\omega C\,E \approx 3\ \text{A/km} \times L_c$$ Avec 200 km de câbles, cela dépasse 600 A : l’arc ne s’éteint plus seul et les surtensions de réamorçage deviennent dangereuses. Les phases saines montent à $\sqrt3\,E$. Le neutre isolé ne convient qu’à des réseaux peu étendus et peu câblés.`,
        en: r`With an isolated neutral, the fault current can only return through the whole network’s phase-to-earth capacitances: $$I_f = 3\omega C\,E \approx 3\ \text{A/km} \times L_c$$ With 200 km of cable this exceeds 600 A: the arc no longer goes out on its own and restrike overvoltages become dangerous. Healthy phases rise to $\sqrt3\,E$. An isolated neutral only suits small networks with little cable.`,
      },
    },
    select: {
      hint: { fr: r`Le seuil doit être au-dessus du courant capacitif du départ sain et en dessous du 3I0 du départ en défaut : essayez 150 A.`, en: r`The threshold must be above the healthy feeder’s capacitive current and below the faulty feeder’s 3I0: try 150 A.` },
      answer: {
        fr: r`Le départ sain voit son propre courant capacitif, ici environ 130 A ; le départ en défaut voit le courant du neutre et celui de tous les autres départs, plus de 600 A : $$3I_{0}^{sain} = 3\omega C_s\,V_N < I_{s0} < |V_N\,(Y_N + 3j\omega(C - C_d))| = 3I_0^{défaut}$$ Un seuil vers 150 A est sélectif. Mais plus le réseau est câblé, plus la marge se réduit : c’est pourquoi on limite le courant de neutre plus haut en réseau souterrain (de l’ordre de 1 000 A) qu’en aérien (de l’ordre de 300 A), ou qu’on passe au neutre compensé.`,
        en: r`The healthy feeder sees its own capacitive current, about 130 A here; the faulty feeder sees the neutral current plus that of all the other feeders, over 600 A: $$3I_{0}^{healthy} = 3\omega C_h\,V_N < I_{s0} < |V_N\,(Y_N + 3j\omega(C - C_f))| = 3I_0^{faulty}$$ A threshold around 150 A is selective. But the more cable, the narrower the margin: that is why the neutral current is limited higher on underground networks (about 1,000 A) than overhead (about 300 A), or a compensated neutral is used.`,
      },
    },
    resistive: {
      hint: { fr: r`Résistance du défaut : 500 Ω ou plus.`, en: r`Fault resistance: 500 Ω or more.` },
      answer: {
        fr: r`La résistance du défaut limite le courant bien en dessous du seuil : $$I_d \approx \frac{E}{R_d + \dots} \approx \frac{11\,500}{500} \approx 23\ \text{A}$$ Le défaut n’est pas vu, alors qu’un conducteur sous tension touche le sol : c’est un danger pour les personnes. Les GRD ajoutent des protections sensibles, très temporisées, qui détectent ces défauts résistants (de l’ordre de quelques ampères à quelques dizaines d’ampères), au prix d’une sélectivité plus délicate.`,
        en: r`The fault resistance limits the current well below the threshold: $$I_f \approx \frac{E}{R_f + \dots} \approx \frac{11\,500}{500} \approx 23\ \text{A}$$ The fault is not seen, while a live conductor is touching the ground: a danger to people. DSOs add sensitive, long-delayed relays that detect these high-resistance faults (a few amps to a few tens of amps), at the cost of trickier selectivity.`,
      },
    },
    petersen: {
      hint: { fr: r`Neutre compensé, désaccord proche de 0 %, défaut franc (1 Ω).`, en: r`Compensated neutral, detuning near 0 %, solid fault (1 Ω).` },
      answer: {
        fr: r`La bobine de Petersen est accordée sur la capacité du réseau : son courant inductif annule le courant capacitif. $$\frac{1}{\omega L} = 3\omega C \quad\Rightarrow\quad I_d \approx I_{pertes} \ll 3I_C$$ Il ne reste que la composante active (pertes de la bobine), quelques dizaines d’ampères : l’arc s’éteint souvent seul, et beaucoup de défauts fugitifs disparaissent sans coupure. Le neutre compensé se généralise sur les réseaux HTA très câblés (ordre de grandeur, à vérifier). La bobine doit suivre l’évolution du réseau : un désaccord de 20 % fait remonter le courant au-delà de 100 A.`,
        en: r`The Petersen coil is tuned to the network capacitance: its inductive current cancels the capacitive current. $$\frac{1}{\omega L} = 3\omega C \quad\Rightarrow\quad I_f \approx I_{losses} \ll 3I_C$$ Only the active component (coil losses) remains, a few tens of amps: the arc often goes out on its own, and many transient faults disappear without an interruption. Compensated neutrals are spreading on heavily cabled MV networks (order of magnitude, to be checked). The coil must follow changes in the network: 20 % detuning brings the current back above 100 A.`,
      },
    },
    wattmetric: {
      hint: { fr: r`Neutre compensé, protection wattmétrique.`, en: r`Compensated neutral, wattmetric relay.` },
      answer: {
        fr: r`En neutre compensé, le départ en défaut voit un 3I0 réduit (la bobine compense les capacités), parfois plus petit que celui d’un départ sain. Mais seul le départ en défaut porte la composante **active** qui va vers le défaut : $$P_0 = \Re\{3\,\underline V_0\,\underline I_0^*\} > 0 \ \text{(défaut)}, \qquad P_0 \approx 0 \ \text{(sain)}$$ La protection wattmétrique homopolaire (PWH) mesure cette puissance et ne déclenche que le bon départ. D’autres principes existent (détection de transitoires), car la composante active est faible.`,
        en: r`With a compensated neutral, the faulty feeder sees a reduced 3I0 (the coil compensates the capacitances), sometimes smaller than a healthy feeder’s. But only the faulty feeder carries the **active** component flowing towards the fault: $$P_0 = \Re\{3\,\underline V_0\,\underline I_0^*\} > 0 \ \text{(faulty)}, \qquad P_0 \approx 0 \ \text{(healthy)}$$ The wattmetric earth-fault relay measures this power and trips only the right feeder. Other principles exist (transient detection), since the active component is small.`,
      },
    },
  },

  protection: {
    setting: {
      hint: { fr: r`Entre $1{,}3 \times 250 = 325$ A et $0{,}8 \times$ le biphasé en bout de départ, environ 830 A.`, en: r`Between $1.3 \times 250 = 325$ A and $0.8 \times$ the end-of-feeder phase-to-phase fault, about 830 A.` },
      answer: {
        fr: r`La fenêtre de réglage est $$1{,}3\,I_{charge} \le I_s \le 0{,}8\,I_{cc,bi}^{fin} \quad\Rightarrow\quad 325\ \text{A} \le I_s \le 830\ \text{A}$$ Le biphasé en bout de départ est le plus petit défaut entre phases à éliminer ; la marge de 0,8 couvre les incertitudes (résistance de défaut, puissance de court-circuit amont variable). Sur un départ très long et peu puissant, cette fenêtre peut se fermer : on ajoute alors des disjoncteurs ou des interrupteurs à coupure automatique en réseau.`,
        en: r`The setting window is $$1.3\,I_{load} \le I_s \le 0.8\,I_{sc,ph-ph}^{end} \quad\Rightarrow\quad 325\ \text{A} \le I_s \le 830\ \text{A}$$ The end-of-feeder phase-to-phase fault is the smallest phase fault to clear; the 0.8 margin covers uncertainties (fault resistance, varying upstream short-circuit power). On a very long, weak feeder this window can close: circuit breakers or sectionalisers are then added along the feeder.`,
      },
    },
    end: {
      hint: { fr: r`Distance du défaut : 20 km, seuil dans la fenêtre.`, en: r`Fault distance: 20 km, threshold inside the window.` },
      answer: {
        fr: r`En bout de départ, le biphasé vaut environ 1 035 A : $$I_{bi}(20\ \text{km}) = \frac{\sqrt3}{2}\,\frac{U}{\sqrt3\,|Z_s + z\,d|} \approx 1\,035\ \text{A} > I_s$$ Le départ le voit et l’élimine seul. Si le seuil était trop haut, c’est la protection de l’arrivée du transformateur, plus lente, qui aurait coupé **tout le jeu de barres** : tous les départs du poste, pour un défaut sur un seul.`,
        en: r`At the end of the feeder the phase-to-phase fault is about 1,035 A: $$I_{ph-ph}(20\ \text{km}) = \frac{\sqrt3}{2}\,\frac{U}{\sqrt3\,|Z_s + z\,d|} \approx 1\,035\ \text{A} > I_s$$ The feeder sees it and clears it alone. Had the threshold been too high, the slower transformer incomer would have tripped **the whole busbar**: every feeder in the substation, for a fault on just one.`,
      },
    },
    grading: {
      hint: { fr: r`Temporisation du départ : 0,4 s au plus.`, en: r`Feeder delay: 0.4 s at most.` },
      answer: {
        fr: r`La sélectivité chronométrique impose $$t_d + \Delta t \le t_{arrivée} \quad\Rightarrow\quad t_d \le 0{,}7 - 0{,}3 = 0{,}4\ \text{s}$$ La marge couvre le temps d’ouverture du disjoncteur et les dispersions des relais. Toute la chaîne est ainsi étagée, du départ HTA jusqu’au réseau de transport : plus on remonte, plus on attend. Le revers : les défauts proches du poste, les plus violents, ne sont pas éliminés plus vite que les autres (d’où des seuils à temps très court pour les forts courants).`,
        en: r`Time grading requires $$t_d + \Delta t \le t_{incomer} \quad\Rightarrow\quad t_d \le 0.7 - 0.3 = 0.4\ \text{s}$$ The margin covers breaker opening time and relay tolerances. The whole chain is graded this way, from the MV feeder up to the transmission grid: the higher up, the longer the wait. The downside: faults close to the substation, the most violent ones, are not cleared any faster (hence instantaneous high-set stages for large currents).`,
      },
    },
    transient: {
      hint: { fr: r`Réenclencheur « Rapide + lent », défaut fugitif.`, en: r`Recloser “Rapid + slow”, transient fault.` },
      answer: {
        fr: r`Le départ déclenche, reste ouvert 0,3 s le temps que l’arc se désionise, puis se referme : le défaut a disparu. $$\text{coupure} \approx t_d + t_{ouverture} + 0{,}3\ \text{s} < 1\ \text{s}$$ Sur les réseaux aériens, la grande majorité des défauts sont fugitifs (amorçage par un oiseau, une branche, la foudre). Le réenclenchement rapide les élimine avec une simple « coupure brève », bien moins gênante qu’une coupure longue pour les clients et pour la qualité de fourniture mesurée par le régulateur.`,
        en: r`The feeder trips, stays open 0.3 s while the arc deionises, then recloses: the fault is gone. $$\text{interruption} \approx t_d + t_{opening} + 0.3\ \text{s} < 1\ \text{s}$$ On overhead networks the great majority of faults are transient (a bird, a branch, lightning). Rapid reclosing clears them with a mere “short interruption”, far less of a nuisance than a long outage for customers and for the supply-quality figures watched by the regulator.`,
      },
    },
    permanent: {
      hint: { fr: r`Défaut permanent, réenclencheur en service.`, en: r`Permanent fault, recloser on.` },
      answer: {
        fr: r`Le défaut est toujours là à chaque refermeture : déclenchement, réenclenchement rapide, déclenchement, réenclenchement lent (15 s), déclenchement définitif. $$\text{cycle} : \ \text{O} - 0{,}3\ \text{s} - \text{FO} - 15\ \text{s} - \text{FO}$$ Le départ est verrouillé ouvert. Commence alors la reprise : localiser le tronçon (indicateurs de passage de défaut), l’isoler par ses interrupteurs, refermer le départ en amont et secourir l’aval par la boucle (leçon 10.1). Les automatismes de reconfiguration le font en quelques minutes.`,
        en: r`The fault is still there at each reclosure: trip, rapid reclose, trip, slow reclose (15 s), final trip. $$\text{cycle}: \ \text{O} - 0.3\ \text{s} - \text{CO} - 15\ \text{s} - \text{CO}$$ The feeder is locked out. Restoration then starts: locate the section (fault passage indicators), isolate it with its switches, reclose the feeder upstream and back-feed downstream through the loop (lesson 10.1). Self-healing automation does it within minutes.`,
      },
    },
  },

  planning: {
    year: {
      hint: { fr: r`Cherchez où la courbe de pointe croise la capacité garantie : vers 9 à 10 ans.`, en: r`Find where the peak curve crosses the firm capacity: around 9 to 10 years.` },
      answer: {
        fr: r`La capacité garantie en N-1 est celle d’un seul transformateur, avec une surcharge temporaire admise : $$P_{N-1} = 36 \times 1{,}2 \times 0{,}95 \approx 41\ \text{MW}$$ Partant de 34 MW et +2 %/an, la pointe l’atteint vers 9,5 ans : $a = \ln(41/34)/\ln 1{,}02$. Au-delà, la perte d’un transformateur à la pointe d’hiver coupe des clients. Le planificateur doit agir **avant** : un nouveau transformateur demande plusieurs années (études, commandes, travaux).`,
        en: r`The N-1 firm capacity is that of a single transformer, with an allowed temporary overload: $$P_{N-1} = 36 \times 1.2 \times 0.95 \approx 41\ \text{MW}$$ Starting at 34 MW and +2 %/yr, the peak reaches it in about 9.5 years: $a = \ln(41/34)/\ln 1.02$. Beyond that, losing a transformer at the winter peak cuts customers off. The planner must act **before**: a new transformer takes several years (studies, orders, works).`,
      },
    },
    backup: {
      hint: { fr: r`Secours HTA : 5 MW.`, en: r`MV back-up: 5 MW.` },
      answer: {
        fr: r`Les départs HTA bouclés vers les postes voisins permettent de leur reporter une partie de la charge pendant l’avarie : $$P_{N-1} = 41 + 5 = 46\ \text{MW} \;\Rightarrow\; a \approx 15\ \text{ans}$$ C’est souvent la parade la moins chère : un bouclage, des interrupteurs télécommandés. Mais elle consomme la marge des postes voisins : la planification se fait à l’échelle d’une zone, pas d’un poste isolé.`,
        en: r`MV feeders looped to neighbouring substations let part of the load be transferred during the outage: $$P_{N-1} = 41 + 5 = 46\ \text{MW} \;\Rightarrow\; a \approx 15\ \text{years}$$ It is often the cheapest remedy: a loop, remote-controlled switches. But it uses up the neighbours’ margin: planning is done for a whole area, not one substation in isolation.`,
      },
    },
    flex: {
      hint: { fr: r`Sans secours, environ 3 MW de flexibilité.`, en: r`Without back-up, about 3 MW of flexibility.` },
      answer: {
        fr: r`Avec 3 MW d’effacement disponibles à la pointe, il faut attendre que la pointe dépasse $41 + 3 = 44$ MW : $$\Delta a = \frac{\ln(44/41)}{\ln 1{,}02} \approx 3{,}6\ \text{ans}$$ Les flexibilités locales (effacement de consommateurs, stockage, pilotage de la recharge des véhicules) sont achetées par le GRD par appels d’offres. Elles ne sont mobilisées que les quelques heures où le N-1 serait menacé, avec une avarie de transformateur en plus.`,
        en: r`With 3 MW of demand response available at the peak, one must wait until the peak exceeds $41 + 3 = 44$ MW: $$\Delta a = \frac{\ln(44/41)}{\ln 1.02} \approx 3.6\ \text{years}$$ Local flexibility (customer demand response, storage, managed EV charging) is bought by the DSO through tenders. It is only used for the few hours when N-1 would be at risk, and only if a transformer actually fails.`,
      },
    },
    econ: {
      hint: { fr: r`Baissez le prix : en dessous de 45 k€/MW/an environ, la valeur du report dépasse le coût.`, en: r`Lower the price: below about 45 k€/MW/yr, the value of deferral exceeds the cost.` },
      answer: {
        fr: r`Reporter de $\Delta a$ un investissement $C$ vaut $$V = C\left[(1+r)^{-a_0} - (1+r)^{-(a_0+\Delta a)}\right] \approx 400\ \text{k€}$$ pour 4 M€ reportés de 3,6 ans à 5 %. La flexibilité, payée chaque année, est rentable si son coût actualisé reste en dessous : vers 45 k€/MW/an ici. Ce calcul coût-bénéfice est ce que le GRD fait avant de lancer un appel d’offres de flexibilité, avec en plus le risque (et si la croissance accélérait ?).`,
        en: r`Deferring an investment $C$ by $\Delta a$ is worth $$V = C\left[(1+r)^{-a_0} - (1+r)^{-(a_0+\Delta a)}\right] \approx 400\ \text{k€}$$ for 4 M€ deferred by 3.6 years at 5 %. Flexibility, paid every year, pays off if its discounted cost stays below that: around 45 k€/MW/yr here. This cost-benefit test is what the DSO runs before launching a flexibility tender, plus the risk (what if growth sped up?).`,
      },
    },
    electrification: {
      hint: { fr: r`Croissance 4 %/an, flexibilité inchangée.`, en: r`Growth 4 %/yr, same flexibility.` },
      answer: {
        fr: r`Le même gisement de flexibilité ne fait plus gagner que $$\Delta a = \frac{\ln(44/41)}{\ln 1{,}04} \approx 1{,}8\ \text{an}$$ et la contrainte arrive dès 5 ans. Avec l’électrification des usages (pompes à chaleur, véhicules électriques), la flexibilité devient surtout un outil pour **gérer le délai** des renforcements et **piloter** les nouveaux usages (recharge hors pointe), pas pour les éviter.`,
        en: r`The same flexibility now only gains $$\Delta a = \frac{\ln(44/41)}{\ln 1.04} \approx 1.8\ \text{years}$$ and the constraint arrives within 5 years. With electrification (heat pumps, electric vehicles), flexibility becomes mainly a tool to **manage the lead time** of reinforcements and **steer** new uses (off-peak charging), not to avoid them.`,
      },
    },
  },
};
