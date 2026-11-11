import { describe, expect, it } from 'vitest';
import { fmt, roundTo, toRoman, toWords } from '../src/engine/format';
import { makeRng } from '../src/engine/rng';
import { isCorrect, type Level, type Question } from '../src/engine/types';
import { UNITS } from '../src/curriculum';
import { additionWorking, subtractionWorking } from '../src/skills/add-subtract';
import { divisionWorking, factorsOf, isPrime, shortMultiplicationWorking } from '../src/skills/multiply-divide';
import { ALL_CONTENT } from '../src/skills';
import { MIXED, ROUND_SIZE, TABLES, clock, isTableKey, makeRound } from '../src/tables';

const parse = (s: string): number => {
  // Fractions are written {3/4} or {2 3/4}.
  const f = s.match(/^\{(?:(\d+) )?(\d+)\/(\d+)\}$/);
  if (f) return Number(f[1] ?? 0) + Number(f[2]) / Number(f[3]);
  if (s.endsWith('%')) return Number(s.slice(0, -1)) / 100;
  return Number(s.replace(/,/g, '').replace('−', '-').replace('°C', ''));
};

const fromRoman = (s: string) => {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) total += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]];
  return total;
};

function checkShape(q: Question) {
  expect(q.prompt.length).toBeGreaterThan(0);
  expect(q.explain.length).toBeGreaterThan(0);
  for (const line of [q.prompt, q.show ?? '', ...q.explain]) expect(line).not.toMatch(/undefined|NaN|Infinity/);
  switch (q.kind) {
    case 'number':
      if (q.decimal) expect(Math.abs(q.answer * 1000 - Math.round(q.answer * 1000))).toBeLessThan(1e-6); // at most 3 decimal places
      else expect(Number.isInteger(q.answer)).toBe(true);
      expect(String(Math.abs(q.answer)).replace('.', '').length).toBeLessThanOrEqual(7); // fits the number pad
      expect(Number(String(q.answer))).toBe(q.answer); // typing the digits gives exactly this value
      if (q.answer < 0) expect(q.allowNegative).toBe(true);
      expect(isCorrect(q, q.answer)).toBe(true);
      expect(isCorrect(q, q.answer + 1)).toBe(false);
      break;
    case 'column': {
      const total = q.op === '+' ? q.rows.reduce((a, b) => a + b, 0) : q.op === '-' ? q.rows[0] - q.rows[1] : q.rows[0] * q.rows[1];
      if (q.workRows) expect(q.op).toBe('\u00d7');
      expect(q.answer).toBe(total);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(1_000_000);
      if (q.op === '-') expect(q.rows.length).toBe(2);
      expect(q.explain[q.explain.length - 1]).toBe(`Answer: ${fmt(q.answer)}.`);
      break;
    }
    case 'fraction': {
      const a = q.answer;
      expect(a.den).toBeGreaterThan(1);
      expect(a.num).toBeGreaterThan(0);
      for (const v of [a.whole, a.num, a.den]) expect(String(v).length).toBeLessThanOrEqual(3); // fits the boxes
      if (q.mixed) { expect(a.num).toBeLessThan(a.den); expect(a.whole).toBeGreaterThan(0); } else expect(a.whole).toBe(0);
      expect(isCorrect(q, a)).toBe(true);
      expect(isCorrect(q, { ...a, num: a.num + 1 })).toBe(false);
      expect(isCorrect(q, { ...a, den: 0 })).toBe(false);
      // An equivalent fraction is accepted unless the simplest form was asked for.
      expect(isCorrect(q, { whole: a.whole, num: a.num * 2, den: a.den * 2 })).toBe(!q.simplest);
      // A mixed-number answer must not be given as an improper fraction.
      if (q.mixed) expect(isCorrect(q, { whole: 0, num: a.whole * a.den + a.num, den: a.den })).toBe(false);
      break;
    }
    case 'division':
      expect(q.answer * q.divisor + q.remainder).toBe(q.dividend);
      expect(q.remainder).toBeGreaterThanOrEqual(0);
      expect(q.remainder).toBeLessThan(q.divisor);
      expect(q.askRemainder).toBe(q.remainder > 0);
      expect(q.divisor).toBeLessThan(10);
      expect(q.explain[q.explain.length - 1]).toBe(`Answer: ${fmt(q.answer)}${q.remainder ? ` remainder ${q.remainder}` : ''}.`);
      expect(isCorrect(q, { quotient: q.answer, remainder: q.remainder })).toBe(true);
      expect(isCorrect(q, { quotient: q.answer + 1, remainder: q.remainder })).toBe(false);
      if (q.askRemainder) expect(isCorrect(q, { quotient: q.answer, remainder: 0 })).toBe(false);
      break;
    case 'choice':
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      break;
    case 'order': {
      expect([...q.items].sort()).toEqual([...q.answer].sort());
      expect(new Set(q.items).size).toBe(q.items.length);
      expect(q.items).not.toEqual(q.answer); // never already in order
      const nums = q.answer.map(parse);
      const asc = nums.every((v, i) => i === 0 || nums[i - 1] < v);
      const desc = nums.every((v, i) => i === 0 || nums[i - 1] > v);
      expect(asc || desc).toBe(true);
      expect(q.prompt.includes('largest first')).toBe(desc);
      break;
    }
    case 'line':
      expect(q.answer).toBeGreaterThanOrEqual(q.min);
      expect(q.answer).toBeLessThanOrEqual(q.max);
      expect((q.answer - q.min) % q.step).toBe(0);
      break;
  }
}

