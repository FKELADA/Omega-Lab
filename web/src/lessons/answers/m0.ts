// Module 0 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers0: Answers = {
  day: {
    predict: {
      hint: {
        fr: r`Pensez à votre propre journée : que fait-on la nuit, le matin au lever, le soir en rentrant ? En hiver, le chauffage et l’éclairage pèsent lourd.`,
        en: r`Think of your own day: what happens at night, when people get up, when they come home? In winter, heating and lighting weigh a lot.`,
      },
      answer: {
        fr: r`La consommation ne descend jamais à zéro : la nuit, il reste un **socle** (industrie, froid, chauffage). Elle monte au réveil, forme un plateau la journée et culmine vers **19 h** (éclairage, cuisson, chauffage en rentrant). Le rapport pointe/creux est typiquement de 1,3 à 1,6. Le réseau doit produire **à chaque instant** exactement ce qui est consommé : $$P_{\text{prod}}(t) = P_{\text{conso}}(t) + P_{\text{pertes}}(t)$$`,
        en: r`Demand never drops to zero: at night there is a **base** (industry, cooling, heating). It rises in the morning, plateaus during the day and peaks around **7 pm** (lighting, cooking, heating when people come home). Peak-to-trough ratios are typically 1.3 to 1.6. The grid must produce **at every instant** exactly what is consumed: $$P_{\text{gen}}(t) = P_{\text{load}}(t) + P_{\text{losses}}(t)$$`,
      },
    },
    day: {
      hint: { fr: r`Appuyez sur ▶ en bas, ou faites glisser le curseur de temps jusqu’à la fin de la journée.`, en: r`Press ▶ at the bottom, or drag the time cursor to the end of the day.` },
      answer: {
        fr: r`Les productions « fatales » (nucléaire constant, éolien et soleil selon la météo) sont prises telles quelles ; la production **flexible** (gaz, hydraulique, imports) fait le reste : $$P_{\text{flex}}(t) = P_{\text{conso}}(t) - P_{\text{nucl}} - P_{\text{éol}}(t) - P_{\text{PV}}(t)$$ C’est elle qui suit la courbe de charge minute par minute.`,
        en: r`“Must-run” generation (constant nuclear, wind and sun as the weather allows) is taken as it comes; **flexible** generation (gas, hydro, imports) covers the rest: $$P_{\text{flex}}(t) = P_{\text{load}}(t) - P_{\text{nucl}} - P_{\text{wind}}(t) - P_{\text{PV}}(t)$$ It is what follows the load curve minute by minute.`,
      },
    },
    voltage: {
      hint: { fr: r`Le curseur « tension de transport » est en bas. Les pertes dépendent du courant, et le courant de la tension.`, en: r`The “transmission voltage” control is at the bottom. Losses depend on current, and current on voltage.` },
      answer: {
        fr: r`À puissance donnée, le courant est inversement proportionnel à la tension, et les pertes Joule au carré du courant : $$I = \frac{P}{\sqrt3\,U\cos\varphi}, \qquad P_{\text{pertes}} = 3RI^2 \propto \frac{1}{U^2}$$ Passer de 63 à 400 kV divise les pertes par $(400/63)^2 \approx 40$. C’est pourquoi le transport se fait en très haute tension et la distribution en tension plus basse, grâce aux transformateurs.`,
        en: r`For a given power, current is inversely proportional to voltage, and Joule losses go with current squared: $$I = \frac{P}{\sqrt3\,U\cos\varphi}, \qquad P_{\text{losses}} = 3RI^2 \propto \frac{1}{U^2}$$ Going from 63 to 400 kV divides losses by $(400/63)^2 \approx 40$. That is why transmission is at very high voltage and distribution at lower voltage, thanks to transformers.`,
      },
    },
    duck: {
      hint: { fr: r`Montez le curseur du photovoltaïque à 30 GW ou plus et regardez la courbe de la production flexible vers midi.`, en: r`Raise the PV slider to 30 GW or more and look at the flexible generation around noon.` },
      answer: {
        fr: r`La **charge nette** (consommation moins renouvelables) creuse à midi et remonte brutalement au coucher du soleil : c’est la « courbe du canard », observée d’abord en Californie. Deux problèmes : un **excédent** à midi (il faut exporter, stocker ou écrêter) et une **rampe** très raide le soir, que seuls des moyens flexibles et rapides peuvent suivre.`,
        en: r`The **net load** (demand minus renewables) dips at noon and climbs sharply at sunset: the “duck curve”, first seen in California. Two problems: a **surplus** at noon (export, store or curtail) and a very steep **ramp** in the evening that only fast, flexible units can follow.`,
      },
    },
    balance: {
      hint: { fr: r`Réduisez le photovoltaïque à environ 10 GW, puis ajustez le nucléaire pour que le creux de la production flexible reste positif.`, en: r`Bring PV down to about 10 GW, then adjust nuclear so the flexible generation never goes negative.` },
      answer: {
        fr: r`Il faut que la charge nette reste dans la plage du parc flexible : $$0 \le P_{\text{conso}}(t) - P_{\text{nucl}} - P_{\text{éol}}(t) - P_{\text{PV}}(t) \le 25\ \text{GW} \quad \forall t$$ La production constante doit être assez basse pour ne pas créer d’excédent la nuit et à midi, mais assez haute pour que la pointe du soir reste sous 25 GW. Au-delà d’une certaine part de solaire, seul le **stockage** (batteries, pompage) peut déplacer l’énergie de midi vers le soir.`,
        en: r`The net load must stay within the flexible fleet’s range: $$0 \le P_{\text{load}}(t) - P_{\text{nucl}} - P_{\text{wind}}(t) - P_{\text{PV}}(t) \le 25\ \text{GW} \quad \forall t$$ Constant generation must be low enough to avoid a surplus at night and at noon, but high enough to keep the evening peak under 25 GW. Beyond some solar share, only **storage** (batteries, pumped hydro) can shift energy from noon to evening.`,
      },
    },
  },

  blackout: {
    predict: {
      hint: { fr: r`Une perte de production, c’est plus de consommation que de production : les machines ralentissent. Pensez aussi aux réserves qui réagissent en quelques secondes.`, en: r`Losing generation means more load than production: machines slow down. Think too about reserves reacting within seconds.` },
      answer: {
        fr: r`La fréquence **chute** immédiatement, avec une pente initiale fixée par l’inertie (le RoCoF), atteint un **creux** (nadir) quand la réserve primaire a compensé la perte, puis remonte partiellement et se stabilise **sous** 50 Hz : $$\left.\frac{df}{dt}\right|_{0^+} = -\frac{\Delta P}{2HS}\,f_0$$ Ici, les protections RoCoF et le délestage modifient fortement cette trajectoire.`,
        en: r`Frequency **drops** at once, with an initial slope set by inertia (the RoCoF), reaches a **nadir** when primary reserve has made up the loss, then partly recovers and settles **below** 50 Hz: $$\left.\frac{df}{dt}\right|_{0^+} = -\frac{\Delta P}{2HS}\,f_0$$ Here, RoCoF protection and load shedding strongly change that path.`,
      },
    },
    cascade: {
      hint: { fr: r`Appuyez sur ▶ et suivez la chronologie à gauche jusqu’à la fin de la minute.`, en: r`Press ▶ and follow the timeline on the left to the end of the minute.` },
      answer: {
        fr: r`Le 9 août 2019, un coup de foudre a fait perdre d’abord une éolienne en mer et une centrale, puis les protections **RoCoF** et de déplacement de phase ont déconnecté de la production décentralisée : la perte totale a dépassé la réserve prévue. Sous **48,8 Hz**, le délestage automatique a coupé environ 1 million de clients. Leçon : une protection pensée pour un incident local peut **aggraver** un incident global.`,
        en: r`On 9 August 2019, a lightning strike first tripped an offshore wind farm and a power station, then **RoCoF** and vector-shift protection disconnected distributed generation: the total loss exceeded the planned reserve. Below **48.8 Hz**, automatic load shedding cut about 1 million customers. Lesson: a protection designed for a local incident can **worsen** a system-wide one.`,
      },
    },
    inertia: {
      hint: { fr: r`Le curseur $H$ est l’inertie : descendez-le vers 2 s.`, en: r`The $H$ slider is inertia: bring it down to about 2 s.` },
      answer: {
        fr: r`La pente initiale est inversement proportionnelle à l’inertie : diviser $H$ par deux double le RoCoF. $$\text{RoCoF} = \frac{\Delta P\,f_0}{2HS}$$ Les éoliennes et panneaux, raccordés par des onduleurs, n’apportent pas d’inertie naturelle : la fréquence chute plus vite et le creux est plus profond, avant que les réserves aient le temps d’agir.`,
        en: r`The initial slope is inversely proportional to inertia: halving $H$ doubles the RoCoF. $$\text{RoCoF} = \frac{\Delta P\,f_0}{2HS}$$ Wind turbines and solar panels, connected through inverters, bring no natural inertia: frequency falls faster and deeper before reserves have time to act.`,
      },
    },
    settings: {
      hint: { fr: r`Remettez $H$ à 4 s, puis basculez « protections RoCoF » sur arrêt.`, en: r`Set $H$ back to 4 s, then switch “RoCoF protection” off.` },
      answer: {
        fr: r`Sans les déclenchements RoCoF, la perte reste de 1000 MW, la réserve suffit et le creux reste au-dessus du seuil de délestage. Après 2019, le Royaume-Uni a relevé les seuils RoCoF de la production décentralisée (de 0,125 à 1 Hz/s) : un réglage de protection est un paramètre **système**, pas seulement local.`,
        en: r`Without RoCoF trips the loss stays at 1000 MW, the reserve is enough and the nadir stays above the shedding threshold. After 2019, Great Britain raised the RoCoF settings of distributed generation (from 0.125 to 1 Hz/s): a protection setting is a **system** parameter, not just a local one.`,
      },
    },
    reserve: {
      hint: { fr: r`Trois leviers : plus d’inertie $H$, plus de réserve, et surtout une réserve plus rapide (petite constante de temps $T_g$).`, en: r`Three levers: more inertia $H$, more reserve, and above all faster reserve (small time constant $T_g$).` },
      answer: {
        fr: r`Le creux résulte d’une course entre l’inertie, qui ralentit la chute, et la réserve, qui doit monter avant que la fréquence n’atteigne le seuil : $$f_{\text{nadir}} \approx f_0 - \frac{\Delta P\,f_0}{2HS}\cdot T_{\text{réponse}}$$ Une réserve rapide (batteries en moins d’une seconde) est souvent plus efficace qu’une grosse réserve lente. C’est la logique des services de réponse rapide (FFR) et des onduleurs « grid-forming ».`,
        en: r`The nadir is a race between inertia, which slows the fall, and reserve, which must ramp up before frequency hits the threshold: $$f_{\text{nadir}} \approx f_0 - \frac{\Delta P\,f_0}{2HS}\cdot T_{\text{response}}$$ Fast reserve (batteries in under a second) is often more effective than a large slow one. That is the logic of fast frequency response (FFR) and grid-forming inverters.`,
      },
    },
  },
};
