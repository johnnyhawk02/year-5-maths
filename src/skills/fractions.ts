// Unit 4: Fractions. All wording and questions are our own.
// Fractions in text are written {3/4} or {2 3/4} and drawn stacked on screen.
import { hundredSquare } from '../engine/pictures';
import { fr, gcd, mx, showFrac, toMixed } from '../engine/fractions';
import type { Rng } from '../engine/rng';
import type { Frac, FractionQuestion, Question, SkillContent } from '../engine/types';

const X = '×';
const DIV = '÷';
const MINUS = '−';

/** A base denominator and a multiple of it, such as 4 and 12. */
function family(r: Rng, maxDen = 24): { d: number; k: number } {
  for (;;) {
    const d = r.int(2, 6), k = r.int(2, 4);
    if (d * k <= maxDen) return { d, k };
  }
}

const choiceOf = (r: Rng, prompt: string, right: string, wrong: string[], explain: string[], extra: Partial<Question> = {}): Question => {
  const options = r.shuffle([right, ...wrong]);
  return { kind: 'choice', prompt, options, answer: options.indexOf(right), explain, ...extra } as Question;
};

const fracQ = (prompt: string, show: string | undefined, answer: Frac, mixed: boolean, explain: string[], extra: Partial<FractionQuestion> = {}): FractionQuestion => ({
  kind: 'fraction', prompt, show, answer, mixed, explain, ...extra,
});

// ---------- 1. Comparing and ordering ----------

function compareTwo(r: Rng, withBars: boolean): Question {
  const { d, k } = family(r);
  const a = r.int(1, d - 1);
  let b: number;
  do b = r.int(1, d * k - 1);
  while (b === a * k);
  const larger = r.next() < 0.5;
  const bigIsFirst = a * k > b;
  const right = larger === bigIsFirst ? fr(a, d) : fr(b, d * k);
  const wrong = right === fr(a, d) ? fr(b, d * k) : fr(a, d);
  return choiceOf(r, `Which fraction is ${larger ? 'larger' : 'smaller'}?`, right, [wrong], [
    `Give them the same denominator. Multiply the top and bottom of ${fr(a, d)} by ${k}: ${fr(a * k, d * k)}.`,
    `Now compare ${fr(a * k, d * k)} and ${fr(b, d * k)} by looking at the numerators.`,
    `${right} is ${larger ? 'larger' : 'smaller'}.`,
  ], withBars ? { bars: [{ parts: d, shaded: a }, { parts: d * k, shaded: b }] } : {});
}

function signBetween(r: Rng): Question {
  const { d, k } = family(r);
  const a = r.int(1, d - 1);
  const b = r.next() < 0.3 ? a * k : r.int(1, d * k - 1);
  const sign = a * k < b ? '<' : a * k > b ? '>' : '=';
  const options = ['<', '>', '='];
  return {
    kind: 'choice',
    prompt: 'Which sign goes in the gap?',
    show: `${fr(a, d)}  ?  ${fr(b, d * k)}`,
    options,
    answer: options.indexOf(sign),
    explain: [
      `Change ${fr(a, d)} into ${fr(a * k, d * k)} so both have the same denominator.`,
      `${a * k} is ${sign === '<' ? 'less than' : sign === '>' ? 'more than' : 'equal to'} ${b}, so the sign is ${sign}.`,
    ],
  };
}

function orderFractions(r: Rng, beyondOne: boolean): Question {
  for (;;) {
    const d = r.int(2, 4);
    const dens = r.pick([[d, d * 2, d * 4], [d, d * 3, d * 6], [d, d * 2, d * 6]]);
    const top = dens[2];
    const seen = new Set<number>();
    const items: { text: string; value: number }[] = [];
    for (let tries = 0; items.length < 4 && tries < 60; tries++) {
      const den = dens[items.length % 3];
      const n = r.int(1, beyondOne ? den * 2 + den - 1 : den - 1);
      if (n % den === 0) continue;
      const value = (n * top) / den; // in units of 1/top, always whole
      if (seen.has(value)) continue;
      seen.add(value);
      // Past one whole, show some as mixed numbers and some as improper fractions.
      const text = n > den && r.next() < 0.5 ? mx(Math.floor(n / den), n % den, den) : fr(n, den);
      items.push({ text, value });
    }
    if (items.length < 4) continue;
    const sorted = [...items].sort((x, y) => x.value - y.value);
    let shown = r.shuffle(items);
    if (shown.every((it, i) => it === sorted[i])) shown = [...sorted].reverse();
    return {
      kind: 'order',
      prompt: 'Put these in order, smallest first.',
      items: shown.map((i) => i.text),
      answer: sorted.map((i) => i.text),
      explain: [
        `Change them all so the denominator is ${top}.`,
        sorted.map((i) => `${i.text} = ${fr(i.value, top)}`).join(',  '),
        `In order: ${sorted.map((i) => i.text).join(',  ')}.`,
      ],
    };
  }
}

