// Module 8, G2ELin lessons 8.10 and 8.11 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers8b: Answers = {
  pssg2: {
    predict: {
      hint: { fr: r`Pensez à ce que fait une excitation rapide quand le transit est important sur une longue liaison (leçon 8.2).`, en: r`Think of what a fast exciter does when a large transfer flows over a long tie (lesson 8.2).` },
      answer: {
        fr: r`Les deux zones oscillent l’une contre l’autre vers 0,6 Hz, et l’oscillation **grandit** lentement : sans PSS, l’amortissement du mode inter-zones est légèrement négatif ($\zeta \approx -0{,}7\,\%$). $$\zeta = \frac{-\sigma}{\sqrt{\sigma^2 + \omega^2}} < 0 \;\Rightarrow\; e^{\sigma t}\ \text{croît}$$ C’est le cas d’école de Kundur : excitations statiques rapides et transit important sur une liaison longue retirent l’amortissement naturel des machines. Sur un vrai réseau, l’oscillation finirait par faire déclencher la liaison.`,
        en: r`The two areas swing against each other around 0.6 Hz, and the oscillation slowly **grows**: without PSSs, the inter-area mode’s damping is slightly negative ($\zeta \approx -0.7\,\%$). $$\zeta = \frac{-\sigma}{\sqrt{\sigma^2 + \omega^2}} < 0 \;\Rightarrow\; e^{\sigma t}\ \text{grows}$$ This is Kundur’s textbook case: fast static exciters and a large transfer over a long tie remove the machines’ natural damping. On a real grid the oscillation would end up tripping the tie.`,
      },
    },
    g1: {
      hint: { fr: r`PSS : G1 ; gain vers 20.`, en: r`PSS: G1; gain around 20.` },
      answer: {
        fr: r`Avec un PSS de gain 20 sur G1, l’amortissement inter-zones passe de −0,7 % à environ **+2 %** : le mode est stable, mais encore loin des 5 % qu’on vise en exploitation. Les modes locaux bougent à peine. Un PSS n’amortit bien que les modes auxquels **sa** machine participe fortement : G1 participe au mode inter-zones, mais moins que d’autres.`,
        en: r`With a gain-20 PSS on G1, the inter-area damping goes from −0.7 % to about **+2 %**: the mode is stable, but still far from the 5 % aimed for in operation. The local modes barely move. A PSS only damps well the modes in which **its** machine takes a large part: G1 takes part in the inter-area mode, but less than others.`,
      },
    },
    g3: {
      hint: { fr: r`PSS : G3, même gain qu’avant.`, en: r`PSS: G3, same gain as before.` },
      answer: {
        fr: r`Sur G3, le même PSS donne environ **4,3 %** au lieu de 2 % : G3 a un **facteur de participation** plus grand dans le mode inter-zones (leçon 8.8). $$\Delta\lambda \approx \frac{\partial \lambda}{\partial K}\,\Delta K \propto p_{k\lambda}$$ La sensibilité d’une valeur propre au gain d’un PSS est proportionnelle à la participation de la machine qui le porte. C’est l’outil des ingénieurs pour choisir **où** installer les stabilisateurs.`,
        en: r`On G3 the same PSS gives about **4.3 %** instead of 2 %: G3 has a larger **participation factor** in the inter-area mode (lesson 8.8). $$\Delta\lambda \approx \frac{\partial \lambda}{\partial K}\,\Delta K \propto p_{k\lambda}$$ An eigenvalue’s sensitivity to a PSS gain is proportional to the participation of the machine carrying it. This is the engineers’ tool to choose **where** to install stabilisers.`,
      },
    },
    two: {
      hint: { fr: r`PSS : G1 et G3, gain vers 15 à 20.`, en: r`PSS: G1 and G3, gain around 15 to 20.` },
      answer: {
        fr: r`Avec un PSS par zone, le mode inter-zones dépasse 5 % dès un gain de 15 (7 % à 20) : les deux zones « freinent » ensemble leur oscillation relative. Les modes locaux de chaque zone gagnent aussi (de 9 % à 15–17 %). $$\zeta_{inter}(G1{+}G3,\ K{=}20) \approx 7\,\%$$ C’est une stratégie courante : quelques PSS bien placés plutôt que partout le même réglage.`,
        en: r`With one PSS per area, the inter-area mode exceeds 5 % from a gain of 15 (7 % at 20): both areas “brake” their relative oscillation together. Each area’s local mode also improves (from 9 % to 15–17 %). $$\zeta_{inter}(G1{+}G3,\ K{=}20) \approx 7\,\%$$ This is a common strategy: a few well-placed PSSs rather than the same setting everywhere.`,
      },
    },
    all: {
      hint: { fr: r`PSS : les quatre ; gain vers 20 à 30.`, en: r`PSS: all four; gain around 20 to 30.` },
      answer: {
        fr: r`Avec les quatre machines équipées et $K = 20$, l’inter-zones atteint environ 18 % et les modes locaux 25 % : tout le système est bien amorti. $$\zeta_{inter} \approx 18\,\%,\qquad \zeta_{local} \approx 25\,\%$$ Au-delà (K = 50 et plus), le mode inter-zones ralentit et ce sont les modes des régulateurs qui deviennent les moins amortis. Ces valeurs viennent du modèle complet de G2ELin (machines d’ordre 6, excitation et PSS du livre), pas d’un modèle simplifié : c’est l’intérêt de les calculer.`,
        en: r`With all four machines fitted and $K = 20$, the inter-area mode reaches about 18 % and the local modes 25 %: the whole system is well damped. $$\zeta_{inter} \approx 18\,\%,\qquad \zeta_{local} \approx 25\,\%$$ Beyond that (K = 50 and above), the inter-area mode slows down and the regulators’ own modes become the least damped. These values come from G2ELin’s full model (6th-order machines, the book’s exciter and PSS), not from a simplified one: that is the point of computing them.`,
      },
    },
  },

  ibrred: {
    gfm: {
      hint: { fr: r`Convertisseur : formeur ; niveau : RMS (statisme seul).`, en: r`Converter: grid-former; level: RMS (droop only).` },
      answer: {
        fr: r`Le modèle complet du formeur et de son réseau compte 27 états ; le statisme seul n’en garde que 7, sans les boucles de courant et de tension, le filtre et le bus continu. La réponse de puissance à un saut de phase reste presque superposée à celle du modèle complet. $$P = P_0 - \frac{1}{m_p}(\omega - \omega_0), \quad \tau_f\,\dot P_m = P - P_m$$ Pour l’étude des oscillations lentes (fréquence, puissance), le statisme suffit : c’est le modèle des outils RMS.`,
        en: r`The full model of the grid-former and its network has 27 states; droop only keeps 7, without the current and voltage loops, the filter and the DC link. The power response to a phase jump stays almost on top of the full model’s. $$P = P_0 - \frac{1}{m_p}(\omega - \omega_0), \quad \tau_f\,\dot P_m = P - P_m$$ For slow oscillations (frequency, power), the droop is enough: it is the RMS tools’ model.`,
      },
    },
    fast: {
      hint: { fr: r`Formeur, niveau « sans filtre ».`, en: r`Grid-former, “no filter” level.` },
      answer: {
        fr: r`Les résonances presque pas amorties, de 600 Hz à quelques kHz, étaient celles du réseau et du filtre LC ($1/\sqrt{LC}$). En les rendant algébriques, on les retire (il reste un mode rapide mais bien amorti, celui de la source du réseau) : $$\varepsilon\,\dot x_f = f(x_s, x_f) \;\to\; 0 = f(x_s, x_f)$$ Le modèle perd ce qu’il ne regardait de toute façon pas à l’échelle des secondes, et le pas de calcul peut grandir : c’est ce qui rend les modèles RMS rapides.`,
        en: r`The barely damped resonances, from 600 Hz to a few kHz, were those of the network and the LC filter ($1/\sqrt{LC}$). Making them algebraic removes them (a fast but well damped mode remains, the grid source’s): $$\varepsilon\,\dot x_f = f(x_s, x_f) \;\to\; 0 = f(x_s, x_f)$$ The model loses what it was not looking at on the scale of seconds anyway, and the time step can grow: that is what makes RMS models fast.`,
      },
    },
    gfl: {
      hint: { fr: r`Convertisseur : suiveur ; niveau : RMS (PLL seule).`, en: r`Converter: grid-follower; level: RMS (PLL only).` },
      answer: {
        fr: r`Le suiveur réduit à sa PLL garde 6 états. Mais sa PLL se cale sur la tension mesurée : ce qu’elle voit dépend des dynamiques rapides qu’on vient de retirer. Selon l’événement, un modèle réduit peut s’écarter du modèle complet, voire ne plus converger : ici, plusieurs niveaux intermédiaires du suiveur échouent sur le saut de phase (le solveur algébrique ne trouve plus de solution). $$\dot\theta_{PLL} = \omega_0 + K_p v_q + K_i \int v_q$$ C’est la limite des modèles RMS pour les réseaux faibles et les interactions entre convertisseurs (leçon 8.5) : il faut alors revenir à l’EMT.`,
        en: r`The grid-follower reduced to its PLL keeps 6 states. But its PLL locks onto the measured voltage: what it sees depends on the fast dynamics just removed. Depending on the event, a reduced model may drift from the full one, or even fail to converge: here several of the grid-follower’s intermediate levels fail on the phase jump (the algebraic solver finds no solution). $$\dot\theta_{PLL} = \omega_0 + K_p v_q + K_i \int v_q$$ That is the limit of RMS models for weak grids and converter interactions (lesson 8.5): EMT is then needed.`,
      },
    },
    cost: {
      hint: { fr: r`Suiveur, modèle complet ; regardez le second graphique.`, en: r`Grid-follower, full model; look at the second chart.` },
      answer: {
        fr: r`Le modèle complet demande plusieurs minutes pour une demi-seconde simulée sur le serveur G2ELin, contre environ une minute pour le modèle RMS (ordres de grandeur, selon la machine). $$h \lesssim \frac{1}{|\lambda|_{max}}$$ Le pas de calcul est imposé par la valeur propre la plus rapide. C’est pourquoi on étudie un grand réseau en RMS, et seulement une zone ou un parc en EMT, là où les interactions rapides comptent. Les deux approches se complètent.`,
        en: r`The full model takes several minutes for half a second simulated on the G2ELin server, against about a minute for the RMS model (orders of magnitude, depending on the machine). $$h \lesssim \frac{1}{|\lambda|_{max}}$$ The time step is set by the fastest eigenvalue. That is why a large grid is studied in RMS, and only one area or one plant in EMT, where fast interactions matter. The two approaches complement each other.`,
      },
    },
  },
};