describe('helpers', () => {
  it('formats numbers', () => {
    expect(fmt(1234567)).toBe('1,234,567');
    expect(fmt(-42)).toBe('−42');
  });
  it('writes numbers in words', () => {
    expect(toWords(406215)).toBe('four hundred and six thousand, two hundred and fifteen');
    expect(toWords(406015)).toBe('four hundred and six thousand and fifteen');
    expect(toWords(30007)).toBe('thirty thousand and seven');
    expect(toWords(52300)).toBe('fifty-two thousand, three hundred');
    expect(toWords(1000000)).toBe('one million');
  });
  it('rounds with halves going up', () => {
    expect(roundTo(4372, 100)).toBe(4400);
    expect(roundTo(4350, 100)).toBe(4400);
    expect(roundTo(4349, 100)).toBe(4300);
    expect(roundTo(450000, 100000)).toBe(500000);
  });
  it('writes Roman numerals that read back to the same number', () => {
    expect(toRoman(1998)).toBe('MCMXCVIII');
    expect(toRoman(444)).toBe('CDXLIV');
    for (let n = 1; n <= 3999; n++) expect(fromRoman(toRoman(n))).toBe(n);
  });
});

describe('skill content', () => {
  it('exists for every skill in units 1 to 4 and nowhere unknown', () => {
    const known = new Set(UNITS.flatMap((u) => u.skills.map((s) => s.id)));
    for (const c of ALL_CONTENT) expect(known.has(c.id)).toBe(true);
    for (const u of UNITS.slice(0, 4)) for (const s of u.skills) expect(ALL_CONTENT.some((c) => c.id === s.id)).toBe(true);
  });

  for (const content of ALL_CONTENT) {
    for (const level of [1, 2, 3] as Level[]) {
      it(`${content.id} level ${level} makes sound questions`, () => {
        const kinds = new Set<string>();
        for (let seed = 1; seed <= 3000; seed++) {
          const q = content.generate(level, makeRng(seed));
          kinds.add(q.kind);
          checkShape(q);
        }
        expect(kinds.size).toBeGreaterThan(0);
      });
    }
  }
});

