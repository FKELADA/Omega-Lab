import { describe, expect, it } from 'vitest';
import { curriculum, lessons } from './curriculum';
import { lessonNotes, moduleNotes } from './notes';

describe('teaching notes', () => {
  it('every module has a note', () => {
    for (const m of curriculum.filter((m) => m.lessons.some((l) => l.experiment))) expect(moduleNotes[m.n]).toBeDefined();
  });
  for (const l of lessons) {
    it(`lesson ${l.id}: complete, with one exercise objective per guided step`, () => {
      const n = lessonNotes[l.id];
      expect(n).toBeDefined();
      expect(n.exercises.length).toBe(l.experiment!.steps.length);
      expect(n.formulas.length).toBeGreaterThan(0);
      expect(n.tests.length).toBeGreaterThan(0);
      for (const t of [n.summary, n.objective, ...n.exercises]) {
        expect(t.fr.length).toBeGreaterThan(10);
        expect(t.en.length).toBeGreaterThan(10);
      }
    });
  }
});
