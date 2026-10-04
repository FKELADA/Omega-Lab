// Client for the G2ELin API (lesson 8.7): modal analysis, mode shapes, free
// responses and topology of real networks. Results land in a reactive store, so
// any lesson panel that reads them updates when they arrive. Requests are
// started from component effects (never from inside derived values).

const BASE = (import.meta.env.VITE_G2ELIN_URL as string | undefined) ?? '/g2elin';

export interface G2Mode {
  index: number; // G2ELin's mode number (for mode_shape)
  re: number;
  im: number;
  freq: number; // Hz
  damping: number; // %
  category: string;
  states: string[]; // top participating states
}

export interface G2Modal {
  nStates: number;
  stable: boolean;
  modes: G2Mode[];
  /** Electromechanical (synchronisation) modes, 0.1–3 Hz, by increasing frequency. */
  em: G2Mode[];
}

export interface G2Node {
  id: number;
  name: string;
  x: number;
  y: number;
  unit: string | null;
}
export interface G2Topology {
  nodes: G2Node[];
  edges: { from: number; to: number; kind: string }[];
}
export interface G2Shape {
  states: string[];
  angles: number[];
}
export interface G2Free {
  t: number[];
  series: Record<string, number[]>;
}

type Slot<T> = T | 'loading' | 'error';

export const g2 = $state({
  status: 'idle' as 'idle' | 'checking' | 'ok' | 'offline',
  modal: {} as Record<string, Slot<G2Modal>>,
  topo: {} as Record<string, Slot<G2Topology>>,
  shape: {} as Record<string, Slot<G2Shape>>,
  free: {} as Record<string, Slot<G2Free>>,
});

async function get<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

export function g2Check() {
  if (g2.status === 'checking' || g2.status === 'ok') return;
  g2.status = 'checking';
  get<unknown[]>('/api/presets')
    .then((r) => (g2.status = Array.isArray(r) ? 'ok' : 'offline'))
    .catch(() => (g2.status = 'offline'));
}

interface RawMode {
  mode: number;
  real: number;
  imag: number;
  damped_hz: number;
  damping_pct: number;
  category: string;
  state1: string;
  state2: string;
  state3: string;
}

export function g2Modal(preset: string) {
  if (g2.modal[preset] && g2.modal[preset] !== 'error') return;
  g2.modal[preset] = 'loading';
  get<{ n_states: number; stable: boolean; modes: RawMode[] }>(`/api/presets/${preset}/modal`, {})
    .then((j) => {
      const modes: G2Mode[] = j.modes.map((m) => ({
        index: m.mode,
        re: m.real,
        im: m.imag,
        freq: m.damped_hz,
        damping: m.damping_pct,
        category: m.category,
        states: [m.state1, m.state2, m.state3].filter(Boolean),
      }));
      const em = modes.filter((m) => m.im > 0 && m.freq >= 0.1 && m.freq <= 3 && m.category === 'synchronisation').sort((a, b) => a.freq - b.freq);
      g2.modal[preset] = { nStates: j.n_states, stable: j.stable, modes, em };
    })
    .catch(() => (g2.modal[preset] = 'error'));
}

export function g2Topology(preset: string) {
  if (g2.topo[preset] && g2.topo[preset] !== 'error') return;
  g2.topo[preset] = 'loading';
  get<{ nodes: { id: number; name: string; x: number; y: number; unit_type: string | null }[]; edges: { from_bus: number; to_bus: number; kind: string }[] }>(`/api/presets/${preset}/topology`)
    .then((j) => {
      g2.topo[preset] = {
        nodes: j.nodes.map((n) => ({ id: n.id, name: n.name, x: n.x, y: n.y, unit: n.unit_type })),
        edges: j.edges.map((e) => ({ from: e.from_bus, to: e.to_bus, kind: e.kind })),
      };
    })
    .catch(() => (g2.topo[preset] = 'error'));
}

export const shapeKey = (preset: string, mode: number) => `${preset}#${mode}`;

export function g2Shape(preset: string, mode: number) {
  const key = shapeKey(preset, mode);
  if (g2.shape[key] && g2.shape[key] !== 'error') return;
  g2.shape[key] = 'loading';
  get<{ states: string[]; angles_deg: number[] }>(`/api/presets/${preset}/modal/mode_shape`, { mode })
    .then((j) => (g2.shape[key] = { states: j.states, angles: j.angles_deg }))
    .catch(() => (g2.shape[key] = 'error'));
}

export const freeKey = (preset: string, sm: number) => `${preset}#SM_${sm}`;

export function g2Free(preset: string, sm: number) {
  const key = freeKey(preset, sm);
  if (g2.free[key] && g2.free[key] !== 'error') return;
  g2.free[key] = 'loading';
  get<{ t: number[]; series: Record<string, number[]> }>(`/api/presets/${preset}/modal/free_response`, {
    perturb_state: `dw_r_{SM_${sm}}`,
    offset: 0.002,
    t_final: 10,
    state_filter: 'dw_r',
  })
    .then((j) => (g2.free[key] = { t: j.t, series: j.series }))
    .catch(() => (g2.free[key] = 'error'));
}

export const ready = <T>(s: Slot<T> | undefined): T | null => (s && s !== 'loading' && s !== 'error' ? s : null);
