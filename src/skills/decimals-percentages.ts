// Unit 5: Decimals and percentages. All wording and questions are our own.
// Decimals are held as whole numbers of thousandths so that no rounding errors creep in.
import { hundredSquare, numberLine, placeChart, type Picture } from '../engine/pictures';
import { fr, gcd, mx } from '../engine/fractions';
import type { Rng } from '../engine/rng';
import type { Written } from '../engine/written';
import type { Frac, NumberQuestion, Question, SkillContent } from '../engine/types';

const MINUS = '−';
const X = '×';

/** Adds pictures to a question. */
const withPics = <Q extends Question>(pics: Picture[], q: Q): Q => ({ ...q, pics });

/** Thousandths as decimal text: 350 -> "0.35". */
export const dec = (t: number): string => (t / 1000).toFixed(3).replace(/\.?0+$/, '');

/** A typed decimal answer, given in thousandths. */
const decQ = (prompt: string, show: string | undefined, t: number, explain: string[], extra: Partial<NumberQuestion> = {}): NumberQuestion => ({
  kind: 'number', prompt, show, answer: t / 1000, decimal: true, explain, ...extra,
});

/** A typed whole-number answer. */
const wholeQ = (prompt: string, show: string | undefined, answer: number, explain: string[], extra: Partial<NumberQuestion> = {}): NumberQuestion => ({
  kind: 'number', prompt, show, answer, explain, ...extra,
});

const fracQ = (prompt: string, answer: Frac, explain: string[], simplest = false): Question => ({
  kind: 'fraction', prompt, answer, mixed: answer.whole > 0, simplest, explain,
});

const choiceOf = (r: Rng, prompt: string, right: string, wrong: string[], explain: string[], show?: string): Question => {
  const options = r.shuffle([right, ...wrong]);
  return { kind: 'choice', prompt, show, options, answer: options.indexOf(right), explain };
};

const simplify = (n: number, d: number): [number, number] => {
  const g = gcd(n, d);
  return [n / g, d / g];
};

// ---------- 1. Decimals as fractions ----------

function fractionToDecimal(r: Rng, withWhole: boolean): Question {
  const den = r.pick([10, 100]);
  const n = den === 10 ? r.int(1, 9) : r.int(1, 99);
  const w = withWhole ? r.int(1, 9) : 0;
  const t = w * 1000 + (n * 1000) / den;
  const name = den === 10 ? 'tenths' : 'hundredths';
  return decQ(`Write ${w ? mx(w, n, den) : fr(n, den)} as a decimal.`, undefined, t, [
    `${fr(n, den)} means ${n} ${name}.`,
    den === 10 ? 'Tenths go in the first decimal place.' : `Hundredths fill the first two decimal places${n < 10 ? ', so a zero is needed in the tenths place' : ''}.`,
    `The answer is ${dec(t)}.`,
  ]);
}

function decimalToFraction(r: Rng, withWhole: boolean): Question {
  const tenths = r.next() < 0.35;
  let n: number;
  do n = tenths ? r.int(1, 9) : r.int(1, 99);
  while (!tenths && n % 10 === 0);
  const den = tenths ? 10 : 100;
  const w = withWhole ? r.int(1, 9) : 0;
  const t = w * 1000 + (n * 1000) / den;
  return fracQ(`Write ${dec(t)} as a ${w ? 'mixed number' : 'fraction'}.`, { whole: w, num: n, den }, [
    `The last digit of ${dec(t)} is in the ${tenths ? 'tenths' : 'hundredths'} place, so the denominator is ${den}.`,
    `${dec(t)} = ${w ? mx(w, n, den) : fr(n, den)}.`,
  ]);
}

function decimalToSimplest(r: Rng): Question {
  let n: number;
  do n = r.int(2, 98);
  while (gcd(n, 100) === 1 || n % 10 === 0);
  const [a, b] = simplify(n, 100);
  return fracQ(`Write ${dec(n * 10)} as a fraction in its simplest form.`, { whole: 0, num: a, den: b }, [
    `${dec(n * 10)} = ${fr(n, 100)}.`,
    `Divide the top and bottom by ${100 / b}: ${fr(a, b)}.`,
  ], true);
}

function otherDenominatorToDecimal(r: Rng): Question {
  const den = r.pick([5, 20, 25, 50]);
  let n: number;
  do n = r.int(1, den - 1);
  while (gcd(n, den) !== 1);
  const k = 100 / den;
  return decQ(`Write ${fr(n, den)} as a decimal.`, undefined, n * k * 10, [
    `Change it into hundredths. Multiply the top and bottom by ${k}: ${fr(n * k, 100)}.`,
    `${fr(n * k, 100)} = ${dec(n * k * 10)}.`,
  ]);
}