const comparing: SkillContent = {
  id: 'fractions-1',
  example: [
    { say: 'When two fractions have the same denominator, the one with the bigger numerator is larger.', show: `${fr(5, 8)}  >  ${fr(3, 8)}`, bars: [{ parts: 8, shaded: 5 }, { parts: 8, shaded: 3 }] },
    { say: 'When the denominators are different, change one fraction so they match.', show: `${fr(3, 4)}  and  ${fr(5, 8)}`, bars: [{ parts: 4, shaded: 3 }, { parts: 8, shaded: 5 }] },
    { say: 'Multiply the top and bottom of {3/4} by 2. It is the same amount, cut into smaller pieces.', show: `${fr(3, 4)} = ${fr(6, 8)}`, bars: [{ parts: 8, shaded: 6 }] },
    { say: 'Now compare the numerators.', show: `${fr(6, 8)}  >  ${fr(5, 8)}   so   ${fr(3, 4)}  >  ${fr(5, 8)}`, bars: [{ parts: 8, shaded: 6 }, { parts: 8, shaded: 5 }] },
  ],
  generate(level, r) {
    if (level === 1) return compareTwo(r, true);
    if (level === 2) return r.pick([() => compareTwo(r, false), () => signBetween(r), () => orderFractions(r, false)])();
    return orderFractions(r, true);
  },
};

// ---------- 2. Equivalent fractions ----------

