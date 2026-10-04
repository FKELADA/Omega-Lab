// The design target of lesson 3.1: at most 5 % overshoot, settled within 0.6 s.
export const SPEC = {
  os: 0.05,
  ts: 0.6,
  /** ζ giving exactly 5 % overshoot: −ln(0.05)/√(π² + ln²(0.05)). */
  zetaMin: -Math.log(0.05) / Math.sqrt(Math.PI ** 2 + Math.log(0.05) ** 2),
};