const decimalsAsFractions: SkillContent = {
  id: 'decimals-percentages-1',
  example: [
    { say: 'The first decimal place is tenths. The second is hundredths.', show: '0.37  =  3 tenths and 7 hundredths', pics: [placeChart(['0.37'], { hi: ['t', 'h'] })] },
    { say: 'So 0.37 is 37 hundredths. Write it over 100.', show: `0.37 = ${fr(37, 100)}`, pics: [hundredSquare(37, '37 of the 100 squares are shaded')] },
    { say: 'It works the other way too. 9 hundredths needs a zero in the tenths place.', show: `${fr(9, 100)} = 0.09`, pics: [placeChart(['0.09']), hundredSquare(9, '9 of the 100 squares are shaded')] },
    { say: 'A number with one decimal place is a number of tenths.', show: `0.7 = ${fr(7, 10)}`, bars: [{ parts: 10, shaded: 7 }] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? fractionToDecimal(r, false) : decimalToFraction(r, false);
    if (level === 2) return r.pick([() => fractionToDecimal(r, true), () => decimalToFraction(r, true), () => fractionToDecimal(r, false)])();
    return r.next() < 0.5 ? decimalToSimplest(r) : otherDenominatorToDecimal(r);
  },
};

// ---------- 2. Thousandths ----------

/** A number of thousandths with three different non-zero decimal digits. */
function threePlaces(r: Rng, maxWhole = 9): { t: number; w: number; a: number; b: number; c: number } {
  // The ones digit is zero or different from the decimal digits, so no digit appears twice.
  const [a, b, c, d] = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const w = maxWhole === 0 || r.next() < 0.3 ? 0 : d;
  return { t: w * 1000 + a * 100 + b * 10 + c, w, a, b, c };
}

function thousandthsToDecimal(r: Rng, withWhole: boolean): Question {
  const n = r.pick([r.int(1, 9), r.int(10, 99), r.int(100, 999)]);
  const w = withWhole ? r.int(1, 9) : 0;
  const t = w * 1000 + n;
  return decQ(`Write ${w ? mx(w, n, 1000) : fr(n, 1000)} as a decimal.`, undefined, t, [
    'Thousandths fill the first three decimal places.',
    n < 100 ? `${n} has ${n < 10 ? 'one digit' : 'two digits'}, so put ${n < 10 ? 'two zeros' : 'a zero'} in front to fill three places.` : `${n} fills all three places.`,
    `The answer is ${dec(t)}.`,
  ]);
}

function digitValue(r: Rng): Question {
  const { t, w, a, b, c } = threePlaces(r);
  const places: [number, string][] = [[a, 'tenths'], [b, 'hundredths'], [c, 'thousandths']];
  if (w > 0) places.push([w, 'ones']);
  const [digit, place] = r.pick(places);
  const all = ['ones', 'tenths', 'hundredths', 'thousandths'];
  return withPics([placeChart([dec(t)])], choiceOf(r, `What is the value of the digit ${digit} in ${dec(t)}?`, `${digit} ${place}`, all.filter((p) => p !== place).map((p) => `${digit} ${p}`), [
    'After the decimal point the places are tenths, hundredths, then thousandths.',
    `The ${digit} is in the ${place} place, so it is worth ${digit} ${place}.`,
  ]));
}

function partition(r: Rng): Question {
  const { t, w, a, b, c } = threePlaces(r, 9);
  const parts = [w * 1000, a * 100, b * 10, c].filter((p) => p > 0);
  const miss = r.int(w > 0 ? 1 : 0, parts.length - 1);
  return decQ('What is the missing number?', `${dec(t)} = ${parts.map((p, i) => (i === miss ? '?' : dec(p))).join(' + ')}`, parts[miss], [
    `Split ${dec(t)} into its place values: ${parts.map(dec).join(' + ')}.`,
    `The missing part is ${dec(parts[miss])}.`,
  ]);
}

function overThousand(r: Rng): Question {
  if (r.next() < 0.5) {
    const n = r.int(1, 99);
    return wholeQ('What is the missing number?', `${fr(n, 100)} = ${fr('?', 1000)}`, n * 10, [
      'One hundredth is the same as 10 thousandths.',
      `Multiply the top and bottom by 10: ${fr(n, 100)} = ${fr(n * 10, 1000)}.`,
    ]);
  }
  const t = r.pick([r.int(1, 9) * 100, r.int(1, 99) * 10, r.int(1, 999)]);
  return wholeQ('What is the missing number?', `${dec(t)} = ${fr('?', 1000)}`, t, [
    `Write ${dec(t)} with three decimal places: ${(t / 1000).toFixed(3)}.`,
    `That is ${t} thousandths, so the missing number is ${t}.`,
  ]);
}

function oneThousandthAway(r: Rng): Question {
  const more = r.next() < 0.5;
  // Start on a number that makes the tenths or hundredths digit change.
  const base = r.int(1, 9) * 1000 + r.int(1, 99) * 10;
  const t = more ? base - 1 : base;
  const answer = more ? t + 1 : t - 1;
  return decQ(`What is 0.001 ${more ? 'more' : 'less'} than ${dec(t)}?`, undefined, answer, [
    `0.001 is one thousandth. Write ${dec(t)} with three decimal places: ${(t / 1000).toFixed(3)}.`,
    `${more ? 'Add' : 'Take away'} one thousandth: ${(answer / 1000).toFixed(3)}.`,
    `The answer is ${dec(answer)}.`,
  ]);
}

const thousandths: SkillContent = {
  id: 'decimals-percentages-2',
  example: [
    { say: 'The third decimal place is thousandths. One thousandth is one of 1,000 equal parts.', show: `0.001 = ${fr(1, 1000)}`, pics: [placeChart(['0.001'], { hi: ['th'] })] },
    { say: 'Each place is ten times smaller than the one before it.', show: '0.1   0.01   0.001', pics: [placeChart(['0.1', '0.01', '0.001'])] },
    { say: 'Read the three decimal digits together as a number of thousandths.', show: `0.347 = ${fr(347, 1000)}`, pics: [placeChart(['0.347'], { hi: ['t', 'h', 'th'] })] },
    { say: 'You can also split the number into its place values.', show: '0.347 = 0.3 + 0.04 + 0.007', pics: [placeChart(['0.347', '0.3', '0.04', '0.007'])] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? thousandthsToDecimal(r, false) : digitValue(r);
    if (level === 2) return r.pick([() => partition(r), () => overThousand(r), () => digitValue(r)])();
    return r.pick([() => oneThousandthAway(r), () => thousandthsToDecimal(r, true), () => overThousand(r)])();
  },
};

// ---------- 3. Rounding decimals ----------

/** Hundredths rounded to the nearest multiple of p hundredths, halves going up. */
const roundH = (h: number, p: number) => Math.floor((h + p / 2) / p) * p;

function roundToWhole(r: Rng): Question {
  let h: number;
  do h = r.int(101, 9999);
  while (h % 100 === 0);
  const answer = roundH(h, 100) / 100;
  const tenths = Math.floor(h / 10) % 10;
  const low = Math.floor(h / 100);
  return withPics([numberLine(low, low + 1, 0.1, [low, low + 0.5, low + 1], { points: [h / 100] })], wholeQ(`Round ${dec(h * 10)} to the nearest whole number.`, undefined, answer, [
    `${dec(h * 10)} is between ${low} and ${low + 1}.`,
    `Look at the tenths digit. It is ${tenths}.`,
    tenths >= 5 ? `${tenths} is 5 or more, so round up to ${answer}.` : `${tenths} is less than 5, so round down to ${answer}.`,
  ]));
}

function roundToTenth(r: Rng, crossing: boolean): Question {
  let h: number;
  do h = crossing ? r.int(1, 99) * 100 + r.int(95, 99) : r.int(101, 9999);
  while (h % 10 === 0);
  const answer = roundH(h, 10);
  const digit = h % 10;
  const low = Math.floor(h / 10) * 10;
  return withPics([numberLine(low / 100, (low + 10) / 100, 0.01, [low / 100, (low + 5) / 100, (low + 10) / 100], { points: [h / 100] })], decQ(`Round ${dec(h * 10)} to one decimal place.`, undefined, answer * 10, [
    `${dec(h * 10)} is between ${(low / 100).toFixed(1)} and ${((low + 10) / 100).toFixed(1)}.`,
    `Look at the hundredths digit. It is ${digit}.`,
    digit >= 5 ? `${digit} is 5 or more, so round up to ${(answer / 100).toFixed(1)}.` : `${digit} is less than 5, so round down to ${(answer / 100).toFixed(1)}.`,
  ]));
}

function whichRounds(r: Rng): Question {
  const tgt = r.int(11, 98) * 10; // hundredths, a whole number of tenths
  const right = tgt + r.int(-5, 4);
  const wrong = [tgt + 5, tgt - 6, tgt + r.int(6, 9), tgt - r.int(7, 10)];
  const name = (tgt / 100).toFixed(1);
  return choiceOf(r, `Which number rounds to ${name} to one decimal place?`, dec(right * 10), wrong.map((w) => dec(w * 10)), [
    `Numbers from ${dec((tgt - 5) * 10)} up to ${dec((tgt + 4) * 10)} round to ${name}.`,
    `${dec(right * 10)} is the only one in that range.`,
  ]);
}

function roundingLimit(r: Rng): Question {
  const tgt = r.int(11, 98) * 10;
  const smallest = r.next() < 0.5;
  const answer = smallest ? tgt - 5 : tgt + 4;
  const name = (tgt / 100).toFixed(1);
  return decQ(`A number with two decimal places rounds to ${name} to one decimal place. What is the ${smallest ? 'smallest' : 'largest'} it could be?`, undefined, answer * 10, [
    smallest
      ? `A hundredths digit of 5 or more rounds up, so start one tenth below ${name} and use 5 hundredths.`
      : `A hundredths digit below 5 rounds down, so keep the tenths of ${name} and use 4 hundredths.`,
    `${dec(answer * 10)} rounds to ${name}, but ${dec((smallest ? answer - 1 : answer + 1) * 10)} does not.`,
  ]);
}

const rounding: SkillContent = {
  id: 'decimals-percentages-3',
  example: [
    { say: 'To round to the nearest whole number, look at the tenths digit.', show: '6.38', pics: [numberLine(6, 7, 0.1, [6, 6.5, 7], { points: [6.38] })] },
    { say: 'The tenths digit is 3. That is less than 5, so round down.', show: '6.38  rounds to  6', pics: [numberLine(6, 7, 0.1, [6, 6.5, 7], { points: [6.38], jumps: [[6.38, 6]] })] },
    { say: 'To round to one decimal place, look at the hundredths digit.', show: '6.38', pics: [numberLine(6.3, 6.4, 0.01, [6.3, 6.35, 6.4], { points: [6.38] })] },
    { say: 'The hundredths digit is 8. That is 5 or more, so the tenths digit goes up by one.', show: '6.38  rounds to  6.4', pics: [numberLine(6.3, 6.4, 0.01, [6.3, 6.35, 6.4], { points: [6.38], jumps: [[6.38, 6.4]] })] },
  ],
  generate(level, r) {
    if (level === 1) return roundToWhole(r);
    if (level === 2) return r.next() < 0.7 ? roundToTenth(r, false) : roundToWhole(r);
    return r.pick([() => roundToTenth(r, true), () => whichRounds(r), () => roundingLimit(r)])();
  },
};

// ---------- 4. Ordering decimals ----------

/** Decimals close together, in thousandths, with no more than `places` decimal places. */
function closeDecimals(r: Rng, count: number, places: 2 | 3): number[] {
  const w = r.int(0, 9) * 1000;
  const tenth = r.int(1, 8) * 100;
  const seen = new Set<number>();
  while (seen.size < count) {
    const kind = r.int(1, places);
    const t = kind === 1 ? r.int(1, 9) * 100 : kind === 2 ? tenth + r.int(-9, 19) * 10 : tenth + r.int(-50, 150);
    if (t > 0 && t < 1000) seen.add(w + t);
  }
  return [...seen];
}

function compareDecimals(r: Rng): Question {
  const [a, b] = closeDecimals(r, 2, 2);
  const larger = r.next() < 0.5;
  const right = larger ? Math.max(a, b) : Math.min(a, b);
  return withPics([placeChart([(a / 1000).toFixed(2), (b / 1000).toFixed(2)])], choiceOf(r, `Which number is ${larger ? 'larger' : 'smaller'}?`, dec(right), [dec(a + b - right)], [
    `Write both with two decimal places: ${(a / 1000).toFixed(2)} and ${(b / 1000).toFixed(2)}.`,
    'Compare the digits from the left, one place at a time.',
    `${dec(right)} is ${larger ? 'larger' : 'smaller'}.`,
  ]));
}

function decimalSign(r: Rng): Question {
  const [a, b] = closeDecimals(r, 2, 3);
  const sign = a < b ? '<' : '>';
  const options = ['<', '>'];
  return {
    kind: 'choice', prompt: 'Which sign goes in the gap?', show: `${dec(a)}  ?  ${dec(b)}`, options, answer: options.indexOf(sign),
    explain: [
      `Write both with three decimal places: ${(a / 1000).toFixed(3)} and ${(b / 1000).toFixed(3)}.`,
      `${(a / 1000).toFixed(3)} is ${a < b ? 'less' : 'more'} than ${(b / 1000).toFixed(3)}, so the sign is ${sign}.`,
    ],
  };
}

function orderDecimals(r: Rng, places: 2 | 3, eitherWay: boolean): Question {
  const list = closeDecimals(r, places === 3 ? 5 : 4, places);
  const desc = eitherWay && r.next() < 0.5;
  const sorted = [...list].sort((x, y) => (desc ? y - x : x - y));
  let shown = r.shuffle(list);
  if (shown.every((v, i) => v === sorted[i])) shown = [...sorted].reverse();
  return {
    kind: 'order',
    prompt: `Put these in order, ${desc ? 'largest first' : 'smallest first'}.`,
    items: shown.map(dec),
    answer: sorted.map(dec),
    explain: [
      `Write them all with ${places === 3 ? 'three' : 'two'} decimal places: ${sorted.map((v) => (v / 1000).toFixed(places)).join(',  ')}.`,
      'Compare the digits from the left, one place at a time.',
      `In order: ${sorted.map(dec).join(',  ')}.`,
    ],
  };
}

function between(r: Rng): Question {
  const low = r.int(0, 9) * 1000 + r.int(1, 8) * 100;
  const right = low + r.int(1, 99);
  const wrong = [low - r.int(1, 99), low + 100 + r.int(1, 99), low + 1000 + r.int(1, 9) * 10];
  return choiceOf(r, `Which number is between ${dec(low)} and ${dec(low + 100)}?`, dec(right), wrong.map(dec), [
    `Write the ends with three decimal places: ${(low / 1000).toFixed(3)} and ${((low + 100) / 1000).toFixed(3)}.`,
    `${dec(right)} is ${(right / 1000).toFixed(3)}, which is between them.`,
  ]);
}

const ordering: SkillContent = {
  id: 'decimals-percentages-4',
  example: [
    { say: 'To compare decimals, give them the same number of decimal places first.', show: '0.4  and  0.35', pics: [placeChart(['0.4', '0.35'])] },
    { say: 'Put a zero on the end of 0.4. It is still the same number.', show: '0.40  and  0.35', pics: [placeChart(['0.40', '0.35'])] },
    { say: 'Now compare from the left. The tenths digits are 4 and 3.', show: '0.40  >  0.35', pics: [placeChart(['0.40', '0.35'], { hi: ['t'] })] },
    { say: 'More digits does not mean a bigger number. Always compare place by place.', show: '0.4  >  0.35  >  0.289', pics: [numberLine(0.2, 0.5, 0.01, [0.2, 0.3, 0.4, 0.5], { points: [0.289, 0.35, 0.4] })] },
  ],
  generate(level, r) {
    if (level === 1) return compareDecimals(r);
    if (level === 2) return r.pick([() => decimalSign(r), () => orderDecimals(r, 2, false), () => compareDecimals(r)])();
    return r.pick([() => orderDecimals(r, 3, true), () => orderDecimals(r, 3, true), () => between(r)])();
  },
};

// ---------- 5. Decimal problems ----------

/** 3.40 + 2.75 set out in columns, with the carry from the tenths. */
const DECIMAL_SUM: Written = {
  kind: 'column',
  alt: '3.40 + 2.75 set out in columns with the decimal points lined up',
  cols: 4,
  rows: [
    { cells: [{ d: '3' }, { d: '.' }, { d: '4' }, { d: '0' }] },
    { op: '+', cells: [{ d: '2' }, { d: '.' }, { d: '7' }, { d: '5' }] },
    'rule',
    { cells: [{ d: '6', hi: true }, { d: '.', hi: true }, { d: '1', hi: true }, { d: '5', hi: true }] },
    'rule',
    { small: true, cells: [{ d: '1', hi: true }, { d: '' }, { d: '' }, { d: '' }] },
  ],
};

function complement(r: Rng): Question {
  const h = r.int(1, 99);
  return decQ('What is the missing number?', `${dec(h * 10)} + ? = 1`, 1000 - h * 10, [
    `1 is the same as 100 hundredths. ${dec(h * 10)} is ${h} hundredths.`,
    `100 ${MINUS} ${h} = ${100 - h}, so the missing number is ${dec(1000 - h * 10)}.`,
  ]);
}

function addTenths(r: Rng): Question {
  const a = r.int(2, 9), b = r.int(2, 9);
  const add = r.next() < 0.6 || a === b;
  const [p, q] = add ? [a, b] : [Math.max(a, b) + 10 * r.int(0, 1), Math.min(a, b)];
  const total = add ? p + q : p - q;
  return decQ('Work out', `${dec(p * 100)} ${add ? '+' : MINUS} ${dec(q * 100)}`, total * 100, [
    `Think in tenths: ${p} tenths ${add ? '+' : MINUS} ${q} tenths = ${total} tenths.`,
    `${total} tenths is ${dec(total * 100)}.`,
  ]);
}

function mixedPlaces(r: Rng): Question {
  const add = r.next() < 0.5;
  // One number has one decimal place (or none), the other has two.
  const x = r.next() < 0.3 ? r.int(2, 9) * 1000 : r.int(11, 99) * 100;
  let y: number;
  do y = r.int(101, 899) * 10;
  while (y % 100 === 0 || (!add && y >= x));
  const [p, q] = add && r.next() < 0.5 ? [y, x] : [x, y];
  const total = add ? p + q : p - q;
  return decQ('Work out', `${dec(p)} ${add ? '+' : MINUS} ${dec(q)}`, total, [
    `Give both numbers two decimal places: ${(p / 1000).toFixed(2)} ${add ? '+' : MINUS} ${(q / 1000).toFixed(2)}.`,
    `Line up the decimal points and ${add ? 'add' : 'subtract'} as you would with whole numbers.`,
    `The answer is ${dec(total)}.`,
  ]);
}

function wordProblem(r: Rng): Question {
  const type = r.int(1, 3);
  if (type === 1) {
    const a = r.int(5, 19) * 125, b = r.int(3, 19) * 125 + r.pick([0, 50]);
    return decQ(`A bag of flour weighs ${dec(a)} kg and a bag of sugar weighs ${dec(b)} kg. How much do they weigh altogether?`, undefined, a + b, [
      `Add the two masses. Give both three decimal places: ${(a / 1000).toFixed(3)} + ${(b / 1000).toFixed(3)}.`,
      `${dec(a)} + ${dec(b)} = ${dec(a + b)}.`,
      `They weigh ${dec(a + b)} kg altogether.`,
    ], { unit: 'kg' });
  }
  if (type === 2) {
    const a = r.pick([1500, 2000, 2500, 3000]);
    const b = r.int(15, 65) * 10, c = r.int(2, 7) * 100 + r.pick([0, 25, 75]);
    return decQ(`A bottle holds ${dec(a)} litres of juice. Sam pours out ${dec(b)} litres and then ${dec(c)} litres. How much juice is left?`, undefined, a - b - c, [
      `First find how much was poured out: ${dec(b)} + ${dec(c)} = ${dec(b + c)}.`,
      `Then take that from the start: ${dec(a)} ${MINUS} ${dec(b + c)} = ${dec(a - b - c)}.`,
      `There are ${dec(a - b - c)} litres left.`,
    ], { unit: 'litres' });
  }
  let a: number, b: number;
  do { a = r.int(12, 95) * 100; b = r.int(105, 899) * 10 + r.pick([0, 5]); }
  while (a === b || b % 100 === 0);
  const big = Math.max(a, b), small = Math.min(a, b);
  return decQ(`One ribbon is ${dec(a)} m long. Another is ${dec(b)} m long. What is the difference between their lengths?`, undefined, big - small, [
    `Take the shorter length from the longer one. Give both three decimal places: ${(big / 1000).toFixed(3)} ${MINUS} ${(small / 1000).toFixed(3)}.`,
    `${dec(big)} ${MINUS} ${dec(small)} = ${dec(big - small)}.`,
    `The difference is ${dec(big - small)} m.`,
  ], { unit: 'm' });
}

const problems: SkillContent = {
  id: 'decimals-percentages-5',
  example: [
    { say: 'To add or subtract decimals, the decimal points must line up.', show: '3.4 + 2.75', pics: [placeChart(['3.4', '2.75'])] },
    { say: 'Give both numbers the same number of decimal places by adding a zero.', show: '3.40 + 2.75', pics: [placeChart(['3.40', '2.75'])] },
    { say: 'Now add as you would with whole numbers: 340 + 275 = 615.', show: '3.40 + 2.75 = 6.15', written: DECIMAL_SUM },
    { say: 'Check with rounding. 3 + 3 = 6, so 6.15 is sensible.', pics: [numberLine(5, 7, 0.1, [5, 6, 7], { points: [6.15] })] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? complement(r) : addTenths(r);
    if (level === 2) return r.next() < 0.75 ? mixedPlaces(r) : complement(r);
    return r.next() < 0.75 ? wordProblem(r) : mixedPlaces(r);
  },
};

// ---------- 6. Percentages ----------

function hundredthsToPercent(r: Rng): Question {
  const n = r.int(1, 99);
  return withPics([hundredSquare(n)], wholeQ(`Write ${fr(n, 100)} as a percentage.`, undefined, n, [
    'Per cent means "out of 100".',
    `${n} out of 100 is ${n}%.`,
  ], { unit: '%' }));
}

function percentToHundredths(r: Rng): Question {
  const n = r.int(1, 99);
  return withPics([hundredSquare(n)], fracQ(`Write ${n}% as a fraction.`, { whole: 0, num: n, den: 100 }, [
    'Per cent means "out of 100".',
    `${n}% = ${fr(n, 100)}.`,
  ]));
}

function decimalToPercent(r: Rng): Question {
  const n = r.pick([r.int(1, 9), r.int(1, 9) * 10, r.int(11, 99)]);
  return withPics([hundredSquare(n)], wholeQ(`Write ${dec(n * 10)} as a percentage.`, undefined, n, [
    `${dec(n * 10)} is ${n} hundredths, which is ${fr(n, 100)}.`,
    `${n} out of 100 is ${n}%.`,
  ], { unit: '%' }));
}

function percentToDecimal(r: Rng): Question {
  const n = r.pick([r.int(1, 9), r.int(1, 9) * 10, r.int(11, 99)]);
  return withPics([hundredSquare(n)], decQ(`Write ${n}% as a decimal.`, undefined, n * 10, [
    `${n}% = ${fr(n, 100)}, which is ${n} hundredths.`,
    `${n} hundredths is ${dec(n * 10)}.`,
  ]));
}

function fractionToPercent(r: Rng): Question {
  const den = r.pick([2, 4, 5, 10, 20, 25, 50]);
  let n: number;
  do n = r.int(1, den - 1);
  while (gcd(n, den) !== 1);
  const k = 100 / den;
  return wholeQ(`Write ${fr(n, den)} as a percentage.`, undefined, n * k, [
    `Change it into hundredths. Multiply the top and bottom by ${k}: ${fr(n * k, 100)}.`,
    `${n * k} out of 100 is ${n * k}%.`,
  ], { unit: '%' });
}

function restOfWhole(r: Rng): Question {
  const a = r.int(5, 60), b = r.int(5, 35);
  const two = r.next() < 0.5;
  const used = two ? a + b : a;
  return wholeQ(
    two
      ? `In a class, ${a}% of the children walk to school and ${b}% cycle. The rest come by car. What percentage come by car?`
      : `${a}% of the children in a class walk to school. What percentage do not walk?`,
    undefined, 100 - used, [
      'The whole class is 100%.',
      two ? `${a} + ${b} = ${used}, then 100 ${MINUS} ${used} = ${100 - used}.` : `100 ${MINUS} ${a} = ${100 - a}.`,
      `The answer is ${100 - used}%.`,
    ], { unit: '%' });
}

const percentages: SkillContent = {
  id: 'decimals-percentages-6',
  example: [
    { say: 'Per cent means "out of 100". The sign for it is %.', show: `37% = ${fr(37, 100)}`, pics: [hundredSquare(37, '37 out of 100 is 37%')] },
    { say: 'Hundredths are easy to write as a decimal, so every percentage is a decimal too.', show: `37% = ${fr(37, 100)} = 0.37`, pics: [placeChart(['0.37'], { hi: ['t', 'h'] })] },
    { say: 'Be careful with small percentages. 7% is 7 hundredths.', show: '7% = 0.07', pics: [hundredSquare(7, '7 out of 100 is 7%')] },
    { say: 'To change another fraction into a percentage, change it into hundredths first.', show: `${fr(3, 5)} = ${fr(60, 100)} = 60%`, bars: [{ parts: 5, shaded: 3 }], pics: [hundredSquare(60, '60 out of 100 is 60%')] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? hundredthsToPercent(r) : percentToHundredths(r);
    if (level === 2) return r.next() < 0.5 ? decimalToPercent(r) : percentToDecimal(r);
    return r.next() < 0.6 ? fractionToPercent(r) : restOfWhole(r);
  },
};

// ---------- 7. Fractions, decimals and percentages ----------

/** The fractions Year 5 children should know as decimals and percentages: [numerator, denominator]. */
const KNOWN: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]];
const pctOf = ([n, d]: [number, number]) => (n * 100) / d;

type Form = 'fraction' | 'decimal' | 'percent';
function write(pct: number, form: Form): string {
  if (form === 'percent') return `${pct}%`;
  if (form === 'decimal') return dec(pct * 10);
  const [n, d] = simplify(pct, 100);
  return fr(n, d);
}

function linkSteps(pct: number): string {
  const [n, d] = simplify(pct, 100);
  return d === 100 ? `${fr(n, d)} = ${dec(pct * 10)} = ${pct}%` : `${fr(n, d)} = ${fr(pct, 100)} = ${dec(pct * 10)} = ${pct}%`;
}

function matchForm(r: Rng): Question {
  const picks = r.shuffle(KNOWN).slice(0, 4).map(pctOf);
  const [from, to] = r.pick<[Form, Form]>([['fraction', 'percent'], ['fraction', 'decimal'], ['percent', 'fraction'], ['decimal', 'fraction'], ['percent', 'decimal']]);
  return choiceOf(r, `Which is the same as ${write(picks[0], from)}?`, write(picks[0], to), picks.slice(1).map((p) => write(p, to)), [
    'Go through hundredths to link fractions, decimals and percentages.',
    linkSteps(picks[0]),
  ]);
}

function convertKnown(r: Rng): Question {
  const pct = pctOf(r.pick(KNOWN));
  const [n, d] = simplify(pct, 100);
  const explain = ['Go through hundredths to link fractions, decimals and percentages.', linkSteps(pct)];
  const type = r.int(1, 4);
  if (type === 1) return fracQ(`Write ${pct}% as a fraction in its simplest form.`, { whole: 0, num: n, den: d }, explain, true);
  if (type === 2) return fracQ(`Write ${dec(pct * 10)} as a fraction in its simplest form.`, { whole: 0, num: n, den: d }, explain, true);
  if (type === 3) return decQ(`Write ${fr(n, d)} as a decimal.`, undefined, pct * 10, explain);
  return wholeQ(`Write ${fr(n, d)} as a percentage.`, undefined, pct, explain, { unit: '%' });
}

function mixedOrder(r: Rng): Question {
  const pcts = r.shuffle([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]).slice(0, 4);
  const forms = r.shuffle<Form>(['fraction', 'decimal', 'percent', r.pick<Form>(['fraction', 'decimal', 'percent'])]);
  const items = pcts.map((p, i) => ({ p, text: write(p, forms[i]) }));
  const desc = r.next() < 0.4;
  const sorted = [...items].sort((a, b) => (desc ? b.p - a.p : a.p - b.p));
  let shown = items;
  if (shown.every((v, i) => v === sorted[i])) shown = [...sorted].reverse();
  return {
    kind: 'order',
    prompt: `Put these in order, ${desc ? 'largest first' : 'smallest first'}.`,
    items: shown.map((i) => i.text),
    answer: sorted.map((i) => i.text),
    explain: [
      'Change them all into percentages so they are easy to compare.',
      sorted.map((i) => (i.text.endsWith('%') ? i.text : `${i.text} = ${i.p}%`)).join(',  '),
      `In order: ${sorted.map((i) => i.text).join(',  ')}.`,
    ],
  };
}

function mixedCompare(r: Rng): Question {
  const [a, b] = r.shuffle([5, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85]).slice(0, 2);
  const [fa, fb] = r.shuffle<Form>(['fraction', 'decimal', 'percent']);
  const larger = r.next() < 0.5;
  const right = larger ? Math.max(a, b) : Math.min(a, b);
  const text = (p: number) => write(p, p === a ? fa : fb);
  return choiceOf(r, `Which is ${larger ? 'larger' : 'smaller'}?`, text(right), [text(a + b - right)], [
    'Change both into percentages so they are easy to compare.',
    `${text(a)} is ${a}% and ${text(b)} is ${b}%.`,
    `${text(right)} is ${larger ? 'larger' : 'smaller'}.`,
  ]);
}

const equivalents: SkillContent = {
  id: 'decimals-percentages-7',
  example: [
    { say: 'A fraction, a decimal and a percentage can all show the same amount.', show: `${fr(1, 2)} = 0.5 = 50%`, bars: [{ parts: 2, shaded: 1 }], pics: [hundredSquare(50)] },
    { say: 'Quarters are worth knowing by heart. Three quarters is three times as much: 0.75, or 75%.', show: `${fr(1, 4)} = 0.25 = 25%`, bars: [{ parts: 4, shaded: 1 }], pics: [hundredSquare(25)] },
    { say: 'One fifth is 20 hundredths. Count up in 20s for the other fifths, so two fifths is 40%.', show: `${fr(1, 5)} = 0.2 = 20%`, bars: [{ parts: 5, shaded: 1 }], pics: [hundredSquare(20)] },
    { say: `For any other fraction, change it into hundredths. Here the top and bottom are multiplied by 5: 7 ${X} 5 = 35.`, show: `${fr(7, 20)} = ${fr(35, 100)} = 0.35 = 35%`, pics: [hundredSquare(35)] },
  ],
  generate(level, r) {
    if (level === 1) return matchForm(r);
    if (level === 2) return r.next() < 0.75 ? convertKnown(r) : matchForm(r);
    return r.next() < 0.6 ? mixedOrder(r) : mixedCompare(r);
  },
};

export const DECIMAL_PERCENTAGE_SKILLS: SkillContent[] = [decimalsAsFractions, thousandths, rounding, ordering, problems, percentages, equivalents];
