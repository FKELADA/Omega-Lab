// Pre-computes G2ELin results for lessons 8.8 and 8.9, so they open instantly
// and work without a running G2ELin server. Needs G2ELin on port 8000
// (start-windows.bat). Usage: node scripts/bake-g2elin.mjs [--skip-emt]
//
// Writes src/data/g2elin/modes.json (modes, participation, mode shapes, free
// responses, topology of real networks) and src/data/g2elin/reduction.json
// (eigenvalues and nonlinear/linear time responses at each model level).

import { mkdirSync, writeFileSync } from 'node:fs';

const API = process.env.G2ELIN_URL ?? 'http://localhost:8000';
const OUT = new URL('../src/data/g2elin/', import.meta.url);
const skipEmt = process.argv.includes('--skip-emt');
mkdirSync(OUT, { recursive: true });

async function call(path, body) {
  const res = await fetch(`${API}${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok) throw new Error(`${path}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}
const r4 = (x) => +x.toPrecision(4);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/** Units named in a state, e.g. "dw_r_{SM_3}" → "SM_3". */
const unitOf = (s) => (s.match(/_\{([A-Za-z]+_\d+)\}$/) ?? [])[1] ?? (s.match(/\{([A-Za-z]+_\d+)\}/) ?? [])[1] ?? 'network';

function compactModal(j, fMax = 5) {
  const modes = j.modes
    .filter((m) => m.imag > 1e-6 && m.damped_hz <= fMax)
    .map((m) => {
      const col = j.participation.map((row, i) => [j.state_names[i], Math.abs(row[m.mode])]);
      col.sort((a, b) => b[1] - a[1]);
      const byUnit = {};
      for (const [s, v] of col) byUnit[unitOf(s)] = (byUnit[unitOf(s)] ?? 0) + v;
      return {
        mode: m.mode,
        re: r4(m.real),
        im: r4(m.imag),
        f: r4(m.damped_hz),
        zeta: r4(m.damping_pct),
        category: m.category,
        shares: Object.fromEntries(Object.entries(m.category_shares ?? {}).map(([k, v]) => [k, r4(v)])),
        top: col.slice(0, 10).map(([s, v]) => [s, r4(v)]),
        units: Object.fromEntries(Object.entries(byUnit).filter(([, v]) => v > 0.01).map(([k, v]) => [k, r4(v)])),
      };
    })
    .sort((a, b) => a.f - b.f);
  const all = j.modes.map((m) => [r4(m.real), r4(m.imag)]);
  return { nStates: j.n_states, stable: j.stable, modes, all, categories: j.categories.map((c) => ({ id: c.id, label: c.label, note: c.note })) };
}

const PRESETS = [
  { id: 'kundur_two_area', fr: 'Kundur, deux zones (modèle détaillé, PSS)', en: 'Kundur two-area (detailed, PSS)' },
  { id: 'kundur_two_area_classic', fr: 'Kundur, deux zones (modèle classique)', en: 'Kundur two-area (classical model)' },
  { id: 'wscc9_3sm', fr: 'WSCC 9 nœuds, 3 alternateurs', en: 'WSCC 9-bus, 3 generators' },
  { id: 'wscc9_2sm_1gfm', fr: 'WSCC 9 nœuds, 2 alternateurs + 1 formeur', en: 'WSCC 9-bus, 2 generators + 1 grid-forming' },
  { id: 'wscc9_1sm_2gfl', fr: 'WSCC 9 nœuds, 1 alternateur + 2 suiveurs', en: 'WSCC 9-bus, 1 generator + 2 grid-following' },
  { id: 'ieee39', fr: 'IEEE 39 nœuds (Nouvelle-Angleterre)', en: 'IEEE 39-bus (New England)' },
];

async function bakeModes() {
  const out = {};
  for (const p of PRESETS) {
    log('modal', p.id);
    const modal = compactModal(await call(`/api/presets/${p.id}/modal`, {}));
    const topo = await call(`/api/presets/${p.id}/topology`);
    const topology = {
      nodes: topo.nodes.map((n) => ({ id: n.id, name: n.name, x: r4(n.x), y: r4(n.y), unit: n.unit_type ?? null })),
      edges: topo.edges.map((e) => ({ from: e.from_bus, to: e.to_bus, kind: e.kind })),
    };
    // Mode shapes of the electromechanical modes (rotor speeds).
    const shapes = {};
    for (const m of modal.modes.filter((m) => m.category === 'synchronisation' && m.f >= 0.1 && m.f <= 3)) {
      const s = await call(`/api/presets/${p.id}/modal/mode_shape`, { mode: m.mode });
      shapes[m.mode] = { states: s.states, angles: s.angles_deg.map(r4) };
    }
    // Free responses of every machine speed after a kick on each machine.
    const states = (await call(`/api/presets/${p.id}/states`)).state_names;
    const sms = states.filter((s) => s.startsWith('dw_r_{')).map((s) => s.slice(6, -1));
    const free = {};
    for (const u of sms) {
      const r = await call(`/api/presets/${p.id}/modal/free_response`, { perturb_state: `dw_r_{${u}}`, offset: 0.001, t_final: 12, state_filter: 'dw_r' });
      free[u] = { t: r.t.map(r4), series: Object.fromEntries(Object.entries(r.series).map(([k, v]) => [k.slice(6, -1), v.map((x) => r4(x * 50 * 1000))])) }; // mHz
    }
    out[p.id] = { name: { fr: p.fr, en: p.en }, ...modal, topology, shapes, free, machines: sms };
  }
  writeFileSync(new URL('modes.json', OUT), JSON.stringify(out));
  log('wrote modes.json');
}

const LEVELS = [
  { id: 'emt', fr: 'EMT complet', en: 'Full EMT', models: {} },
  { id: 'rms', fr: 'Réseau RMS', en: 'RMS network', models: { network_level: 'quasi_stationary' } },
  { id: 'o6', fr: 'RMS + machine d’ordre 6', en: 'RMS + 6th-order machine', models: { network_level: 'quasi_stationary', sm_level: 'order6' } },
  { id: 'o4', fr: 'RMS + machine d’ordre 4', en: 'RMS + 4th-order machine', models: { network_level: 'quasi_stationary', sm_level: 'order4' } },
  { id: 'o3', fr: 'RMS + machine d’ordre 3', en: 'RMS + 3rd-order machine', models: { network_level: 'quasi_stationary', sm_level: 'order3' } },
  { id: 'o2', fr: 'RMS + modèle classique', en: 'RMS + classical model', models: { network_level: 'quasi_stationary', sm_level: 'order2' } },
];

async function bakeReduction() {
  const out = { levels: LEVELS.map(({ id, fr, en }) => ({ id, name: { fr, en } })), smib: {}, kundur: {} };
  const smib = await call('/api/presets/sm_smib/network');
  const kundur = await call('/api/presets/kundur_two_area/network');
  for (const L of LEVELS) {
    const withLevel = (net) => ({ ...net, models: { ...net.models, ...L.models } });
    log('reduction modal', L.id);
    const ms = await call('/api/network/modal', { network: withLevel(smib) });
    const mk = await call('/api/network/modal', { network: withLevel(kundur) });
    out.kundur[L.id] = compactModal(mk, 3);
    const entry = { modal: compactModal(ms, 1e9), emt: null };
    if (!skipEmt) {
      log('reduction emt', L.id, '(slow)');
      const t0 = Date.now();
      // A 20° phase jump of the infinite-bus source: possible at every model level.
      const r = await call('/api/network/emt', {
        network: withLevel(smib),
        perturb_kind: 'event',
        event: { kind: 'phase_jump', bus: 4, angle_deg: 20 },
        t_final: 3,
        linear_overlay: true,
        plot_states: ['dw_r_{SM_1}'],
      });
      const lin = r.linear?.series?.['dw_r_{SM_1}'] ?? null;
      entry.emt = {
        seconds: r4((Date.now() - t0) / 1000),
        t: r.t.map(r4),
        dw: r.series['dw_r_{SM_1}'].map((x) => r4(x * 50 * 1000)),
        linT: r.linear ? r.linear.t.map(r4) : null,
        lin: lin ? lin.map((x) => r4(x * 50 * 1000)) : null,
        note: r.linear_note ?? null,
      };
    }
    out.smib[L.id] = entry;
    writeFileSync(new URL('reduction.json', OUT), JSON.stringify(out));
  }
  log('wrote reduction.json');
}

await bakeModes();
await bakeReduction();
