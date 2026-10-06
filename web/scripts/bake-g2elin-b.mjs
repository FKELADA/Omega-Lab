// Pre-computes G2ELin results for lessons 8.10 (PSS on Kundur's two-area system) and 8.11
// (converter model reduction). Needs G2ELin on port 8000 (start-windows.bat).
// Usage: node scripts/bake-g2elin-b.mjs [pss] [ibr]   (both by default)
//
// Writes src/data/g2elin/pss.json and src/data/g2elin/ibr.json.

import { mkdirSync, writeFileSync } from 'node:fs';

const API = process.env.G2ELIN_URL ?? 'http://localhost:8000';
const OUT = new URL('../src/data/g2elin/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const want = process.argv.slice(2);
const run = (k) => !want.length || want.includes(k);

async function call(path, body) {
  const res = await fetch(`${API}${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok) throw new Error(`${path}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}
const r4 = (x) => +(+x).toPrecision(4);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
/** Keeps every k-th sample so a series has at most n points. */
const thin = (arr, n) => {
  const k = Math.max(1, Math.ceil(arr.length / n));
  return arr.filter((_, i) => i % k === 0 || i === arr.length - 1);
};

// ── 8.10 PSS on Kundur's two-area system ─────────────────────────────────────

const PLACES = [
  { id: 'none', units: [], fr: 'Aucun', en: 'None' },
  { id: 'G1', units: [1], fr: 'G1', en: 'G1' },
  { id: 'G2', units: [2], fr: 'G2', en: 'G2' },
  { id: 'G3', units: [3], fr: 'G3', en: 'G3' },
  { id: 'G4', units: [4], fr: 'G4', en: 'G4' },
  { id: 'G1G3', units: [1, 3], fr: 'G1 et G3', en: 'G1 and G3' },
  { id: 'all', units: [1, 2, 3, 4], fr: 'Les quatre', en: 'All four' },
];
const GAINS = [0, 2.5, 5, 10, 15, 20, 30, 40, 50, 75, 100];
const FREE_GAINS = GAINS;

/** Electromechanical and control modes between 0.1 and 3 Hz, least damped first. */
const lowModes = (j) =>
  j.modes
    .filter((m) => m.imag > 1e-6 && m.damped_hz >= 0.1 && m.damped_hz <= 3 && (m.category === 'synchronisation' || m.category === 'control'))
    .map((m) => ({ re: r4(m.real), im: r4(m.imag), f: r4(m.damped_hz), z: r4(m.damping_pct), cat: m.category, top: m.state1, part: r4(m.part1_pct) }))
    .sort((a, b) => a.f - b.f);

async function bakePss() {
  const base = await call('/api/presets/kundur_two_area/network');
  const netFor = (place, K) => {
    const net = structuredClone(base);
    net.models = { ...net.models, network_level: 'quasi_stationary' };
    for (const u of net.der_units) {
      const on = place.units.includes(u.id) && K > 0;
      u.pss = on ? 'kundur' : 'none';
      if (on) u.params = { ...u.params, KSTAB: K };
    }
    return net;
  };
  const out = { places: PLACES.map(({ id, fr, en }) => ({ id, name: { fr, en } })), gains: GAINS, modes: {}, free: {} };
  for (const place of PLACES) {
    out.modes[place.id] = {};
    for (const K of place.units.length ? GAINS : [0]) {
      log('pss modal', place.id, K);
      out.modes[place.id][K] = lowModes(await call('/api/network/modal', { network: netFor(place, K) }));
    }
    out.free[place.id] = {};
    for (const K of place.units.length ? FREE_GAINS : [0]) {
      log('pss free', place.id, K);
      const r = await call('/api/network/modal/free_response', { network: netFor(place, K), perturb_state: 'dw_r_{SM_1}', offset: 0.001, t_final: 15, state_filter: 'dw_r' });
      const t = thin(r.t, 400);
      const k = Math.max(1, Math.ceil(r.t.length / 400));
      const pick = (name) => thin(r.series[name], 400).map((x) => r4(x * 50 * 1000)); // mHz
      out.free[place.id][K] = { t: t.map(r4), w: [1, 2, 3, 4].map((u) => pick(`dw_r_{SM_${u}}`)), step: k };
    }
  }
  writeFileSync(new URL('pss.json', OUT), JSON.stringify(out));
  log('wrote pss.json');
}

// ── 8.11 Converter model reduction ───────────────────────────────────────────

const IBR = [
  {
    id: 'gfm',
    preset: 'gfm_smib',
    plot: 'p_m_{GFM_1}',
    jump: 10,
    levels: [
      ['full', 'Ordre complet (EMT)', 'Full order (EMT)'],
      ['no_trafo', 'Sans courant du transformateur', 'No transformer current'],
      ['no_filter', 'Sans filtre LC', 'No LC filter'],
      ['no_inner', 'Sans boucle de courant', 'No inner current loop'],
      ['no_voltage', 'Sans boucle de tension', 'No voltage loop'],
      ['droop', 'Statisme seul (RMS)', 'Droop only (RMS)'],
    ],
  },
  {
    id: 'gfl',
    preset: 'gfl_smib',
    plot: 'M_pll_{GFL_1}',
    jump: 3,
    levels: [
      ['full', 'Ordre complet (EMT)', 'Full order (EMT)'],
      ['no_trafo', 'Sans courant du transformateur', 'No transformer current'],
      ['no_filter', 'Sans filtre LCL', 'No LCL filter'],
      ['no_inner', 'Sans boucle de courant', 'No inner current loop'],
      ['no_dc', 'Sans bus continu', 'No DC link'],
      ['pll', 'PLL seule (RMS)', 'PLL only (RMS)'],
    ],
  },
];

async function bakeIbr() {
  const out = {};
  for (const c of IBR) {
    const base = await call(`/api/presets/${c.preset}/network`);
    out[c.id] = { plot: c.plot, jump: c.jump, levels: [] };
    for (const [id, fr, en] of c.levels) {
      const net = { ...base, models: { ...base.models, network_level: id === 'full' ? 'full' : 'quasi_stationary', [`${c.id}_level`]: id } };
      log('ibr modal', c.id, id);
      const m = await call('/api/network/modal', { network: net });
      const eig = m.modes.map((x) => ({ re: r4(x.real), im: r4(x.imag), z: r4(x.damping_pct), top: x.state1 }));
      const entry = { id, name: { fr, en }, n: m.modes.length, eig, emt: null };
      log('ibr emt', c.id, id, '(slow)');
      const t0 = Date.now();
      try {
        const r = await call('/api/network/emt', { network: net, perturb_kind: 'event', event: { kind: 'phase_jump', bus: 4, angle_deg: c.jump }, t_final: 0.5, linear_overlay: true, plot_states: [c.plot] });
        entry.emt = {
          seconds: r4((Date.now() - t0) / 1000),
          t: r.t.map(r4),
          y: r.series[c.plot].map(r4),
          linT: r.linear ? r.linear.t.map(r4) : null,
          lin: r.linear?.series?.[c.plot]?.map(r4) ?? null,
        };
      } catch (e) {
        entry.emt = { error: String(e).slice(0, 200) };
      }
      out[c.id].levels.push(entry);
      writeFileSync(new URL('ibr.json', OUT), JSON.stringify(out));
    }
  }
  log('wrote ibr.json');
}

if (run('pss')) await bakePss();
if (run('ibr')) await bakeIbr();
