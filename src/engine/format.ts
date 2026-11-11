const MINUS = '−';

/** 1234567 -> "1,234,567", with a proper minus sign for negatives. */
export function fmt(n: number): string {
  const s = Math.abs(n).toLocaleString('en-GB');
  return n < 0 ? MINUS + s : s;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function under1000(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (rest) {
    const t = rest < 20 ? ONES[rest] : TENS[Math.floor(rest / 10)] + (rest % 10 ? `-${ONES[rest % 10]}` : '');
    parts.push(t);
  }
  return parts.join(' and ');
}

/** British English number words for 0 to 1,000,000. */
export function toWords(n: number): string {
  if (n === 0) return 'zero';
  if (n === 1_000_000) return 'one million';
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (th) parts.push(`${under1000(th)} thousand`);
  if (rest) parts.push(rest < 100 && th ? `and ${under1000(rest)}` : under1000(rest));
  return parts.join(rest >= 100 && th ? ', ' : ' ');
}

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** The Roman numeral for 1 to 3,999, plus the parts it is built from. */
export function romanParts(n: number): { symbol: string; value: number }[] {
  const parts: { symbol: string; value: number }[] = [];
  let left = n;
  for (const [value, symbol] of ROMAN) {
    // Group repeats of the same symbol, so XXX reads as one part worth 30.
    let count = 0;
    while (left >= value) {
      left -= value;
      count++;
    }
    if (count) parts.push({ symbol: symbol.repeat(count), value: value * count });
  }
  return parts;
}

export const toRoman = (n: number): string => romanParts(n).map((p) => p.symbol).join('');

/** Rounds to the nearest multiple of p, with halves going up. */
export const roundTo = (n: number, p: number): number => Math.floor(n / p + 0.5) * p;

export const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
