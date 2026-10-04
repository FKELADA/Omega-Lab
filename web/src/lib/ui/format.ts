// Number formatting with SI prefixes, in the reader's language (decimal comma in French).

import { ui } from './ui.svelte';

const PREFIXES: [number, string, string][] = [
  [1e9, 'G', 'G'],
  [1e6, 'M', 'M'],
  [1e3, 'k', 'k'],
  [1, '', ''],
  [1e-3, 'm', 'm'],
  [1e-6, 'µ', '\\mu '],
  [1e-9, 'n', 'n'],
  [1e-12, 'p', 'p'],
];

/** Units that take no SI prefix. */
const NO_PREFIX = new Set(['', '%', 'rad/s', '1/s', '°', 'dB', 'pu', 'km', 'GW', 'MW', 'Hz/s', '€/MWh', '€/h', 'MVA', 'Mvar', 'kA', 'MWh', 'kHz', 'µH', 'µF', 'mH', 'kW', 'kV', 'MJ', 'm/s', 'W/m²', '°C', 'rpm', 'ms', 'mF', 'kV ', 'pu/s']);

/** Below this, a value is round-off (e.g. the sum of balanced currents) and shown as 0. */
const NOISE = 1e-11;
const clean = (v: number) => (Math.abs(v) < NOISE ? 0 : v);

function split(v: number, unit: string): { m: number; pre: number } {
  v = clean(v);
  if (NO_PREFIX.has(unit) || v === 0 || !isFinite(v)) return { m: v, pre: 3 };
  const a = Math.abs(v);
  let idx = PREFIXES.findIndex(([f]) => a >= f * 0.9995);
  if (idx < 0) idx = PREFIXES.length - 1;
  return { m: v / PREFIXES[idx][0], pre: idx };
}

export function num(v: number, digits = 3): string {
  v = clean(v);
  if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
  const a = Math.abs(v);
  const sci = a !== 0 && (a >= 1e5 || a < 1e-3);
  const opts: Intl.NumberFormatOptions = sci
    ? { notation: 'scientific', maximumSignificantDigits: digits }
    : { maximumSignificantDigits: digits };
  return new Intl.NumberFormat(ui.lang === 'fr' ? 'fr-FR' : 'en-GB', opts).format(v).replace('-', '−');
}

/** A time value in the experiment's own unit: seconds (with prefixes) or hours of a day. */
export function time(v: number, unit: 's' | 'h' = 's', digits = 3): string {
  return unit === 'h' ? `${num(v, digits)} h` : si(v, 's', digits);
}

/** Plain-text value with unit, e.g. "31,4 mA". */
export function si(v: number, unit: string, digits = 3): string {
  const { m, pre } = split(v, unit);
  const u = PREFIXES[pre][1] + unit;
  return u ? `${num(m, digits)} ${u}` : num(m, digits);
}

const TEX_UNITS: Record<string, string> = { '1/s': 's^{-1}', Ω: '\\Omega', '°': '^{\\circ}', '%': '\\%', '€/MWh': '\\text{€}/MWh', '€/h': '\\text{€}/h', 'µH': '\\mu H', 'µF': '\\mu F', 'W/m²': 'W/m^2', '°C': '^{\\circ}C' };

/** The same, as KaTeX source. */
export function tex(v: number, unit: string, digits = 3): string {
  const { m, pre } = split(v, unit);
  const n = num(m, digits)
    .replace(/,/g, '{,}')
    .replace(/[  ]/g, '\\,')
    .replace('−', '-')
    .replace(/E(-?\d+)/, (_, e) => `\\times 10^{${e}}`);
  const u = PREFIXES[pre][2] + (TEX_UNITS[unit] ?? unit);
  return u ? `${n}\\,\\mathrm{${u}}` : n;
}
