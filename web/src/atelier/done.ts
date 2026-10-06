// Challenges met in this browser (a per-viewer convenience).

const KEY = 'omega-atelier-done';

export function doneChallenges(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function markDone(id: string) {
  try {
    const d = doneChallenges();
    if (!d.includes(id)) localStorage.setItem(KEY, JSON.stringify([...d, id]));
  } catch {
    /* storage unavailable */
  }
}