/** A fraction in its simplest form. */
function simpleFraction(r: Rng, maxDen: number): [number, number] {
  for (;;) {
    const d = r.int(2, maxDen), n = r.int(1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
}

function missingTop(r: Rng): Question {
  const [a, d] = simpleFraction(r, 6);
  const k = r.int(2, 4);
  return {
    kind: 'number',
    prompt: 'What is the missing number?',
    show: `${fr(a, d)} = ${fr('?', d * k)}`,
    answer: a * k,
    bars: [{ parts: d, shaded: a }, { parts: d * k, shaded: a * k }],
    explain: [`The denominator has been multiplied by ${k}: ${d} ${X} ${k} = ${d * k}.`, `Do the same to the numerator: ${a} ${X} ${k} = ${a * k}.`],
  };
}

function missingBottom(r: Rng): Question {
  const [a, d] = simpleFraction(r, 9);
  const k = r.int(2, 6);
  return {
    kind: 'number',
    prompt: 'What is the missing number?',
    show: `${fr(a, d)} = ${fr(a * k, '?')}`,
    answer: d * k,
    explain: [`The numerator has been multiplied by ${k}: ${a} ${X} ${k} = ${a * k}.`, `Do the same to the denominator: ${d} ${X} ${k} = ${d * k}.`],
  };
}

function tenthsHundredths(r: Rng): Question {
  const a = r.int(1, 9);
  const up = r.next() < 0.5;
  return {
    kind: 'number',
    prompt: 'What is the missing number?',
    show: up ? `${fr(a, 10)} = ${fr('?', 100)}` : `${fr(a * 10, 100)} = ${fr('?', 10)}`,
    answer: up ? a * 10 : a,
    explain: up
      ? ['One tenth is the same as ten hundredths.', `${a} tenths = ${a * 10} hundredths.`]
      : ['Ten hundredths make one tenth.', `${a * 10} ${DIV} 10 = ${a}, so it is ${a} tenths.`],
  };
}

function simplest(r: Rng, maxK: number): Question {
  const [a, d] = simpleFraction(r, 9);
  const k = r.int(2, maxK);
  return fracQ(`Write ${fr(a * k, d * k)} in its simplest form.`, undefined, { whole: 0, num: a, den: d }, false, [
    `Find the biggest number that divides into both ${a * k} and ${d * k}. It is ${k}.`,
    `${a * k} ${DIV} ${k} = ${a} and ${d * k} ${DIV} ${k} = ${d}.`,
    `The simplest form is ${fr(a, d)}.`,
  ], { simplest: true });
}

function equivalentChoice(r: Rng, findOddOne: boolean): Question {
  const [a, d] = simpleFraction(r, 6);
  const ks = r.shuffle([2, 3, 4, 5, 6]);
  const same = ks.slice(0, 3).map((k) => fr(a * k, d * k));
  // Near misses: add the same number top and bottom, or scale only one of them.
  const k = ks[3];
  const near: string[] = r.shuffle([[a + k, d + k], [a * k, d * k + d], [a * k + a, d * k], [a + 1, d * k]])
    .filter(([n, m]) => n * d !== a * m && n < m)
    .map(([n, m]) => fr(n, m))
    .filter((text, i, all) => all.indexOf(text) === i);
  // Top up with plain near misses if two candidates happened to match.
  for (let extra = 1; near.length < 3; extra++) {
    const text = fr(a * k + extra, d * k + 2 * extra + 1);
    if ((a * k + extra) * d !== a * (d * k + 2 * extra + 1) && !near.includes(text)) near.push(text);
  }
  if (findOddOne) {
    return choiceOf(r, `Which of these is not equivalent to ${fr(a, d)}?`, near[0], same, [
      'Equivalent fractions come from multiplying the top and bottom by the same number.',
      `${same.join(', ')} all equal ${fr(a, d)}.`,
      `${near[0]} does not.`,
    ]);
  }
  return choiceOf(r, `Which fraction is equivalent to ${fr(a, d)}?`, same[0], near.slice(0, 3), [
    'Equivalent fractions come from multiplying the top and bottom by the same number.',
    `${a} ${X} ${ks[0]} = ${a * ks[0]} and ${d} ${X} ${ks[0]} = ${d * ks[0]}, so ${fr(a, d)} = ${same[0]}.`,
  ]);
}

const equivalents: SkillContent = {
  id: 'fractions-2',
  example: [
    { say: 'Equivalent fractions look different but are worth the same.', show: `${fr(1, 2)} = ${fr(2, 4)} = ${fr(4, 8)}`, bars: [{ parts: 2, shaded: 1 }, { parts: 4, shaded: 2 }, { parts: 8, shaded: 4 }] },
    { say: 'To make one, multiply the top and the bottom by the same number.', show: `${fr(2, 3)} = ${fr(8, 12)}   (both ${X} 4)`, bars: [{ parts: 3, shaded: 2 }, { parts: 12, shaded: 8 }] },
    { say: 'Dividing the top and bottom by the same number works too. This is called simplifying.', show: `${fr(12, 18)} = ${fr(2, 3)}   (both ${DIV} 6)`, bars: [{ parts: 18, shaded: 12 }, { parts: 3, shaded: 2 }] },
    { say: 'Tenths and hundredths are linked the same way.', show: `${fr(7, 10)} = ${fr(70, 100)}`, bars: [{ parts: 10, shaded: 7 }], pics: [hundredSquare(70, '70 hundredths fill the same space as 7 tenths')] },
  ],
  generate(level, r) {
    if (level === 1) return missingTop(r);
    if (level === 2) return r.pick([() => missingBottom(r), () => tenthsHundredths(r), () => equivalentChoice(r, false), () => simplest(r, 4)])();
    return r.pick([() => equivalentChoice(r, true), () => simplest(r, 8)])();
  },
};

// ---------- 3. Mixed numbers and improper fractions ----------

function improperToMixed(r: Rng): Question {
  const d = r.int(2, 9);
  let n: number;
  do n = r.int(d + 1, d * 5);
  while (n % d === 0);
  const m = toMixed(n, d);
  return fracQ(`Write ${fr(n, d)} as a mixed number.`, undefined, m, true, [
    `How many whole ones? ${n} ${DIV} ${d} = ${m.whole} remainder ${m.num}.`,
    `That is ${m.whole} whole${m.whole > 1 ? 's' : ''} and ${m.num} left over out of ${d}.`,
    `${fr(n, d)} = ${showFrac(m)}.`,
  ], d <= 6 && n <= d * 3 ? { bars: [{ parts: d, shaded: n }] } : {});
}

function mixedToImproper(r: Rng): Question {
  const d = r.int(2, 9), w = r.int(1, 5), n = r.int(1, d - 1);
  return fracQ(`Write ${mx(w, n, d)} as an improper fraction.`, undefined, { whole: 0, num: w * d + n, den: d }, false, [
    `Each whole one is ${d} ${d === 2 ? 'halves' : 'parts'}: ${w} ${X} ${d} = ${w * d}.`,
    `Add the ${n} extra: ${w * d} + ${n} = ${w * d + n}.`,
    `${mx(w, n, d)} = ${fr(w * d + n, d)}.`,
  ], d <= 6 && w <= 3 ? { bars: [{ parts: d, shaded: w * d + n }] } : {});
}

function sumPastOne(r: Rng): Question {
  for (;;) {
    const d = r.int(3, 9), a = r.int(2, d - 1), b = r.int(2, d - 1);
    if (a + b <= d || (a + b) % d === 0) continue;
    const m = toMixed(a + b, d);
    return fracQ('Add these and write the answer as a mixed number.', `${fr(a, d)} + ${fr(b, d)}`, m, true, [
      `Add the numerators: ${a} + ${b} = ${a + b}. So the total is ${fr(a + b, d)}.`,
      `${a + b} ${DIV} ${d} = ${m.whole} remainder ${m.num}.`,
      `${fr(a + b, d)} = ${showFrac(m)}.`,
    ], { bars: [{ parts: d, shaded: a }, { parts: d, shaded: b }] });
  }
}

function mixedVersusImproper(r: Rng): Question {
  const d = r.int(2, 8), w = r.int(1, 4), n = r.int(1, d - 1);
  const exact = w * d + n;
  let m: number;
  do m = exact + r.int(-3, 3);
  while (m === exact || m <= d);
  const larger = r.next() < 0.5;
  const mixedIsBig = exact > m;
  const right = larger === mixedIsBig ? mx(w, n, d) : fr(m, d);
  const wrong = right === fr(m, d) ? mx(w, n, d) : fr(m, d);
  return choiceOf(r, `Which is ${larger ? 'larger' : 'smaller'}?`, right, [wrong], [
    `Write ${mx(w, n, d)} as an improper fraction: ${w} ${X} ${d} + ${n} = ${exact}, so it is ${fr(exact, d)}.`,
    `Compare ${fr(exact, d)} with ${fr(m, d)}.`,
    `${right} is ${larger ? 'larger' : 'smaller'}.`,
  ]);
}

const mixedNumbers: SkillContent = {
  id: 'fractions-3',
  example: [
    { say: 'An improper fraction has a numerator bigger than its denominator. It is worth more than one whole.', show: fr(7, 4), bars: [{ parts: 4, shaded: 7 }] },
    { say: 'A mixed number shows the same amount as whole ones plus a fraction.', show: `${fr(7, 4)} = ${mx(1, 3, 4)}`, bars: [{ parts: 4, shaded: 7 }] },
    { say: 'To change an improper fraction, divide the top by the bottom. The answer is the wholes and the remainder is what is left.', show: `7 ${DIV} 4 = 1 remainder 3`, bars: [{ parts: 4, shaded: 7 }] },
    { say: 'To go back, multiply the whole number by the denominator and add the numerator.', show: `${mx(2, 3, 5)} = ${fr(13, 5)}   (2 ${X} 5 + 3 = 13)`, bars: [{ parts: 5, shaded: 13 }] },
  ],
  generate(level, r) {
    if (level === 1) return improperToMixed(r);
    if (level === 2) return r.pick([() => mixedToImproper(r), () => improperToMixed(r)])();
    return r.pick([() => sumPastOne(r), () => mixedVersusImproper(r)])();
  },
};

// ---------- 4. Adding and subtracting fractions ----------

function sameDenominator(r: Rng): Question {
  const d = r.int(5, 12);
  const add = r.next() < 0.5;
  const a = r.int(2, d - 2);
  const b = add ? r.int(1, d - 1 - a) : r.int(1, a - 1);
  const n = add ? a + b : a - b;
  return fracQ('Work this out.', `${fr(a, d)} ${add ? '+' : MINUS} ${fr(b, d)}`, { whole: 0, num: n, den: d }, false, [
    'The denominators are the same, so the size of the parts does not change.',
    `${add ? 'Add' : 'Subtract'} the numerators: ${a} ${add ? '+' : MINUS} ${b} = ${n}.`,
    `The answer is ${fr(n, d)}.`,
  ], { bars: [{ parts: d, shaded: a }, { parts: d, shaded: b }] });
}

function relatedDenominators(r: Rng, pastOne: boolean): Question {
  for (;;) {
    const { d, k } = family(r, 20);
    const a = r.int(1, d - 1), b = r.int(1, d * k - 1);
    const add = pastOne || r.next() < 0.5;
    const n = add ? a * k + b : a * k - b;
    const big = d * k;
    if (n <= 0 || n % big === 0 || (n > big) !== pastOne || b % k === 0) continue;
    const m = toMixed(n, big);
    const expr = `${fr(a, d)} ${add ? '+' : MINUS} ${fr(b, big)}`;
    return fracQ(pastOne ? 'Work this out. Write the answer as a mixed number.' : 'Work this out.', expr, pastOne ? m : { whole: 0, num: n, den: big }, pastOne, [
      `Make the denominators match. ${fr(a, d)} = ${fr(a * k, big)}.`,
      `${fr(a * k, big)} ${add ? '+' : MINUS} ${fr(b, big)} = ${fr(n, big)}.`,
      ...(pastOne ? [`${n} ${DIV} ${big} = ${m.whole} remainder ${m.num}, so the answer is ${showFrac(m)}.`] : []),
    ]);
  }
}

function mixedTakeAway(r: Rng): Question {
  for (;;) {
    const { d, k } = family(r, 16);
    const w = r.int(2, 4), a = r.int(1, d - 1), b = r.int(1, d * k - 1);
    const big = d * k;
    const n = (w * d + a) * k - b;
    if (n % big === 0 || n < big || b % k === 0) continue;
    const m = toMixed(n, big);
    return fracQ('Work this out. Write the answer as a mixed number.', `${mx(w, a, d)} ${MINUS} ${fr(b, big)}`, m, true, [
      `Write ${mx(w, a, d)} as an improper fraction: ${fr(w * d + a, d)}.`,
      `Make the denominators match: ${fr(w * d + a, d)} = ${fr((w * d + a) * k, big)}.`,
      `${fr((w * d + a) * k, big)} ${MINUS} ${fr(b, big)} = ${fr(n, big)}.`,
      `${n} ${DIV} ${big} = ${m.whole} remainder ${m.num}, so the answer is ${showFrac(m)}.`,
    ]);
  }
}

const addSubtract: SkillContent = {
  id: 'fractions-4',
  example: [
    { say: 'When the denominators match, just add or subtract the numerators. The denominator stays the same.', show: `${fr(3, 8)} + ${fr(2, 8)} = ${fr(5, 8)}`, bars: [{ parts: 8, shaded: 5 }] },
    { say: 'When they are different, change one fraction first so the denominators match.', show: `${fr(1, 4)} + ${fr(3, 8)}`, bars: [{ parts: 4, shaded: 1 }, { parts: 8, shaded: 3 }] },
    { say: 'One quarter is the same as two eighths.', show: `${fr(2, 8)} + ${fr(3, 8)} = ${fr(5, 8)}`, bars: [{ parts: 8, shaded: 2 }, { parts: 8, shaded: 3 }, { parts: 8, shaded: 5 }] },
    { say: 'If the answer is more than one whole, write it as a mixed number.', show: `${fr(3, 4)} + ${fr(5, 8)} = ${fr(11, 8)} = ${mx(1, 3, 8)}`, bars: [{ parts: 4, shaded: 3 }, { parts: 8, shaded: 5 }, { parts: 8, shaded: 11 }] },
  ],
  generate(level, r) {
    if (level === 1) return sameDenominator(r);
    if (level === 2) return relatedDenominators(r, false);
    return r.pick([() => relatedDenominators(r, true), () => mixedTakeAway(r)])();
  },
};

// ---------- 5. Multiplying fractions by whole numbers ----------

function unitTimes(r: Rng): Question {
  const d = r.int(3, 10), n = r.int(2, d - 1);
  return fracQ('Work this out.', `${fr(1, d)} ${X} ${n}`, { whole: 0, num: n, den: d }, false, [
    `${n} lots of one ${d === 4 ? 'quarter' : `part out of ${d}`} is ${n} parts out of ${d}.`,
    `The answer is ${fr(n, d)}.`,
  ], { bars: [{ parts: d, shaded: n }] });
}

function properTimes(r: Rng): Question {
  for (;;) {
    const d = r.int(3, 9), a = r.int(2, d - 1), n = r.int(2, 8);
    if (a * n <= d || (a * n) % d === 0) continue;
    const m = toMixed(a * n, d);
    return fracQ('Work this out. Write the answer as a mixed number.', `${fr(a, d)} ${X} ${n}`, m, true, [
      `Multiply the numerator by ${n}: ${a} ${X} ${n} = ${a * n}. The denominator stays the same.`,
      `That gives ${fr(a * n, d)}.`,
      `${a * n} ${DIV} ${d} = ${m.whole} remainder ${m.num}, so the answer is ${showFrac(m)}.`,
    ]);
  }
}

function mixedTimes(r: Rng): Question {
  for (;;) {
    const d = r.int(2, 6), w = r.int(1, 3), a = r.int(1, d - 1), n = r.int(2, 6);
    if ((a * n) % d === 0) continue;
    const part = toMixed(a * n, d);
    const answer: Frac = { whole: w * n + part.whole, num: part.num, den: d };
    return fracQ('Work this out. Write the answer as a mixed number.', `${mx(w, a, d)} ${X} ${n}`, answer, true, [
      `Multiply the whole number: ${w} ${X} ${n} = ${w * n}.`,
      `Multiply the fraction: ${fr(a, d)} ${X} ${n} = ${fr(a * n, d)}${a * n > d ? ` = ${showFrac(part)}` : ''}.`,
      `Add them together: ${showFrac(answer)}.`,
    ]);
  }
}

function recipe(r: Rng): Question {
  for (;;) {
    const d = r.pick([3, 4, 5, 8]), a = r.int(2, d - 1), n = r.int(3, 9);
    if (a * n <= d || (a * n) % d === 0) continue;
    const m = toMixed(a * n, d);
    const [what, unit] = r.pick([['cake', 'cup of milk'], ['loaf', 'kg of flour'], ['smoothie', 'litre of juice']]);
    return fracQ(`One ${what} needs ${fr(a, d)} of a ${unit}. How much is needed for ${n}? Write the answer as a mixed number.`, undefined, m, true, [
      `You need ${n} lots of ${fr(a, d)}: ${fr(a, d)} ${X} ${n} = ${fr(a * n, d)}.`,
      `${a * n} ${DIV} ${d} = ${m.whole} remainder ${m.num}, so the answer is ${showFrac(m)}.`,
    ]);
  }
}

const multiplying: SkillContent = {
  id: 'fractions-5',
  example: [
    { say: 'Multiplying a fraction by a whole number means taking that many lots of it.', show: `${fr(1, 5)} ${X} 3 = ${fr(3, 5)}`, bars: [{ parts: 5, shaded: 3 }] },
    { say: 'Multiply the numerator by the whole number. The denominator does not change, because the parts stay the same size.', show: `${fr(3, 4)} ${X} 5 = ${fr(15, 4)}`, bars: [{ parts: 4, shaded: 15 }] },
    { say: 'If the answer is improper, change it into a mixed number.', show: `${fr(15, 4)} = ${mx(3, 3, 4)}`, bars: [{ parts: 4, shaded: 15 }] },
    { say: 'For a mixed number, multiply the whole part and the fraction part separately, then add.', show: `${mx(1, 2, 3)} ${X} 4  =  4 + ${fr(8, 3)}  =  ${mx(6, 2, 3)}`, bars: [{ parts: 3, shaded: 20 }] },
  ],
  generate(level, r) {
    if (level === 1) return unitTimes(r);
    if (level === 2) return properTimes(r);
    return r.pick([() => mixedTimes(r), () => recipe(r)])();
  },
};

export const FRACTION_SKILLS: SkillContent[] = [comparing, equivalents, mixedNumbers, addSubtract, multiplying];
