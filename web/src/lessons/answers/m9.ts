// Module 9 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers9: Answers = {
  levels: {
    bulk: {
      hint: { fr: r`Essayez 400 kV. Si les pertes ou la chute dépassent encore la limite, doublez le nombre de circuits.`, en: r`Try 400 kV. If losses or the drop still exceed the limit, double the number of circuits.` },
      answer: {
        fr: r`À **400 kV avec 2 circuits** : $$I = \frac{P}{n\sqrt3\,U\cos\varphi} = \frac{1000}{2\sqrt3 \times 400 \times 0{,}95} \approx 760\ \text{A par circuit}$$ $$\frac{p_J}{P} = \frac{R\,P}{U^2\cos^2\varphi} = \frac{3 \times 1000}{400^2 \times 0{,}90} \approx 2{,}1\,\%, \qquad \frac{\Delta V}{V} \approx 8\,\%$$ Avec un seul circuit, les pertes doublent (4,2 %) et la chute dépasse 16 %. En 225 kV, il faudrait 2,7 kA : au-delà de la limite thermique. C’est pourquoi les grands transits (centrales, interconnexions) passent en 400 kV, presque toujours sur des lignes à **deux circuits**, ce qui permet aussi de tenir le N-1.`,
        en: r`At **400 kV with 2 circuits**: $$I = \frac{P}{n\sqrt3\,U\cos\varphi} = \frac{1000}{2\sqrt3 \times 400 \times 0.95} \approx 760\ \text{A per circuit}$$ $$\frac{p_J}{P} = \frac{R\,P}{U^2\cos^2\varphi} = \frac{3 \times 1000}{400^2 \times 0.90} \approx 2.1\,\%, \qquad \frac{\Delta V}{V} \approx 8\,\%$$ With a single circuit losses double (4.2 %) and the drop exceeds 16 %. At 225 kV it would take 2.7 kA: beyond the thermal rating. That is why bulk flows (power plants, interconnections) go at 400 kV, nearly always on **double-circuit** lines, which also helps hold N-1.`,
      },
    },
    square: {
      hint: { fr: r`Niveau 225 kV, 2 circuits, mêmes P et L. Comparez les pertes à celles du 400 kV.`, en: r`225 kV, 2 circuits, same P and L. Compare the losses with 400 kV.` },
      answer: {
        fr: r`Les pertes passent de 2,1 % à environ 13 %, soit un rapport de 6,3 : $$\frac{p_{225}}{p_{400}} = \left(\frac{400}{225}\right)^2 \times \frac{r_{225}}{r_{400}} = 3{,}2 \times 2$$ Le carré de la tension fait l’essentiel ; s’y ajoute que les lignes 225 kV ont des conducteurs plus petits. Monter en tension réduit les pertes au carré, mais coûte en isolement, en emprise et en postes : chaque niveau a son domaine (400 kV pour le grand transport, 225 kV pour la répartition régionale, 90 et 63 kV pour alimenter les postes sources).`,
        en: r`Losses go from 2.1 % to about 13 %, a ratio of 6.3: $$\frac{p_{225}}{p_{400}} = \left(\frac{400}{225}\right)^2 \times \frac{r_{225}}{r_{400}} = 3.2 \times 2$$ The square of the voltage does most of it; on top of that, 225 kV lines have smaller conductors. Raising the voltage cuts losses as a square, but costs insulation, right-of-way and substations: each level has its domain (400 kV for bulk transmission, 225 kV for regional transmission, 90 and 63 kV to feed primary substations).`,
      },
    },
    mv: {
      hint: { fr: r`Niveau 20 kV, environ 5 MW et 20 km. Regardez les deux termes de la chute de tension.`, en: r`20 kV, about 5 MW and 20 km. Look at the two terms of the voltage drop.` },
      answer: {
        fr: r`Pour 5 MW sur 20 km en 20 kV : $I \approx 150$ A, et $$\frac{\Delta V}{V} = \underbrace{\frac{R\,P}{U^2}}_{5\,\%} + \underbrace{\frac{X\,Q}{U^2}}_{2{,}9\,\%}, \qquad \frac{R}{X} \approx 0{,}6$$ En distribution, la résistance n’est plus négligeable : la **puissance active** fait varier la tension. Conséquence directe : une production locale (PV) qui injecte du $P$ fait **monter** la tension du départ, et l’absorption de réactif n’y remédie qu’en partie (Module 10). Les pertes (5,5 %) sont aussi bien plus élevées qu’en transport.`,
        en: r`For 5 MW over 20 km at 20 kV: $I \approx 150$ A, and $$\frac{\Delta V}{V} = \underbrace{\frac{R\,P}{U^2}}_{5\,\%} + \underbrace{\frac{X\,Q}{U^2}}_{2.9\,\%}, \qquad \frac{R}{X} \approx 0.6$$ In distribution, resistance is no longer negligible: **active power** moves the voltage. A direct consequence: local generation (PV) injecting $P$ **raises** the feeder voltage, and absorbing reactive power only partly helps (Module 10). Losses (5.5 %) are also much higher than in transmission.`,
      },
    },
    lv: {
      hint: { fr: r`Niveau 400 V, 0,1 MW. La chute vaut environ 15 % par kilomètre : visez un peu plus de 500 m.`, en: r`400 V, 0.1 MW. The drop is about 15 % per kilometre: aim for a little over 500 m.` },
      answer: {
        fr: r`En 400 V, 100 kW font 150 A, et la chute vaut $$\frac{\Delta V}{V} \approx \frac{(r + x\tan\varphi)\,L\,P}{U^2} \approx 15\,\%/\text{km}$$ soit 8 % vers 540 m. Ici $R/X \approx 2{,}6$ : la chute est presque entièrement due à $P$. C’est pourquoi un départ BT dépasse rarement quelques centaines de mètres et pourquoi il y a des centaines de milliers de postes HTA/BT. La norme EN 50160 laisse ±10 % chez le client : le GRD répartit ce budget entre HTA, transformateur et BT (leçon 10.2).`,
        en: r`At 400 V, 100 kW means 150 A, and the drop is $$\frac{\Delta V}{V} \approx \frac{(r + x\tan\varphi)\,L\,P}{U^2} \approx 15\,\%/\text{km}$$ so 8 % at about 540 m. Here $R/X \approx 2.6$: the drop is almost entirely due to $P$. That is why an LV feeder rarely exceeds a few hundred metres, and why there are hundreds of thousands of MV/LV substations. EN 50160 allows ±10 % at the customer: the DSO shares that budget between MV, transformer and LV (lesson 10.2).`,
      },
    },
  },

  balancing: {
    predict: {
      hint: { fr: r`Trois temps : la chute (inertie), l’arrêt de la chute (réglage primaire), le retour à 50 Hz (réglage secondaire).`, en: r`Three phases: the fall (inertia), the fall stopped (primary control), the return to 50 Hz (secondary control).` },
      answer: {
        fr: r`La fréquence tombe d’abord, freinée par l’inertie de toute l’Europe, jusqu’à un creux vers 49,92 Hz. Le réglage primaire (FCR) de **tous** les pays l’arrête, et la laisse à un écart quasi stationnaire $$\Delta f \approx -\frac{\Delta P}{\lambda} = -\frac{1000}{18\,600} \approx -54\ \text{mHz}$$ Puis le réglage secondaire **français** (aFRR) monte en quelques minutes et ramène 50 Hz ; enfin l’ajustement (mFRR) le relaie. Sur un réseau aussi grand que l’Europe continentale, 1 000 MW sont un incident courant : la fréquence bouge à peine.`,
        en: r`The frequency first falls, slowed by the inertia of all of Europe, to a nadir near 49.92 Hz. The primary control (FCR) of **every** country stops it, leaving a quasi-steady deviation $$\Delta f \approx -\frac{\Delta P}{\lambda} = -\frac{1000}{18\,600} \approx -54\ \text{mHz}$$ Then **France’s** secondary control (aFRR) ramps up over a few minutes and brings back 50 Hz; finally balancing energy (mFRR) takes over. On a grid as large as continental Europe, 1,000 MW is a routine incident: the frequency barely moves.`,
      },
    },
    nosec: {
      hint: { fr: r`Réglage secondaire hors service, incident en France. Regardez l’écart d’échanges.`, en: r`Secondary control off, incident in France. Look at the interchange deviation.` },
      answer: {
        fr: r`Sans secondaire, la fréquence reste à −50 mHz environ et la France **importe** environ 800 MW : c’est la réserve primaire et l’autoréglage de ses voisins. $$\Delta P_{ech} \approx -\Delta P\,\frac{\lambda_{voisins}}{\lambda} \approx -1000 \times \frac{15\,000}{18\,600}$$ C’est la **solidarité** du réseau interconnecté, mais elle n’est que provisoire : elle mobilise les réserves des autres et dévie les flux prévus sur les interconnexions. D’où l’obligation, pour chaque zone, de résorber son propre déséquilibre.`,
        en: r`Without secondary control, the frequency stays about −50 mHz low and France **imports** about 800 MW: the primary reserve and self-regulation of its neighbours. $$\Delta P_{ex} \approx -\Delta P\,\frac{\lambda_{neighbours}}{\lambda} \approx -1000 \times \frac{15\,000}{18\,600}$$ This is the **solidarity** of an interconnected grid, but it is only temporary: it uses the others’ reserves and diverts the scheduled flows on interconnectors. Hence each area’s obligation to remove its own imbalance.`,
      },
    },
    abroad: {
      hint: { fr: r`Secondaire en service, incident chez un voisin. Observez l’aFRR français.`, en: r`Secondary control on, incident abroad. Watch France’s aFRR.` },
      answer: {
        fr: r`La France fournit sa part de réserve primaire : elle **exporte** un peu plus. Mais son écart de réglage de zone reste nul : $$\text{ACE}_{FR} = \Delta P_{ech} + \lambda_{FR}\,\Delta f \approx (-\lambda_{FR}\,\Delta f) + \lambda_{FR}\,\Delta f = 0$$ Le secondaire français ne bouge pas ; c’est celui du pays en déficit qui corrige. Ce **principe de non-intervention** évite que toutes les zones se battent pour la même correction. Le coefficient $\lambda_{FR}$ (le « K » de la zone) doit donc refléter sa vraie contribution primaire.`,
        en: r`France supplies its share of primary reserve: it **exports** a little more. But its area control error stays at zero: $$\text{ACE}_{FR} = \Delta P_{ex} + \lambda_{FR}\,\Delta f \approx (-\lambda_{FR}\,\Delta f) + \lambda_{FR}\,\Delta f = 0$$ France’s secondary control does not move; the country in deficit corrects. This **non-intervention principle** stops every area from fighting over the same correction. The coefficient $\lambda_{FR}$ (the area’s “K”) must therefore reflect its true primary contribution.`,
      },
    },
    reference: {
      hint: { fr: r`Incident en France, 3 000 MW.`, en: r`Incident in France, 3,000 MW.` },
      answer: {
        fr: r`Le creux descend vers 49,77 Hz et l’écart quasi stationnaire reste près de −0,11 à −0,16 Hz : $$\Delta f_{qs} \approx -\frac{3000}{18\,600} \approx -0{,}16\ \text{Hz} > -0{,}2\ \text{Hz}$$ L’Europe continentale est dimensionnée pour cet **incident de référence** (perte de deux grosses tranches nucléaires) : 3 000 MW de FCR, entièrement mobilisés à 200 mHz en 30 s. Le creux dynamique doit rester au-dessus de 49,2 Hz, bien avant le premier seuil de délestage (49 Hz, leçon 9.5).`,
        en: r`The nadir goes down to about 49.77 Hz and the quasi-steady deviation stays near −0.11 to −0.16 Hz: $$\Delta f_{qs} \approx -\frac{3000}{18\,600} \approx -0.16\ \text{Hz} > -0.2\ \text{Hz}$$ Continental Europe is sized for this **reference incident** (losing two large nuclear units): 3,000 MW of FCR, fully deployed at 200 mHz within 30 s. The dynamic nadir must stay above 49.2 Hz, well clear of the first shedding threshold (49 Hz, lesson 9.5).`,
      },
    },
    release: {
      hint: { fr: r`Délai de l’mFRR à 2 minutes ou moins, 1 000 MW en France.`, en: r`mFRR delay of 2 minutes or less, 1,000 MW in France.` },
      answer: {
        fr: r`L’mFRR (en France, le **mécanisme d’ajustement**) remplace progressivement l’aFRR : $$\text{aFRR} + \text{mFRR} \approx \Delta P \quad\Rightarrow\quad \text{aFRR} \to 0$$ Le réglage secondaire est une réserve chère et limitée (en France, au moins 500 MW, selon l’heure et la saison) : il faut le **reconstituer** au plus vite, pour être prêt à l’incident suivant. Dans l’ordre : FCR (secondes), aFRR (minutes), mFRR (un quart d’heure), puis le marché reprend la main pour les heures suivantes.`,
        en: r`mFRR (in France, the **balancing mechanism**) gradually replaces aFRR: $$\text{aFRR} + \text{mFRR} \approx \Delta P \quad\Rightarrow\quad \text{aFRR} \to 0$$ Secondary control is an expensive and limited reserve (in France, at least 500 MW, depending on the hour and season): it must be **rebuilt** quickly, ready for the next incident. In order: FCR (seconds), aFRR (minutes), mFRR (a quarter of an hour), then the market takes over for the following hours.`,
      },
    },
  },

  n1: {
    find: {
      hint: { fr: r`Regardez la courbe rouge sur la journée : la pointe du soir est vers 19 h.`, en: r`Look at the red curve over the day: the evening peak is around 7 pm.` },
      answer: {
        fr: r`Vers 19 h, toutes les lignes sont sous 100 % en N, mais si **L3** déclenche, **L4** monte à environ 110 % : $$\max_{c}\ \frac{|F_{L4}^{(c)}|}{F_{L4}^{max}} > 100\,\%$$ Le réseau n’est pas « sûr » au sens du N-1. Le GRT fait ce calcul la veille pour le lendemain, puis en temps réel, et prépare des **parades** : préventives (appliquées avant l’incident) ou curatives (prêtes à être appliquées en quelques minutes après).`,
        en: r`Around 7 pm every line is below 100 % in N, but if **L3** trips, **L4** rises to about 110 %: $$\max_{c}\ \frac{|F_{L4}^{(c)}|}{F_{L4}^{max}} > 100\,\%$$ The grid is not “secure” in the N-1 sense. The TSO runs this computation the day before, then in real time, and prepares **remedial actions**: preventive (applied before the incident) or curative (ready to apply within minutes after).`,
      },
    },
    redispatch: {
      hint: { fr: r`Environ 300 MW à l’Industrie.`, en: r`About 300 MW at Industrie.` },
      answer: {
        fr: r`Avec 300 MW produits sur place, l’Industrie importe moins par L4 et la contrainte disparaît. Mais il faut payer le producteur appelé, et réduire ailleurs (ici l’import) : $$\text{coût} \approx 300\ \text{MW} \times 6\ \text{h} \times 60\ \text{€/MWh} \approx 100\ \text{k€ par jour}$$ Le redispatching marche presque toujours, mais il coûte : en France il passe par le mécanisme d’ajustement, et ces coûts de congestion se chiffrent en dizaines à centaines de millions d’euros par an selon les années (ordre de grandeur).`,
        en: r`With 300 MW produced locally, Industrie imports less over L4 and the constraint goes away. But the plant called must be paid, and output reduced elsewhere (here the import): $$\text{cost} \approx 300\ \text{MW} \times 6\ \text{h} \times 60\ \text{€/MWh} \approx 100\ \text{k€ per day}$$ Redispatch nearly always works, but it costs: in France it goes through the balancing mechanism, and congestion costs run to tens or hundreds of millions of euros a year depending on the year (order of magnitude).`,
      },
    },
    pst: {
      hint: { fr: r`Un angle négatif d’une dizaine de degrés.`, en: r`A negative angle of about ten degrees.` },
      answer: {
        fr: r`Vers $\alpha \approx -12°$, le déphaseur repousse environ 700 MW d’équivalent vers les autres chemins (60 MW par degré ici) et L4 reste sous sa limite même si L3 déclenche. $$F_{L4} \approx F_{L4}^{(0)} + \text{PTDF}\cdot \alpha\,k$$ Une fois installé, un déphaseur ne coûte presque rien à manœuvrer : c’est une parade de choix. Mais sa plage est limitée, et il ne fait que **déplacer** le problème : il faut vérifier que les autres lignes encaissent le report.`,
        en: r`Around $\alpha \approx -12°$ the phase shifter pushes the equivalent of about 700 MW onto the other paths (60 MW per degree here) and L4 stays within its rating even if L3 trips. $$F_{L4} \approx F_{L4}^{(0)} + \text{PTDF}\cdot \alpha\,k$$ Once installed, a phase shifter costs next to nothing to operate: a remedy of choice. But its range is limited, and it only **moves** the problem: the other lines must be checked to absorb the shift.`,
      },
    },
    topology: {
      hint: { fr: r`Comparez « Fermer L8 » et « Ouvrir L5 ».`, en: r`Compare “Close L8” and “Open L5”.` },
      answer: {
        fr: r`**Fermer L8** ajoute un second chemin Interco–Ville B : l’import se répartit mieux et L4 reste sous 100 %. **Ouvrir L5** oblige Ville A à être alimentée par L1 et L3 seules : c’est pire. Les manœuvres topologiques sont gratuites et rapides, mais elles ont des effets non intuitifs et des contreparties : L8 est ouverte en temps normal parce qu’elle **augmente le courant de court-circuit** du poste. Les GRT recherchent ces parades par calcul (optimisation de topologie), pas à l’intuition.`,
        en: r`**Closing L8** adds a second Interco–Ville B path: the import spreads better and L4 stays under 100 %. **Opening L5** leaves Ville A fed by L1 and L3 alone: it is worse. Switching actions are free and quick, but they have non-intuitive effects and trade-offs: L8 is normally open because it **raises the short-circuit current** in the substation. TSOs search for these remedies by computation (topology optimisation), not by intuition.`,
      },
    },
    cold: {
      hint: { fr: r`Fermez L8, réglez le déphaseur vers −12°, puis ajoutez le redispatching qui manque.`, en: r`Close L8, set the phase shifter near −12°, then add the missing redispatch.` },
      answer: {
        fr: r`Avec 10 % de consommation en plus, la pire charge N-1 dépasse 130 %. Aucune parade seule n’y suffit ; en combinant la topologie, le déphaseur et quelques centaines de MW de redispatching, on retrouve un réseau sûr. On commence par les parades **gratuites** et on complète par la moins chère des parades payantes : $$\min\ \text{coût} \quad \text{sous} \quad \max_{h,c,\ell} \frac{|F_\ell^{(c)}(h)|}{F_\ell^{max}} \le 1$$ C’est un problème d’optimisation (OPF sous contraintes de sécurité). Si même la combinaison échoue, il reste la limitation de consommation, et à long terme le **renforcement** du réseau (leçon 9.6).`,
        en: r`With 10 % more demand the worst N-1 loading exceeds 130 %. No single remedy is enough; by combining topology, the phase shifter and a few hundred MW of redispatch, the grid is secure again. Start with the **free** remedies and top up with the cheapest paid one: $$\min\ \text{cost} \quad \text{s.t.} \quad \max_{h,c,\ell} \frac{|F_\ell^{(c)}(h)|}{F_\ell^{max}} \le 1$$ This is an optimisation problem (security-constrained OPF). If even the combination fails, demand curtailment remains, and in the long run grid **reinforcement** (lesson 9.6).`,
      },
    },
  },

  vplan: {
    primary: {
      hint: { fr: r`Réglage secondaire hors service ; amenez le curseur de temps vers 19 h.`, en: r`Secondary control off; bring the time cursor to about 7 pm.` },
      answer: {
        fr: r`À la pointe, la zone consomme environ 500 Mvar de plus que ses lignes n’en produisent. Chaque groupe tient la tension **à ses bornes**, mais le nœud pilote, plus loin, descend vers 397 kV : $$\Delta V_p \approx \frac{V}{S_{cc}}\,\Delta Q$$ La nuit, c’est l’inverse : les lignes peu chargées produisent du réactif et la tension monte. Le groupe le plus proche de la charge fournit l’essentiel : ses réserves s’épuisent en premier.`,
        en: r`At the peak the zone absorbs about 500 Mvar more than its lines produce. Each generator holds the voltage **at its own terminals**, but the pilot node, further away, falls towards 397 kV: $$\Delta V_p \approx \frac{V}{S_{sc}}\,\Delta Q$$ At night it is the reverse: lightly loaded lines produce reactive power and the voltage rises. The generator nearest the load supplies most of it: its reserve runs out first.`,
      },
    },
    secondary: {
      hint: { fr: r`Réglage secondaire en service, sans condensateurs.`, en: r`Secondary control on, no capacitors.` },
      answer: {
        fr: r`Le réglage secondaire de tension mesure le nœud pilote et calcule un **niveau** commun $N$, envoyé à tous les groupes de la zone : $$\dot N \propto V_c - V_p, \qquad Q_i = N\,Q_{r,i}$$ La tension pilote reste à sa consigne et les groupes sont **alignés** (même fraction de leur capacité). Mais à la pointe, $N$ atteint 1 : il n’y a plus de réserve et la tension décroche malgré tout. Cette réserve réactive est justement ce qui protège contre l’effondrement de tension (leçon 8.3).`,
        en: r`Secondary voltage control measures the pilot node and computes a common **level** $N$, sent to every generator in the zone: $$\dot N \propto V_c - V_p, \qquad Q_i = N\,Q_{r,i}$$ The pilot voltage stays at its setpoint and the generators are **aligned** (the same fraction of their capability). But at the peak $N$ reaches 1: there is no reserve left and the voltage drops anyway. That reactive reserve is exactly what protects against voltage collapse (lesson 8.3).`,
      },
    },
    caps: {
      hint: { fr: r`Environ 300 Mvar de condensateurs.`, en: r`About 300 Mvar of capacitors.` },
      answer: {
        fr: r`Avec 300 Mvar de condensateurs enclenchés pour la pointe, le niveau maximal retombe vers 0,5 : les groupes gardent la moitié de leur capacité pour un incident. $$N = \frac{s_{pp}\,(Q_d - Q_C)}{s_{p1}\,Q_{r,1} + s_{p2}\,Q_{r,2}}$$ où les $s$ sont les sensibilités de la tension pilote : les groupes, plus loin du nœud pilote que la charge, doivent fournir davantage que le déficit lui-même. À l’enclenchement, la tension saute de plusieurs kV, puis le réglage secondaire la ramène en quelques minutes. Les **moyens statiques** (condensateurs, inductances) servent le gros du besoin prévisible ; les groupes et le réglage secondaire, la partie variable et les incidents.`,
        en: r`With 300 Mvar of capacitors switched in for the peak, the highest level falls to about 0.5: the generators keep half their capability for an incident. $$N = \frac{s_{pp}\,(Q_d - Q_C)}{s_{p1}\,Q_{r,1} + s_{p2}\,Q_{r,2}}$$ where the $s$ are the pilot voltage’s sensitivities: the generators, further from the pilot node than the load, must supply more than the deficit itself. At switching the voltage jumps by several kV, then secondary control brings it back within minutes. **Static devices** (capacitors, reactors) cover the bulk of the predictable need; the generators and secondary control, the variable part and incidents.`,
      },
    },
    over: {
      hint: { fr: r`Condensateurs à 550 Mvar ou plus.`, en: r`Capacitors at 550 Mvar or more.` },
      answer: {
        fr: r`Les condensateurs restent enclenchés jusqu’à 22 h alors que la charge baisse dès 20 h : la zone a trop de réactif et les groupes doivent en **absorber** jusqu’à leur limite ($N = -1$). $$Q_C > Q_d(t) + Q_{r,1} + Q_{r,2} \;\Rightarrow\; V_p \nearrow$$ Un moyen fixe ne suit pas le besoin : il faut des gradins manœuvrés au bon moment, ou des moyens réglables (compensateurs statiques, leçon 4.10). Avec de plus en plus de câbles souterrains, qui produisent du réactif, les GRT installent surtout des **inductances**.`,
        en: r`The capacitors stay in until 10 pm while load falls from 8 pm: the zone has too much reactive power and the generators must **absorb** up to their limit ($N = -1$). $$Q_C > Q_d(t) + Q_{r,1} + Q_{r,2} \;\Rightarrow\; V_p \nearrow$$ A fixed device does not follow the need: banks must be switched in steps at the right time, or adjustable devices used (static compensators, lesson 4.10). With more and more underground cables, which produce reactive power, TSOs mostly install **reactors**.`,
      },
    },
    tertiary: {
      hint: { fr: r`Consigne 410 kV, condensateurs vers 300 Mvar.`, en: r`Setpoint 410 kV, capacitors around 300 Mvar.` },
      answer: {
        fr: r`À 410 kV au lieu de 405 kV, les pertes Joule baissent d’environ 2,4 % : $$\frac{p_J(410)}{p_J(405)} = \left(\frac{405}{410}\right)^2 \approx 0{,}976$$ Mais tenir une tension plus haute demande plus de réactif : le niveau maximal monte vers 0,9. Le **réglage tertiaire** est ce compromis, fait par le dispatcher toutes les quinzaines de minutes environ : le plus haut possible pour les pertes et la stabilité, sans épuiser la réserve ni dépasser 420 kV.`,
        en: r`At 410 kV instead of 405 kV, Joule losses fall by about 2.4 %: $$\frac{p_J(410)}{p_J(405)} = \left(\frac{405}{410}\right)^2 \approx 0.976$$ But holding a higher voltage takes more reactive power: the highest level rises to about 0.9. **Tertiary control** is this trade-off, made by the dispatcher every quarter of an hour or so: as high as possible for losses and stability, without using up the reserve or exceeding 420 kV.`,
      },
    },
  },

  defence: {
    predict: {
      hint: { fr: r`La réserve ne couvre qu’un tiers du déficit. Que se passe-t-il au passage de 49 Hz, puis de 48,8 Hz ?`, en: r`The reserve covers only a third of the deficit. What happens as the frequency crosses 49 Hz, then 48.8 Hz?` },
      answer: {
        fr: r`La fréquence plonge d’abord à près d’1 Hz/s : $$\frac{df}{dt} = -\frac{\Delta P}{2H}\,f_0 = -\frac{0{,}15}{8} \times 50 \approx -0{,}94\ \text{Hz/s}$$ À 49 Hz, puis 48,8 Hz, deux échelons retirent chacun 7,5 % de la charge : le déficit est couvert, la fréquence remonte après un creux vers 48,75 Hz, et la réserve primaire la ramène près de 50 Hz. Le délestage sacrifie 15 % des clients pour sauver les 85 % restants.`,
        en: r`The frequency first dives at nearly 1 Hz/s: $$\frac{df}{dt} = -\frac{\Delta P}{2H}\,f_0 = -\frac{0.15}{8} \times 50 \approx -0.94\ \text{Hz/s}$$ At 49 Hz, then 48.8 Hz, two stages each remove 7.5 % of the load: the deficit is covered, the frequency recovers after a nadir near 48.75 Hz, and primary reserve brings it back near 50 Hz. Shedding sacrifices 15 % of customers to save the other 85 %.`,
      },
    },
    none: {
      hint: { fr: r`Échelons à 0 %.`, en: r`Stages at 0 %.` },
      answer: {
        fr: r`Sans délestage, seuls la réserve (5 %) et l’autoréglage de la charge freinent la chute : $$\Delta f_\infty \approx -\frac{\Delta P - R}{D}\,f_0 \ll -2{,}5\ \text{Hz}$$ La fréquence passe sous 47,5 Hz, les groupes se découplent pour se protéger et la zone s’éteint. C’est le scénario des grandes pannes : la séparation du réseau européen de 2006 a été contenue grâce au délestage automatique de 17 GW de consommation (et 1,6 GW de pompage) dans la zone ouest (rapport final de l’UCTE).`,
        en: r`Without shedding, only the reserve (5 %) and load self-regulation slow the fall: $$\Delta f_\infty \approx -\frac{\Delta P - R}{D}\,f_0 \ll -2.5\ \text{Hz}$$ The frequency drops below 47.5 Hz, the generators disconnect to protect themselves and the area goes dark. This is the large-blackout scenario: the 2006 split of the European grid was contained thanks to the automatic shedding of 17 GW of load (and 1.6 GW of pumping) in the western area (UCTE final report).`,
      },
    },
    over: {
      hint: { fr: r`Déficit 10 %, échelons de 15 %.`, en: r`10 % deficit, 15 % stages.` },
      answer: {
        fr: r`Un seul échelon retire 15 % de charge pour un déficit de 10 % : la zone se retrouve avec 5 % de production **en trop** et la fréquence dépasse 51 Hz. $$\Delta P_{apres} = \delta - \Delta P = +5\,\%$$ Au-delà de 51,5 Hz, des groupes pourraient se découpler à leur tour. Les échelons sont donc **fins** (le code européen les limite à 10 % chacun) et nombreux, et les producteurs doivent réduire leur puissance en surfréquence (mode LFSM-O des codes de réseau).`,
        en: r`A single stage removes 15 % of load for a 10 % deficit: the area ends up with 5 % **too much** generation and the frequency goes above 51 Hz. $$\Delta P_{after} = \delta - \Delta P = +5\,\%$$ Above 51.5 Hz, generators could disconnect in turn. Stages are therefore **small** (the European code caps each at 10 %) and numerous, and generators must cut their output at over-frequency (the LFSM-O mode of grid codes).`,
      },
    },
    big: {
      hint: { fr: r`Déficit 30 %, échelons de 7,5 %.`, en: r`30 % deficit, 7.5 % stages.` },
      answer: {
        fr: r`Avec des échelons de 7,5 %, quatre échelons partent (30 %) et la fréquence se stabilise après un creux vers 48,35 Hz. $$\sum_{k=1}^{4} \delta = 30\,\% \approx \Delta P$$ Le plan européen prévoit de délester de l’ordre de 45 % de la charge entre 49 et 48 Hz : il couvre de très gros déficits, à condition que la chute ne soit pas trop rapide.`,
        en: r`With 7.5 % stages, four stages trip (30 %) and the frequency settles after a nadir near 48.35 Hz. $$\sum_{k=1}^{4} \delta = 30\,\% \approx \Delta P$$ The European plan sheds about 45 % of load between 49 and 48 Hz: it covers very large deficits, provided the fall is not too fast.`,
      },
    },
    inertia: {
      hint: { fr: r`Inertie 1,5 s, déficit 25 % : essayez des échelons de 5 %.`, en: r`Inertia 1.5 s, 25 % deficit: try 5 % stages.` },
      answer: {
        fr: r`Avec $H = 1{,}5$ s, la fréquence tombe à plus de 4 Hz/s. Pendant les 150 ms que le code européen laisse au relais et au disjoncteur, elle perd encore 0,6 Hz : plusieurs seuils sont franchis avant que le premier échelon n’agisse, et trop de charge part. $$\Delta f_{retard} \approx \frac{df}{dt}\,t_{relais} = 4{,}2 \times 0{,}15 \approx 0{,}6\ \text{Hz}$$ Des échelons plus fins (5 %) corrigent ici. Plus largement, la baisse de l’inertie (plus d’onduleurs, moins de machines tournantes) pousse à revoir les plans de défense : relais sur la dérivée de fréquence, inertie synthétique, réserves très rapides (leçons 7.2, 7.5, 8.4).`,
        en: r`With $H = 1.5$ s the frequency falls at over 4 Hz/s. During the 150 ms the European code allows the relay and breaker, it loses another 0.6 Hz: several thresholds are crossed before the first stage acts, and too much load goes. $$\Delta f_{delay} \approx \frac{df}{dt}\,t_{relay} = 4.2 \times 0.15 \approx 0.6\ \text{Hz}$$ Smaller stages (5 %) fix it here. More broadly, falling inertia (more inverters, fewer spinning machines) is pushing a rethink of defence plans: RoCoF relays, synthetic inertia, very fast reserves (lessons 7.2, 7.5, 8.4).`,
      },
    },
  },

  connect: {
    weak: {
      hint: { fr: r`Poste C, éolien. Montez la puissance jusqu’à ce qu’un critère devienne rouge.`, en: r`Substation C, wind. Raise the power until a criterion turns red.` },
      answer: {
        fr: r`Au poste C, la limite est de **200 MW**, fixée par la force du réseau, pas par la capacité (250 MW) : $$\text{SCR} = \frac{S_{cc}}{P} = \frac{600}{200} = 3$$ Au-delà, un onduleur standard risque l’instabilité (leçon 8.5). Le porteur de projet peut réduire sa puissance, demander une étude détaillée (EMT) avec des onduleurs adaptés, voire formeurs de réseau (leçon 7.2), ou viser un poste plus fort.`,
        en: r`At substation C the limit is **200 MW**, set by grid strength, not capacity (250 MW): $$\text{SCR} = \frac{S_{sc}}{P} = \frac{600}{200} = 3$$ Beyond it, a standard inverter risks instability (lesson 8.5). The developer can reduce the size, ask for a detailed (EMT) study with suitable inverters, even grid-forming ones (lesson 7.2), or aim for a stronger substation.`,
      },
    },
    stronger: {
      hint: { fr: r`Essayez le poste B en 225 kV.`, en: r`Try substation B at 225 kV.` },
      answer: {
        fr: r`Au poste B (225 kV), le SCR vaut $8000/400 = 20$ : le réseau est fort, et c’est la **capacité d’accueil** N-1 (400 MW) qui limite. Le poste A (400 kV) accepterait aussi, avec un raccordement plus coûteux (transformateur 400 kV, cellules). L’étude de raccordement compare ces solutions : coût et délai du raccordement, renforcements nécessaires, et partage de ces coûts selon les règles en vigueur (en France, les schémas régionaux de raccordement, S3REnR, pour les énergies renouvelables).`,
        en: r`At substation B (225 kV) the SCR is $8000/400 = 20$: the grid is strong, and the N-1 **hosting capacity** (400 MW) is what binds. Substation A (400 kV) would also accept, with a more expensive connection (400 kV transformer, bays). The connection study compares these options: connection cost and lead time, reinforcements needed, and how those costs are shared under the rules in force (in France, the regional renewable connection schemes, S3REnR).`,
      },
    },
    sync: {
      hint: { fr: r`Poste A, centrale synchrone, 1 000 MW. Regardez le courant de court-circuit.`, en: r`Substation A, synchronous plant, 1,000 MW. Look at the short-circuit current.` },
      answer: {
        fr: r`La centrale apporte au défaut : $$\Delta I_{cc} \approx \frac{S}{\sqrt3\,U\,(X''_d + X_t)} = \frac{1111}{\sqrt3 \times 400 \times 0{,}35} \approx 4{,}6\ \text{kA}$$ Le poste, déjà à 59,5 kA, passerait à 64 kA, au-delà des 63 kA que ses disjoncteurs savent couper. Solutions : remplacer l’appareillage (cher, long), exploiter le poste en deux sous-ensembles (couplage ouvert), ou ajouter des réactances de limitation. Le courant de court-circuit est une contrainte majeure dans les zones denses du réseau de transport.`,
        en: r`The plant feeds into a fault: $$\Delta I_{sc} \approx \frac{S}{\sqrt3\,U\,(X''_d + X_t)} = \frac{1111}{\sqrt3 \times 400 \times 0.35} \approx 4.6\ \text{kA}$$ The substation, already at 59.5 kA, would reach 64 kA, beyond the 63 kA its breakers can interrupt. Remedies: replace the switchgear (expensive, slow), run the substation as two split sections (open bus coupler), or add current-limiting reactors. Short-circuit current is a major constraint in dense parts of the transmission grid.`,
      },
    },
    ibr: {
      hint: { fr: r`Poste A, éolien/PV, 1 000 MW.`, en: r`Substation A, wind/PV, 1,000 MW.` },
      answer: {
        fr: r`Un onduleur limite son courant à environ 1,1 fois son nominal : $$\Delta I_{cc} \approx 1{,}1\,\frac{S}{\sqrt3\,U} \approx 1{,}8\ \text{kA}$$ et le poste reste sous 63 kA. Le revers de la médaille : avec moins de machines synchrones, les courants de court-circuit **baissent** ailleurs, les protections voient moins bien les défauts et le réseau s’affaiblit (SCR plus faible). Les études de raccordement modernes regardent donc autant le manque que l’excès de courant de court-circuit.`,
        en: r`An inverter limits its current to about 1.1 times its rating: $$\Delta I_{sc} \approx 1.1\,\frac{S}{\sqrt3\,U} \approx 1.8\ \text{kA}$$ and the substation stays below 63 kA. The flip side: with fewer synchronous machines, short-circuit currents **fall** elsewhere, protection sees faults less clearly and the grid weakens (lower SCR). Modern connection studies look at too little short-circuit current as much as too much.`,
      },
    },
  },
};
