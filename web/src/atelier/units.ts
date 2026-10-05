// Values typed with SI prefixes and units: "4,7µ", "10k", "20 kV", "100 mH", "1e-3".

const PREFIX: Record<string, number> = { p: 1e-12, n: 1e-9, u: 1e-6, µ: 1e-6, μ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };

export function parseSI(text: string): number | null {
  const m = text.trim().replace(',', '.').match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([pnuµμmkKMG])?\s*[A-Za-zΩ°/²]*$/);
  if (!m) return null;
  const v = parseFloat(m[1]) * (m[2] ? PREFIX[m[2]] : 1);
  return Number.isFinite(v) ? v : null;
}
