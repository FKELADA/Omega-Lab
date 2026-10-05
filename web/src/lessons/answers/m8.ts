// Module 8 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers8: Answers = {
  eac: {
    predict: {
      hint: { fr: r`Pendant le défaut, l’alternateur ne peut presque plus débiter : sa turbine l’accélère. Après le défaut, avec une ligne en moins, le réseau le retient-il ?`, en: r`During the fault, the generator can hardly deliver power: its turbine accelerates it. After the fault, with one line fewer, does the grid hold it back?` },
      answer: {
        fr: r`L’angle **monte** pendant le défaut (le rotor accélère), continue sur sa lancée après l’élimination, atteint un maximum puis **redescend** et oscille autour d’un nouvel équilibre plus élevé (une ligne en moins). Le critère des aires dit si le rotor revient : $$\underbrace{\int_{\delta_0}^{\delta_c} (P_m - P_{e,\text{défaut}})\,d\delta}_{A_{acc}} \le \underbrace{\int_{\delta_c}^{\delta_{max}} (P_{e,\text{après}} - P_m)\,d\delta}_{A_{déc}}$$ Avec 150 ms, il reste stable.`,
        en: r`The angle **rises** during the fault (the rotor accelerates), keeps going after clearing, peaks, then **swings back** and oscillates around a new, higher equilibrium (one line fewer). The equal-area criterion says whether the rotor comes back: $$\underbrace{\int_{\delta_0}^{\delta_c} (P_m - P_{e,\text{fault}})\,d\delta}_{A_{acc}} \le \underbrace{\int_{\delta_c}^{\delta_{max}} (P_{e,\text{post}} - P_m)\,d\delta}_{A_{dec}}$$ With 150 ms, it stays stable.`,
      },
    },
    loss: {
      hint: { fr: r`Allongez la durée du défaut $t_c$ vers 300 ms.`, en: r`Lengthen the fault duration $t_c$ towards 300 ms.` },
      answer: {
        fr: r`Plus le défaut dure, plus l’aire d’accélération grandit. Quand elle dépasse l’aire de décélération disponible (jusqu’à l’angle instable $\delta_u$), le rotor franchit $\delta_u$ et ne revient plus. Pour un défaut franc au poste ($P_e = 0$ pendant le défaut) : $$\delta(t) = \delta_0 + \frac{\omega_0 P_m}{4H}\,t^2$$ Les protections doivent éliminer le défaut avant le **temps critique**.`,
        en: r`The longer the fault, the larger the accelerating area. When it exceeds the available decelerating area (up to the unstable angle $\delta_u$), the rotor passes $\delta_u$ and never comes back. For a solid fault at the substation ($P_e = 0$ during the fault): $$\delta(t) = \delta_0 + \frac{\omega_0 P_m}{4H}\,t^2$$ Protection must clear the fault before the **critical clearing time**.`,
      },
    },
    edge: {
      hint: { fr: r`Le temps critique est affiché dans les équations : réglez $t_c$ à quelques millisecondes en dessous.`, en: r`The critical clearing time is shown in the equations: set $t_c$ a few milliseconds below it.` },
      answer: {
        fr: r`Au temps critique, les deux aires sont exactement égales et le rotor s’arrête pile à $\delta_u$ : $$A_{acc}(\delta_{cr}) = A_{déc}(\delta_{cr} \to \delta_u), \qquad t_{cr} = \sqrt{\frac{4H(\delta_{cr} - \delta_0)}{\omega_0 P_m}}$$ C’est ce temps qui fixe le cahier des charges des protections (typiquement 100 ms en très haute tension).`,
        en: r`At the critical time, the two areas are exactly equal and the rotor stops right at $\delta_u$: $$A_{acc}(\delta_{cr}) = A_{dec}(\delta_{cr} \to \delta_u), \qquad t_{cr} = \sqrt{\frac{4H(\delta_{cr} - \delta_0)}{\omega_0 P_m}}$$ That time sets the protection requirements (typically 100 ms at extra-high voltage).`,
      },
    },
    inertia: {
      hint: { fr: r`Montez $H$ à 8 s.`, en: r`Raise $H$ to 8 s.` },
      answer: {
        fr: r`L’angle critique ne dépend pas de l’inertie, mais la vitesse à laquelle on l’atteint, si : $$t_{cr} \propto \sqrt{H}$$ Doubler $H$ multiplie le temps critique par $\sqrt2 \approx 1{,}41$. Moins d’inertie (plus d’onduleurs) laisse donc moins de temps aux protections.`,
        en: r`The critical angle does not depend on inertia, but how fast it is reached does: $$t_{cr} \propto \sqrt{H}$$ Doubling $H$ multiplies the critical time by $\sqrt2 \approx 1.41$. Less inertia (more inverters) therefore leaves protection less time.`,
      },
    },
    load: {
      hint: { fr: r`Baissez $P_m$ à 0,6 pu.`, en: r`Lower $P_m$ to 0.6 pu.` },
      answer: {
        fr: r`Une puissance mécanique plus faible réduit l’accélération pendant le défaut ($\propto P_m$) et éloigne $\delta_0$ de $\delta_u$ : l’aire de décélération disponible grandit. $$\delta_0 = \arcsin\frac{P_m}{P_{max}}, \qquad \delta_u = 180° - \arcsin\frac{P_m}{P_{max,après}}$$ Les gestionnaires limitent parfois la production d’une centrale pour garder la stabilité après un défaut.`,
        en: r`Lower mechanical power reduces acceleration during the fault ($\propto P_m$) and moves $\delta_0$ away from $\delta_u$: the available decelerating area grows. $$\delta_0 = \arcsin\frac{P_m}{P_{max}}, \qquad \delta_u = 180° - \arcsin\frac{P_m}{P_{max,post}}$$ Operators sometimes cap a plant’s output to keep it stable after a fault.`,
      },
    },
    remote: {
      hint: { fr: r`Choisissez l’emplacement « milieu de ligne ».`, en: r`Choose the “mid-line” location.` },
      answer: {
        fr: r`Un défaut lointain ne ramène pas la tension à zéro au poste : un peu de puissance passe encore, $P_{e,\text{défaut}} = P_{max,d}\sin\delta > 0$. L’aire d’accélération $\int (P_m - P_{e,\text{défaut}})\,d\delta$ diminue et le temps critique augmente. Les défauts les plus sévères sont les défauts triphasés proches des centrales.`,
        en: r`A remote fault does not bring the substation voltage to zero: some power still flows, $P_{e,\text{fault}} = P_{max,f}\sin\delta > 0$. The accelerating area $\int (P_m - P_{e,\text{fault}})\,d\delta$ shrinks and the critical time grows. The most severe faults are three-phase faults close to power plants.`,
      },
    },
  },

  pss: {
    predict: {
      hint: { fr: r`Un régulateur de tension rapide sur un alternateur chargé et une liaison longue peut produire un amortissement… négatif.`, en: r`A fast voltage regulator on a loaded generator with a long tie can produce… negative damping.` },
      answer: {
        fr: r`La vitesse **oscille en grandissant**, autour de 1 Hz : le mode électromécanique est **instable**. Le régulateur de tension rapide crée un couple électrique en retard de phase, dont la composante en phase avec la vitesse est négative : $$\Delta T_e = K_S\,\Delta\delta + K_D\,\Delta\omega, \qquad K_D < 0$$ C’est l’effet découvert dans les années 1960 avec les régulateurs statiques rapides.`,
        en: r`Speed **oscillates with growing amplitude**, at about 1 Hz: the electromechanical mode is **unstable**. The fast voltage regulator creates a lagging electrical torque whose component in phase with speed is negative: $$\Delta T_e = K_S\,\Delta\delta + K_D\,\Delta\omega, \qquad K_D < 0$$ This effect was discovered in the 1960s with fast static exciters.`,
      },
    },
    avr: {
      hint: { fr: r`PSS à 0, puis baissez $K_A$ (vers 50 ou moins).`, en: r`PSS at 0, then lower $K_A$ (to 50 or less).` },
      answer: {
        fr: r`Dans le modèle de Heffron–Phillips, l’amortissement négatif apporté par le régulateur croît avec son gain : $$K_D^{AVR} \approx -\frac{K_2 K_5 K_A}{\dots} \quad (K_5 < 0 \text{ à forte charge})$$ Baisser $K_A$ stabilise le mode, mais la tension est moins bien tenue pendant les défauts, ce qui réduit la stabilité transitoire. On garde donc le régulateur rapide et on ajoute un PSS.`,
        en: r`In the Heffron–Phillips model, the negative damping from the regulator grows with its gain: $$K_D^{AVR} \approx -\frac{K_2 K_5 K_A}{\dots} \quad (K_5 < 0 \text{ at heavy load})$$ Lowering $K_A$ stabilises the mode, but voltage is held less well during faults, which hurts transient stability. So the fast regulator is kept and a PSS is added.`,
      },
    },
    pss: {
      hint: { fr: r`$K_A = 200$, puis montez $K_{pss}$ vers 15–25.`, en: r`$K_A = 200$, then raise $K_{pss}$ to 15–25.` },
      answer: {
        fr: r`Le PSS mesure la vitesse et ajoute au régulateur un signal qui, après compensation du retard de phase de l’excitation, produit un couple **en phase avec la vitesse** : un amortissement positif. $$V_{pss} = K_{pss}\,\frac{sT_w}{1 + sT_w}\,\frac{1 + sT_1}{1 + sT_2}\,\Delta\omega$$ 15 % d’amortissement est une valeur confortable ; les gestionnaires exigent souvent au moins 5 %.`,
        en: r`The PSS measures speed and adds a signal to the regulator that, after compensating the exciter’s phase lag, produces a torque **in phase with speed**: positive damping. $$V_{pss} = K_{pss}\,\frac{sT_w}{1 + sT_w}\,\frac{1 + sT_1}{1 + sT_2}\,\Delta\omega$$ 15 % damping is comfortable; operators often require at least 5 %.`,
      },
    },
    weak: {
      hint: { fr: r`Gardez le PSS (gain ≥ 5) et montez $X_e$ à 0,9 pu.`, en: r`Keep the PSS (gain ≥ 5) and raise $X_e$ to 0.9 pu.` },
      answer: {
        fr: r`Une liaison plus longue réduit le couple synchronisant, donc la fréquence du mode, et change le retard de phase à compenser. Un PSS réglé pour un point de fonctionnement doit rester efficace sur toute la plage : on vérifie son réglage sur plusieurs configurations du réseau (lignes hors service, charges différentes).`,
        en: r`A longer tie reduces the synchronising torque, hence the mode frequency, and changes the phase lag to compensate. A PSS tuned for one operating point must stay effective over the whole range: its tuning is checked on several grid configurations (lines out, different loads).`,
      },
    },
    load: {
      hint: { fr: r`PSS à 0, $K_A \ge 150$, puis baissez $P$ à 0,6 pu.`, en: r`PSS at 0, $K_A \ge 150$, then lower $P$ to 0.6 pu.` },
      answer: {
        fr: r`À faible charge, l’angle de fonctionnement est petit et le coefficient $K_5$ du modèle de Heffron–Phillips devient positif ou faible : le régulateur n’apporte plus d’amortissement négatif. Les oscillations mal amorties apparaissent donc aux pointes de transit, sur les liaisons longues : exactement quand le réseau est le plus sollicité.`,
        en: r`At light load, the operating angle is small and the Heffron–Phillips coefficient $K_5$ becomes positive or small: the regulator no longer adds negative damping. Poorly damped oscillations therefore appear at peak transfers, on long ties: exactly when the grid is most stressed.`,
      },
    },
  },

  ltvs: {
    predict: {
      hint: { fr: r`Juste après le déclenchement, la tension chute. Ensuite, le régleur relève la tension BT cran après cran… en tirant plus de courant sur le réseau HT affaibli.`, en: r`Right after the trip, voltage drops. Then the tap changer raises the LV voltage step by step… drawing more current from the weakened HV grid.` },
      answer: {
        fr: r`La tension HT chute d’un coup au déclenchement, puis **descend par paliers** toutes les dizaines de secondes, à chaque changement de prise, jusqu’à l’effondrement. Le régleur rétablit la tension des clients, donc leur puissance ($P \propto V^2$ pour une charge résistive), ce qui augmente le courant tiré sur un réseau qui ne peut plus le fournir : $$V_{BT} = \frac{V_{HT}}{t}, \qquad t \downarrow \Rightarrow P_{charge} \uparrow \Rightarrow V_{HT} \downarrow$$`,
        en: r`HV voltage drops at once at the trip, then **steps down** every few tens of seconds, at each tap change, until collapse. The tap changer restores customer voltage, hence their power ($P \propto V^2$ for a resistive load), which raises the current drawn from a grid that can no longer supply it: $$V_{LV} = \frac{V_{HV}}{t}, \qquad t \downarrow \Rightarrow P_{load} \uparrow \Rightarrow V_{HV} \downarrow$$`,
      },
    },
    watch: {
      hint: { fr: r`Faites glisser le curseur de temps jusqu’à la fin des 5 minutes.`, en: r`Drag the time cursor to the end of the 5 minutes.` },
      answer: {
        fr: r`C’est une instabilité **lente** (minutes) : chaque cran fait remonter la charge et descendre le point de fonctionnement sur la courbe P–V, jusqu’au-delà du nez. C’est le scénario de la panne de l’ouest de la France en janvier 1987, et de nombreux incidents de tension dans le monde.`,
        en: r`This is a **slow** instability (minutes): each step restores load and pushes the operating point down the P–V curve, past the nose. It is the scenario of the western France blackout in January 1987, and of many voltage incidents worldwide.`,
      },
    },
    off: {
      hint: { fr: r`Mettez le régleur sur « hors service ».`, en: r`Set the tap changer to “off”.` },
      answer: {
        fr: r`Sans régleur, la charge garde sa sensibilité à la tension : à 0,86 pu, une charge résistive consomme $0{,}86^2 \approx 74\ \%$ de sa puissance. Ce « délestage naturel » suffit à rester du bon côté du nez. Un peu de tension basse chez les clients vaut mieux qu’un effondrement.`,
        en: r`Without the tap changer, the load keeps its voltage sensitivity: at 0.86 pu, a resistive load draws $0.86^2 \approx 74\ \%$ of its power. This “natural load relief” is enough to stay on the right side of the nose. A bit of low voltage at customers beats a collapse.`,
      },
    },
    block: {
      hint: { fr: r`Mode de régleur « blocage si V_HT < 0,9 ».`, en: r`Tap-changer mode “block if V_HV < 0.9”.` },
      answer: {
        fr: r`Le blocage conditionnel garde le service normal du régleur, mais l’arrête dès que la tension amont révèle un réseau en difficulté. C’est l’une des parades mises en place en France après 1987, avec des automates de baisse de consigne et de délestage sur critère de tension.`,
        en: r`Conditional blocking keeps the tap changer’s normal service, but stops it as soon as the upstream voltage reveals a struggling grid. It is one of the countermeasures introduced in France after 1987, along with setpoint-reduction schemes and undervoltage load shedding.`,
      },
    },
    cap: {
      hint: { fr: r`Régleur normal, condensateurs $B$ à 0,3 pu.`, en: r`Normal tap changer, capacitors $B$ at 0.3 pu.` },
      answer: {
        fr: r`Les condensateurs fournissent localement le réactif que la ligne restante ne peut plus transporter : la courbe P–V monte et le nez s’éloigne au-delà de la charge rétablie par le régleur. $$Q_C = BV^2$$ Ils doivent être enclenchés assez tôt : à tension trop basse, leur production s’effondre.`,
        en: r`Capacitors supply locally the reactive power the remaining line can no longer carry: the P–V curve rises and the nose moves beyond the load restored by the tap changer. $$Q_C = BV^2$$ They must be switched in early enough: at too low a voltage, their output collapses.`,
      },
    },
    thermo: {
      hint: { fr: r`Condensateurs à 0, régleur bloqué ou hors service, part thermostatée à 100 %.`, en: r`Capacitors at 0, tap changer blocked or off, thermostatic share at 100 %.` },
      answer: {
        fr: r`Les thermostats rétablissent la puissance en quelques minutes, indépendamment de la tension : $$P(t) \to P_0 \quad \text{quelle que soit } V$$ C’est l’équivalent d’un régleur invisible, qu’on ne peut pas bloquer. Seuls le délestage ou un renforcement du réseau (réactif, production locale) sauvent alors le système.`,
        en: r`Thermostats restore power within minutes, regardless of voltage: $$P(t) \to P_0 \quad \text{whatever } V$$ It is like an invisible tap changer that cannot be blocked. Only load shedding or grid reinforcement (reactive power, local generation) can then save the system.`,
      },
    },
  },

  fsys: {
    predict: {
      hint: { fr: r`Les onduleurs suiveurs n’apportent pas d’inertie : seules les machines (70 %) freinent la chute.`, en: r`Grid-following inverters bring no inertia: only the machines (70 %) slow the fall.` },
      answer: {
        fr: r`La fréquence chute, avec un RoCoF d’environ −0,3 Hz/s, atteint un creux vers 49,2–49,4 Hz après quelques secondes, puis remonte et se stabilise vers 49,8 Hz. Seules les machines contribuent à l’inertie : $$H_{sys} = (1 - s)\,H_{machines}, \qquad \text{RoCoF} = -\frac{\Delta P\,f_0}{2H_{sys}S}$$`,
        en: r`Frequency falls, with a RoCoF of about −0.3 Hz/s, reaches a nadir around 49.2–49.4 Hz after a few seconds, then recovers and settles near 49.8 Hz. Only machines contribute inertia: $$H_{sys} = (1 - s)\,H_{machines}, \qquad \text{RoCoF} = -\frac{\Delta P\,f_0}{2H_{sys}S}$$`,
      },
    },
    shed: {
      hint: { fr: r`Formeurs et réserve rapide à 0, puis montez la part d’onduleurs vers 70–80 %.`, en: r`Grid-forming and fast reserve at 0, then raise the inverter share to 70–80 %.` },
      answer: {
        fr: r`Chaque machine remplacée retire de l’inertie **et** de la réserve primaire : la fréquence tombe plus vite et plus bas avant que les turbines restantes ne compensent. Sous 48,8 Hz (Europe continentale), le délestage automatique coupe des consommateurs par tranches pour sauver le réseau.`,
        en: r`Each machine replaced removes inertia **and** primary reserve: frequency falls faster and lower before the remaining turbines make up. Below 48.8 Hz (Continental Europe), automatic load shedding cuts consumers in blocks to save the grid.`,
      },
    },
    rocof: {
      hint: { fr: r`Continuez à monter la part d’onduleurs, vers 90 %.`, en: r`Keep raising the inverter share, towards 90 %.` },
      answer: {
        fr: r`Le RoCoF initial ne dépend que de l’inertie : $$\text{RoCoF} = -\frac{\Delta P\,f_0}{2H_{sys}S}$$ Avec 10 % de machines, il dépasse 1 Hz/s : les protections RoCoF et les machines elles-mêmes (glissements de pôles) sont menacées dans la première seconde, avant toute régulation. C’est la limite dure des réseaux à très faible inertie.`,
        en: r`The initial RoCoF depends only on inertia: $$\text{RoCoF} = -\frac{\Delta P\,f_0}{2H_{sys}S}$$ With 10 % machines it exceeds 1 Hz/s: RoCoF protection and the machines themselves (pole slipping) are threatened within the first second, before any control acts. That is the hard limit of very low-inertia grids.`,
      },
    },
    ffr: {
      hint: { fr: r`Part d’onduleurs ≥ 80 %, formeurs à 0, puis montez la réserve rapide vers 1000 MW ou plus.`, en: r`Inverter share ≥ 80 %, grid-forming at 0, then raise the fast reserve to 1000 MW or more.` },
      answer: {
        fr: r`La réserve rapide agit après sa détection (quelques centaines de ms) : elle relève le creux, mais ne change pas la pente initiale, fixée par l’inertie au moment de la perte. $$\left.\frac{df}{dt}\right|_{0^+} \text{ inchangé}, \qquad f_{nadir} \uparrow$$ Elle règle le problème du délestage, pas celui du RoCoF.`,
        en: r`Fast reserve acts after detection (a few hundred ms): it lifts the nadir but does not change the initial slope, set by inertia at the moment of the loss. $$\left.\frac{df}{dt}\right|_{0^+} \text{ unchanged}, \qquad f_{nadir} \uparrow$$ It solves load shedding, not RoCoF.`,
      },
    },
    gfm: {
      hint: { fr: r`Réserve rapide à 0, puis montez la part de formeurs (vers 30–50 % des onduleurs).`, en: r`Fast reserve at 0, then raise the grid-forming share (towards 30–50 % of inverters).` },
      answer: {
        fr: r`Les formeurs répondent **instantanément**, comme une inertie : ils réduisent la pente initiale et le creux. $$H_{sys} = (1 - s)H_{machines} + s\,g\,H_{virt}$$ Ils remplacent ce que les machines apportaient naturellement. Leur limite est le courant des semi-conducteurs, d’où l’intérêt de les associer à du stockage.`,
        en: r`Grid-forming units respond **instantly**, like inertia: they reduce both the initial slope and the nadir. $$H_{sys} = (1 - s)H_{machines} + s\,g\,H_{virt}$$ They replace what machines provided naturally. Their limit is the semiconductors’ current, hence the value of pairing them with storage.`,
      },
    },
  },

  cds: {
    predict: {
      hint: { fr: r`Leçon 7.1 : réseau faible et PLL rapide ne font pas bon ménage.`, en: r`Lesson 7.1: weak grid and fast PLL do not mix well.` },
      answer: {
        fr: r`La puissance monte vers 1 pu puis se met à **osciller en grandissant** (quelques Hz à quelques dizaines de Hz) : le système est instable. La PLL mesure une tension que le courant de la centrale déplace fortement ; avec une bande passante trop grande, elle « poursuit » sa propre action. $$Z_g = \frac{1}{\text{SCR}}\ \text{pu}, \qquad \Delta\theta_{PCC} \approx X_g\,\Delta i_q / V$$`,
        en: r`Power rises towards 1 pu then starts **oscillating with growing amplitude** (a few to tens of Hz): the system is unstable. The PLL measures a voltage that the plant’s own current moves strongly; with too wide a bandwidth, it “chases” its own action. $$Z_g = \frac{1}{\text{SCR}}\ \text{pu}, \qquad \Delta\theta_{PCC} \approx X_g\,\Delta i_q / V$$`,
      },
    },
    slow: {
      hint: { fr: r`Baissez $f_{PLL}$ vers 20 Hz.`, en: r`Lower $f_{PLL}$ towards 20 Hz.` },
      answer: {
        fr: r`Une PLL plus lente ne réagit plus aux variations rapides qu’elle provoque : la boucle retrouve sa marge. On ralentit la PLL quand le SCR baisse, au prix d’une synchronisation moins rapide pendant les défauts.`,
        en: r`A slower PLL no longer reacts to the fast variations it causes: the loop regains margin. The PLL is slowed down as SCR falls, at the cost of slower synchronisation during faults.`,
      },
    },
    strong: {
      hint: { fr: r`$f_{PLL} \ge 55$ Hz, puis montez le SCR vers 3–4.`, en: r`$f_{PLL} \ge 55$ Hz, then raise the SCR to 3–4.` },
      answer: {
        fr: r`Un réseau plus fort (SCR plus élevé) réduit l’effet du courant de la centrale sur la tension mesurée : $$\text{SCR} = \frac{S_{cc}}{P_n}$$ On l’augmente avec de nouvelles lignes, ou avec des compensateurs synchrones qui apportent de la puissance de court-circuit et de l’inertie.`,
        en: r`A stronger grid (higher SCR) reduces the plant’s effect on the measured voltage: $$\text{SCR} = \frac{S_{sc}}{P_n}$$ It is raised with new lines, or with synchronous condensers that bring short-circuit power and inertia.`,
      },
    },
    curtail: {
      hint: { fr: r`SCR = 2, PLL ≥ 55 Hz, puis baissez $P$ vers 0,6 pu.`, en: r`SCR = 2, PLL ≥ 55 Hz, then lower $P$ towards 0.6 pu.` },
      answer: {
        fr: r`Plus la puissance injectée est grande, plus l’angle aux bornes de la liaison est grand et plus la tension est sensible au courant : réduire $P$ redonne de la marge. C’est la solution immédiate (limitation de production), en attendant un renforcement ou une commande adaptée.`,
        en: r`The more power injected, the larger the angle across the tie and the more sensitive the voltage to current: reducing $P$ restores margin. It is the immediate fix (output limitation), pending reinforcement or adapted control.`,
      },
    },
    minscr: {
      hint: { fr: r`$P = 1$ pu, $f_{PLL}$ vers 10–15 Hz, puis descendez le SCR sous 1,4 en suivant la frontière du graphique.`, en: r`$P = 1$ pu, $f_{PLL}$ around 10–15 Hz, then bring the SCR below 1.4 following the chart’s boundary.` },
      answer: {
        fr: r`La frontière de stabilité dans le plan (SCR, bande passante) montre qu’avec une PLL assez lente, un suiveur peut fonctionner sur un réseau très faible. Mais la marge reste mince et d’autres boucles (tension, courant) limitent aussi. En dessous d’un SCR d’environ 1,5, on préfère des onduleurs **formeurs**.`,
        en: r`The stability boundary in the (SCR, bandwidth) plane shows that with a slow enough PLL, a grid-following unit can run on a very weak grid. But the margin stays thin and other loops (voltage, current) also limit. Below an SCR of about 1.5, **grid-forming** inverters are preferred.`,
      },
    },
  },

  ssr: {
    predict: {
      hint: { fr: r`La ligne compensée a une résonance électrique à $50\sqrt k$ Hz ; le rotor la voit à $50 - 50\sqrt k$ Hz. Avec $k = 0{,}5$ ?`, en: r`The compensated line has an electrical resonance at $50\sqrt k$ Hz; the rotor sees it at $50 - 50\sqrt k$ Hz. With $k = 0.5$?` },
      answer: {
        fr: r`Le couple de torsion **grandit** exponentiellement : le mode à 14,6 Hz est instable. La résonance électrique, vue du rotor, tombe exactement sur la fréquence de torsion : $$f_{er} = f_0\sqrt{\frac{X_C}{X_L}} = 50\sqrt{0{,}5} \approx 35{,}4\ \text{Hz}, \qquad f_0 - f_{er} \approx 14{,}6\ \text{Hz}$$ L’échange d’énergie entre le réseau et l’arbre amplifie la torsion. C’est ce qui a rompu les arbres de la centrale de Mohave en 1970 et 1971.`,
        en: r`The torsional torque **grows** exponentially: the 14.6 Hz mode is unstable. The electrical resonance, as seen from the rotor, falls exactly on the torsional frequency: $$f_{er} = f_0\sqrt{\frac{X_C}{X_L}} = 50\sqrt{0.5} \approx 35.4\ \text{Hz}, \qquad f_0 - f_{er} \approx 14.6\ \text{Hz}$$ Energy exchange between grid and shaft amplifies the torsion. This broke the shafts at the Mohave plant in 1970 and 1971.`,
      },
    },
    detune: {
      hint: { fr: r`Condensateur fixe, puis passez $k$ à 0,4 ou 0,6.`, en: r`Fixed capacitor, then set $k$ to 0.4 or 0.6.` },
      answer: {
        fr: r`Hors coïncidence, l’interaction est faible et l’amortissement mécanique l’emporte : $$|50(1 - \sqrt k) - f_m| \gg \text{largeur de la résonance}$$ Les études SSR consistent à vérifier, pour chaque taux de compensation et chaque mode de torsion des groupes voisins, qu’on reste loin de la coïncidence.`,
        en: r`Away from coincidence the interaction is weak and mechanical damping wins: $$|50(1 - \sqrt k) - f_m| \gg \text{resonance width}$$ SSR studies check, for every compensation level and every torsional mode of nearby units, that coincidence is avoided.`,
      },
    },
    find: {
      hint: { fr: r`$f_m = 20$ Hz ; $50(1 - \sqrt k) = 20$ donne $\sqrt k = 0{,}6$, soit $k = 0{,}36$.`, en: r`$f_m = 20$ Hz; $50(1 - \sqrt k) = 20$ gives $\sqrt k = 0.6$, i.e. $k = 0.36$.` },
      answer: {
        fr: r`La condition de résonance s’inverse : $$k = \left(1 - \frac{f_m}{f_0}\right)^2 = (1 - 0{,}4)^2 = 0{,}36$$ Chaque groupe a plusieurs modes de torsion (entre 10 et 45 Hz) : un taux de compensation sûr pour l’un peut être dangereux pour un autre.`,
        en: r`The resonance condition inverts to: $$k = \left(1 - \frac{f_m}{f_0}\right)^2 = (1 - 0.4)^2 = 0.36$$ Each unit has several torsional modes (between 10 and 45 Hz): a compensation level safe for one can be dangerous for another.`,
      },
    },
    damping: {
      hint: { fr: r`Gardez la résonance et montez $\zeta_m$ à 0,5 %.`, en: r`Keep the resonance and raise $\zeta_m$ to 0.5 %.` },
      answer: {
        fr: r`Le mode grandit si l’amortissement négatif apporté par le réseau dépasse l’amortissement mécanique : $$\sigma = \sigma_{méca} + \sigma_{élec}, \qquad \sigma_{élec} > 0 \text{ près de la résonance}$$ L’amortissement mécanique d’un arbre de turbine est naturellement très faible (0,05 à 0,5 %) : on ne peut pas compter sur lui.`,
        en: r`The mode grows if the negative damping from the grid exceeds mechanical damping: $$\sigma = \sigma_{mech} + \sigma_{elec}, \qquad \sigma_{elec} > 0 \text{ near resonance}$$ A turbine shaft’s mechanical damping is naturally very small (0.05 to 0.5 %): it cannot be relied on.`,
      },
    },
    tcsc: {
      hint: { fr: r`Atténuation « TCSC », $k \ge 0{,}45$.`, en: r`“TCSC” mitigation, $k \ge 0.45$.` },
      answer: {
        fr: r`Un condensateur série commandé par thyristors (TCSC) se comporte comme un condensateur à 50 Hz mais comme une **inductance** aux fréquences hyposynchrones : la résonance électrique disparaît dans la bande dangereuse. La ligne garde son transfert accru, sans risque de résonance. D’autres parades existent : filtres, amortisseurs actifs sur l’excitation.`,
        en: r`A thyristor-controlled series capacitor (TCSC) behaves like a capacitor at 50 Hz but like an **inductor** at subsynchronous frequencies: the electrical resonance vanishes from the dangerous band. The line keeps its increased transfer, with no resonance risk. Other remedies exist: filters, active damping through the excitation.`,
      },
    },
  },

  g2: {
    predict: {
      hint: { fr: r`Les quatre machines sont reliées par le réseau, comme des masses reliées par des ressorts. Un choc sur l’une se propage-t-il aux autres ?`, en: r`The four machines are linked through the grid, like masses joined by springs. Does a kick on one spread to the others?` },
      answer: {
        fr: r`G3 **oscille aussi**, lentement (environ 0,6 Hz) et longtemps : le choc excite le mode inter-zones, où toute la zone 1 oscille contre toute la zone 2. Ce mode apparaît dans la réponse de chaque machine : $$\Delta\omega_3(t) = \sum_i v_{3i}\,c_i\,e^{\lambda_i t}$$ dès que la composante $v_{3i}$ de sa forme modale n’est pas nulle.`,
        en: r`G3 **oscillates too**, slowly (about 0.6 Hz) and for a long time: the kick excites the inter-area mode, where all of area 1 swings against all of area 2. That mode appears in every machine’s response: $$\Delta\omega_3(t) = \sum_i v_{3i}\,c_i\,e^{\lambda_i t}$$ as long as the component $v_{3i}$ of its mode shape is non-zero.`,
      },
    },
    shape: {
      hint: { fr: r`Sélecteur « mode affiché » : passez à « local 1 » ou « local 2 ».`, en: r`“Mode shown” selector: switch to “local 1” or “local 2”.` },
      answer: {
        fr: r`La forme modale (le vecteur propre) donne l’amplitude et le signe de chaque machine dans le mode : $$M^{-1}K\,v = \omega^2 v$$ Mode inter-zones : $v = (+, +, -, -)$, les zones s’opposent. Mode local : $v = (+, -, 0, 0)$ ou $(0, 0, +, -)$, deux voisines s’opposent et le reste du réseau ne bouge presque pas.`,
        en: r`The mode shape (the eigenvector) gives each machine’s amplitude and sign in the mode: $$M^{-1}K\,v = \omega^2 v$$ Inter-area mode: $v = (+, +, -, -)$, the areas oppose. Local mode: $v = (+, -, 0, 0)$ or $(0, 0, +, -)$, two neighbours oppose and the rest barely moves.`,
      },
    },
    weak: {
      hint: { fr: r`Montez $X_t$ à 1,8 pu ou plus.`, en: r`Raise $X_t$ to 1.8 pu or more.` },
      answer: {
        fr: r`La fréquence d’un mode dépend du « ressort » qui relie les groupes. Pour le mode inter-zones, c’est la liaison : $$\omega_{iz}^2 \approx \frac{\omega_0}{2}\,K_{tie}\left(\frac{1}{H_1} + \frac{1}{H_2}\right), \qquad K_{tie} \approx \frac{V^2\cos\theta_{tie}}{X_t}$$ Une liaison plus longue abaisse cette fréquence, sans toucher aux modes locaux, fixés par les liaisons internes.`,
        en: r`A mode’s frequency depends on the “spring” joining the groups. For the inter-area mode, it is the tie: $$\omega_{ia}^2 \approx \frac{\omega_0}{2}\,K_{tie}\left(\frac{1}{H_1} + \frac{1}{H_2}\right), \qquad K_{tie} \approx \frac{V^2\cos\theta_{tie}}{X_t}$$ A longer tie lowers that frequency, without touching the local modes, set by internal links.`,
      },
    },
    transfer: {
      hint: { fr: r`$X_t = 1$ pu, puis montez $P_{tie}$ à 0,85 pu.`, en: r`$X_t = 1$ pu, then raise $P_{tie}$ to 0.85 pu.` },
      answer: {
        fr: r`Le transit augmente l’angle $\theta_{tie}$ aux bornes de la liaison ; le coefficient synchronisant $\propto \cos\theta_{tie}$ diminue et le mode ralentit. Les grands transits (par exemple est–ouest en Europe) rendent les modes inter-zones plus lents et souvent moins amortis : on les surveille en temps réel avec des PMU.`,
        en: r`Transfer increases the angle $\theta_{tie}$ across the tie; the synchronising coefficient $\propto \cos\theta_{tie}$ decreases and the mode slows. Large transfers (e.g. east–west in Europe) make inter-area modes slower and often less damped: they are monitored in real time with PMUs.`,
      },
    },
    local: {
      hint: { fr: r`Machine perturbée : G3 ; mode affiché : local 2.`, en: r`Machine kicked: G3; mode shown: local 2.` },
      answer: {
        fr: r`Un choc sur G3 excite tous les modes où G3 participe : le mode local 2 (G3 contre G4, environ 1,1 Hz) et le mode inter-zones (0,6 Hz). Sur l’oscilloscope, on voit leur superposition. L’amplitude initiale de chaque mode dépend de la projection du choc sur son vecteur propre à gauche.`,
        en: r`A kick on G3 excites every mode in which G3 takes part: local mode 2 (G3 against G4, about 1.1 Hz) and the inter-area mode (0.6 Hz). The oscilloscope shows their sum. Each mode’s initial amplitude depends on the projection of the kick on its left eigenvector.`,
      },
    },
    damp: {
      hint: { fr: r`Montez $D$ vers 8–10 pu.`, en: r`Raise $D$ towards 8–10 pu.` },
      answer: {
        fr: r`Un amortissement proportionnel à la vitesse déplace les pôles vers la gauche : $$\zeta \approx \frac{D}{2\sqrt{2H\,K/\omega_0}}$$ En pratique, on agit là où le mode est observable et commandable — les machines de grande forme modale — avec des PSS ou des fonctions d’amortissement d’onduleurs (POD).`,
        en: r`Damping proportional to speed moves the poles left: $$\zeta \approx \frac{D}{2\sqrt{2H\,K/\omega_0}}$$ In practice, action is taken where the mode is observable and controllable — machines with a large mode shape — with PSSs or inverter damping functions (POD).`,
      },
    },
  },

  modes: {
    interarea: {
      hint: { fr: r`Réseau « Kundur », puis cliquez dans le tableau sur le mode de synchronisme le plus lent (vers 0,6 Hz).`, en: r`“Kundur” network, then click the slowest synchronisation mode in the table (around 0.6 Hz).` },
      answer: {
        fr: r`Le mode à 0,60 Hz est le mode inter-zones : sur la carte, G1 et G2 pointent dans une direction, G3 et G4 dans l’autre. Avec le modèle détaillé (AVR, PSS, amortisseurs), il est bien amorti (environ 18 %) : $$\zeta = \frac{-\sigma}{\sqrt{\sigma^2 + \omega^2}}$$ C’est le même mode qu’en 8.7, retrouvé ici sur un modèle de 95 états.`,
        en: r`The 0.60 Hz mode is the inter-area mode: on the map, G1 and G2 point one way, G3 and G4 the other. With the detailed model (AVR, PSS, dampers), it is well damped (about 18 %): $$\zeta = \frac{-\sigma}{\sqrt{\sigma^2 + \omega^2}}$$ It is the same mode as in 8.7, found here on a 95-state model.`,
      },
    },
    local: {
      hint: { fr: r`Cliquez sur un mode de synchronisme vers 1,3 Hz.`, en: r`Click a synchronisation mode around 1.3 Hz.` },
      answer: {
        fr: r`Les modes à 1,30 et 1,36 Hz sont locaux : chacun ne fait intervenir que deux machines d’une même zone, en opposition. Leurs facteurs de participation se concentrent sur les angles et vitesses de ces deux machines : $$p_{ki} = \frac{|v_{ki}\,w_{ik}|}{\sum_j |v_{ji}\,w_{ij}|}$$ Plus rapides, ils sont liés aux liaisons courtes à l’intérieur de chaque zone.`,
        en: r`The 1.30 and 1.36 Hz modes are local: each involves only two machines of the same area, in opposition. Their participation factors concentrate on those two machines’ angles and speeds: $$p_{ki} = \frac{|v_{ki}\,w_{ik}|}{\sum_j |v_{ji}\,w_{ij}|}$$ Faster, they come from the short links inside each area.`,
      },
    },
    control: {
      hint: { fr: r`Cherchez dans le tableau un mode marqué « régulation » ou « électrique (machine) » ; sur Kundur, ce sont les plus rapides.`, en: r`Look in the table for a mode marked “control” or “unit electrical”; on Kundur, they are the fastest.` },
      answer: {
        fr: r`Tous les modes ne sont pas des oscillations de rotors. Les modes de régulation et électriques viennent des régulateurs (AVR, PSS, gouverneurs, boucles d’onduleurs) et des flux des machines : leurs participations portent sur ces états, pas sur les angles. C’est pourquoi on ne parle de facteurs de participation qu’avec la liste des états : ils disent **quel organe** fait le mode.`,
        en: r`Not every mode is a rotor swing. Control and electrical modes come from regulators (AVR, PSS, governors, inverter loops) and machine fluxes: their participations sit on those states, not on angles. That is why participation factors come with the list of states: they say **which device** makes the mode.`,
      },
    },
    free: {
      hint: { fr: r`Sur Kundur, réglez « machine perturbée » à 3, puis faites glisser le curseur de temps jusqu’à la fin.`, en: r`On Kundur, set “machine kicked” to 3, then drag the time cursor to the end.` },
      answer: {
        fr: r`La réponse libre est la somme des modes excités : $$\Delta x(t) = \sum_i v_i\,(w_i\,\Delta x_0)\,e^{\lambda_i t}$$ Les modes locaux, rapides et bien amortis, s’éteignent en quelques secondes ; il reste le mode inter-zones, plus lent. G1 et G2 oscillent ensemble, en opposition avec G3 et G4.`,
        en: r`The free response is the sum of the excited modes: $$\Delta x(t) = \sum_i v_i\,(w_i\,\Delta x_0)\,e^{\lambda_i t}$$ The fast, well-damped local modes die out within seconds; the slower inter-area mode remains. G1 and G2 swing together, against G3 and G4.`,
      },
    },
    classic: {
      hint: { fr: r`Réseau « Kundur classique », puis cliquez sur le mode de synchronisme sous 1 Hz.`, en: r`“Kundur classical” network, then click the synchronisation mode below 1 Hz.` },
      answer: {
        fr: r`Dans le modèle classique, l’amortissement du mode inter-zones est **négatif** (environ −0,7 %) : la moindre perturbation le fait grandir. Le modèle détaillé l’amortit à 18 % grâce au PSS, qui ajoute un couple en phase avec la vitesse (leçon 8.2). Le choix du modèle change donc la conclusion : un modèle trop simple peut prédire une instabilité qui n’existe pas… ou l’inverse.`,
        en: r`In the classical model, the inter-area mode’s damping is **negative** (about −0.7 %): the slightest disturbance makes it grow. The detailed model damps it to 18 % thanks to the PSS, which adds a torque in phase with speed (lesson 8.2). The model choice changes the conclusion: a model that is too simple can predict an instability that does not exist… or the reverse.`,
      },
    },
    inverters: {
      hint: { fr: r`Ouvrez le réseau « WSCC 9 », puis « WSCC 9 + formeur », et comparez les deux tableaux.`, en: r`Open the “WSCC 9” network, then “WSCC 9 + GFM”, and compare the two tables.` },
      answer: {
        fr: r`Remplacer un alternateur par un onduleur formeur supprime ses modes mécaniques et en crée d’autres, liés à la synchronisation du formeur (sa boucle de puissance, son inertie virtuelle) et à ses régulations. Ici, un mode de synchronisme très amorti apparaît, dominé par le formeur. Les modes restants des alternateurs changent de fréquence et d’amortissement : on ne peut pas raisonner machine par machine.`,
        en: r`Replacing a generator with a grid-forming inverter removes its mechanical modes and creates others, tied to the inverter’s synchronisation (its power loop, its virtual inertia) and its controls. Here a heavily damped synchronisation mode appears, dominated by the grid-forming unit. The generators’ remaining modes change frequency and damping: you cannot reason machine by machine.`,
      },
    },
    ieee39: {
      hint: { fr: r`Réseau « IEEE 39 », puis cherchez dans le tableau un mode « synchronisme » avec ζ en orange (sous 5 %).`, en: r`“IEEE 39” network, then look in the table for a “synchronisation” mode with ζ in orange (below 5 %).` },
      answer: {
        fr: r`Sur le réseau de Nouvelle-Angleterre (10 machines, 403 états), plusieurs modes électromécaniques entre 1,2 et 1,5 Hz sont amortis à moins de 5 %, et l’un est même légèrement instable. Les facteurs de participation désignent les machines où un PSS serait le plus efficace : $$\text{site PSS} = \arg\max_k\ p_{\Delta\omega_k,\,i}$$ C’est la démarche réelle de réglage des stabilisateurs sur un grand réseau.`,
        en: r`On the New England network (10 machines, 403 states), several electromechanical modes between 1.2 and 1.5 Hz are damped below 5 %, and one is even slightly unstable. The participation factors point to the machines where a PSS would work best: $$\text{PSS site} = \arg\max_k\ p_{\Delta\omega_k,\,i}$$ This is how stabilisers are actually tuned on a large grid.`,
      },
    },
  },

  reduction: {
    emt: {
      hint: { fr: r`Niveau « EMT », puis faites glisser le curseur de temps jusqu’à la fin.`, en: r`“EMT” level, then drag the time cursor to the end.` },
      answer: {
        fr: r`Le modèle EMT résout toutes les équations différentielles, y compris celles des lignes et des flux du stator, avec un pas de l’ordre de 10 à 50 µs : $$v = Ri + L\frac{di}{dt}, \qquad \frac{d\psi}{dt} = v - Ri \quad \text{(à chaque instant)}$$ Il est la référence, mais coûteux : près d’une minute pour 3 s d’une seule machine.`,
        en: r`The EMT model solves every differential equation, including the lines’ and the stator fluxes’, with a step of about 10 to 50 µs: $$v = Ri + L\frac{di}{dt}, \qquad \frac{d\psi}{dt} = v - Ri \quad \text{(at every instant)}$$ It is the reference, but costly: almost a minute for 3 s of a single machine.`,
      },
    },
    rms: {
      hint: { fr: r`Choisissez le niveau « RMS ».`, en: r`Choose the “RMS” level.` },
      answer: {
        fr: r`Le réseau est remplacé par des phaseurs : les transitoires à 50 Hz, qui s’éteignent en quelques périodes, disparaissent. $$L\frac{di}{dt} \to jX\,\underline I$$ Les modes électromécaniques ne bougent presque pas (0,603 → 0,604 Hz), l’écart à l’EMT reste de quelques mHz, et le calcul est environ dix fois plus rapide. C’est le modèle des études de stabilité classiques.`,
        en: r`The network is replaced by phasors: the 50 Hz transients, which die out within a few cycles, disappear. $$L\frac{di}{dt} \to jX\,\underline I$$ The electromechanical modes barely move (0.603 → 0.604 Hz), the gap to EMT stays at a few mHz, and the run is about ten times faster. This is the model of classical stability studies.`,
      },
    },
    o4: {
      hint: { fr: r`Choisissez « ordre 4 », puis « ordre 3 ».`, en: r`Choose “order 4”, then “order 3”.` },
      answer: {
        fr: r`Chaque ordre de machine retire des flux rapides : amortisseurs (ordre 4), puis l’axe q transitoire (ordre 3). Les modes électromécaniques restent bien amortis mais les modes locaux ralentissent un peu (1,30 → 1,04 Hz à l’ordre 3) : le modèle est moins précis, mais suffisant pour beaucoup d’études de grande taille. $$\text{ordre 4 : } \dot E'_q,\ \dot E'_d,\ \dot\delta,\ \dot\omega \qquad \text{ordre 3 : } \dot E'_q,\ \dot\delta,\ \dot\omega$$`,
        en: r`Each machine order removes fast fluxes: dampers (order 4), then the transient q axis (order 3). The electromechanical modes stay well damped but the local modes slow down a little (1.30 → 1.04 Hz at order 3): the model is less accurate, but enough for many large studies. $$\text{order 4: } \dot E'_q,\ \dot E'_d,\ \dot\delta,\ \dot\omega \qquad \text{order 3: } \dot E'_q,\ \dot\delta,\ \dot\omega$$`,
      },
    },
    classical: {
      hint: { fr: r`Choisissez le niveau « classique ».`, en: r`Choose the “classical” level.` },
      answer: {
        fr: r`Le modèle classique garde seulement l’angle et la vitesse, avec une f.é.m. constante derrière $X'_d$ : $$\frac{2H}{\omega_0}\ddot\delta = P_m - \frac{E'V}{X'_d}\sin\delta - D\,\Delta\omega$$ L’excitation ne peut plus agir, donc le PSS non plus : l’amortissement tombe à 1 %. Bon pour un premier calcul de stabilité transitoire (8.1), trompeur pour les oscillations.`,
        en: r`The classical model keeps only angle and speed, with a constant EMF behind $X'_d$: $$\frac{2H}{\omega_0}\ddot\delta = P_m - \frac{E'V}{X'_d}\sin\delta - D\,\Delta\omega$$ Excitation can no longer act, so neither can the PSS: damping falls to 1 %. Fine for a first transient-stability estimate (8.1), misleading for oscillations.`,
      },
    },
    linear: {
      hint: { fr: r`Cliquez sur la pastille « vitesse, modèle linéarisé » au-dessus de l’oscilloscope.`, en: r`Click the “speed, linearised model” chip above the oscilloscope.` },
      answer: {
        fr: r`La réponse linéarisée est celle de $\dot{\Delta x} = A\,\Delta x$, calculée à partir des mêmes valeurs propres que l’analyse modale. Pour un saut de phase de 20°, elle suit la simulation non linéaire à moins de 10 % près : l’analyse aux petits signaux (8.2, 8.7, 8.8) est fiable pour ces perturbations modérées. Pour les grands défauts, il faut revenir à la simulation non linéaire (8.1).`,
        en: r`The linearised response is that of $\dot{\Delta x} = A\,\Delta x$, built from the same eigenvalues as the modal analysis. For a 20° phase jump, it follows the nonlinear simulation within 10 %: small-signal analysis (8.2, 8.7, 8.8) is reliable for such moderate disturbances. For large faults, nonlinear simulation is needed again (8.1).`,
      },
    },
  },
};
