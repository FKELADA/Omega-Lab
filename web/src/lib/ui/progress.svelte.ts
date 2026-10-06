// Learner progress, per viewer: the guided steps completed in each lesson and the last lesson
// opened. Keyed by experiment id, so it survives lesson renumbering. Lessons still start
// afresh on each visit; this only records what was achieved, for the home page.

const KEY = 'omega-lab.progress';

interface Saved {
  done: Record<string, string[]>;
  last: string | null;
}

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { done: s.done ?? {}, last: s.last ?? null };
  } catch {
    return { done: {}, last: null };
  }
}

export const progress = $state<Saved>(load());

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable: progress just won't persist */
  }
}

export function markStep(expId: string, stepId: string) {
  const d = progress.done[expId] ?? [];
  if (d.includes(stepId)) return;
  progress.done[expId] = [...d, stepId];
  save();
}

export function markVisit(expId: string) {
  if (progress.last === expId) return;
  progress.last = expId;
  save();
}

export function resetProgress() {
  progress.done = {};
  progress.last = null;
  save();
}

/** Steps done in a lesson, against its step ids (stale ids from older versions are ignored). */
export const doneIn = (expId: string, stepIds: string[]) => (progress.done[expId] ?? []).filter((s) => stepIds.includes(s)).length;
