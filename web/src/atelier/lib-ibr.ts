// Inverter-based resources (averaged models with their controls): grid-following
// and grid-forming inverters, PV plant with MPPT, battery with frequency
// support, wind turbine, and the MMC of HVDC links.

import { capacitor } from './engine/elements';
import { addI, nodeV, type EmtElement } from './engine/emt';
import { gflCore, gfmCore, type VscMeas } from './engine/vsc';
import { si, type ElementDef, type PortDef, type Sig } from './defs';

const abc = (dx: number): PortDef => ({ id: 'abc', dx, dy: 0, phases: 3, label: 'abc' });
const i3: Sig[] = ['a', 'b', 'c'].map((x) => ({ id: `i${x}`, unit: 'A', name: { fr: `courant ${x}`, en: `current ${x}` }, sym: `i_${x}` }));
const PQf: Sig[] = [
  { id: 'P', unit: 'pu', name: { fr: 'puissance active', en: 'active power' }, sym: 'P' },
  { id: 'Q', unit: 'pu', name: { fr: 'puissance réactive', en: 'reactive power' }, sym: 'Q' },
  { id: 'f', unit: 'Hz', name: { fr: 'fréquence mesurée', en: 'measured frequency' }, sym: 'f' },
];
const pp = (id: string, sym: string, fr: string, en: string, unit: string, def: number, min: number, max: number, scale: 'lin' | 'log' = 'lin') => ({ id, symbol: sym, name: { fr, en }, unit, default: def, min, max, scale });
const base = [
  pp('Sn', 'S_n', 'Puissance assignée', 'Rating', 'VA', 100e3, 1e3, 2e9, 'log'),
  pp('Vn', 'U_n', 'Tension assignée', 'Rated voltage', 'V', 400, 100, 1e6, 'log'),
  pp('f', 'f', 'Fréquence', 'Frequency', 'Hz', 50, 1, 1000, 'log'),
];
const gflParams = [
  pp('fpll', 'f_{PLL}', 'Bande passante de la PLL', 'PLL bandwidth', 'Hz', 20, 1, 200, 'log'),
  pp('fc', 'f_c', 'Bande passante des courants', 'Current bandwidth', 'Hz', 300, 20, 2000, 'log'),
  pp('lf', 'l_f', 'Inductance du filtre (pu)', 'Filter inductance (pu)', '', 0.15, 0.02, 0.5),
  pp('Imax', 'I_{max}', 'Courant maximal (pu)', 'Maximum current (pu)', '', 1.1, 0.5, 2),
];
const inv = 'M-14,-14 H14 V14 H-14 Z M-14,14 L14,-14 M-10,-7 H-2 M2,7 c2,-5 4,-5 6,0 s4,5 6,0';
const gfl = (p: Record<string, number>) => ({ Sn: p.Sn, Vn: p.Vn, f: p.f, lf: p.lf, fc: p.fc, fpll: p.fpll, Imax: p.Imax });

/** PV array, normalised: current i(v) at irradiance g (pu) and temperature T (°C); v in pu of V_oc at 25 °C. */
function pvPower(v: number, g: number, T: number): number {
  const voc = 1 - 0.0035 * (T - 25), a = 0.05;
  const i = (g * (1 - Math.exp((v - voc) / a))) / (1 - Math.exp(-voc / a));
  return Math.max(0, v * i);
}
const PV_REF = Math.max(...Array.from({ length: 1001 }, (_, k) => pvPower(k / 1000, 1, 25)));

/** Power coefficient Cp(λ, β) of a wind rotor (standard empirical fit). */
function cp(lambda: number, beta: number): number {
  const li = 1 / (1 / (lambda + 0.08 * beta) - 0.035 / (beta ** 3 + 1));
  return Math.max(0, 0.5176 * (116 / li - 0.4 * beta - 5) * Math.exp(-21 / li) + 0.0068 * lambda);
}
const LOPT = 8.1, CPOPT = cp(LOPT, 0);