// Independent re-working of the answers, written separately from the generators.
describe('answers are right', () => {
  const each = (id: string, level: Level, fn: (q: Question) => void) => {
    const c = ALL_CONTENT.find((x) => x.id === id)!;
    for (let seed = 1; seed <= 3000; seed++) fn(c.generate(level, makeRng(seed)));
  };

  it('place value', () => {
    for (const level of [1, 2, 3] as Level[]) {
      each('place-value-1', level, (q) => {
        if (q.kind === 'number' && q.prompt.startsWith('What is the value')) {
          const digit = Number(q.prompt.match(/digit (\d)/)![1]);
          const n = String(parse(q.show!));
          const i = n.indexOf(String(digit));
          expect(q.answer).toBe(digit * 10 ** (n.length - 1 - i));
        }
        if (q.kind === 'choice') {
          const [a, b] = q.options.map(parse);
          expect(parse(q.options[q.answer])).toBe(q.prompt.includes('larger') ? Math.max(a, b) : Math.min(a, b));
        }
        if (q.kind === 'number' && q.prompt.startsWith('Write this number')) expect(toWords(q.answer)).toBe(q.show);
        if (q.kind === 'number' && q.prompt.startsWith('Use each')) {
          const cards = q.show!.split(/\s+/).sort().join('');
          expect(String(q.answer).split('').sort().join('')).toBe(cards);
          if (q.prompt.includes('odd')) expect(q.answer % 2).toBe(1);
          if (q.prompt.includes('even')) expect(q.answer % 2).toBe(0);
        }
      });
    }
  });

  it('counting in powers of 10', () => {
    for (const level of [1, 2] as Level[]) {
      each('place-value-2', level, (q) => {
        if (q.kind !== 'number') throw new Error('unexpected kind');
        const m = q.prompt.match(/What is ([\d,]+) (more|less) than ([\d,]+)/);
        if (m) expect(q.answer).toBe(parse(m[3]) + (m[2] === 'more' ? 1 : -1) * parse(m[1]));
        else {
          const t = q.show!.split(/,\s{2}/).slice(0, 3).map(parse);
          expect(t[1] - t[0]).toBe(t[2] - t[1]);
          expect(q.answer).toBe(t[2] + (t[2] - t[1]));
        }
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(1_000_000);
      });
    }
    each('place-value-2', 3, (q) => {
      if (q.kind !== 'number') throw new Error('unexpected kind');
      if (q.show) {
        const t = q.show.split(/,\s{2}/).slice(1).map(parse);
        expect(q.answer).toBe(t[0] - (t[1] - t[0]));
      } else {
        const m = q.prompt.match(/starts at ([\d,]+) and counts (on|back) in steps of ([\d,]+)/)!;
        expect(q.answer).toBe(parse(m[1]) + (m[2] === 'on' ? 4 : -4) * parse(m[3]));
      }
    });
  });

  it('rounding', () => {
    for (const level of [1, 2] as Level[]) {
      each('place-value-4', level, (q) => {
        if (q.kind !== 'number') throw new Error('unexpected kind');
        const m = q.prompt.match(/Round ([\d,]+) to the nearest ([\d,]+)/)!;
        const n = parse(m[1]), p = parse(m[2]);
        expect(q.answer % p).toBe(0);
        expect(Math.abs(q.answer - n)).toBeLessThanOrEqual(p / 2);
        if (Math.abs(q.answer - n) === p / 2) expect(q.answer).toBeGreaterThan(n);
      });
    }
    each('place-value-4', 3, (q) => {
      if (q.kind === 'number') {
        const m = q.prompt.match(/rounds to ([\d,]+) to the nearest ([\d,]+)\. What is the (smallest|largest)/)!;
        const x = parse(m[1]), p = parse(m[2]);
        expect(roundTo(q.answer, p)).toBe(x);
        expect(roundTo(q.answer + (m[3] === 'smallest' ? -1 : 1), p)).not.toBe(x);
      } else if (q.kind === 'choice') {
        const m = q.prompt.match(/rounds to ([\d,]+) to the nearest ([\d,]+)/)!;
        const hits = q.options.map((o) => roundTo(parse(o), parse(m[2])) === parse(m[1]));
        expect(hits.filter(Boolean).length).toBe(1);
        expect(hits[q.answer]).toBe(true);
      }
    });
  });

  it('Roman numerals', () => {
    for (const level of [1, 2, 3] as Level[]) {
      each('place-value-5', level, (q) => {
        if (q.kind === 'number') expect(fromRoman(q.show!)).toBe(q.answer);
        if (q.kind === 'choice') expect(fromRoman(q.options[q.answer])).toBe(parse(q.prompt.match(/([\d,]+)/)![1]));
      });
    }
  });

  it('negative numbers', () => {
    for (const level of [1, 2, 3] as Level[]) {
      each('place-value-3', level, (q) => {
        const nums = (s: string) => [...s.matchAll(/−?\d+/g)].map((m) => parse(m[0]));
        if (q.kind === 'line') expect(q.answer).toBe(nums(q.prompt)[0]);
        if (q.kind === 'choice') {
          const [a, b] = q.options.map(parse);
          expect(parse(q.options[q.answer])).toBe(q.prompt.includes('colder') ? Math.min(a, b) : Math.max(a, b));
        }
        if (q.kind !== 'number') return;
        const n = nums(q.prompt);
        if (q.prompt.includes('It falls by')) expect(q.answer).toBe(n[0] - n[1]);
        else if (q.prompt.startsWith('Start at')) expect(q.answer).toBe(q.prompt.includes('Count on') ? n[0] + n[1] : n[0] - n[1]);
        else if (q.prompt.includes('rose from')) expect(q.answer).toBe(n[1] - n[0]);
        else if (q.prompt.includes('On Monday')) expect(q.answer).toBe(n[0] - n[1] + n[2]);
        else if (q.show) {
          const t = q.show.split(/,\s{2}/).slice(0, 3).map(parse);
          expect(q.answer).toBe(t[2] + (t[2] - t[1]));
          expect(q.answer).toBeLessThan(0);
        } else throw new Error('unrecognised question: ' + q.prompt);
      });
    }
  });
});

