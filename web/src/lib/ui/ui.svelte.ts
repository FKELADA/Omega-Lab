// App-wide preferences: language, persona, theme. Persisted per viewer when storage allows.

export type Lang = 'fr' | 'en';
export type Persona = 'learner' | 'research' | 'utility';
export type Theme = 'auto' | 'light' | 'dark';

/** A string in both languages. All user-facing content is written this way. */
export type L = Record<Lang, string>;

const KEY = 'omega-lab.prefs';

function load(): Partial<{ lang: Lang; persona: Persona; theme: Theme }> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

const saved = load();
const browserLang: Lang =
  typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';

export const ui = $state({
  lang: saved.lang ?? browserLang,
  persona: saved.persona ?? ('learner' as Persona),
  theme: saved.theme ?? ('auto' as Theme),
  /** Bumped whenever the effective colours change, so canvas-drawn plots repaint. */
  paletteTick: 0,
});

export function savePrefs() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lang: ui.lang, persona: ui.persona, theme: ui.theme }));
  } catch {
    /* storage unavailable: preferences just won't persist */
  }
}

export const tr = (l: L): string => l[ui.lang];

/** Reads a CSS custom property from the root, for canvas-drawn graphics. */
export const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Fixed interface strings. */
export const S = {
  tagline: { fr: 'Du circuit RLC à la stabilité des réseaux', en: 'From RLC circuits to grid stability' },
  learner: { fr: 'Apprenant', en: 'Learner' },
  research: { fr: 'Chercheur', en: 'Researcher' },
  utility: { fr: 'Ingénieur', en: 'Engineer' },
  persona: { fr: 'Profil', en: 'Profile' },
  theme: { fr: 'Thème', en: 'Theme' },
  modules: { fr: 'Parcours', en: 'Course map' },
  soon: { fr: 'bientôt', en: 'soon' },
  scope: { fr: 'Oscilloscope', en: 'Oscilloscope' },
  splane: { fr: 'Plan complexe s', en: 's-plane' },
  energy: { fr: 'Bilan d’énergie', en: 'Energy balance' },
  equations: { fr: 'Équations vivantes', en: 'Live equations' },
  params: { fr: 'Paramètres', en: 'Parameters' },
  time: { fr: 'Temps', en: 'Time' },
  play: { fr: 'Lecture', en: 'Play' },
  pause: { fr: 'Pause', en: 'Pause' },
  freeze: { fr: 'Figer et comparer', en: 'Freeze & compare' },
  clear: { fr: 'Effacer', en: 'Clear' },
  lockAxis: { fr: 'Verrouiller l’axe du temps', en: 'Lock time axis' },
  sweep: { fr: 'Balayer', en: 'Sweep' },
  sweepTitle: { fr: 'Superposer 7 valeurs sur toute la plage', en: 'Overlay 7 values across the range' },
  reset: { fr: 'Double-clic : valeur par défaut', en: 'Double-click: default value' },
  predict: { fr: 'Prédire', en: 'Predict' },
  predicting: {
    fr: 'Dessinez votre prédiction sur l’oscilloscope (cliquer-glisser), puis révélez.',
    en: 'Sketch your prediction on the oscilloscope (click and drag), then reveal.',
  },
  reveal: { fr: 'Révéler', en: 'Reveal' },
  retry: { fr: 'Recommencer', en: 'Try again' },
  score: { fr: 'Concordance', en: 'Match' },
  hiddenUntilReveal: {
    fr: 'Masqué jusqu’à la révélation de votre prédiction.',
    en: 'Hidden until you reveal your prediction.',
  },
  supplied: { fr: 'Fournie par la source', en: 'Supplied by source' },
  storedLost: { fr: 'Stockée + dissipée', en: 'Stored + dissipated' },
  step: { fr: 'Étape', en: 'Step' },
  next: { fr: 'Suivant', en: 'Next' },
  prev: { fr: 'Précédent', en: 'Previous' },
  hint: { fr: 'Indice', en: 'Hint' },
  done: { fr: 'Réussi', en: 'Done' },
  derive: { fr: 'Dériver', en: 'Derive' },
  at: { fr: 'à', en: 'at' },
  ghost: { fr: 'figé', en: 'frozen' },
  clickToProbe: { fr: 'Cliquer un élément pour l’afficher', en: 'Click an element to probe it' },
} satisfies Record<string, L>;