export const IBR: ElementDef[] = [
  {
    type: 'gfl', family: 'ibr', prefix: 'GFL',
    name: { fr: 'Onduleur suiveur (GFL)', en: 'Grid-following inverter (GFL)' },
    ports: [abc(2)],
    params: [
      ...base,
      pp('Pset', 'P^*', 'Consigne de puissance active (pu)', 'Active power setpoint (pu)', '', 0.8, -1.2, 1.2),
      pp('Qset', 'Q^*', 'Consigne de puissance réactive (pu)', 'Reactive power setpoint (pu)', '', 0, -1, 1),
      pp('Tr', 'T_r', 'Durée de la rampe de démarrage', 'Start-up ramp time', 's', 0.1, 0.001, 10, 'log'),
      ...gflParams,
    ],
    symbol: `${inv} M14,0 H40`,
    label: (p) => `${si(p.Sn, 'VA')} P*=${p.Pset}`,
    signals: [...i3, ...PQf],
    scopeDefault: ['P', 'Q'],
    ac: { kind: 'none' },
    build: (id, n, p, h, node) =>
      gflCore(id, n, gfl(p), h, node, (m) => ({ P: p.Pset * p.Sn * Math.min(1, m.t / p.Tr), Q: p.Qset * p.Sn * Math.min(1, m.t / p.Tr) })).els,
    formulas: [
      {
        title: { fr: 'Commande en cascade', en: 'Cascaded control' },
        tex: (c, id) => `i_d^* = \\frac{2P^*}{3v_d},\\ i_q^* = -\\frac{2Q^*}{3v_d}; \\quad e_d = v_d - \\omega L_f i_q + PI(i_d^* - i_d), \\quad P = ${c.q(c.at(`${id}.P`), 'pu')}`,
        note: (c) => c.tr({ fr: 'Une PLL aligne l’axe $d$ sur la tension, deux régulateurs PI règlent les courants $i_d$ (actif) et $i_q$ (réactif) avec découplage (leçon 7.1). Sur un réseau faible, une PLL trop rapide déstabilise l’onduleur (leçon 8.5).', en: 'A PLL aligns the $d$ axis with the voltage, two PI controllers regulate the currents $i_d$ (active) and $i_q$ (reactive) with decoupling (lesson 7.1). On a weak grid, a PLL that is too fast destabilises the inverter (lesson 8.5).' }),
      },
    ],
  },
  {
    type: 'gfm', family: 'ibr', prefix: 'GFM',
    name: { fr: 'Onduleur formeur (GFM)', en: 'Grid-forming inverter (GFM)' },
    ports: [abc(2)],
    params: [
      ...base,
      pp('Pset', 'P^*', 'Consigne de puissance active (pu)', 'Active power setpoint (pu)', '', 0.5, -1.2, 1.2),
      pp('Qset', 'Q^*', 'Consigne de puissance réactive (pu)', 'Reactive power setpoint (pu)', '', 0, -1, 1),
      pp('H', 'H', 'Inertie virtuelle', 'Virtual inertia', 's', 2, 0.05, 15),
      pp('R', 'R', 'Statisme P–f (pu)', 'P–f droop (pu)', '', 0.05, 0.01, 0.2),
      pp('kq', 'k_q', 'Statisme Q–V (pu)', 'Q–V droop (pu)', '', 0.05, 0, 0.2),
      pp('lf', 'l_f', 'Inductance du filtre (pu)', 'Filter inductance (pu)', '', 0.15, 0.02, 0.5),
    ],
    symbol: `${inv} M14,0 H40`,
    label: (p) => `${si(p.Sn, 'VA')} H=${p.H}`,
    signals: [...i3, ...PQf],
    scopeDefault: ['P', 'f'],
    ac: { kind: 'none' },
    build: (id, n, p, h, node) =>
      gfmCore(id, n, { Sn: p.Sn, Vn: p.Vn, f: p.f, lf: p.lf, H: p.H, R: p.R, kq: p.kq }, h, node, () => ({ P: p.Pset * p.Sn, Q: p.Qset * p.Sn })).els,
    formulas: [
      {
        title: { fr: 'Machine synchrone virtuelle', en: 'Virtual synchronous machine' },
        tex: () => `2H\\frac{d\\omega}{dt} = P^* - P - \\frac{\\omega - 1}{R}, \\qquad E = 1 + k_q(Q^* - Q)`,
        note: (c) => c.tr({ fr: 'L’onduleur impose une tension, comme un alternateur : sa puissance réagit instantanément à un saut de phase ou de fréquence du réseau, sans PLL (leçon 7.2).', en: 'The inverter imposes a voltage, like a generator: its power reacts instantly to a phase or frequency jump of the grid, without a PLL (lesson 7.2).' }),
      },
    ],
  },
  {
    type: 'pv', family: 'ibr', prefix: 'PV',
    name: { fr: 'Centrale photovoltaïque (MPPT)', en: 'PV plant (MPPT)' },
    ports: [abc(2)],
    params: [
      ...base,
      pp('G1', 'G_1', 'Ensoleillement initial', 'Initial irradiance', 'W/m²', 1000, 50, 1200),
      pp('G2', 'G_2', 'Ensoleillement après le nuage', 'Irradiance after the cloud', 'W/m²', 400, 50, 1200),
      pp('tG', 't_G', 'Instant du nuage', 'Cloud time', 's', 1, 0, 100),
      pp('T', 'T', 'Température des cellules', 'Cell temperature', '°C', 25, -20, 80),
      pp('dv', '\\Delta v', 'Pas de la MPPT (pu)', 'MPPT step (pu)', '', 0.01, 0.001, 0.1, 'log'),
      pp('tm', 'T_m', 'Période de la MPPT', 'MPPT period', 's', 0.02, 0.001, 1, 'log'),
      ...gflParams,
    ],
    symbol: `M14,0 H40 M-14,-14 H14 V14 H-14 Z M-14,-4 H14 M-14,6 H14 M-4,-14 V14 M6,-14 V14`,
    label: (p) => `${si(p.Sn, 'W')} ${Math.round(p.G1)}→${Math.round(p.G2)} W/m²`,
    signals: [...i3, ...PQf, { id: 'Pmpp', unit: 'pu', name: { fr: 'puissance maximale disponible', en: 'maximum available power' }, sym: 'P_{mpp}' }, { id: 'vop', unit: 'pu', name: { fr: 'tension de fonctionnement', en: 'operating voltage' }, sym: 'v_{op}' }],
    scopeDefault: ['P', 'Pmpp'],
    ac: { kind: 'none' },
    build: (id, n, p, h, node) => {
      let vop = 0.95, dir = -1, Pprev = 0, tNext = 0;
      const g = (t: number) => (t >= p.tG ? p.G2 : p.G1) / 1000;
      const pmpp = (t: number) => Math.max(...Array.from({ length: 101 }, (_, k) => pvPower(k / 100, g(t), p.T))) / PV_REF;
      const sp = (m: VscMeas) => {
        if (m.t >= tNext) {
          // Perturb and observe: keep going while the power rises, turn back when it falls.
          const Pnow = pvPower(vop, g(m.t), p.T);
          if (Pnow < Pprev) dir = -dir;
          Pprev = Pnow;
          vop = Math.min(1.05, Math.max(0.2, vop + dir * p.dv));
          tNext = m.t + p.tm;
        }
        return { P: (pvPower(vop, g(m.t), p.T) / PV_REF) * p.Sn * Math.min(1, m.t / 0.05), Q: 0 };
      };
      return gflCore(id, n, gfl(p), h, node, sp, (m) => ({ Pmpp: pmpp(m.t), vop })).els;
    },
    formulas: [
      {
        title: { fr: 'Recherche du point de puissance maximale', en: 'Maximum power point tracking' },
        tex: (c, id) => `v_{k+1} = v_k + \\Delta v\\,\\text{sign}(\\Delta P_k \\cdot \\Delta v_k), \\qquad P = ${c.q(c.at(`${id}.P`), 'pu')},\\ P_{mpp} = ${c.q(c.at(`${id}.Pmpp`), 'pu')}`,
        note: (c) => c.tr({ fr: 'Toutes les $T_m$, l’algorithme « perturber et observer » déplace la tension de fonctionnement et garde la direction qui augmente la puissance (leçon 7.3). Un nuage fait chuter le courant, l’algorithme retrouve le nouveau maximum.', en: 'Every $T_m$, the “perturb and observe” algorithm moves the operating voltage and keeps the direction that increases power (lesson 7.3). A cloud cuts the current, the algorithm finds the new maximum.' }),
      },
    ],
  },
  {
    type: 'bess', family: 'ibr', prefix: 'BAT',
    name: { fr: 'Batterie (soutien de fréquence)', en: 'Battery (frequency support)' },
    ports: [abc(2)],
    params: [
      ...base,
      pp('E', 'E', 'Énergie', 'Energy', 'Wh', 50e3, 1e3, 1e9, 'log'),
      pp('soc0', 'SoC_0', 'État de charge initial', 'Initial state of charge', '', 0.6, 0, 1),
      pp('R', 'R', 'Statisme (pu)', 'Droop (pu)', '', 0.01, 0.002, 0.1, 'log'),
      { id: 'ffr', symbol: '\\text{FFR}', name: { fr: 'Réponse rapide', en: 'Fast response' }, unit: '', default: 0, min: 0, max: 1, scale: 'lin', choices: [{ value: 0, label: { fr: 'statisme', en: 'droop' } }, { value: 1, label: { fr: 'FFR', en: 'FFR' } }] },
      pp('fthr', 'f_{FFR}', 'Seuil de la FFR', 'FFR threshold', 'Hz', 49.8, 45, 50),
      ...gflParams.map((q) => (q.id === 'fpll' ? { ...q, default: 10 } : q)),
    ],
    symbol: 'M14,0 H40 M-14,-10 H14 V10 H-14 Z M-6,-4 V4 M-2,-7 V7 M4,-4 V4 M8,-7 V7',
    label: (p) => `${si(p.Sn, 'W')} ${si(p.E, 'Wh')}`,
    signals: [...i3, ...PQf, { id: 'soc', unit: '', name: { fr: 'état de charge', en: 'state of charge' }, sym: 'SoC' }],
    scopeDefault: ['P', 'f'],
    ac: { kind: 'none' },
    build: (id, n, p, h, node) => {
      let soc = p.soc0, fired = false;
      const sp = (m: VscMeas) => {
        const df = (p.f - m.f) / p.f; // positive when the frequency is low
        let P = m.t < 0.2 ? 0 : Math.max(-1, Math.min(1, df / p.R)) * p.Sn;
        if (p.ffr && m.t > 0.2 && (fired || m.f < p.fthr)) (fired = true), (P = p.Sn);
        if ((soc <= 0 && P > 0) || (soc >= 1 && P < 0)) P = 0;
        soc -= (P * m.h) / 3600 / p.E;
        return { P, Q: 0 };
      };
      return gflCore(id, n, gfl(p), h, node, sp, () => ({ soc })).els;
    },
    formulas: [
      {
        title: { fr: 'Soutien de fréquence', en: 'Frequency support' },
        tex: (c, id) => `P = \\frac{f_0 - f}{f_0\\,R}\\,S_n \\ \\text{(statisme)} \\quad \\text{ou} \\quad P = S_n \\text{ si } f < f_{FFR}, \\qquad SoC = ${c.q(c.at(`${id}.soc`), '')}`,
        note: (c) => c.tr({ fr: 'La fréquence est mesurée par la PLL. En statisme, la batterie répond en proportion de l’écart ; en FFR, elle donne toute sa puissance dès le seuil franchi (leçon 7.5).', en: 'Frequency is measured by the PLL. In droop mode the battery responds in proportion to the deviation; in FFR it gives its full power once the threshold is crossed (lesson 7.5).' }),
      },
    ],
  },
  {
    type: 'wind', family: 'ibr', prefix: 'EOL',
    name: { fr: 'Éolienne (type 4)', en: 'Wind turbine (type 4)' },
    ports: [abc(2)],
    params: [
      ...base.map((q) => (q.id === 'Sn' ? { ...q, default: 2e6 } : q)),
      pp('v', 'v', 'Vitesse du vent', 'Wind speed', 'm/s', 9, 3, 25),
      pp('dv', '\\Delta v', 'Rafale', 'Gust', 'm/s', 3, 0, 10),
      pp('tg', 't_r', 'Début de la rafale', 'Gust start', 's', 1, 0, 100),
      pp('Tg', 'T_r', 'Durée de la rafale', 'Gust duration', 's', 4, 0.1, 100),
      pp('H', 'H', 'Inertie du rotor', 'Rotor inertia', 's', 4, 0.5, 10),
      ...gflParams,
    ],
    symbol: 'M14,0 H40 M0,14 V-2 M0,-2 L-12,-12 M0,-2 L12,-10 M0,-2 L2,12',
    label: (p) => `${si(p.Sn, 'W')} ${p.v} m/s`,
    signals: [...i3, ...PQf, { id: 'w', unit: 'pu', name: { fr: 'vitesse du rotor', en: 'rotor speed' }, sym: '\\omega_r' }, { id: 'beta', unit: '°', name: { fr: 'calage des pales', en: 'pitch angle' }, sym: '\\beta' }, { id: 'vw', unit: 'm/s', name: { fr: 'vent', en: 'wind' }, sym: 'v' }],
    scopeDefault: ['P', 'w'],
    ac: { kind: 'none' },
    build: (id, n, p, h, node) => {
      const vr = 12; // rated wind speed
      let w = Math.min(1, p.v / vr), beta = 0, xb = 0, vw = p.v;
      const sp = (m: VscMeas) => {
        vw = p.v + (m.t >= p.tg && m.t < p.tg + p.Tg ? p.dv : 0);
        const lambda = (LOPT * w * vr) / Math.max(vw, 0.1);
        const Pa = (vw / vr) ** 3 * (cp(lambda, beta) / CPOPT);
        // Torque control: MPPT (P ∝ ω³) below rated, rated power above.
        const Pg = Math.min(1, w ** 3);
        w += (m.h / (2 * 4 * Math.max(w, 0.2))) * (Pa - Pg) * (4 / p.H);
        // Pitch: limit the speed to 1 pu.
        const e = w - 1;
        xb += 30 * e * m.h;
        xb = Math.max(0, Math.min(30, xb));
        beta = Math.max(0, Math.min(30, 60 * e + xb));
        return { P: Pg * p.Sn * Math.min(1, m.t / 0.05), Q: 0 };
      };
      return gflCore(id, n, gfl(p), h, node, sp, () => ({ w, beta, vw })).els;
    },
    formulas: [
      {
        title: { fr: 'Puissance du vent', en: 'Wind power' },
        tex: (c, id) => `P = \\tfrac12\\rho\\pi R^2 C_p(\\lambda, \\beta)\\,v^3, \\quad \\lambda = \\frac{\\omega R}{v}, \\quad \\omega_r = ${c.q(c.at(`${id}.w`), 'pu')},\\ \\beta = ${c.q(c.at(`${id}.beta`), '°')}`,
        note: (c) => c.tr({ fr: 'Sous la vitesse nominale, le couple suit $k\\omega^2$ pour rester au sommet de $C_p$ ; au-dessus, le calage des pales limite la vitesse. L’inertie du rotor lisse les rafales (leçon 7.4).', en: 'Below rated speed, torque follows $k\\omega^2$ to stay at the top of $C_p$; above, blade pitch limits the speed. Rotor inertia smooths the gusts (lesson 7.4).' }),
      },
    ],
  },
  {
    type: 'mmc', family: 'ibr', prefix: 'MMC',
    name: { fr: 'Convertisseur MMC (CCHT, moyen)', en: 'MMC converter (HVDC, averaged)' },
    ports: [{ id: 'p', dx: -2, dy: -1, label: '+' }, { id: 'n', dx: -2, dy: 1, label: '−' }, abc(2)],
    params: [
      pp('Sn', 'S_n', 'Puissance assignée', 'Rating', 'VA', 500e6, 1e6, 3e9, 'log'),
      pp('Vn', 'U_n', 'Tension alternative', 'AC voltage', 'V', 220e3, 1e3, 1e6, 'log'),
      pp('f', 'f', 'Fréquence', 'Frequency', 'Hz', 50, 1, 1000, 'log'),
      pp('Vdc', 'V_{dc}', 'Tension continue', 'DC voltage', 'V', 400e3, 1e3, 1.2e6, 'log'),
      { id: 'mode', symbol: '\\text{mode}', name: { fr: 'Commande', en: 'Control' }, unit: '', default: 0, min: 0, max: 1, scale: 'lin', choices: [{ value: 0, label: { fr: 'puissance', en: 'power' } }, { value: 1, label: { fr: 'tension continue', en: 'DC voltage' } }] },
      pp('Pset', 'P^*', 'Consigne de puissance (pu, vers l’alternatif)', 'Power setpoint (pu, to AC)', '', 0.8, -1.1, 1.1),
      pp('Qset', 'Q^*', 'Consigne de réactif (pu)', 'Reactive setpoint (pu)', '', 0, -1, 1),
      pp('Wc', 'W_c', 'Énergie stockée (kJ/MVA)', 'Stored energy (kJ/MVA)', '', 30, 5, 100),
      pp('fv', 'f_v', 'Bande passante de la boucle de tension continue', 'DC voltage loop bandwidth', 'Hz', 10, 1, 50),
      ...gflParams.map((q) => (q.id === 'fc' ? { ...q, default: 200 } : q)),
    ],
    symbol: 'M-40,-20 H-16 M-40,20 H-16 M16,0 H40 M-16,-24 H16 V24 H-16 Z M-8,-16 h16 M-8,-10 h16 M-8,-4 h16 M-8,4 h16 M-8,10 h16 M-8,16 h16',
    box: [20, 28],
    label: (p) => `${si(p.Sn, 'VA')} ${p.mode ? 'V_dc' : `P*=${p.Pset}`}`,
    signals: [...i3, ...PQf, { id: 'Vdc', unit: 'V', name: { fr: 'tension continue', en: 'DC voltage' }, sym: 'V_{dc}' }, { id: 'idc', unit: 'A', name: { fr: 'courant continu', en: 'DC current' }, sym: 'i_{dc}' }],
    scopeDefault: ['P', 'Vdc'],
    ac: { kind: 'none' },
    build: (id, nodes, p, h, node) => {
      const [dp, dn, ...ac] = nodes;
      // Equivalent DC capacitance of the submodules, precharged at V_dc.
      const Ceq = (2 * p.Wc * 1e3 * (p.Sn / 1e6)) / (p.Vdc * p.Vdc);
      const cap = capacitor(`${id}:C`, dp, dn, Ceq, h);
      cap.v = p.Vdc;
      let Pac = 0, Vdc = p.Vdc, xv = 0, idc = 0;
      const wv = 2 * Math.PI * p.fv, Kp = 2 * 0.7 * wv * Ceq * p.Vdc, Ki = wv * wv * Ceq * p.Vdc;
      // The converter draws P_ac / V_dc from its DC terminals (power balance).
      const draw: EmtElement = {
        id: `${id}:dc`, v: 0, i: 0,
        stamp: () => {},
        rhs(b, _t, sys) {
          idc = Pac / Math.max(Vdc, 0.1 * p.Vdc);
          addI(b, sys, dp, dn, idc);
        },
        update(x, _t, sys) {
          Vdc = nodeV(x, sys, dp) - nodeV(x, sys, dn);
        },
      };
      const sp = (m: VscMeas) => {
        Pac = m.P;
        if (!p.mode) return { P: p.Pset * p.Sn * Math.min(1, m.t / 0.2), Q: p.Qset * p.Sn };
        const e = p.Vdc - Vdc;
        xv += Ki * e * m.h;
        return { P: -(Kp * e + xv), Q: p.Qset * p.Sn };
      };
      const core = gflCore(id, ac, gfl(p), h, node, sp, () => ({ Vdc, idc }));
      return [cap, draw, ...core.els];
    },
    formulas: [
      {
        title: { fr: 'Modèle moyen du MMC', en: 'Averaged MMC model' },
        tex: (c, id) => `P_{dc} = P_{ac} \\;\\Rightarrow\\; i_{dc} = \\frac{P_{ac}}{V_{dc}}, \\qquad C_{eq} = \\frac{2W_cS_n}{V_{dc}^2}, \\quad V_{dc} = ${c.q(c.at(`${id}.Vdc`), 'V')}`,
        note: (c) => c.tr({ fr: 'Côté alternatif, une source de tension commandée comme un onduleur suiveur ; côté continu, une capacité équivalente aux condensateurs des sous-modules et un courant fixé par la conservation de la puissance (leçon 7.6). Une station règle la tension continue, l’autre la puissance.', en: 'On the AC side, a controlled voltage source driven like a grid-following inverter; on the DC side, a capacitance equivalent to the submodule capacitors and a current set by power balance (lesson 7.6). One station controls the DC voltage, the other the power.' }),
      },
    ],
  },
];

