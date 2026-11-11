import { describe, expect, it } from 'vitest';
import { fmt, roundTo, toRoman, toWords } from '../src/engine/format';
import { makeRng } from '../src/engine/rng';
import { isCorrect, type Level, type Question } from '../src/engine/types';
import { UNITS } from '../src/curriculum';
import { ALL_CONTENT } from '../src/skills';

const parse = (s: string) => Number(s.replace(/,/g, '').replace('−', '-').replace('°C', ''));

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
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(String(Math.abs(q.answer)).length).toBeLessThanOrEqual(7); // fits the number pad
      if (q.answer < 0) expect(q.allowNegative).toBe(true);
      expect(isCorrect(q, q.answer)).toBe(true);
      expect(isCorrect(q, q.answer + 1)).toBe(false);
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
  it('exists for every skill in unit 1 and nowhere unknown', () => {
    const known = new Set(UNITS.flatMap((u) => u.skills.map((s) => s.id)));
    for (const c of ALL_CONTENT) expect(known.has(c.id)).toBe(true);
    for (const s of UNITS[0].skills) expect(ALL_CONTENT.some((c) => c.id === s.id)).toBe(true);
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
