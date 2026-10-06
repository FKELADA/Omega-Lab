// Where the Atelier keeps the current project in the browser. Separate from the
// bench so lessons can hand a project over without loading the Atelier.

import type { BenchDoc } from './doc';

export const STORE = 'omega-atelier-v1';

/** Opens a project in the Atelier: stores it, then switches to #atelier. */
export function openInAtelier(doc: BenchDoc) {
  try {
    localStorage.setItem(STORE, JSON.stringify(doc));
  } catch {
    /* storage unavailable: fall back to a share link */
    location.hash = `atelier=${btoa(unescape(encodeURIComponent(JSON.stringify(doc))))}`;
    return;
  }
  location.hash = 'atelier';
}