describe('unit 2 answers are right', () => {
  const each = (id: string, level: Level, fn: (q: Question) => void) => {
    const c = ALL_CONTENT.find((x) => x.id === id)!;
    for (let seed = 1; seed <= 3000; seed++) fn(c.generate(level, makeRng(seed)));
  };
  const PLACE_NAMES = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten thousands', 'Hundred thousands', 'Millions'];
  const nums = (s: string) => [...s.matchAll(/\d[\d,]*/g)].map((m) => parse(m[0]));

  // Rebuild the answer from the digit each line of working arrives at.
  const digitsFromWorking = (lines: string[], fallback: number) => {
    const out = String(fallback).split('').reverse().map(Number);
    for (const line of lines) {
      const place = PLACE_NAMES.findIndex((p) => line.startsWith(p + ':'));
      if (place === -1) continue;
      const result = Number(line.match(/= (\d+)\./)![1]);
      out[place] = result % 10;
    }
    return Number(out.reverse().join(''));
  };

  it('written working matches the real sum', () => {
    expect(additionWorking([46275, 8163]).at(-1)).toBe('Answer: 54,438.');
    expect(subtractionWorking(52364, 7138).at(-1)).toBe('Answer: 45,226.');
    const r = makeRng(7);
    for (let i = 0; i < 5000; i++) {
      const a = r.int(1000, 499999), b = r.int(1000, 499999);
      expect(digitsFromWorking(additionWorking([a, b]), a + b)).toBe(a + b);
      const [hi, lo] = a >= b ? [a, b] : [b, a];
      // Start from the top number: every column the working skips must be an unchanged copy of it.
      expect(digitsFromWorking(subtractionWorking(hi, lo), hi) % 10 ** String(hi).length).toBe(hi - lo);
    }
    for (const [a, b] of [[40003, 17568], [500200, 1111], [70010, 69999], [100000, 99999], [90000, 1234]]) {
      expect(digitsFromWorking(subtractionWorking(a, b), a)).toBe(a - b);
    }
  });

  it('mental methods', () => {
    for (const level of [1, 2, 3] as Level[]) {
      each('add-subtract-3', level, (q) => {
        if (q.kind !== 'number') throw new Error('unexpected kind');
        const n = nums(q.prompt);
        if (q.prompt.startsWith('What must be added')) expect(n[0] + q.answer).toBe(n[1]);
        else expect(q.answer).toBe(q.prompt.includes('+') ? n[0] + n[1] : n[0] - n[1]);
        expect(q.answer).toBeGreaterThan(0);
        expect(q.explain.at(-1)).toContain(fmt(q.answer));
      });
    }
  });

  it('estimating', () => {
    for (const level of [1, 2, 3] as Level[]) {
      each('add-subtract-4', level, (q) => {
        const n = nums(q.prompt);
        const add = q.prompt.includes('+');
        const real = add ? n[0] + n[1] : n[0] - n[1];
        expect(real).toBeGreaterThan(0);
        if (q.kind === 'number') {
          const p = n[2];
          expect(q.answer).toBe(add ? roundTo(n[0], p) + roundTo(n[1], p) : roundTo(n[0], p) - roundTo(n[1], p));
          expect(q.answer).toBeGreaterThan(0);
        } else if (q.kind === 'choice' && q.prompt.startsWith('Which is the best')) {
          const gaps = q.options.map((o) => Math.abs(parse(o) - real));
          expect(gaps.indexOf(Math.min(...gaps))).toBe(q.answer);
        } else if (q.kind === 'choice') {
          const claimed = n[2];
          expect(q.answer).toBe(claimed === real ? 0 : claimed > real ? 1 : 2);
          if (claimed !== real) expect(Math.abs(claimed - real)).toBeGreaterThanOrEqual(20000);
        }
      });
    }
  });

  it('problems end on the stated answer', () => {
    for (const level of [1, 2, 3] as Level[]) {
      each('add-subtract-5', level, (q) => {
        if (q.kind !== 'number') throw new Error('unexpected kind');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.explain.at(-1)).toContain(fmt(q.answer));
        if (q.show) {
          const n = nums(q.show);
          expect(n[0] + q.answer).toBe(n[1]);
        }
        if (q.prompt.startsWith('Two numbers add up')) {
          const n = nums(q.prompt);
          expect(q.answer + q.answer + n[1]).toBe(n[0]);
        }
      });
    }
  });
});

