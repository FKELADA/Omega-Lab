// Module 4, second part (4.3, 4.5, 4.7) — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers4b: Answers = {
  oltc: {
    predict: {
      hint: { fr: r`Le régleur ne réagit pas tout de suite, et il ne peut bouger que d’une prise à la fois (1,25 %).`, en: r`The tap changer does not react at once, and it can only move one tap at a time (1.25 %).` },
      answer: {
        fr: r`La tension aval tombe d’abord avec l’amont, d’environ 8 %. Le régleur attend sa temporisation $T_1 = 30$ s, puis monte d’une prise toutes les $T_2 = 10$ s, en **marches d’escalier** de 1,25 %, jusqu’à revenir dans la bande : $$V_{BT} = V_{HT}\,(1 + n\,\Delta) - \varepsilon \quad\Rightarrow\quad n \approx \frac{V_c + \varepsilon}{V_{HT}\,\Delta} - \frac{1}{\Delta} = 9$$ Il lui faut ici 7 prises et un peu plus d’une minute et demie. Le régleur règle la tension **lentement** : il corrige les variations de charge de la journée, pas les creux brefs.`,
        en: r`The downstream voltage first falls with the upstream one, by about 8 %. The tap changer waits for its delay $T_1 = 30$ s, then moves up one tap every $T_2 = 10$ s, in 1.25 % **stair steps**, until it is back in the band: $$V_{LV} = V_{HV}\,(1 + n\,\Delta) - \varepsilon \quad\Rightarrow\quad n \approx \frac{V_c + \varepsilon}{V_{HV}\,\Delta} - \frac{1}{\Delta} = 9$$ Here it takes 7 taps and just over a minute and a half. The tap changer regulates **slowly**: it corrects the daily load swings, not short dips.`,
      },
    },
    limit: {
      hint: { fr: r`Avec 12 prises de 1,25 %, le régleur ne peut ajouter qu’environ 15 %. Descendez $V_{HT}$ vers 0,86 pu.`, en: r`With 12 taps of 1.25 %, the tap changer can only add about 15 %. Bring $V_{HV}$ down to about 0.86 pu.` },
      answer: {
        fr: r`En butée, la tension la plus haute que le régleur sait rendre est $$V_{BT,max} = V_{HT}\,(1 + 12 \times 0{,}0125) - 0{,}03 = 1{,}15\,V_{HT} - 0{,}03$$ Elle reste sous la bande dès que $V_{HT} < 0{,}887$ pu environ. Au-delà, le régleur ne règle plus rien : il faut du réactif local (condensateurs, leçon 4.9) ou relever la tension amont. Pire, en tirant sur un réseau déjà faible, des régleurs qui remontent tous ensemble peuvent pousser vers l’**effondrement de tension** (leçon 8.3) ; c’est pourquoi on peut les **bloquer** en situation dégradée.`,
        en: r`At its end stop, the highest voltage the tap changer can deliver is $$V_{LV,max} = V_{HV}\,(1 + 12 \times 0.0125) - 0.03 = 1.15\,V_{HV} - 0.03$$ It stays below the band as soon as $V_{HV} < 0.887$ pu or so. Beyond that the tap changer no longer regulates anything: local reactive power (capacitors, lesson 4.9) or a higher upstream voltage is needed. Worse, by pulling on a grid that is already weak, tap changers all raising together can push towards **voltage collapse** (lesson 8.3); that is why they can be **blocked** in degraded conditions.`,
      },
    },
    hunting: {
      hint: { fr: r`Un pas de prise vaut 1,25 %. Que se passe-t-il si la bande fait moins que ça ?`, en: r`One tap step is 1.25 %. What happens if the band is narrower than that?` },
      answer: {
        fr: r`Avec une bande de 0,8 % (±0,4 %), aucune prise ne tombe dedans : la prise 9 donne −0,65 %, la prise 10 donne +0,5 %. Le régulateur monte, se retrouve au-dessus, redescend, et ainsi de suite : c’est le **pompage**. La règle de réglage : $$DB > \Delta = 1{,}25\,\% \qquad (\text{souvent } DB \approx 1{,}5 \text{ à } 2\,\Delta)$$ Chaque manœuvre use le commutateur, qui est l’organe le plus entretenu d’un transformateur.`,
        en: r`With a 0.8 % band (±0.4 %), no tap lands inside it: tap 9 gives −0.65 %, tap 10 gives +0.5 %. The regulator goes up, ends above, comes back down, and so on: this is **hunting**. The setting rule: $$DB > \Delta = 1.25\,\% \qquad (\text{often } DB \approx 1.5 \text{ to } 2\,\Delta)$$ Every operation wears the diverter switch, the most maintained part of a transformer.`,
      },
    },
    delay: {
      hint: { fr: r`Bande morte à 2 %, puis temporisation $T_1$ à 10 s.`, en: r`Dead band at 2 %, then delay $T_1$ at 10 s.` },
      answer: {
        fr: r`La tension revient 20 s plus tôt. Mais un régleur trop rapide manœuvre pour chaque creux de quelques secondes (démarrage de moteur, défaut éliminé) qui aurait disparu tout seul. Surtout, des régleurs **en cascade** (poste source HTB/HTA puis, ailleurs, d’autres étages) doivent être **échelonnés** : $$T_{amont} < T_{aval}$$ L’étage amont agit d’abord ; sinon les deux corrigent la même chute et se renvoient la balle. En pratique, les premières temporisations se comptent en dizaines de secondes.`,
        en: r`The voltage comes back 20 s earlier. But a tap changer that is too fast operates for every dip of a few seconds (motor start, cleared fault) that would have gone away on its own. Above all, **cascaded** tap changers (transmission/distribution substation, then further stages) must be **graded**: $$T_{upstream} < T_{downstream}$$ The upstream stage acts first; otherwise both correct the same drop and bounce it back and forth. In practice first delays are tens of seconds.`,
      },
    },
    pst: {
      hint: { fr: r`Le transit de la ligne 1 vaut $P_1 = (P X_2 + \alpha)/(X_1 + X_2)$. Il faut un $\alpha$ négatif.`, en: r`Line 1 carries $P_1 = (P X_2 + \alpha)/(X_1 + X_2)$. You need a negative $\alpha$.` },
      answer: {
        fr: r`Sans déphaseur, la puissance se partage à l’inverse des réactances : $P_1 = P\,X_2/(X_1+X_2) = 0{,}58$ pu. Le déphaseur ajoute un angle $\alpha$ en série avec la ligne 1 : $$P_1 = \frac{P\,X_2 + \alpha}{X_1 + X_2} \le 0{,}45 \;\Rightarrow\; \alpha \le -0{,}08\ \text{rad} \approx -4{,}6^\circ$$ La ligne 2 reprend la différence. On contrôle ainsi un transit **sans redispatcher la production** : c’est un levier du gestionnaire de transport pour tenir le N-1 (Module 9).`,
        en: r`With no phase shifter, power splits in inverse proportion to the reactances: $P_1 = P\,X_2/(X_1+X_2) = 0.58$ pu. The phase shifter adds an angle $\alpha$ in series with line 1: $$P_1 = \frac{P\,X_2 + \alpha}{X_1 + X_2} \le 0.45 \;\Rightarrow\; \alpha \le -0.08\ \text{rad} \approx -4.6^\circ$$ Line 2 takes up the difference. A flow is thus controlled **without redispatching generation**: a lever the TSO uses to hold N-1 (Module 9).`,
      },
    },
    group: {
      hint: { fr: r`« D » majuscule : triangle côté HT. « yn » : étoile avec neutre sorti côté BT.`, en: r`Capital “D”: delta on the HV side. “yn”: star with the neutral brought out on the LV side.` },
      answer: {
        fr: r`**Dyn11** : triangle en HTA, étoile avec neutre en BT, BT en avance de 30° (indice 11) : $$\underline V_a = \underline V_A\,e^{-j\,11\times30^\circ} = \underline V_A\,e^{+j30^\circ}$$ Le neutre BT sert aux clients monophasés et à la mise à la terre (régime TT en France). Un défaut à la terre en BT crée un courant homopolaire qui **circule dans le triangle** sans remonter en HTA : les protections HTA ne le voient pas. Dyn5 marcherait aussi, mais deux transformateurs ne peuvent être mis **en parallèle** que s’ils ont le même indice : on normalise donc un seul couplage.`,
        en: r`**Dyn11**: delta on MV, star with neutral on LV, LV leading by 30° (clock 11): $$\underline V_a = \underline V_A\,e^{-j\,11\times30^\circ} = \underline V_A\,e^{+j30^\circ}$$ The LV neutral serves single-phase customers and earthing (TT system in France). An LV earth fault creates a zero-sequence current that **circulates inside the delta** without reaching the MV grid: MV protection does not see it. Dyn5 would also work, but two transformers can only run **in parallel** if they share the same clock number, so a single group is standardised.`,
      },
    },
  },

  smdyn: {
    predict: {
      hint: { fr: r`Le régulateur de vitesse ajoute de la puissance proportionnellement à l’écart de fréquence. Que faut-il pour qu’il fournisse 0,1 pu de plus ?`, en: r`The governor adds power in proportion to the frequency error. What is needed for it to deliver 0.1 pu more?` },
      answer: {
        fr: r`La fréquence chute (la charge freine le rotor), passe par un **creux** vers 49,65 Hz, puis remonte **sans revenir à 50 Hz**. Le régulateur est proportionnel : pour fournir $\Delta P$ en plus, il lui faut un écart permanent $$\Delta f_\infty = -\frac{\Delta P\,f_0}{1/s + D} = -\frac{0{,}1 \times 50}{20 + 0{,}9} \approx -0{,}24\ \text{Hz}$$ Le creux dépend de l’inertie $H$ et de la vitesse de la turbine. Ramener 50 Hz est le rôle du **réglage secondaire**, plus lent, qui décale la consigne (Module 9).`,
        en: r`The frequency drops (the load brakes the rotor), goes through a **nadir** near 49.65 Hz, then rises **without returning to 50 Hz**. The governor is proportional: to deliver $\Delta P$ more, it needs a standing error $$\Delta f_\infty = -\frac{\Delta P\,f_0}{1/s + D} = -\frac{0.1 \times 50}{20 + 0.9} \approx -0.24\ \text{Hz}$$ The nadir depends on the inertia $H$ and the turbine speed. Bringing back 50 Hz is the job of the slower **secondary control**, which shifts the setpoint (Module 9).`,
      },
    },
    droop: {
      hint: { fr: r`Il faut $\Delta f_\infty \ge -0{,}2$ Hz, soit $1/s + D \ge 25$ environ.`, en: r`You need $\Delta f_\infty \ge -0.2$ Hz, i.e. $1/s + D \ge 25$ or so.` },
      answer: {
        fr: r`Avec un statisme de 4 % ou moins, $1/s \ge 25$ : $$\Delta f_\infty = -\frac{0{,}1 \times 50}{25 + 0{,}9} \approx -0{,}19\ \text{Hz}$$ Un statisme plus faible rend la machine plus « raide » : elle répond plus fort à un même écart. Mais sur un grand réseau, toutes les machines en réglage primaire partagent le déséquilibre au prorata de $P_n/s$ : si une seule avait un statisme très faible, elle prendrait presque tout. Les statismes sont donc **harmonisés**, typiquement de 4 à 6 %.`,
        en: r`With a droop of 4 % or less, $1/s \ge 25$: $$\Delta f_\infty = -\frac{0.1 \times 50}{25 + 0.9} \approx -0.19\ \text{Hz}$$ A smaller droop makes the machine “stiffer”: it responds more strongly to the same error. But on a large grid, all machines in primary control share an imbalance in proportion to $P_n/s$: one with a very small droop would take almost all of it. Droops are therefore **harmonised**, typically 4 to 6 %.`,
      },
    },
    classical: {
      hint: { fr: r`Choisissez l’essai « défaut puis déclenchement de ligne » et le modèle classique.`, en: r`Choose the “fault then line trip” test and the classical model.` },
      answer: {
        fr: r`Le modèle classique garde une f.é.m. $E'$ **constante** derrière $X'_d$ : $$P_e = \frac{E' V}{X'_d + X_e}\sin\delta$$ Pendant le défaut, $P_e$ s’effondre, le rotor accélère ; après, il oscille autour d’un nouvel angle, plus grand, car la ligne perdue a augmenté $X_e$. La tension aux bornes reste plus basse : rien ne vient relever l’excitation. Ce modèle suffit pour la **première oscillation** (leçon 8.1), pas au-delà.`,
        en: r`The classical model keeps a **constant** EMF $E'$ behind $X'_d$: $$P_e = \frac{E' V}{X'_d + X_e}\sin\delta$$ During the fault $P_e$ collapses and the rotor speeds up; afterwards it swings around a new, larger angle, since the lost line has increased $X_e$. The terminal voltage stays lower: nothing raises the field. This model is enough for the **first swing** (lesson 8.1), not beyond.`,
      },
    },
    oneaxis: {
      hint: { fr: r`Modèle « un axe », gain $K_A = 0$.`, en: r`“One-axis” model, gain $K_A = 0$.` },
      answer: {
        fr: r`Le flux d’excitation devient un état : $$T'_{d0}\,\frac{dE'_q}{dt} = E_{fd} - E'_q - (X_d - X'_d)\,i_d$$ Après la perte de la ligne, le courant $i_d$ augmente (réaction d’induit démagnétisante) et $E'_q$ **s’affaisse** en quelques secondes ($T'_{d0} = 8$ s). La tension finale descend vers 0,97 pu, plus bas qu’avec le modèle classique. Le modèle classique était optimiste sur la tension, mais aussi sur l’amortissement : le circuit d’excitation en apporte un peu.`,
        en: r`The field flux becomes a state: $$T'_{d0}\,\frac{dE'_q}{dt} = E_{fd} - E'_q - (X_d - X'_d)\,i_d$$ After the line is lost, the current $i_d$ rises (demagnetising armature reaction) and $E'_q$ **sags** over a few seconds ($T'_{d0} = 8$ s). The final voltage falls to about 0.97 pu, lower than with the classical model. The classical model was optimistic about voltage, but also about damping: the field circuit adds some.`,
      },
    },
    avr: {
      hint: { fr: r`Gain $K_A$ entre 20 et 50, modèle à un axe ; affichez $E_{fd}$.`, en: r`Gain $K_A$ between 20 and 50, one-axis model; show $E_{fd}$.` },
      answer: {
        fr: r`L’AVR mesure $V_t$ et pilote l’excitation : $$T_A\,\frac{dE_{fd}}{dt} = K_A\,(V_{ref} - V_t) - E_{fd}$$ Pendant le défaut, la tension s’effondre et $E_{fd}$ monte au **plafond** (5 pu) : c’est le « forçage » d’excitation, qui aide la machine à rester synchrone. Ensuite, il relève $E'_q$ jusqu’à ramener $V_t$ à 1 pu malgré la ligne perdue. L’écart statique vaut $E_{fd}/K_A$, d’où un gain de quelques dizaines au moins.`,
        en: r`The AVR measures $V_t$ and drives the field: $$T_A\,\frac{dE_{fd}}{dt} = K_A\,(V_{ref} - V_t) - E_{fd}$$ During the fault the voltage collapses and $E_{fd}$ goes to its **ceiling** (5 pu): this is field forcing, which helps the machine stay in step. Then it raises $E'_q$ until $V_t$ is back at 1 pu despite the lost line. The steady error is $E_{fd}/K_A$, hence a gain of at least a few tens.`,
      },
    },
    weak: {
      hint: { fr: r`$K_A \ge 100$ et $X_e \ge 0{,}5$ pu, toujours avec le modèle à un axe.`, en: r`$K_A \ge 100$ and $X_e \ge 0.5$ pu, still with the one-axis model.` },
      answer: {
        fr: r`Un AVR rapide à gain élevé corrige la tension en modulant $E'_q$, mais avec un retard de phase dû à $T'_{d0}$. Sur un réseau faible et à forte charge, ce couple électrique arrive **en opposition** avec la vitesse : il retire de l’amortissement. Dans le modèle de Heffron–Phillips, c’est le signe de $K_5$ qui devient négatif : $$\Delta T_e = \underbrace{K_S\,\Delta\delta}_{\text{synchronisant}} + \underbrace{K_D\,\Delta\omega}_{\text{amortissant}}, \qquad K_D < 0$$ Les oscillations croissent. Le remède n’est pas de ralentir l’AVR (on perdrait la tenue de tension) mais d’ajouter un **stabilisateur (PSS)** qui injecte un signal en phase avec la vitesse (leçon 8.2).`,
        en: r`A fast high-gain AVR corrects the voltage by moving $E'_q$, but with a phase lag due to $T'_{d0}$. On a weak, heavily loaded grid this electrical torque arrives **against** the speed: it removes damping. In the Heffron–Phillips model, the sign of $K_5$ turns negative: $$\Delta T_e = \underbrace{K_S\,\Delta\delta}_{\text{synchronising}} + \underbrace{K_D\,\Delta\omega}_{\text{damping}}, \qquad K_D < 0$$ The swings grow. The cure is not to slow the AVR (voltage support would be lost) but to add a **stabiliser (PSS)** that injects a signal in phase with speed (lesson 8.2).`,
      },
    },
  },

  loadexp: {
    z: {
      hint: { fr: r`Une impédance constante consomme $P = V^2/R$.`, en: r`A constant impedance draws $P = V^2/R$.` },
      answer: {
        fr: r`Avec $\alpha = 2$, $$P = P_0\,V^2 = 0{,}95^2 \approx 0{,}90\ \text{pu}$$ C’est le comportement d’un radiateur ou d’une ampoule à incandescence : une baisse de tension de 5 % réduit la puissance de près de 10 %. Le modèle exponentiel couvre d’un seul paramètre toute la gamme entre la puissance constante ($\alpha = 0$) et l’impédance constante ($\alpha = 2$).`,
        en: r`With $\alpha = 2$, $$P = P_0\,V^2 = 0.95^2 \approx 0.90\ \text{pu}$$ That is how a heater or an incandescent bulb behaves: a 5 % voltage drop cuts power by nearly 10 %. The exponential model covers with a single parameter the whole range between constant power ($\alpha = 0$) and constant impedance ($\alpha = 2$).`,
      },
    },
    p: {
      hint: { fr: r`Mettez l’exposant à zéro : $V^0 = 1$.`, en: r`Set the exponent to zero: $V^0 = 1$.` },
      answer: {
        fr: r`Avec $\alpha = 0$, $P = P_0$ quelle que soit la tension : le courant $I = P/V$ **augmente** quand la tension baisse. C’est la charge la plus défavorable pour la stabilité de tension : elle n’aide pas le réseau quand il faiblit. Les alimentations à découpage, les variateurs de vitesse et, après quelques minutes, les charges thermostatées s’en approchent (leçon 4.6 : rétablissement).`,
        en: r`With $\alpha = 0$, $P = P_0$ whatever the voltage: the current $I = P/V$ **rises** when the voltage falls. This is the worst load for voltage stability: it does not help the grid when it weakens. Switched-mode supplies, variable-speed drives and, after a few minutes, thermostat-controlled loads come close to it (lesson 4.6: recovery).`,
      },
    },
    zip: {
      hint: { fr: r`Dérivez le ZIP en $V = 1$ : $\alpha \approx 2a_Z + a_I$.`, en: r`Differentiate the ZIP at $V = 1$: $\alpha \approx 2a_Z + a_I$.` },
      answer: {
        fr: r`La pente relative du ZIP en 1 pu vaut $$\alpha = \frac{V}{P}\frac{dP}{dV}\Big|_{V=1} = 2a_Z + a_I = 2 \times 0{,}4 + 0{,}3 = 1{,}1$$ Les deux courbes coïncident autour de 1 pu et s’écartent pour de grands creux (en 0,7 pu, le ZIP donne 0,70 et l’exponentielle 0,68). On utilise l’exponentiel quand on a mesuré la sensibilité autour du point de fonctionnement, le ZIP quand on connaît la composition de la charge. C’est aussi le **facteur CVR** : 1 % de tension en moins, 1,1 % d’énergie en moins.`,
        en: r`The relative slope of the ZIP at 1 pu is $$\alpha = \frac{V}{P}\frac{dP}{dV}\Big|_{V=1} = 2a_Z + a_I = 2 \times 0.4 + 0.3 = 1.1$$ The two curves coincide around 1 pu and part ways for deep dips (at 0.7 pu the ZIP gives 0.70 and the exponential 0.68). The exponential model is used when the sensitivity around the operating point has been measured, the ZIP when the load composition is known. It is also the **CVR factor**: 1 % less voltage, 1.1 % less energy.`,
      },
    },
    q: {
      hint: { fr: r`L’exposant réactif $\beta$ est le second curseur.`, en: r`The reactive exponent $\beta$ is the second slider.` },
      answer: {
        fr: r`Avec $\beta = 3$ : $$Q = Q_0\,V^3 = 0{,}4 \times 0{,}95^3 \approx 0{,}343\ \text{pu} \quad (-14\,\%)$$ contre −5 % pour l’actif. Le réactif d’un moteur est surtout son courant magnétisant, qui suit le flux, donc la tension, de façon très non linéaire près de la saturation. Pour le plan de tension, c’est une bonne nouvelle : quand la tension baisse, la charge réclame moins de réactif. Mais c’est l’inverse pour un moteur proche du **décrochage** (leçon 4.8), dont le réactif explose.`,
        en: r`With $\beta = 3$: $$Q = Q_0\,V^3 = 0.4 \times 0.95^3 \approx 0.343\ \text{pu} \quad (-14\,\%)$$ against −5 % for active power. A motor’s reactive power is mostly its magnetising current, which follows flux, hence voltage, very non-linearly near saturation. For voltage control that is good news: when voltage falls, the load asks for less reactive power. The opposite holds for a motor near **stall** (lesson 4.8), whose reactive draw soars.`,
      },
    },
    freq: {
      hint: { fr: r`$K_{pf} = 2$, $\Delta f = -0{,}5$ Hz. L’écart relatif de fréquence est de 1 %.`, en: r`$K_{pf} = 2$, $\Delta f = -0.5$ Hz. The relative frequency deviation is 1 %.` },
      answer: {
        fr: r`$$\frac{\Delta P}{P_0} = K_{pf}\,\frac{\Delta f}{f_0} = 2 \times \frac{-0{,}5}{50} = -2\,\%$$ Moteurs, pompes et ventilateurs tournent moins vite et consomment moins. Cette **autoréglage** freine toute chute de fréquence, même sans régulateur : après la perte de 3 % de production, il suffirait d’un écart de $\Delta f = -0{,}03 \times 50 / K_{pf}$, soit 0,75 Hz ici. Avec les régulateurs (statisme 5 %), l’écart tombe à quelques centièmes de hertz. Avec l’électronique de puissance, cet effet tend à diminuer : les variateurs découplent les moteurs de la fréquence du réseau.`,
        en: r`$$\frac{\Delta P}{P_0} = K_{pf}\,\frac{\Delta f}{f_0} = 2 \times \frac{-0.5}{50} = -2\,\%$$ Motors, pumps and fans turn slower and draw less. This **self-regulation** slows any frequency drop, even without governors: after losing 3 % of generation, a deviation of $\Delta f = -0.03 \times 50 / K_{pf}$ would be enough, i.e. 0.75 Hz here. With governors (5 % droop) the deviation falls to a few hundredths of a hertz. With power electronics this effect is shrinking: drives decouple motors from the grid frequency.`,
      },
    },
  },
};
