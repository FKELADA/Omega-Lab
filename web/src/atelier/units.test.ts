import { expect, it } from 'vitest';
import { parseSI } from './units';

it('reads values with SI prefixes and units', () => {
  expect(parseSI('4,7µ')).toBeCloseTo(4.7e-6, 15);
  expect(parseSI('10k')).toBe(1e4);
  expect(parseSI('20 kV')).toBe(2e4);
  expect(parseSI('100 mH')).toBeCloseTo(0.1, 12);
  expect(parseSI('1e-3')).toBe(1e-3);
  expect(parseSI('-5 V')).toBe(-5);
  expect(parseSI('2.2 MΩ')).toBe(2.2e6);
  expect(parseSI('abc')).toBeNull();
});
