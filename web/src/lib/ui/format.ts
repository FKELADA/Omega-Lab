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
const NO_PREFIX = new Set(['', '%', 'rad/s', '1/s', '°', 'dB']);

function split(v: number, unit: string): { m: number; pre: number } {
  if (NO_PREFIX.has(unit) || v === 0 || !isFinite(v)) return { m: v, pre: 3 };
  const a = Math.abs(v);
  let idx = PREFIXES.findIndex(([f]) => a >= f * 0.9995);
  if (idx < 0) idx = PREFIXES.length - 1;
  return { m: v / PREFIXES[idx][0], pre: idx };
}

export function num(v: number, digits = 3): string {
  if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
  const a = Math.abs(v);
  const sci = a !== 0 && (a >= 1e5 || a < 1e-3);
  const opts: Intl.NumberFormatOptions = sci
    ? { notation: 'scientific', maximumSignificantDigits: digits }
    : { maximumSignificantDigits: digits };
  return new Intl.NumberFormat(ui.lang === 'fr' ? 'fr-FR' : 'en-GB', opts).format(v).replace('-', '−');
}

/** Plain-text value with unit, e.g. "31,4 mA". */
export function si(v: number, unit: string, digits = 3): string {
  const { m, pre } = split(v, unit);
  const u = PREFIXES[pre][1] + unit;
  return u ? `${num(m, digits)} ${u}` : num(m, digits);
}

const TEX_UNITS: Record<string, string> = { '1/s': 's^{-1}', Ω: '\\Omega' };

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
