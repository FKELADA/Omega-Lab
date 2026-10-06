import { describe, expect, it } from 'vitest';
import { lessons } from '../lessons/curriculum';
import { DEFS } from './library';
import { docForLesson, LINKS } from './links';
import { TEMPLATES } from './templates';

describe('lessons ↔ Atelier links', () => {
  for (const [id, link] of Object.entries(LINKS))
    it(`lesson ${id} opens template ${link.template} with its parameters`, () => {
      const lesson = lessons.find((l) => l.id === id);
      expect(lesson).toBeDefined();
      const tpl = TEMPLATES.find((t) => t.id === link.template)!;
      expect(tpl).toBeDefined();
      const p = Object.fromEntries(lesson!.experiment!.params.map((q) => [q.id, q.default]));
      for (const [k, v] of Object.entries(link.map?.(p) ?? {})) {
        const [el, param] = k.split('.');
        const e = tpl.doc().elements.find((x) => x.id === el);
        expect(e, `${id}: ${el}`).toBeDefined();
        expect(DEFS[e!.type].params.some((q) => q.id === param), `${id}: ${k}`).toBe(true);
        expect(Number.isFinite(v), `${id}: ${k}`).toBe(true);
      }
      const doc = docForLesson(id, p)!;
      expect(doc.elements.length).toBeGreaterThan(1);
    });

  it('carries the lesson’s settings over (1.2: R = 20 Ω)', () => {
    const doc = docForLesson('1.2', { R: 20, L: 0.01, C: 1e-4, V: 10 })!;
    expect(doc.elements.find((e) => e.id === 'R1')!.params.R).toBe(20);
  });
});