describe('unit 3 answers are right', () => {
  const each = (id: string, fn: (q: Question) => void) => {
    const c = ALL_CONTENT.find((x) => x.id === id)!;
    for (const level of [1, 2, 3] as Level[]) for (let seed = 1; seed <= 3000; seed++) fn(c.generate(level, makeRng(seed)));
  };
  const ints = (s: string) => [...s.matchAll(/\d[\d,]*/g)].map((m) => parse(m[0]));
  // Turns "6\u00b2 + 2\u00b3" or "? \u00d7 100 = 362" into something JavaScript can work out.
  const value = (expr: string, missing?: number) =>
    Function(
      `return (${expr
        .replace(/,/g, '')
        .replace('?', String(missing))
        .replace(/\u00d7/g, '*')
        .replace(/\u00f7/g, '/')
        .replace(/\u2212/g, '-')
        .replace(/\u00b2/g, '**2')
        .replace(/\u00b3/g, '**3')})`,
    )() as number;
  const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-9);
  const answerOf = (q: Question) => (q.kind === 'choice' ? parse(q.options[q.answer]) : (q as { answer: number }).answer);
  const exactlyOne = (q: Question, test: (v: number) => boolean) => {
    if (q.kind !== 'choice') throw new Error('expected a choice');
    const hits = q.options.map((o) => test(parse(o)));
    expect(hits.filter(Boolean).length).toBe(1);
    expect(hits[q.answer]).toBe(true);
  };
  // Any question shown as an equation must balance once the answer is put in.
  const balances = (q: Question) => {
    if (!q.show || !q.show.includes('=')) return false;
    const [left, right] = q.show.split('=');
    close(value(left, answerOf(q)), value(right, answerOf(q)));
    return true;
  };

  it('multiples and factors', () => {
    each('multiply-divide-1', (q) => {
      const n = ints(q.prompt);
      if (balances(q)) return;
      if (q.prompt.startsWith('Which number is a multiple')) exactlyOne(q, (v) => v % n[0] === 0);
      else if (q.prompt.startsWith('Which number is a factor')) exactlyOne(q, (v) => n[0] % v === 0);
      else if (q.prompt.startsWith('Which number is a common factor')) exactlyOne(q, (v) => n[0] % v === 0 && n[1] % v === 0);
      else if (q.kind !== 'number') throw new Error('unexpected: ' + q.prompt);
      else if (q.prompt.includes('multiple of both')) {
        let m = 1;
        while (m % n[0] || m % n[1]) m++;
        expect(q.answer).toBe(m);
      } else if (q.prompt.includes('factor of both')) expect(q.answer).toBe(Math.max(...factorsOf(n[0]).filter((d) => n[1] % d === 0)));
      else if (q.prompt.startsWith('How many factors')) expect(q.answer).toBe(factorsOf(n[0]).length);
      else if (q.prompt.includes('multiple of')) expect(q.answer).toBe(n[0] * n[1]);
      else throw new Error('unexpected: ' + q.prompt);
    });
  });

  it('prime numbers', () => {
    expect([2, 3, 5, 7, 11, 13, 17, 19].every(isPrime)).toBe(true);
    expect([1, 9, 15, 21, 51, 91].some(isPrime)).toBe(false);
    each('multiply-divide-2', (q) => {
      if (q.prompt === 'Which of these is a prime number?') exactlyOne(q, isPrime);
      else if (q.prompt === 'Which of these is not a prime number?') exactlyOne(q, (v) => !isPrime(v));
      else if (q.prompt.startsWith('Is ') && q.kind === 'choice') expect(q.answer).toBe(isPrime(ints(q.prompt)[0]) ? 0 : 1);
      else if (q.prompt.startsWith('What is the next prime') && q.kind === 'number') {
        const n = ints(q.prompt)[0];
        expect(isPrime(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(n);
        for (let v = n + 1; v < q.answer; v++) expect(isPrime(v)).toBe(false);
      } else if (q.prompt.includes('product of prime factors') && q.kind === 'choice') {
        const n = ints(q.prompt)[0];
        const good = q.options.map((o) => ints(o).every(isPrime) && ints(o).reduce((a, b) => a * b, 1) === n);
        expect(good.filter(Boolean).length).toBe(1);
        expect(good[q.answer]).toBe(true);
      } else throw new Error('unexpected: ' + q.prompt);
    });
  });

  it('squares and cubes', () => {
    each('multiply-divide-3', (q) => {
      const n = ints(q.prompt);
      if (q.kind === 'choice') exactlyOne(q, (v) => Number.isInteger(Math.sqrt(v)));
      else if (q.kind !== 'number') throw new Error('unexpected kind');
      else if (q.show) expect(q.answer).toBe(value(q.show));
      else if (q.prompt.includes('squared makes')) expect(q.answer ** 2).toBe(n[0]);
      else if (q.prompt.includes('area of')) expect(q.answer ** 2).toBe(n[0]);
      else if (q.prompt.includes('solid cube')) expect(q.answer).toBe(n[1] ** 3);
      else throw new Error('unexpected: ' + q.prompt);
    });
  });

  it('powers of ten and mental methods', () => {
    for (const id of ['multiply-divide-4', 'multiply-divide-5']) {
      each(id, (q) => {
        if (balances(q)) return;
        if (q.kind !== 'number') throw new Error('unexpected kind');
        const expr = q.prompt.replace(/^.*?(?=\d)/, '');
        close(q.answer, value(expr));
        expect(q.answer).toBeGreaterThan(0);
      });
    }
  });

  it('written multiplication and division working', () => {
    expect(shortMultiplicationWorking(2346, 7).at(-1)).toBe('Answer: 16,422.');
    expect(divisionWorking(952, 4)).toEqual(['4 into 9 goes 2 with 1 left over. Carry the 1.', '4 into 15 goes 3 with 3 left over. Carry the 3.', '4 into 32 goes 8.', 'Answer: 238.']);
    expect(divisionWorking(1236, 4).slice(0, 2)).toEqual(['4 into 1 does not go. Carry the 1.', '4 into 12 goes 3.']);
    expect(divisionWorking(953, 4).at(-1)).toBe('Answer: 238 remainder 1.');
    each('multiply-divide-6', (q) => {
      if (q.kind !== 'column') throw new Error('unexpected kind');
      expect(q.rows.length).toBe(2);
      if (q.rows[1] < 10) {
        // Rebuild the product from the digit each line writes down.
        const lines = q.explain.slice(0, -1);
        const built = lines.map((l, i) => { const v = Number(l.match(/= (\d+)\./)![1]); return i === lines.length - 1 ? String(v) : String(v % 10); }).reverse().join('');
        expect(Number(built)).toBe(q.answer);
      } else {
        expect(q.workRows!.map((w) => value(w)).reduce((a, b) => a + b, 0)).toBe(q.answer);
      }
    });
    each('multiply-divide-7', (q) => {
      if (q.kind === 'division') {
        // Rebuild the quotient from the "goes N" in each line.
        const built = q.explain.slice(0, -1).map((l) => (l.includes('does not go') ? '0' : l.match(/goes (\d)/)![1])).join('');
        expect(Number(built)).toBe(q.answer);
      } else if (q.kind === 'number') {
        const n = ints(q.prompt);
        const total = Math.max(n[0], n[1]), size = Math.min(n[0], n[1]);
        const want = q.prompt.includes('minibuses') ? Math.ceil(total / size) : q.prompt.includes('left over') ? total % size : Math.floor(total / size);
        expect(q.answer).toBe(want);
      } else throw new Error('unexpected kind');
    });
  });

  it('problems end on the stated answer', () => {
    for (const id of ['multiply-divide-8', 'multiply-divide-9']) {
      each(id, (q) => {
        if (q.kind !== 'number') throw new Error('unexpected kind');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.explain.at(-1)).toContain(fmt(q.answer));
        balances(q);
        // Every line of working that is a sum must be true.
        for (const line of q.explain) {
          for (const m of line.matchAll(/([\d,]+(?:\u00b2)?(?: [+\u2212\u00d7\u00f7] [\d,]+)+) = ([\d,]+)/g)) close(value(m[1]), parse(m[2]));
        }
      });
    }
  });
});

