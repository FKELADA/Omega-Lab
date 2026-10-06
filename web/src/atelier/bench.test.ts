import { describe, expect, it } from 'vitest';
import { Bench } from './bench.svelte';
import { TEMPLATES } from './templates';

const fresh = () => {
  const b = new Bench();
  b.load(TEMPLATES[0].doc()); // series RLC: V1 (4,8), R1 (8,4), L1 (14,4), C1 (18,8), GND1 (4,12)
  return b;
};

describe('Atelier selection', () => {
  it('select all, then delete the selection', () => {
    const b = fresh();
    b.selectAll();
    expect(b.picked.els.length).toBe(5);
    expect(b.selection).toBeNull(); // several items: no single-element inspector
    b.removePicked();
    expect(b.doc.elements.length).toBe(0);
    expect(b.doc.wires.length).toBe(0);
    b.undo();
    expect(b.doc.elements.length).toBe(5);
  });

  it('rectangle selection takes the elements inside and the wires between them', () => {
    const b = fresh();
    b.selectBox(7, 3, 15, 5); // R1 and L1
    expect([...b.picked.els].sort()).toEqual(['L1', 'R1']);
    expect(b.picked.wires).toEqual(['w2']);
    b.selectBox(17, 7, 19, 9, true); // add C1
    expect(b.picked.els.length).toBe(3);
    expect(b.picked.wires.sort()).toEqual(['w2', 'w3']);
  });

  it('deleting selected elements removes their wires too', () => {
    const b = fresh();
    b.selectBox(7, 3, 9, 5); // R1
    b.removePicked();
    expect(b.doc.elements.map((e) => e.id)).not.toContain('R1');
    expect(b.doc.wires.some((w) => w.a.el === 'R1' || w.b.el === 'R1')).toBe(false);
  });

  it('Shift+click toggles, and a single pick drives the inspector', () => {
    const b = fresh();
    b.togglePick('el', 'C1');
    expect(b.selection).toEqual({ kind: 'el', id: 'C1' });
    b.togglePick('wire', 'w1');
    expect(b.selection).toBeNull();
    b.togglePick('el', 'C1');
    expect(b.selection).toEqual({ kind: 'wire', id: 'w1' });
  });

  it('a group moves together, and clear all is undoable', () => {
    const b = fresh();
    b.selectBox(7, 3, 15, 5);
    b.beginMove();
    b.moveGroup({ R1: [8, 4], L1: [14, 4] }, 2, -1);
    expect([b.el('R1')!.x, b.el('R1')!.y, b.el('L1')!.x]).toEqual([10, 3, 16]);
    b.clearAll();
    expect(b.doc.elements.length).toBe(0);
    b.undo();
    expect(b.doc.elements.length).toBe(5);
    b.undo();
    expect(b.el('R1')!.x).toBe(8);
  });
});

describe('Atelier challenges: locks', () => {
  it('locked elements resist deletion, moves and edits; open parameters stay editable', () => {
    const b = new Bench();
    b.startChallenge('ch-critical');
    expect(b.challenge?.id).toBe('ch-critical');
    b.selectAll();
    b.removePicked();
    expect(b.doc.elements.length).toBe(5); // all locked
    b.setParam('L1', 'L', 1);
    expect(b.el('L1')!.params.L).toBe(0.01); // locked parameter
    b.setParam('R1', 'R', 20);
    expect(b.el('R1')!.params.R).toBe(20); // open parameter
    b.beginMove();
    b.moveGroup({ R1: [8, 4] }, 3, 3);
    expect(b.el('R1')!.x).toBe(8);
  });

  it('clear all keeps the challenge, removes what the learner added; leaving unlocks', () => {
    const b = new Bench();
    b.startChallenge('ch-buck');
    b.add('R', 30, 4);
    expect(b.doc.elements.length).toBe(8);
    b.clearAll();
    expect(b.doc.elements.length).toBe(7);
    b.leaveChallenge();
    expect(b.challenge).toBeUndefined();
    b.setParam('V1', 'V', 24);
    expect(b.el('V1')!.params.V).toBe(24);
  });
});
