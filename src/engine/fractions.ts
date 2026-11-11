// Fractions are written in text as {3/4} or {2 3/4}. The Rich component draws them stacked.
import type { Frac } from './types';

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** {n/d} */
export const fr = (n: number | string, d: number | string) => `{${n}/${d}}`;
/** {w n/d} */
export const mx = (w: number, n: number, d: number) => `{${w} ${n}/${d}}`;

/** An improper fraction as a mixed number, keeping the same denominator. */
export const toMixed = (n: number, d: number): Frac => ({ whole: Math.floor(n / d), num: n % d, den: d });

/** How a fraction answer is written in text: {n/d}, {w n/d}, or a whole number. */
export function showFrac(f: Frac): string {
  if (f.num === 0) return String(f.whole);
  return f.whole ? mx(f.whole, f.num, f.den) : fr(f.num, f.den);
}