describe('unit 4 answers are right', () => {
  const each = (id: string, fn: (q: Question) => void) => {
    const c = ALL_CONTENT.find((x) => x.id === id)!;
    for (const level of [1, 2, 3] as Level[]) for (let seed = 1; seed <= 3000; seed++) fn(c.generate(level, makeRng(seed)));
  };
  const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-9);
  // Works out text such as "{1/4} + {3/8}" or "{2 1/3} × 4", with ? replaced by the answer.
  const value = (expr: string, missing?: number) =>
    Function(
      `return (${expr
        .replace(/\?/g, String(missing))
        .replace(/\{(\d+) (\d+)\/(\d+)\}/g, '($1+$2/$3)')
        .replace(/\{(\d+)\/(\d+)\}/g, '($1/$2)')
        .replace(/×/g, '*')
        .replace(/−/g, '-')})`,
    )() as number;
  const fracs = (s: string) => [...s.matchAll(/\{(?:\d+ )?\d+\/\d+\}/g)].map((m) => m[0]);
  const answerValue = (q: Question) => {
    if (q.kind !== 'fraction') throw new Error('expected a fraction answer');
    return q.answer.whole + q.answer.num / q.answer.den;
  };
  const hcf = (a: number, b: number): number => (b ? hcf(b, a % b) : a);

  it('comparing and ordering', () => {
    each('fractions-1', (q) => {
      if (q.kind === 'order') return; // order is checked by value in the shape test
      if (q.kind !== 'choice') throw new Error('unexpected kind');
      if (q.show) {
        const [a, b] = fracs(q.show).map(parse);
        expect(q.options[q.answer]).toBe(Math.abs(a - b) < 1e-9 ? '=' : a < b ? '<' : '>');
      } else {
        const [a, b] = q.options.map(parse);
        expect(Math.abs(a - b)).toBeGreaterThan(1e-9);
        close(parse(q.options[q.answer]), q.prompt.includes('larger') ? Math.max(a, b) : Math.min(a, b));
        if (q.bars) q.bars.forEach((bar) => expect(q.options.some((o) => Math.abs(parse(o) - bar.shaded / bar.parts) < 1e-9)).toBe(true));
      }
    });
  });

  it('equivalent fractions', () => {
    each('fractions-2', (q) => {
      if (q.kind === 'number') {
        const [left, right] = q.show!.split('=');
        close(value(left, q.answer), value(right, q.answer));
        if (q.bars) close(q.bars[0].shaded / q.bars[0].parts, q.bars[1].shaded / q.bars[1].parts);
      } else if (q.kind === 'fraction') {
        expect(q.simplest).toBe(true);
        expect(hcf(q.answer.num, q.answer.den)).toBe(1);
        close(answerValue(q), parse(fracs(q.prompt)[0]));
      } else if (q.kind === 'choice') {
        const target = parse(fracs(q.prompt)[0]);
        const same = q.options.map((o) => Math.abs(parse(o) - target) < 1e-9);
        const wantSame = !q.prompt.includes('not equivalent');
        expect(same.filter((v) => v === wantSame).length).toBe(1);
        expect(same[q.answer]).toBe(wantSame);
        expect(q.options.length).toBe(4);
      } else throw new Error('unexpected kind');
    });
  });

  it('mixed numbers and improper fractions', () => {
    each('fractions-3', (q) => {
      if (q.kind === 'fraction') {
        close(answerValue(q), q.show ? value(q.show) : parse(fracs(q.prompt)[0]));
        if (q.prompt.includes('improper')) expect(q.answer.num).toBeGreaterThan(q.answer.den);
        if (q.bars) close(q.bars[0].shaded / q.bars[0].parts, answerValue(q));
      } else if (q.kind === 'choice') {
        const [a, b] = q.options.map(parse);
        expect(Math.abs(a - b)).toBeGreaterThan(1e-9);
        close(parse(q.options[q.answer]), q.prompt.includes('larger') ? Math.max(a, b) : Math.min(a, b));
      } else throw new Error('unexpected kind');
    });
  });

  it('adding, subtracting and multiplying', () => {
    for (const id of ['fractions-4', 'fractions-5']) {
      each(id, (q) => {
        if (q.kind !== 'fraction') throw new Error('unexpected kind');
        if (q.show) close(answerValue(q), value(q.show));
        else {
          const lots = Number(q.prompt.match(/needed for (\d+)/)![1]);
          close(answerValue(q), parse(fracs(q.prompt)[0]) * lots);
        }
        expect(answerValue(q)).toBeGreaterThan(0);
        expect(q.mixed).toBe(answerValue(q) > 1);
        if (q.bars) close(q.bars[0].shaded / q.bars[0].parts, answerValue(q));
        // Every "a = b" step in the working must hold.
        for (const line of q.explain) {
          for (const m of line.matchAll(/(\{[^}]+\}(?: [+−×] (?:\{[^}]+\}|\d+))?) = (\{[^}]+\})/g)) close(value(m[1]), value(m[2]));
        }
      });
    }
  });
});

