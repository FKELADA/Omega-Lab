// The circuit's own equation cards, shown when no element is selected: what the
// simulator actually solves, with the nodal matrix written out for small circuits.

import type { EquationSpec } from '../lib/lab/types';
import type { Params } from '../lib/models/types';
import type { Netlist } from './compile';
import { N_OUT, buildElements, substeps } from './analyses';
import { layout } from './engine/emt';

/** The modified nodal matrix of the circuit for the parameters p (window T). */
export function nodalMatrix(net: Netlist, p: Params): { A: number[][]; names: string[]; h: number } {
  const T = p.T;
  const h = T / (N_OUT * substeps(net, p, T));
  const { els, nAll: nBuilt } = buildElements(net, p, h);
  const { n, sys, bases, nAll } = layout(nBuilt, els);
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const names = Array.from({ length: nAll - 1 }, (_, k) => (k < net.nNodes - 1 ? `v_{${k + 1}}` : `v_{\\text{int}${k + 2 - net.nNodes}}`));
  els.forEach((e, j) => {
    e.stamp(A, sys, bases[j]);
    for (let k = 0; k < (e.extra ?? 0); k++) names.push(`i_{\\text{${e.id}}}`);
  });
  return { A, names, h };
}

const num = (v: number) => {
  if (v === 0) return '0';
  const a = Math.abs(v);
  return a >= 1e4 || a < 1e-2 ? v.toExponential(1).replace('e', '\\text{e}') : (+v.toPrecision(3)).toString();
};

export function circuitEquations(net: Netlist): EquationSpec[] {
  const states = net.active.filter(({ def }) => def.type === 'L' || def.type === 'C').length;
  return [
    {
      id: 'circuit',
      title: { fr: 'Le circuit', en: 'The circuit' },
      tex: () => `${net.nNodes - 1}\\ \\text{nœuds (hors masse)}, \\quad ${net.active.length}\\ \\text{éléments}, \\quad ${states}\\ \\text{états } (L, C)`,
      note: (c) =>
        c.tr({
          fr: 'Cliquez sur un élément pour voir ses équations. Les fils relient les bornes ; toutes les bornes reliées forment un nœud.',
          en: 'Click an element to see its equations. Wires join terminals; all joined terminals form one node.',
        }),
    },
    {
      id: 'mna',
      title: { fr: 'Ce que résout le simulateur', en: 'What the simulator solves' },
      tex: () => `\\underbrace{A}_{\\text{conductances}}\\,\\underbrace{x_n}_{\\text{tensions, courants}} = \\underbrace{b_n}_{\\text{sources} + \\text{mémoire}}, \\qquad n = 1, 2, \\dots`,
      note: (c) =>
        c.tr({
          fr: 'À chaque pas $h$, chaque bobine et chaque condensateur devient une conductance et une source de courant « mémoire » (règle des trapèzes). On écrit la loi des nœuds partout et on résout un système linéaire. C’est la méthode des logiciels EMT (EMTP, PSCAD, G2ELin).',
          en: 'At each step $h$, every inductor and capacitor becomes a conductance and a “memory” current source (trapezoidal rule). Kirchhoff’s current law is written at every node and a linear system is solved. This is how EMT software works (EMTP, PSCAD, G2ELin).',
        }),
    },
    {
      id: 'matrix',
      title: { fr: 'La matrice nodale', en: 'The nodal matrix' },
      personas: ['research', 'utility'],
      tex: (c) => {
        if (!net.active.length) return '\\text{—}';
        const { A, names, h } = nodalMatrix(net, c.p);
        if (A.length > 8) return `A \\in \\mathbb{R}^{${A.length}\\times${A.length}}, \\quad h = ${c.q(h, 's')}`;
        return `\\begin{pmatrix}${A.map((r) => r.map(num).join(' & ')).join('\\\\')}\\end{pmatrix}\\begin{pmatrix}${names.join('\\\\')}\\end{pmatrix} = b, \\quad h = ${c.q(h, 's')}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une ligne par nœud (loi des nœuds), plus une par source de tension. Un élément ne touche que les cases de ses deux nœuds : la matrice est creuse, comme la matrice Y de la leçon 5.1.',
          en: 'One row per node (current law), plus one per voltage source. An element only touches the entries of its two nodes: the matrix is sparse, like the Y matrix of lesson 5.1.',
        }),
    },
  ];
}
