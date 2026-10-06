// Teaching notes for the G2ELin lessons 8.10 and 8.11 (merged into notes.ts).

import type { LessonNote } from './notes';

const r = String.raw;

export const module8bNotes: Record<string, LessonNote> = {
  '8.10': {
    summary: {
      fr: 'Sur le réseau à deux zones de Kundur, calculé par G2ELin avec son modèle complet, on choisit où installer des stabilisateurs (PSS) et avec quel gain, en lisant l’amortissement des modes électromécaniques.',
      en: 'On Kundur’s two-area system, computed by G2ELin with its full model, choose where to install stabilisers (PSSs) and with what gain, by reading the damping of the electromechanical modes.',
    },
    objective: {
      fr: 'Relier participation et efficacité d’un PSS, et atteindre un amortissement cible pour les modes inter-zones et locaux.',
      en: 'Link participation to a PSS’s effectiveness, and reach a damping target for the inter-area and local modes.',
    },
    formulas: [
      { tex: r`\zeta = \frac{-\sigma}{\sqrt{\sigma^2 + \omega^2}}`, meaning: { fr: 'L’amortissement d’un mode, lu sur sa valeur propre.', en: 'A mode’s damping, read from its eigenvalue.' } },
      { tex: r`v_{PSS} = K\,\frac{sT_W}{1+sT_W}\,\frac{1+sT_1}{1+sT_2}\,\frac{1+sT_3}{1+sT_4}\,\Delta\omega`, meaning: { fr: 'Le stabilisateur de Kundur : washout et deux avances de phase.', en: 'Kundur’s stabiliser: washout and two lead stages.' } },
      { tex: r`\partial\lambda/\partial K \propto p_{k\lambda}`, meaning: { fr: 'Un PSS agit sur un mode en proportion de la participation de sa machine.', en: 'A PSS acts on a mode in proportion to its machine’s participation.' } },
    ],
    exercises: [
      { fr: 'Prédire l’oscillation inter-zones sans PSS.', en: 'Predict the inter-area oscillation without PSS.' },
      { fr: 'Voir l’effet limité d’un PSS sur G1.', en: 'See the limited effect of one PSS on G1.' },
      { fr: 'Trouver un meilleur emplacement (G3).', en: 'Find a better place (G3).' },
      { fr: 'Atteindre 5 % avec un PSS par zone.', en: 'Reach 5 % with one PSS per area.' },
      { fr: 'Bien amortir tous les modes avec quatre PSS.', en: 'Damp every mode well with four PSSs.' },
    ],
    tests: [
      { what: { fr: 'Sans PSS, le mode inter-zones (vers 0,6 Hz) a un amortissement négatif.', en: 'Without PSS, the inter-area mode (around 0.6 Hz) has negative damping.' }, why: { fr: 'Vérifie le point de départ.', en: 'Checks the starting point.' } },
      { what: { fr: 'À gain égal, un PSS sur G3 amortit mieux le mode inter-zones qu’un PSS sur G1 ; G1 + G3 dépassent 5 % ; les quatre à K = 20 dépassent 15 % et 20 % sur les locaux.', en: 'At the same gain, a PSS on G3 damps the inter-area mode better than one on G1; G1 + G3 exceed 5 %; all four at K = 20 exceed 15 % and 20 % on the local modes.' }, why: { fr: 'Vérifie que chaque étape a une solution dans les données G2ELin.', en: 'Checks that each step has a solution in the G2ELin data.' } },
      { what: { fr: 'Les réponses temporelles précalculées existent pour chaque emplacement et chaque gain.', en: 'The baked time responses exist for every placement and gain.' }, why: { fr: 'Garantit que la leçon fonctionne hors ligne.', en: 'Ensures the lesson works offline.' } },
    ],
  },
  '8.11': {
    summary: {
      fr: 'Un convertisseur formeur ou suiveur se modélise à plusieurs niveaux de détail, du modèle EMT complet (boucles, filtres, bus continu) au modèle RMS (statisme ou PLL). G2ELin calcule chaque niveau : on voit ce qui disparaît, ce qui reste, et ce que coûte le détail.',
      en: 'A grid-forming or grid-following converter can be modelled at several levels of detail, from the full EMT model (loops, filters, DC link) to the RMS model (droop or PLL). G2ELin computes every level: see what goes, what stays, and what detail costs.',
    },
    objective: {
      fr: 'Savoir quel niveau de modèle convient à quelle étude, et pourquoi les modèles RMS ne voient pas les interactions rapides.',
      en: 'Know which model level suits which study, and why RMS models miss fast interactions.',
    },
    formulas: [
      { tex: r`\varepsilon\,\dot x_f = f(x_s, x_f) \to 0 = f(x_s, x_f)`, meaning: { fr: 'La perturbation singulière : une dynamique rapide devient algébrique.', en: 'Singular perturbation: a fast dynamic becomes algebraic.' } },
      { tex: r`h \lesssim 1/|\lambda|_{max}`, meaning: { fr: 'Le pas de calcul est imposé par la valeur propre la plus rapide.', en: 'The time step is set by the fastest eigenvalue.' } },
    ],
    exercises: [
      { fr: 'Réduire le formeur à son statisme.', en: 'Reduce the grid-former to its droop.' },
      { fr: 'Voir disparaître les modes rapides.', en: 'See the fast modes disappear.' },
      { fr: 'Réduire le suiveur à sa PLL.', en: 'Reduce the grid-follower to its PLL.' },
      { fr: 'Mesurer le coût du modèle complet.', en: 'Measure the cost of the full model.' },
    ],
    tests: [
      { what: { fr: 'Chaque niveau garde moins d’états que le précédent ; seul le modèle complet a des modes peu amortis au-dessus de 100 Hz.', en: 'Each level keeps fewer states than the one before; only the full model has lightly damped modes above 100 Hz.' }, why: { fr: 'Vérifie la logique de la réduction.', en: 'Checks the logic of reduction.' } },
      { what: { fr: 'Le formeur réduit au statisme reste proche du modèle complet sur le saut de phase.', en: 'The grid-former reduced to droop stays close to the full model on the phase jump.' }, why: { fr: 'Vérifie l’affirmation de l’étape 1.', en: 'Checks the claim of step 1.' } },
    ],
  },
};