describe('unit 5 answers are right', () => {
  const each = (id: string, fn: (q: Question) => void) => {
    const c = ALL_CONTENT.find((x) => x.id === id)!;
    for (const level of [1, 2, 3] as Level[]) for (let seed = 1; seed <= 3000; seed++) fn(c.generate(level, makeRng(seed)));
  };
  const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-9);
  // Works out text such as "0.3 + {4/100}" with ? replaced by the answer.
  const value = (expr: string, missing?: number) =>
    Function(
      `return (${expr
        .replace(/\?/g, String(missing))
        .replace(/\{(\d+) (\d+)\/(\d+)\}/g, '($1+$2/$3)')
        .replace(/\{(\d+)\/(\d+)\}/g, '($1/$2)')
        .replace(/(\d+)%/g, '($1/100)')
        .replace(/×/g, '*')
        .replace(/−/g, '-')})`,
    )() as number;
  // The first fraction, percentage or number written in a piece of text.
  const firstValue = (s: string) => value(s.match(/\{[^}]+\}|\d+(?:\.\d+)?%?/)![0]);
  const numbers = (s: string) => [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  const answerOf = (q: Question) => {
    if (q.kind === 'number') return q.answer;
    if (q.kind === 'fraction') return q.answer.whole + q.answer.num / q.answer.den;
    throw new Error('unexpected kind');
  };
  const hcf = (a: number, b: number): number => (b ? hcf(b, a % b) : a);
  // Rounding done on whole hundredths, separately from the app's own helper.
  const hundredths = (x: number) => Math.round(x * 100);
  const toTenth = (x: number) => Math.floor((hundredths(x) + 5) / 10) / 10;
  const pickLargerOrSmaller = (q: Question) => {
    if (q.kind !== 'choice') throw new Error('unexpected kind');
    const [a, b] = q.options.map(parse);
    expect(q.options.length).toBe(2);
    expect(Math.abs(a - b)).toBeGreaterThan(1e-9);
    close(parse(q.options[q.answer]), q.prompt.includes('larger') ? Math.max(a, b) : Math.min(a, b));
  };

  it('decimals as fractions', () => {
    each('decimals-percentages-1', (q) => {
      close(answerOf(q), firstValue(q.prompt));
      if (q.kind === 'fraction') {
        expect(q.simplest ?? false).toBe(q.prompt.includes('simplest'));
        if (q.simplest) expect(hcf(q.answer.num, q.answer.den)).toBe(1);
        else expect([10, 100]).toContain(q.answer.den);
      }
    });
  });

  it('thousandths', () => {
    each('decimals-percentages-2', (q) => {
      if (q.kind === 'choice') {
        const [, digit, text] = q.prompt.match(/digit (\d) in ([\d.]+)/)!;
        const [whole, places] = text.split('.');
        expect(text.split(digit).length).toBe(2); // the digit appears once
        const name = whole === digit ? 'ones' : ['tenths', 'hundredths', 'thousandths'][places.indexOf(digit)];
        expect(q.options[q.answer]).toBe(`${digit} ${name}`);
        expect(q.options.length).toBe(4);
      } else if (q.kind === 'number') {
        if (q.show) {
          const [left, right] = q.show.split('=');
          close(value(left, q.answer), value(right, q.answer));
        } else if (q.prompt.includes('more than') || q.prompt.includes('less than')) {
          const [step, start] = numbers(q.prompt);
          close(q.answer, q.prompt.includes('more') ? start + step : start - step);
        } else close(q.answer, firstValue(q.prompt));
      } else throw new Error('unexpected kind');
    });
  });

  it('rounding', () => {
    each('decimals-percentages-3', (q) => {
      if (q.kind === 'choice') {
        const target = numbers(q.prompt)[0];
        const hits = q.options.map((o) => Math.abs(toTenth(parse(o)) - target) < 1e-9);
        expect(hits.filter(Boolean).length).toBe(1);
        expect(hits[q.answer]).toBe(true);
      } else if (q.kind === 'number') {
        const x = numbers(q.prompt)[0];
        if (q.prompt.includes('whole number')) expect(q.answer).toBe(Math.floor((hundredths(x) + 50) / 100));
        else if (q.prompt.includes('could be')) {
          const outside = q.prompt.includes('smallest') ? q.answer - 0.01 : q.answer + 0.01;
          close(toTenth(q.answer), x);
          expect(Math.abs(toTenth(outside) - x)).toBeGreaterThan(0.05);
        } else close(q.answer, toTenth(x));
        expect(q.explain.at(-1)).toContain(q.prompt.includes('could be') ? String(q.answer) : ` ${Number.isInteger(q.answer) && !q.prompt.includes('whole') ? q.answer.toFixed(1) : q.answer}.`);
      } else throw new Error('unexpected kind');
    });
  });

  it('ordering', () => {
    each('decimals-percentages-4', (q) => {
      if (q.kind === 'order') return; // order is checked by value in the shape test
      if (q.kind !== 'choice') throw new Error('unexpected kind');
      if (q.prompt.includes('sign')) {
        const [a, b] = numbers(q.show!);
        expect(a).not.toBe(b);
        expect(q.options[q.answer]).toBe(a < b ? '<' : '>');
      } else if (q.prompt.includes('between')) {
        const [low, high] = numbers(q.prompt);
        const inside = q.options.map((o) => parse(o) > low && parse(o) < high);
        expect(inside.filter(Boolean).length).toBe(1);
        expect(inside[q.answer]).toBe(true);
      } else pickLargerOrSmaller(q);
    });
  });

  it('decimal problems', () => {
    each('decimals-percentages-5', (q) => {
      if (q.kind !== 'number') throw new Error('unexpected kind');
      expect(q.answer).toBeGreaterThan(0);
      if (q.show?.includes('?')) {
        const [left, right] = q.show.split('=');
        close(value(left, q.answer), value(right, q.answer));
      } else if (q.show) close(q.answer, value(q.show));
      else {
        const n = numbers(q.prompt);
        const want = q.prompt.includes('altogether') ? n[0] + n[1] : q.prompt.includes('left') ? n[0] - n[1] - n[2] : Math.abs(n[0] - n[1]);
        close(q.answer, want);
        expect(q.unit).toBeTruthy();
        expect(q.explain.at(-1)).toContain(`${q.answer} ${q.unit}`);
      }
    });
  });

  it('percentages', () => {
    each('decimals-percentages-6', (q) => {
      const n = numbers(q.prompt);
      if (q.prompt.includes('class')) {
        if (q.kind !== 'number') throw new Error('unexpected kind');
        expect(q.answer).toBe(100 - n[0] - (q.prompt.includes('cycle') ? n[1] : 0));
        expect(q.answer).toBeGreaterThan(0);
        expect(q.unit).toBe('%');
      } else if (q.kind === 'number' && q.unit === '%') {
        expect(q.prompt).toContain('as a percentage');
        close(q.answer / 100, firstValue(q.prompt));
      } else {
        expect(q.prompt).toMatch(/as a (decimal|fraction)/);
        close(answerOf(q), firstValue(q.prompt));
      }
    });
  });

  it('fractions, decimals and percentages', () => {
    each('decimals-percentages-7', (q) => {
      if (q.kind === 'order') {
        expect(new Set(q.items.map((i) => (i.endsWith('%') ? 'p' : i.startsWith('{') ? 'f' : 'd'))).size).toBeGreaterThan(1);
        // The percentages given in the working must match the cards.
        for (const m of q.explain[1].matchAll(/(\{[^}]+\}|[\d.]+) = (\d+%)/g)) close(parse(m[1]), parse(m[2]));
      } else if (q.kind === 'choice' && q.prompt.includes('same as')) {
        const target = firstValue(q.prompt);
        const same = q.options.map((o) => Math.abs(parse(o) - target) < 1e-9);
        expect(same.filter(Boolean).length).toBe(1);
        expect(same[q.answer]).toBe(true);
        expect(q.options.length).toBe(4);
      } else if (q.kind === 'choice') pickLargerOrSmaller(q);
      else if (q.kind === 'number' && q.unit === '%') close(q.answer / 100, firstValue(q.prompt));
      else {
        close(answerOf(q), firstValue(q.prompt));
        if (q.kind === 'fraction') { expect(q.simplest).toBe(true); expect(hcf(q.answer.num, q.answer.den)).toBe(1); }
      }
      // Each chain of equals signs in the working must hold all the way along.
      for (const line of q.explain) {
        if (!line.includes(' = ') || line.includes(',')) continue;
        const parts = line.split(' = ').map((p) => value(p));
        parts.forEach((p) => close(p, parts[0]));
      }
    });
  });
});

