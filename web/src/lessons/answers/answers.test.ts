import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { lessons } from '../curriculum';
import { answers } from '.';

describe('step help', () => {
  for (const l of lessons) {
    it(`lesson ${l.id}: every step has a hint and a full explanation`, () => {
      const e = l.experiment!;
      for (const s of e.steps) {
        const h = answers[e.id]?.[s.id];
        const hint = s.hint ?? h?.hint, answer = s.answer ?? h?.answer;
        expect(hint, `${l.id} ${s.id} hint`).toBeDefined();
        expect(answer, `${l.id} ${s.id} answer`).toBeDefined();
        for (const [t, min] of [[hint!, 10], [answer!, 100]] as const) {
          expect(t.fr.length, `${l.id} ${s.id}`).toBeGreaterThan(min);
          expect(t.en.length, `${l.id} ${s.id}`).toBeGreaterThan(min);
        }
      }
      // No stray entries for steps that do not exist.
      for (const id of Object.keys(answers[e.id] ?? {})) expect(e.steps.map((s) => s.id), `${l.id} ${id}`).toContain(id);
    });
  }
});

describe('step help formulas', () => {
  it('every formula in hints and explanations renders in KaTeX', () => {
    const bad: string[] = [];
    for (const [e, steps] of Object.entries(answers))
      for (const [s, h] of Object.entries(steps))
        for (const t of [h.hint.fr, h.hint.en, h.answer.fr, h.answer.en]) {
          const display = [...t.matchAll(/\$\$([\s\S]+?)\$\$/g)].map((m) => m[1]);
          const inline = [...t.replace(/\$\$[\s\S]+?\$\$/g, '').matchAll(/\$([^$\n]+?)\$/g)].map((m) => m[1]);
          for (const m of [...display, ...inline])
            try {
              katex.renderToString(m, { throwOnError: true, strict: false });
            } catch (err) {
              bad.push(`${e}/${s}: ${m.slice(0, 50)} → ${(err as Error).message.slice(0, 80)}`);
            }
        }
    expect(bad).toEqual([]);
  });
});
