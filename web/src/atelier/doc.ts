// An Atelier project: placed elements, wires between their ports, and the run
// settings. Plain data, so it can be saved, shared in a URL and compiled.

export type Rot = 0 | 90 | 180 | 270;

export interface BenchEl {
  id: string;
  type: string;
  /** Centre, in grid units. */
  x: number;
  y: number;
  rot: Rot;
  params: Record<string, number>;
  /** Signals shown on the oscilloscope ('v', 'i', 'p'). */
  scope: string[];
}

export interface PortRef {
  el: string;
  port: string;
}

export interface Wire {
  id: string;
  a: PortRef;
  b: PortRef;
}

export interface BenchDoc {
  version: 1;
  name: string;
  elements: BenchEl[];
  wires: Wire[];
  /** Simulated duration (s). */
  T: number;
}

export const emptyDoc = (): BenchDoc => ({ version: 1, name: 'Sans titre', elements: [], wires: [], T: 0.05 });

/** A port's position on the grid, after rotation. */
export function portPos(el: BenchEl, dx: number, dy: number): [number, number] {
  const r = ((el.rot % 360) + 360) % 360;
  const [x, y] = r === 0 ? [dx, dy] : r === 90 ? [-dy, dx] : r === 180 ? [-dx, -dy] : [dy, -dx];
  return [el.x + x, el.y + y];
}