describe('times tables', () => {
  const work = (text: string) => {
    const [a, op, b] = text.split(' ');
    return op === '×' ? Number(a) * Number(b) : Number(a) / Number(b);
  };
  it('gives every fact of one table once', () => {
    for (const n of TABLES) for (const division of [true, false]) for (let seed = 1; seed <= 300; seed++) {
      const round = makeRound(String(n), division, makeRng(seed));
      expect(round.length).toBe(ROUND_SIZE);
      const others: number[] = [];
      for (const f of round) {
        expect(work(f.text)).toBe(f.answer);
        expect(f.full).toBe(`${f.text} = ${f.answer}`);
        if (!division) expect(f.text).toContain('×');
        const [a, op, b] = f.text.split(' ');
        if (op === '×') {
          expect([Number(a), Number(b)]).toContain(n);
          others.push(Number(a) === n ? Number(b) : Number(a));
        } else {
          expect(Number(b)).toBe(n);
          others.push(f.answer);
        }
      }
      expect(others.sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
  });
  it('gives twelve different mixed facts', () => {
    let divisions = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const round = makeRound(MIXED, true, makeRng(seed));
      expect(round.length).toBe(ROUND_SIZE);
      const ids = round.map((f) => {
        expect(work(f.text)).toBe(f.answer);
        const [a, op, b] = f.text.split(' ').map((v, i) => (i === 1 ? v : Number(v))) as [number, string, number];
        if (op === '÷') divisions++;
        const pair = op === '×' ? [a, b] : [b, f.answer];
        pair.forEach((v) => { expect(v).toBeGreaterThanOrEqual(2); expect(v).toBeLessThanOrEqual(12); });
        return pair.sort((x, y) => x - y).join(',');
      });
      expect(new Set(ids).size).toBe(ROUND_SIZE);
    }
    expect(divisions).toBeGreaterThan(3000);
  });
  it('knows its table names and shows times', () => {
    expect(isTableKey('7')).toBe(true);
    expect(isTableKey('mixed')).toBe(true);
    expect(isTableKey('13')).toBe(false);
    expect(isTableKey('1')).toBe(false);
    expect(clock(75)).toBe('1:15');
    expect(clock(9)).toBe('0:09');
  });
});
