// Module 5 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers5: Answers = {
  pflow: {
    predict: {
      hint: { fr: r`Newton–Raphson remplace le problème par sa tangente à chaque pas. Près de la solution, l’erreur est-elle divisée par un facteur fixe, ou élevée au carré ?`, en: r`Newton–Raphson replaces the problem by its tangent at each step. Near the solution, is the error divided by a fixed factor, or squared?` },
      answer: {
        fr: r`L’écart décroît **de plus en plus vite** : sur l’échelle logarithmique, la courbe plonge, car le nombre de chiffres exacts double à chaque itération (convergence **quadratique**). $$\|e_{k+1}\| \le C\,\|e_k\|^2, \qquad x_{k+1} = x_k - J(x_k)^{-1} f(x_k)$$ Trois à cinq itérations suffisent sur un réseau normalement chargé.`,
        en: r`The mismatch falls **faster and faster**: on the log scale the curve dives, because the number of correct digits doubles at each iteration (**quadratic** convergence). $$\|e_{k+1}\| \le C\,\|e_k\|^2, \qquad x_{k+1} = x_k - J(x_k)^{-1} f(x_k)$$ Three to five iterations are enough on a normally loaded grid.`,
      },
    },
    build: {
      hint: { fr: r`Cliquez sur « Construire pas à pas » dans le panneau de la matrice, puis ajoutez toutes les lignes.`, en: r`Click “Build step by step” in the matrix panel, then add every line.` },
      answer: {
        fr: r`Une ligne d’admittance $y_{ij}$ entre $i$ et $j$ ajoute $$Y_{ii} \mathrel{+}= y_{ij} + \tfrac{j b_{ij}}{2}, \quad Y_{jj} \mathrel{+}= y_{ij} + \tfrac{j b_{ij}}{2}, \quad Y_{ij} = Y_{ji} \mathrel{-}= y_{ij}$$ Chaque nœud n’est relié qu’à quelques voisins : $Y$ est **creuse**. Sur un réseau de 10 000 nœuds, plus de 99,9 % de ses cases sont nulles, ce qui rend les calculs rapides.`,
        en: r`A line of admittance $y_{ij}$ between $i$ and $j$ adds $$Y_{ii} \mathrel{+}= y_{ij} + \tfrac{j b_{ij}}{2}, \quad Y_{jj} \mathrel{+}= y_{ij} + \tfrac{j b_{ij}}{2}, \quad Y_{ij} = Y_{ji} \mathrel{-}= y_{ij}$$ Each bus connects to only a few neighbours: $Y$ is **sparse**. On a 10,000-bus grid, over 99.9 % of its entries are zero, which makes computations fast.`,
      },
    },
    outage: {
      hint: { fr: r`Choisissez une ligne dans le sélecteur « ligne hors service ».`, en: r`Pick a line in the “line out of service” selector.` },
      answer: {
        fr: r`Le courant suit les lois de Kirchhoff, pas un itinéraire choisi : il se répartit entre les chemins parallèles en proportion inverse de leurs impédances. En approximation continue : $$P_{ij} \approx \frac{\theta_i - \theta_j}{x_{ij}}$$ Quand une ligne déclenche, son transit se reporte sur les autres, qui peuvent à leur tour être surchargées. C’est la base de l’analyse N–1.`,
        en: r`Current follows Kirchhoff’s laws, not a chosen route: it splits between parallel paths in inverse proportion to their impedances. In the DC approximation: $$P_{ij} \approx \frac{\theta_i - \theta_j}{x_{ij}}$$ When a line trips, its flow moves onto the others, which may in turn be overloaded. That is the basis of N–1 analysis.`,
      },
    },
    pv: {
      hint: { fr: r`Montez la consigne $V_2$ à 1,05 pu.`, en: r`Raise the $V_2$ setpoint to 1.05 pu.` },
      answer: {
        fr: r`Un nœud PV fixe $P$ et $|V|$ ; son réactif $Q$ devient une inconnue, ajustée pour tenir la tension : $$Q_i = |V_i|\sum_k |V_k|\,(G_{ik}\sin\theta_{ik} - B_{ik}\cos\theta_{ik})$$ Relever la consigne fait produire plus de réactif, qui relève les tensions voisines. Les alternateurs règlent ainsi la tension du réseau de transport.`,
        en: r`A PV bus fixes $P$ and $|V|$; its reactive power $Q$ becomes an unknown, adjusted to hold the voltage: $$Q_i = |V_i|\sum_k |V_k|\,(G_{ik}\sin\theta_{ik} - B_{ik}\cos\theta_{ik})$$ Raising the setpoint makes it produce more reactive power, which lifts the neighbouring voltages. Generators regulate transmission voltage this way.`,
      },
    },
    heavy: {
      hint: { fr: r`Montez le niveau de charge $\lambda$ vers 2,5 ou plus.`, en: r`Raise the load level $\lambda$ to 2.5 or more.` },
      answer: {
        fr: r`La convergence quadratique ne vaut que **près** de la solution. Un réseau chargé a des angles et des chutes de tension importants : le départ à plat est loin et le jacobien se rapproche d’une matrice singulière, si bien que les premiers pas sont moins bons. En exploitation, on part de la solution précédente (« démarrage à chaud »).`,
        en: r`Quadratic convergence only holds **near** the solution. A loaded grid has large angles and voltage drops: the flat start is far away and the Jacobian approaches singularity, so the first steps are poorer. In operation, the previous solution is used as the start (“warm start”).`,
      },
    },
    diverge: {
      hint: { fr: r`Continuez à monter $\lambda$ jusqu’à ce que le calcul échoue.`, en: r`Keep raising $\lambda$ until the solver fails.` },
      answer: {
        fr: r`Au nez de la courbe P–V, le jacobien devient **singulier** : $$\det J = 0$$ Au-delà, les équations de répartition n’ont plus de solution réelle. La non-convergence est ici un message physique : le réseau ne peut pas transporter cette charge. Les outils de « continuation » suivent la courbe jusqu’au nez pour mesurer la marge.`,
        en: r`At the nose of the P–V curve, the Jacobian becomes **singular**: $$\det J = 0$$ Beyond it, the power-flow equations have no real solution. Non-convergence here is a physical message: the grid cannot carry that load. Continuation tools follow the curve up to the nose to measure the margin.`,
      },
    },
  },

  pv: {
    predict: {
      hint: { fr: r`Au début la tension baisse lentement. Jusqu’où ? Pensez à la courbe du nez de la leçon 4.9.`, en: r`At first voltage falls slowly. How far? Think of the nose curve of lesson 4.9.` },
      answer: {
        fr: r`La tension baisse d’abord doucement, puis **de plus en plus vite**, jusqu’au **nez** où la courbe s’arrête : au-delà, aucune solution. $$\left.\frac{dV}{d\lambda}\right|_{\text{nez}} \to -\infty$$ La dernière portion est trompeuse : la tension paraît encore acceptable (0,85–0,9 pu) alors que la marge est presque nulle.`,
        en: r`Voltage first falls gently, then **faster and faster**, up to the **nose** where the curve stops: beyond it, no solution. $$\left.\frac{dV}{d\lambda}\right|_{\text{nose}} \to -\infty$$ The last stretch is misleading: voltage still looks acceptable (0.85–0.9 pu) while the margin is almost nil.`,
      },
    },
    nose: {
      hint: { fr: r`Faites glisser le curseur de charge (en bas) jusqu’à ce que le point P–V s’arrête.`, en: r`Drag the load cursor (bottom) until the P–V point stops.` },
      answer: {
        fr: r`Au nez, la courbe Q–V touche zéro : il faudrait injecter du réactif pour aller plus loin. La **marge de charge** est la distance entre le point de fonctionnement et le nez : $$\text{marge} = \lambda_{max} - \lambda_0$$ Les gestionnaires exigent typiquement 5 à 10 % de marge, y compris après la perte d’un ouvrage.`,
        en: r`At the nose, the Q–V curve touches zero: reactive power would have to be injected to go further. The **loadability margin** is the distance between the operating point and the nose: $$\text{margin} = \lambda_{max} - \lambda_0$$ Operators typically require a 5 to 10 % margin, including after losing one element.`,
      },
    },
    qlim: {
      hint: { fr: r`Baissez $Q_{2,max}$ à 1 pu.`, en: r`Lower $Q_{2,max}$ to 1 pu.` },
      answer: {
        fr: r`En butée de réactif, le nœud PV devient un nœud PQ : il ne tient plus sa tension. $$Q_2 = Q_{2,max} \;\Rightarrow\; V_2 \text{ libre}$$ Le soutien de tension disparaît au pire moment et le nez recule. Dans les grands incidents de tension, l’atteinte successive des limites d’excitation des alternateurs précède l’effondrement.`,
        en: r`At its reactive limit, the PV bus becomes a PQ bus: it no longer holds its voltage. $$Q_2 = Q_{2,max} \;\Rightarrow\; V_2 \text{ free}$$ Voltage support disappears at the worst moment and the nose moves in. In major voltage incidents, generators hitting their field limits one after another precedes the collapse.`,
      },
    },
    cap: {
      hint: { fr: r`Montez $B_4$ à 0,4 pu.`, en: r`Raise $B_4$ to 0.4 pu.` },
      answer: {
        fr: r`Le condensateur fournit le réactif là où il est consommé ; il relève la tension et éloigne le nez. Mais sa production $BV^2$ baisse avec la tension : le nez recule moins que la tension ne monte, et une tension « normale » obtenue grâce aux condensateurs peut masquer une faible marge.`,
        en: r`The capacitor supplies reactive power where it is consumed; it lifts the voltage and pushes the nose out. But its output $BV^2$ falls with voltage: the nose moves less than the voltage rises, and a “normal” voltage obtained with capacitors can hide a small margin.`,
      },
    },
    outage: {
      hint: { fr: r`Sélectionnez la ligne 1–3 hors service.`, en: r`Select line 1–3 out of service.` },
      answer: {
        fr: r`Perdre une ligne augmente la réactance équivalente vue par la charge, donc réduit la puissance maximale : $$P_{max} \propto \frac{E^2}{X_{eq}}$$ La règle N–1 impose que le réseau reste dans ses limites (et loin du nez) après la perte de n’importe quel ouvrage.`,
        en: r`Losing a line raises the equivalent reactance seen by the load, hence lowers the maximum power: $$P_{max} \propto \frac{E^2}{X_{eq}}$$ The N–1 rule requires the grid to stay within limits (and away from the nose) after losing any single element.`,
      },
    },
    margin: {
      hint: { fr: r`Rapprochez le curseur de charge du nez, en surveillant la marge réactive affichée sur la courbe Q–V.`, en: r`Move the load cursor close to the nose, watching the reactive margin shown on the Q–V curve.` },
      answer: {
        fr: r`La marge réactive est la profondeur du creux de la courbe Q–V sous l’axe : $$Q_{marge} = -\min_V Q(V)$$ C’est le réactif qu’on pourrait encore retirer au nœud avant l’effondrement. Elle s’annule au nez : une petite marge signale un point fragile, à renforcer par de la compensation.`,
        en: r`The reactive margin is the depth of the Q–V curve’s dip below the axis: $$Q_{margin} = -\min_V Q(V)$$ It is the reactive power that could still be removed at the bus before collapse. It vanishes at the nose: a small margin flags a weak bus, to be reinforced with compensation.`,
      },
    },
  },

  faults: {
    predict: {
      hint: { fr: r`Le courant de défaut est limité par les impédances directe, inverse et homopolaire en série. Pensez aussi à la composante continue de la leçon 4.4.`, en: r`Fault current is limited by the positive, negative and zero-sequence impedances in series. Remember the DC offset of lesson 4.4 too.` },
      answer: {
        fr: r`Au défaut, le courant de la phase a passe brusquement de 0,5 pu à **plusieurs pu**, avec une composante continue qui s’amortit. Pour un défaut phase–terre franc : $$\underline I_a = 3\underline I_0 = \frac{3\underline E}{\underline Z_1 + \underline Z_2 + \underline Z_0}$$ Les trois réseaux de séquence sont en série ; les phases saines gardent à peu près leur courant de charge.`,
        en: r`At the fault, phase a current jumps from 0.5 pu to **several pu**, with a decaying DC offset. For a solid single-line-to-ground fault: $$\underline I_a = 3\underline I_0 = \frac{3\underline E}{\underline Z_1 + \underline Z_2 + \underline Z_0}$$ The three sequence networks are in series; the healthy phases keep roughly their load current.`,
      },
    },
    tph: {
      hint: { fr: r`Choisissez le type « triphasé ».`, en: r`Choose the “three-phase” type.` },
      answer: {
        fr: r`Un défaut triphasé reste équilibré : seul le réseau direct est concerné. $$I_{3\phi} = \frac{E}{Z_1}, \qquad S_{cc} = \sqrt3\,U\,I_{3\phi}$$ La puissance de court-circuit mesure la « force » du réseau en un point : elle fixe le calibre des disjoncteurs et l’effet des charges sur la tension.`,
        en: r`A three-phase fault stays balanced: only the positive-sequence network is involved. $$I_{3\phi} = \frac{E}{Z_1}, \qquad S_{sc} = \sqrt3\,U\,I_{3\phi}$$ Short-circuit power measures the grid’s “strength” at a point: it sets breaker ratings and how loads affect voltage.`,
      },
    },
    isolated: {
      hint: { fr: r`Type « phase–terre », mise à la terre « isolé ».`, en: r`“Line-to-ground” type, “isolated” grounding.` },
      answer: {
        fr: r`Sans chemin vers la terre, $Z_0 \to \infty$ : le courant de défaut se réduit au faible courant capacitif. Mais le point neutre se décale de toute la tension simple : $$|V_b| = |V_c| = \sqrt3\,V$$ Le réseau peut continuer à fonctionner avec un défaut, mais l’isolation des phases saines est fortement sollicitée. C’est le choix de certains réseaux de distribution ; le transport est mis directement à la terre.`,
        en: r`With no path to earth, $Z_0 \to \infty$: fault current shrinks to the small capacitive current. But the neutral point shifts by a whole phase voltage: $$|V_b| = |V_c| = \sqrt3\,V$$ The grid can keep running with a fault, but the healthy phases’ insulation is heavily stressed. Some distribution grids choose this; transmission is solidly grounded.`,
      },
    },
    near: {
      hint: { fr: r`Mise à la terre « directe », défaut phase–terre, distance réduite à 10 km ou moins.`, en: r`“Solid” grounding, line-to-ground fault, distance down to 10 km or less.` },
      answer: {
        fr: r`Le rapport des deux courants est $$\frac{I_{1\phi}}{I_{3\phi}} = \frac{3Z_1}{2Z_1 + Z_0}$$ Il dépasse 1 quand $Z_0 < Z_1$, ce qui arrive près d’un transformateur étoile-terre (faible $Z_0$ du transformateur, peu de ligne). Le défaut monophasé peut alors dimensionner les disjoncteurs.`,
        en: r`The ratio of the two currents is $$\frac{I_{1\phi}}{I_{3\phi}} = \frac{3Z_1}{2Z_1 + Z_0}$$ It exceeds 1 when $Z_0 < Z_1$, which happens near a grounded-star transformer (low transformer $Z_0$, little line). The single-phase fault can then set breaker ratings.`,
      },
    },
    ll: {
      hint: { fr: r`Choisissez le type « biphasé ».`, en: r`Choose the “line-to-line” type.` },
      answer: {
        fr: r`Un défaut entre deux phases met les réseaux direct et inverse en parallèle, sans le homopolaire : $$I_{2\phi} = \frac{\sqrt3\,E}{Z_1 + Z_2} = \frac{\sqrt3}{2}\,I_{3\phi} \quad (Z_2 = Z_1)$$ La mise à la terre n’y change rien. C’est souvent le plus petit courant de défaut, qui fixe la sensibilité minimale des protections.`,
        en: r`A fault between two phases puts the positive and negative-sequence networks in parallel, without zero sequence: $$I_{LL} = \frac{\sqrt3\,E}{Z_1 + Z_2} = \frac{\sqrt3}{2}\,I_{3\phi} \quad (Z_2 = Z_1)$$ Grounding makes no difference. It is often the smallest fault current, which sets the minimum sensitivity of protection.`,
      },
    },
    rf: {
      hint: { fr: r`Défaut phase–terre, puis montez $R_f$ à 0,5 pu.`, en: r`Line-to-ground fault, then raise $R_f$ to 0.5 pu.` },
      answer: {
        fr: r`La résistance de défaut s’ajoute trois fois dans la boucle homopolaire : $$\underline I_a = \frac{3\underline E}{\underline Z_1 + \underline Z_2 + \underline Z_0 + 3R_f}$$ Le courant peut devenir proche du courant de charge : les protections à maximum de courant ne le voient plus. On utilise des protections homopolaires sensibles ou différentielles.`,
        en: r`Fault resistance enters three times in the zero-sequence loop: $$\underline I_a = \frac{3\underline E}{\underline Z_1 + \underline Z_2 + \underline Z_0 + 3R_f}$$ The current can approach load current: overcurrent relays no longer see it. Sensitive earth-fault or differential protection is used.`,
      },
    },
  },

  dispatch: {
    predict: {
      hint: { fr: r`Le prix est fixé par la dernière centrale appelée. Quelle centrale tourne la nuit ? Et à la pointe du soir ?`, en: r`Price is set by the last plant dispatched. Which plant runs at night? And at the evening peak?` },
      answer: {
        fr: r`Le prix suit la consommation **en marches d’escalier** : bas la nuit (la centrale bon marché suffit), plus haut le jour quand le gaz est appelé. Le prix est le **coût marginal** du système : $$\lambda = \frac{dC_{total}}{dP_{conso}} = \frac{dC_i}{dP_i} \quad \text{pour toute centrale non en butée}$$`,
        en: r`Price follows demand **in steps**: low at night (the cheap plant is enough), higher during the day when gas is dispatched. The price is the system’s **marginal cost**: $$\lambda = \frac{dC_{total}}{dP_{load}} = \frac{dC_i}{dP_i} \quad \text{for every unit not at a limit}$$`,
      },
    },
    peaker: {
      hint: { fr: r`Montez la pointe à 1000 MW.`, en: r`Raise the peak to 1000 MW.` },
      answer: {
        fr: r`Quand G1 et G2 sont à pleine puissance, le mégawatt suivant vient de G3, au coût élevé. Le prix saute à son coût marginal, et toutes les centrales en marche sont payées ce prix. Cette **rente** finance les centrales de base ; les heures de pointe, rares et chères, financent les turbines de pointe.`,
        en: r`Once G1 and G2 are at full output, the next megawatt comes from G3, at a high cost. The price jumps to its marginal cost, and every running plant is paid that price. That **rent** pays for baseload plants; the rare, expensive peak hours pay for peakers.`,
      },
    },
    equal: {
      hint: { fr: r`Avec la pointe à 1000 MW, faites glisser le curseur vers le début de soirée et cherchez une heure où G2 et G3 sont tous deux entre 0 et leur maximum.`, en: r`With the peak at 1000 MW, move the cursor to early evening and look for an hour where G2 and G3 are both between zero and their maximum.` },
      answer: {
        fr: r`À l’optimum, toutes les centrales non bridées ont le même coût marginal (condition de Lagrange) : $$\min \sum_i C_i(P_i) \ \text{s.c.}\ \sum_i P_i = D \;\Rightarrow\; \frac{dC_i}{dP_i} = \lambda$$ Si l’une était moins chère à la marge, il serait rentable de lui transférer de la production.`,
        en: r`At the optimum, all unconstrained units have the same marginal cost (Lagrange condition): $$\min \sum_i C_i(P_i) \ \text{s.t.}\ \sum_i P_i = D \;\Rightarrow\; \frac{dC_i}{dP_i} = \lambda$$ If one were cheaper at the margin, it would pay to shift output to it.`,
      },
    },
    congestion: {
      hint: { fr: r`Baissez la capacité $F_{max}$ de la ligne 1–3 à 450 MW.`, en: r`Lower the 1–3 line capacity $F_{max}$ to 450 MW.` },
      answer: {
        fr: r`Quand une ligne est saturée, le mégawatt suivant ne peut plus venir de la centrale la moins chère : il est produit localement, plus cher. Chaque nœud a alors son propre prix : $$\lambda_i = \lambda_{\text{réf}} + \mu_{\ell}\,\text{PTDF}_{\ell,i}$$ L’écart de prix entre les nœuds est la **rente de congestion** ; il signale où renforcer le réseau. C’est le principe des marchés nodaux (États-Unis) et du couplage par zones (Europe).`,
        en: r`When a line is congested, the next megawatt can no longer come from the cheapest plant: it is produced locally, at a higher cost. Each bus then has its own price: $$\lambda_i = \lambda_{\text{ref}} + \mu_{\ell}\,\text{PTDF}_{\ell,i}$$ The price difference between buses is the **congestion rent**; it signals where to reinforce the grid. This is the principle of nodal markets (US) and zonal coupling (Europe).`,
      },
    },
    solar: {
      hint: { fr: r`Montez le solaire à 300 MW.`, en: r`Raise solar to 300 MW.` },
      answer: {
        fr: r`Le solaire a un coût marginal quasi nul : il passe en premier dans l’**ordre de mérite** et repousse les centrales chères hors du marché à midi. Le prix baisse aux heures solaires — c’est l’**effet d’ordre de mérite** — mais la pointe du soir, sans soleil, reste fixée par les centrales thermiques.`,
        en: r`Solar has a near-zero marginal cost: it comes first in the **merit order** and pushes expensive plants out of the market at noon. Prices fall in sunny hours — the **merit-order effect** — but the evening peak, without sun, is still set by thermal plants.`,
      },
    },
    curtail: {
      hint: { fr: r`Solaire à 500 MW ou plus, ligne 1–3 limitée à 300 MW ou moins.`, en: r`Solar at 500 MW or more, line 1–3 limited to 300 MW or less.` },
      answer: {
        fr: r`Si la production du nœud 1 dépasse sa consommation locale plus la capacité d’export, l’excédent ne peut aller nulle part : il faut l’écrêter. Le prix local tombe au coût marginal du solaire, proche de zéro (voire négatif sur certains marchés). Le remède : renforcer la ligne, stocker sur place, ou déplacer la consommation vers midi.`,
        en: r`If bus 1’s output exceeds its local load plus the export capacity, the surplus has nowhere to go: it must be curtailed. The local price falls to solar’s marginal cost, near zero (even negative in some markets). The remedies: reinforce the line, store locally, or shift demand to midday.`,
      },
    },
  },

  feeder: {
    predict: {
      hint: { fr: r`Le soir, la consommation fait baisser la tension le long du départ. À midi, le solaire injecte plus qu’on ne consomme : dans quel sens va le courant ?`, en: r`In the evening, consumption lowers the voltage along the feeder. At noon, solar injects more than is consumed: which way does the current flow?` },
      answer: {
        fr: r`La tension en bout de départ **monte** au-dessus de celle du poste vers midi, quand le solaire exporte, et **descend** sous elle le soir, à la pointe de consommation. Le long d’un départ résistif : $$\Delta V \approx \frac{R\,P + X\,Q}{V}, \qquad P < 0 \text{ (export)} \Rightarrow \text{la tension monte}$$ En distribution, $R$ est grand : la puissance active pèse beaucoup sur la tension.`,
        en: r`The end-of-feeder voltage **rises** above the substation’s around noon, when solar exports, and **drops** below it in the evening, at peak demand. Along a resistive feeder: $$\Delta V \approx \frac{R\,P + X\,Q}{V}, \qquad P < 0 \text{ (export)} \Rightarrow \text{voltage rises}$$ In distribution, $R$ is large: active power weighs heavily on voltage.`,
      },
    },
    reverse: {
      hint: { fr: r`Faites glisser le curseur de temps vers 12 h.`, en: r`Drag the time cursor to 12:00.` },
      answer: {
        fr: r`À midi, la production solaire dépasse la consommation locale : l’excédent remonte vers le poste et le réseau amont. $$P_{poste} = \sum P_{conso} - \sum P_{PV} < 0$$ Les départs ont été conçus pour un flux descendant : protections, régleurs et compteurs doivent s’adapter au flux inverse.`,
        en: r`At noon, solar output exceeds local demand: the surplus flows back to the substation and the upstream grid. $$P_{sub} = \sum P_{load} - \sum P_{PV} < 0$$ Feeders were designed for downward flow: protection, tap changers and meters must adapt to reverse flow.`,
      },
    },
    over: {
      hint: { fr: r`Sans réglage des onduleurs, montez le solaire par nœud vers 3,5 MW.`, en: r`With no inverter control, raise solar per bus towards 3.5 MW.` },
      answer: {
        fr: r`Sur un départ de distribution, la **tension** est souvent la première limite atteinte, bien avant l’échauffement des câbles. La capacité d’accueil est la puissance installable sans dépasser 1,05 pu (en planification ; la norme EN 50160 tolère ±10 %). $$V_{bout} \approx V_{poste} + \frac{R\,P_{export}}{V}$$`,
        en: r`On a distribution feeder, **voltage** is often the first limit reached, well before cable heating. Hosting capacity is the power that can be installed without exceeding 1.05 pu (in planning; EN 50160 tolerates ±10 %). $$V_{end} \approx V_{sub} + \frac{R\,P_{export}}{V}$$`,
      },
    },
    qv: {
      hint: { fr: r`Solaire à 3,5 MW ou plus, réglage « Q(V) ».`, en: r`Solar at 3.5 MW or more, “Q(V)” control.` },
      answer: {
        fr: r`Les onduleurs absorbent du réactif quand la tension monte, ce qui compense une partie de l’élévation : $$\Delta V \approx \frac{R\,P + X\,Q}{V}, \qquad Q < 0 \text{ compense } P < 0$$ L’effet est limité par le rapport $X/R$ du départ (faible en souterrain) et coûte un peu de pertes, mais aucune énergie solaire n’est perdue.`,
        en: r`Inverters absorb reactive power when voltage rises, offsetting part of the rise: $$\Delta V \approx \frac{R\,P + X\,Q}{V}, \qquad Q < 0 \text{ offsets } P < 0$$ The effect is limited by the feeder’s $X/R$ ratio (low for cables) and costs a few losses, but no solar energy is lost.`,
      },
    },
    oltc: {
      hint: { fr: r`Réglage « aucun », puis baissez la consigne du poste à 1,00 pu.`, en: r`“None” control, then lower the substation setpoint to 1.00 pu.` },
      answer: {
        fr: r`Le régleur du poste décale toute la courbe de tension d’un même montant : il ne peut pas réduire l’**écart** entre midi (tension haute) et le soir (tension basse). Quand l’amplitude de variation dépasse la bande de ±5 %, il faut un réglage **local** : onduleurs, régulateurs de ligne ou stockage.`,
        en: r`The substation tap changer shifts the whole voltage curve by the same amount: it cannot reduce the **gap** between noon (high voltage) and evening (low voltage). When the swing exceeds the ±5 % band, **local** control is needed: inverters, line regulators or storage.`,
      },
    },
    curtail: {
      hint: { fr: r`Solaire à 5 MW par nœud ou plus, réglage « écrêtement P(V) ».`, en: r`Solar at 5 MW per bus or more, “P(V) curtailment” control.` },
      answer: {
        fr: r`L’écrêtement P(V) réduit l’injection active quand la tension dépasse un seuil : c’est le levier le plus efficace sur un réseau résistif ($R \gg X$), mais il perd de l’énergie verte. On le réserve aux quelques heures de l’année où Q(V) ne suffit pas : écrêter 1 à 3 % de l’énergie annuelle permet souvent d’accueillir bien plus de puissance installée.`,
        en: r`P(V) curtailment reduces active injection when voltage exceeds a threshold: the most effective lever on a resistive grid ($R \gg X$), but it loses green energy. It is kept for the few hours a year when Q(V) is not enough: curtailing 1 to 3 % of annual energy often allows far more installed capacity.`,
      },
    },
  },
};
