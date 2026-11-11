// Unit 3: Multiplication and division. All wording and questions are our own.
import { fmt } from '../engine/format';
import type { Rng } from '../engine/rng';
import type { NumberQuestion, Question, SkillContent } from '../engine/types';

const X = '×';
const DIV = '÷';
const MINUS = '−';
const SQ = '²';
const CU = '³';

export const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
export const factorsOf = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const pairsLine = (n: number) =>
  factorsOf(n).filter((d) => d * d <= n).map((d) => `${d} ${X} ${n / d}`).join(',  ');

/** `count` different numbers from the pool that pass the test. */
function pickSome(r: Rng, pool: number[], count: number): number[] {
  return r.shuffle(pool).slice(0, count);
}
const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

function choiceOf(r: Rng, prompt: string, right: number | string, wrong: (number | string)[], explain: string[], show?: string): Question {
  const label = (v: number | string) => (typeof v === 'number' ? fmt(v) : v);
  const options = r.shuffle([right, ...wrong]).map(label);
  return { kind: 'choice', prompt, show, options, answer: options.indexOf(label(right)), explain };
}

// ---------- 1. Multiples and factors ----------

function multipleChoice(r: Rng): Question {
  const k = r.int(3, 12);
  const right = k * r.int(3, 12);
  const wrong = pickSome(r, range(right - 15 > 2 ? right - 15 : 3, right + 15).filter((v) => v % k !== 0), 3);
  return choiceOf(r, `Which number is a multiple of ${k}?`, right, wrong, [
    `Multiples of ${k} are the numbers in the ${k} times table.`,
    `${k} ${X} ${right / k} = ${right}, so ${right} is a multiple of ${k}.`,
  ]);
}

function nthMultiple(r: Rng): Question {
  const k = r.int(3, 12), n = r.int(4, 12);
  return {
    kind: 'number',
    prompt: `What is the ${ordinal(n)} multiple of ${k}?`,
    answer: k * n,
    explain: [`The ${ordinal(n)} multiple of ${k} is ${n} lots of ${k}.`, `${n} ${X} ${k} = ${k * n}.`],
  };
}

const RICH = [24, 30, 36, 40, 42, 48, 54, 56, 60, 72, 84, 90, 96];

function factorChoice(r: Rng): Question {
  const n = r.pick(RICH);
  const right = r.pick(factorsOf(n).filter((d) => d > 2 && d < n));
  const wrong = pickSome(r, range(4, n - 1).filter((v) => n % v !== 0), 3);
  return choiceOf(r, `Which number is a factor of ${n}?`, right, wrong, [
    'A factor divides into the number exactly, with nothing left over.',
    `${right} ${X} ${n / right} = ${n}, so ${right} is a factor of ${n}.`,
  ]);
}

function factorPair(r: Rng): Question {
  const n = r.pick(RICH);
  const f = r.pick(factorsOf(n).filter((d) => d > 1 && d * d <= n));
  return {
    kind: 'number',
    prompt: 'Complete the factor pair.',
    show: `${f} ${X} ? = ${n}`,
    answer: n / f,
    explain: [`Factor pairs multiply to make the number.`, `${n} ${DIV} ${f} = ${n / f}.`],
  };
}

function countFactors(r: Rng): Question {
  const n = r.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 45, 48]);
  const fs = factorsOf(n);
  return {
    kind: 'number',
    prompt: `How many factors does ${n} have?`,
    answer: fs.length,
    explain: [
      `Work through the factor pairs in order: ${pairsLine(n)}.`,
      `The factors are ${fs.join(', ')}.`,
      `That makes ${fs.length} factors.`,
    ],
  };
}

const COMMON_PAIRS: [number, number][] = [[12, 18], [16, 24], [18, 30], [20, 30], [24, 36], [24, 40], [27, 45], [28, 42], [30, 45], [32, 48], [36, 60]];

function commonFactorChoice(r: Rng): Question {
  const [a, b] = r.pick(COMMON_PAIRS);
  const common = (v: number) => a % v === 0 && b % v === 0;
  const right = r.pick(range(2, a).filter(common));
  const wrong = pickSome(r, range(2, b).filter((v) => !common(v) && (a % v === 0 || b % v === 0)), 3);
  return choiceOf(r, `Which number is a common factor of ${a} and ${b}?`, right, wrong, [
    'A common factor divides exactly into both numbers.',
    `${a} ${DIV} ${right} = ${a / right} and ${b} ${DIV} ${right} = ${b / right}.`,
  ]);
}

function largestCommonFactor(r: Rng): Question {
  const [a, b] = r.pick(COMMON_PAIRS);
  const g = gcd(a, b);
  return {
    kind: 'number',
    prompt: `What is the largest number that is a factor of both ${a} and ${b}?`,
    answer: g,
    explain: [
      `Factors of ${a}: ${factorsOf(a).join(', ')}.`,
      `Factors of ${b}: ${factorsOf(b).join(', ')}.`,
      `The largest number in both lists is ${g}.`,
    ],
  };
}

function smallestCommonMultiple(r: Rng): Question {
  const [a, b] = r.pick<[number, number]>([[4, 6], [6, 8], [6, 9], [8, 12], [9, 12], [10, 15], [4, 10], [6, 10], [3, 7], [5, 8]]);
  const l = (a * b) / gcd(a, b);
  const list = (k: number) => range(1, l / k).map((i) => i * k).join(', ');
  return {
    kind: 'number',
    prompt: `What is the smallest number that is a multiple of both ${a} and ${b}?`,
    answer: l,
    explain: [`Multiples of ${a}: ${list(a)}.`, `Multiples of ${b}: ${list(b)}.`, `The first number in both lists is ${l}.`],
  };
}

const multiplesAndFactors: SkillContent = {
  id: 'multiply-divide-1',
  example: [
    { say: 'A multiple is what you get when you multiply a number by a whole number. They are the times table answers.', show: `Multiples of 6:  6, 12, 18, 24, 30 ...` },
    { say: 'A factor is a number that divides in exactly. Factors come in pairs that multiply to make the number.', show: `24 = 1 ${X} 24 = 2 ${X} 12 = 3 ${X} 8 = 4 ${X} 6` },
    { say: 'To find every factor, try 1, 2, 3 and so on. Stop when the pairs start to repeat.', show: 'Factors of 24:  1, 2, 3, 4, 6, 8, 12, 24' },
    { say: 'A common factor is a factor of two numbers at once. 6 is a common factor of 24 and 30.', show: `24 ${DIV} 6 = 4     30 ${DIV} 6 = 5` },
  ],
  generate(level, r) {
    if (level === 1) return r.pick([() => multipleChoice(r), () => nthMultiple(r), () => factorChoice(r)])();
    if (level === 2) return r.pick([() => factorPair(r), () => countFactors(r), () => commonFactorChoice(r)])();
    return r.pick([() => largestCommonFactor(r), () => smallestCommonMultiple(r)])();
  },
};

// ---------- 2. Prime numbers ----------

const whyNotPrime = (n: number) => {
  const d = factorsOf(n)[1];
  return `${n} = ${d} ${X} ${n / d}, so it is not prime.`;
};

function primeChoice(r: Rng, max: number): Question {
  const right = r.pick(range(max > 30 ? 30 : 2, max).filter(isPrime));
  // Odd composites make the choice a real test, not just "pick the odd one".
  const pool = range(9, max).filter((v) => !isPrime(v));
  const odd = pool.filter((v) => v % 2 === 1);
  const wrong = [...pickSome(r, odd, 2), r.pick(pool.filter((v) => v % 2 === 0))];
  return choiceOf(r, 'Which of these is a prime number?', right, wrong, [
    'A prime number has exactly two factors: 1 and itself.',
    ...wrong.map(whyNotPrime),
    `${right} only divides by 1 and ${right}.`,
  ]);
}

function notPrimeChoice(r: Rng): Question {
  const right = r.pick([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 87, 91, 93]);
  const wrong = pickSome(r, range(11, 97).filter(isPrime), 3);
  return choiceOf(r, 'Which of these is not a prime number?', right, wrong, [
    'Test each one by trying to divide by 2, 3, 5 and 7.',
    whyNotPrime(right),
  ]);
}

function isItPrime(r: Rng): Question {
  const n = r.pick([51, 53, 57, 59, 61, 67, 71, 73, 77, 79, 83, 87, 89, 91, 93, 97]);
  const options = ['Yes, it is prime', 'No, it is not prime'];
  return {
    kind: 'choice',
    prompt: `Is ${n} a prime number?`,
    options,
    answer: isPrime(n) ? 0 : 1,
    explain: [
      'For numbers up to 100 you only need to try dividing by 2, 3, 5 and 7.',
      isPrime(n) ? `None of them divide into ${n} exactly, so it is prime.` : whyNotPrime(n),
    ],
  };
}

function nextPrime(r: Rng): Question {
  const n = r.int(20, 90);
  let p = n + 1;
  while (!isPrime(p)) p++;
  const skipped = range(n + 1, p - 1);
  return {
    kind: 'number',
    prompt: `What is the next prime number after ${n}?`,
    answer: p,
    explain: [
      ...(skipped.length ? [`Check each number in turn. ${skipped.slice(0, 3).map(whyNotPrime).join(' ')}`] : []),
      `${p} only divides by 1 and itself, so the next prime is ${p}.`,
    ],
  };
}

export function primeFactors(n: number): number[] {
  const out: number[] = [];
  let left = n;
  for (let d = 2; left > 1; d++) while (left % d === 0) { out.push(d); left /= d; }
  return out;
}

function primeFactorChoice(r: Rng): Question {
  const n = r.pick([12, 18, 20, 28, 30, 42, 45, 50, 63, 66, 70, 75, 78, 98]);
  const pf = primeFactors(n); // always three of them for this list
  const show = (list: number[]) => list.join(` ${X} `);
  let bigger = pf[2] + 1;
  while (!isPrime(bigger)) bigger++;
  const wrong = [show([pf[0] * pf[1], pf[2]]), show([pf[0], pf[1] * pf[2]]), show([pf[0], pf[1], bigger])];
  return choiceOf(r, `Which of these shows ${n} as a product of prime factors?`, show(pf), wrong, [
    'Every number in the answer must be prime, and they must multiply to make the number.',
    `${show(pf)} = ${n}, and ${[...new Set(pf)].join(' and ')} ${new Set(pf).size > 1 ? 'are' : 'is'} prime.`,
  ]);
}

const primes: SkillContent = {
  id: 'multiply-divide-2',
  example: [
    { say: 'A prime number has exactly two factors: 1 and itself.', show: '2, 3, 5, 7, 11, 13, 17, 19 ...' },
    { say: 'A number with more than two factors is called composite. 1 is neither, because it has only one factor.', show: `15 = 3 ${X} 5, so 15 is composite` },
    { say: 'To test a number up to 100, try dividing by 2, 3, 5 and 7. If none of them work, it is prime.', show: `91 = 7 ${X} 13, so 91 is not prime` },
    { say: 'Any composite number can be broken down into prime factors.', show: `30 = 2 ${X} 3 ${X} 5` },
  ],
  generate(level, r) {
    if (level === 1) return primeChoice(r, 30);
    if (level === 2) return r.pick([() => primeChoice(r, 100), () => notPrimeChoice(r), () => isItPrime(r)])();
    return r.pick([() => nextPrime(r), () => primeFactorChoice(r)])();
  },
};

// ---------- 3. Square and cube numbers ----------

const num = (prompt: string, answer: number, explain: string[], show?: string): NumberQuestion => ({ kind: 'number', prompt, show, answer, explain });

function squaresAndCubes(r: Rng, level: number): Question {
  if (level === 1) {
    const n = r.int(2, 12);
    return num('Work out this square number.', n * n, [`${n}${SQ} means ${n} ${X} ${n}.`, `${n} ${X} ${n} = ${n * n}.`], `${n}${SQ}`);
  }
  if (level === 2) {
    return r.pick([
      () => {
        const n = r.pick([1, 2, 3, 4, 5, 10]);
        return num('Work out this cube number.', n ** 3, [`${n}${CU} means ${n} ${X} ${n} ${X} ${n}.`, `${n} ${X} ${n} = ${n * n}, and ${n * n} ${X} ${n} = ${fmt(n ** 3)}.`], `${n}${CU}`);
      },
      () => {
        const n = r.int(4, 12);
        return num(`Which number squared makes ${n * n}?`, n, [`Look for a number times itself that makes ${n * n}.`, `${n} ${X} ${n} = ${n * n}, so the number is ${n}.`]);
      },
      () => {
        const n = r.int(3, 12);
        const wrong = pickSome(r, range(n * n - 12 > 1 ? n * n - 12 : 2, n * n + 12).filter((v) => Math.sqrt(v) % 1 !== 0), 3);
        return choiceOf(r, 'Which of these is a square number?', n * n, wrong, ['A square number is a number times itself.', `${n} ${X} ${n} = ${n * n}.`]);
      },
    ])();
  }
  return r.pick([
    () => {
      const a = r.int(3, 9), b = r.int(2, 4);
      return num('Work this out.', a * a + b ** 3, [`${a}${SQ} = ${a * a}.`, `${b}${CU} = ${b ** 3}.`, `${a * a} + ${b ** 3} = ${a * a + b ** 3}.`], `${a}${SQ} + ${b}${CU}`);
    },
    () => {
      const b = r.int(2, 8), a = r.int(b + 1, 12);
      return num('Work this out.', a * a - b * b, [`${a}${SQ} = ${a * a}.`, `${b}${SQ} = ${b * b}.`, `${a * a} ${MINUS} ${b * b} = ${a * a - b * b}.`], `${a}${SQ} ${MINUS} ${b}${SQ}`);
    },
    () => {
      const n = r.int(4, 12);
      return { ...num(`A square has an area of ${n * n} cm${SQ}. How long is each side?`, n, ['The area of a square is the side length times itself.', `${n} ${X} ${n} = ${n * n}, so each side is ${n} cm.`]), unit: 'cm' };
    },
    () => {
      const n = r.int(2, 5);
      return num(`A solid cube is built from 1 cm cubes. Each edge is ${n} cm long. How many 1 cm cubes are in it?`, n ** 3, [`Each layer has ${n} ${X} ${n} = ${n * n} cubes.`, `There are ${n} layers: ${n * n} ${X} ${n} = ${n ** 3}.`]);
    },
  ])();
}

const squaresCubes: SkillContent = {
  id: 'multiply-divide-3',
  example: [
    { say: 'A square number is a number multiplied by itself. The small 2 means "squared".', show: `5${SQ} = 5 ${X} 5 = 25` },
    { say: 'It is called square because that many dots make a square: 5 rows of 5.' },
    { say: 'A cube number is a number multiplied by itself, and by itself again. The small 3 means "cubed".', show: `4${CU} = 4 ${X} 4 ${X} 4 = 64` },
    { say: 'Work a cube out in two steps.', show: `4 ${X} 4 = 16,   16 ${X} 4 = 64` },
  ],
  generate: (level, r) => squaresAndCubes(r, level),
};

// ---------- 4. Multiplying and dividing by 10, 100 and 1,000 ----------

const PLACES_MOVED: Record<number, string> = { 10: 'one place', 100: 'two places', 1000: 'three places' };
/** A decimal built from whole numbers, so it is exactly what typing the digits gives. */
const dec = (m: number, places: number) => (places > 0 ? m / 10 ** places : m * 10 ** -places);
const noTrailingZero = (r: Rng, lo: number, hi: number) => {
  let m: number;
  do m = r.int(lo, hi);
  while (m % 10 === 0);
  return m;
};

function powerOfTen(r: Rng, level: number): Question {
  const j = r.int(1, 3);
  const p = 10 ** j;
  if (level === 1) {
    const m = r.int(12, 999);
    if (r.next() < 0.5) {
      return num(`Work out ${fmt(m)} ${X} ${fmt(p)}`, m * p, [`Multiplying by ${fmt(p)} moves every digit ${PLACES_MOVED[p]} to the left.`, `${fmt(m)} ${X} ${fmt(p)} = ${fmt(m * p)}.`]);
    }
    return num(`Work out ${fmt(m * p)} ${DIV} ${fmt(p)}`, m, [`Dividing by ${fmt(p)} moves every digit ${PLACES_MOVED[p]} to the right.`, `${fmt(m * p)} ${DIV} ${fmt(p)} = ${fmt(m)}.`]);
  }
  if (level === 2) {
    if (r.next() < 0.5) {
      const k = r.int(1, 2);
      const m = noTrailingZero(r, 11, 9999);
      const start = dec(m, k), answer = dec(m, k - j);
      return { ...num(`Work out ${fmt(start)} ${X} ${fmt(p)}`, answer, [`Multiplying by ${fmt(p)} moves every digit ${PLACES_MOVED[p]} to the left.`, `${fmt(start)} ${X} ${fmt(p)} = ${fmt(answer)}.`]), decimal: true };
    }
    const k = r.int(0, 3 - j);
    const m = noTrailingZero(r, 3, 999);
    const start = dec(m, k), answer = dec(m, k + j);
    return { ...num(`Work out ${fmt(start)} ${DIV} ${fmt(p)}`, answer, [`Dividing by ${fmt(p)} moves every digit ${PLACES_MOVED[p]} to the right.`, 'Use zeros to fill any empty places before the first digit.', `${fmt(start)} ${DIV} ${fmt(p)} = ${fmt(answer)}.`]), decimal: true };
  }
  const k = r.int(0, 3 - j);
  const m = noTrailingZero(r, 11, 999);
  const small = dec(m, k + j), big = dec(m, k);
  return r.pick([
    () => ({ ...num('What is the missing number?', small, [`Undo the multiplying by dividing: ${fmt(big)} ${DIV} ${fmt(p)}.`, `Every digit moves ${PLACES_MOVED[p]} to the right: ${fmt(small)}.`], `? ${X} ${fmt(p)} = ${fmt(big)}`), decimal: true }),
    () => choiceOf(r, 'What is the missing number?', p, [10, 100, 1000, 10000].filter((v) => v !== p), [`Compare the two numbers. The digits have moved ${PLACES_MOVED[p]} to the right.`, `That is dividing by ${fmt(p)}.`], `${fmt(big)} ${DIV} ? = ${fmt(small)}`),
    () => choiceOf(r, 'What is the missing number?', p, [10, 100, 1000, 10000].filter((v) => v !== p), [`Compare the two numbers. The digits have moved ${PLACES_MOVED[p]} to the left.`, `That is multiplying by ${fmt(p)}.`], `${fmt(small)} ${X} ? = ${fmt(big)}`),
  ])();
}

const powersOfTen: SkillContent = {
  id: 'multiply-divide-4',
  example: [
    { say: 'Multiplying by 10 makes every digit worth ten times as much, so each digit moves one place to the left.', show: `36 ${X} 10 = 360` },
    { say: 'By 100 they move two places. By 1,000 they move three.', show: `36 ${X} 1,000 = 36,000` },
    { say: 'Dividing moves the digits to the right instead.', show: `4,500 ${DIV} 100 = 45` },
    { say: 'It works for decimals too. The digits move, and the decimal point stays where it is.', show: `3.47 ${X} 100 = 347       52.6 ${DIV} 10 = 5.26` },
  ],
  generate: (level, r) => powerOfTen(r, level),
};

// ---------- 5. Multiplying and dividing in your head ----------

function mental(r: Rng, level: number): Question {
  if (level === 1) {
    const a = r.int(2, 9), b = r.int(2, 9), p = r.pick([10, 100, 1000]);
    if (r.next() < 0.5) {
      return num(`Work this out in your head: ${fmt(a * p)} ${X} ${b}`, a * b * p, [`Use the fact ${a} ${X} ${b} = ${a * b}.`, `${fmt(a * p)} is ${fmt(p)} times bigger than ${a}, so the answer is ${fmt(a * b * p)}.`]);
    }
    return num(`Work this out in your head: ${fmt(a * b * p)} ${DIV} ${b}`, a * p, [`Use the fact ${a * b} ${DIV} ${b} = ${a}.`, `${fmt(a * b * p)} is ${fmt(p)} times bigger than ${a * b}, so the answer is ${fmt(a * p)}.`]);
  }
  if (level === 2) {
    return r.pick([
      () => {
        const a = r.int(13, 89), b = r.int(3, 9);
        const tens = Math.floor(a / 10) * 10, ones = a % 10;
        return num(`Work this out in your head: ${a} ${X} ${b}`, a * b, [`Split ${a} into ${tens} and ${ones}.`, `${tens} ${X} ${b} = ${tens * b} and ${ones} ${X} ${b} = ${ones * b}.`, `${tens * b} + ${ones * b} = ${a * b}.`]);
      },
      () => {
        const a = r.int(12, 68) * 2;
        return num(`Work this out in your head: ${a} ${X} 5`, a * 5, ['Multiplying by 5 is the same as multiplying by 10 and halving.', `${a} ${X} 10 = ${fmt(a * 10)}.`, `Half of ${fmt(a * 10)} is ${fmt(a * 5)}.`]);
      },
      () => {
        const a = r.int(13, 99);
        return num(`Work this out in your head: ${a} ${X} 4`, a * 4, ['Multiplying by 4 is doubling twice.', `Double ${a} is ${a * 2}.`, `Double ${a * 2} is ${a * 4}.`]);
      },
      () => {
        const b = r.int(3, 9), q = r.int(11, 49);
        const tens = Math.floor(q / 10) * 10;
        return num(`Work this out in your head: ${q * b} ${DIV} ${b}`, q, [`Split ${q * b} into ${tens * b} and ${(q - tens) * b}.`, `${tens * b} ${DIV} ${b} = ${tens} and ${(q - tens) * b} ${DIV} ${b} = ${q - tens}.`, `${tens} + ${q - tens} = ${q}.`]);
      },
    ])();
  }
  return r.pick([
    () => {
      const n = r.int(3, 12) * 4;
      return num(`Work this out in your head: 25 ${X} ${n}`, 25 * n, [`Four 25s make 100.`, `${n} is ${n / 4} lots of 4, so the answer is ${n / 4} hundreds: ${fmt(25 * n)}.`]);
    },
    () => {
      const n = r.int(3, 9);
      return num(`Work this out in your head: 99 ${X} ${n}`, 99 * n, [`99 is one less than 100.`, `100 ${X} ${n} = ${n * 100}.`, `Take away one lot of ${n}: ${n * 100} ${MINUS} ${n} = ${99 * n}.`]);
    },
    () => {
      const a = r.int(2, 9) * 10, b = r.int(2, 9) * r.pick([10, 100]);
      return num('What is the missing number?', b, [`Undo the multiplying by dividing: ${fmt(a * b)} ${DIV} ${a}.`, `${fmt(a * b)} ${DIV} ${a} = ${fmt(b)}.`], `? ${X} ${a} = ${fmt(a * b)}`);
    },
  ])();
}

const mentalMethods: SkillContent = {
  id: 'multiply-divide-5',
  example: [
    { say: 'Times table facts unlock much bigger sums.', show: `4 ${X} 6 = 24   so   400 ${X} 6 = 2,400` },
    { say: 'Split a number into tens and ones, multiply each part, then add.', show: `23 ${X} 4 = 80 + 12 = 92` },
    { say: 'Use doubling and halving. Times 4 is double, then double again. Times 5 is times 10, then halve.', show: `36 ${X} 5 = 360 ${DIV} 2 = 180` },
    { say: 'Division facts stretch the same way.', show: `35 ${DIV} 7 = 5   so   3,500 ${DIV} 7 = 500` },
  ],
  generate: (level, r) => mental(r, level),
};

// ---------- 6. Long multiplication ----------

const PLACE_CAP = ['Ones', 'Tens', 'Hundreds', 'Thousands'];

export function shortMultiplicationWorking(a: number, b: number): string[] {
  const lines: string[] = [];
  const ds = String(a).split('').reverse().map(Number);
  let carry = 0;
  ds.forEach((d, i) => {
    const v = d * b + carry;
    const last = i === ds.length - 1;
    lines.push(`${PLACE_CAP[i]}: ${d} ${X} ${b}${carry ? ` + ${carry} carried` : ''} = ${v}.${v >= 10 && !last ? ` Write ${v % 10} and carry ${Math.floor(v / 10)}.` : ''}`);
    carry = Math.floor(v / 10);
  });
  lines.push(`Answer: ${fmt(a * b)}.`);
  return lines;
}

function multiplyWritten(r: Rng, level: number): Question {
  if (level === 1) {
    const a = r.int(112, 9999), b = r.int(3, 9);
    return { kind: 'column', op: X, rows: [a, b], answer: a * b, prompt: 'Multiply. Start with the ones.', explain: shortMultiplicationWorking(a, b) };
  }
  const a = level === 2 ? r.int(13, 999) : r.int(1012, 9999);
  let b: number;
  do b = r.int(12, 98);
  while (b % 10 === 0);
  const ones = b % 10, tens = b - ones;
  return {
    kind: 'column',
    op: X,
    rows: [a, b],
    workRows: [`${fmt(a)} ${X} ${ones}`, `${fmt(a)} ${X} ${tens}`],
    answer: a * b,
    prompt: 'Multiply. Work out one row for the ones and one for the tens, then add them.',
    explain: [
      `Ones row: ${fmt(a)} ${X} ${ones} = ${fmt(a * ones)}.`,
      `Tens row: ${fmt(a)} ${X} ${tens} = ${fmt(a * tens)}. Put a 0 in the ones place first, then multiply by ${tens / 10}.`,
      `Add the rows: ${fmt(a * ones)} + ${fmt(a * tens)} = ${fmt(a * b)}.`,
      `Answer: ${fmt(a * b)}.`,
    ],
  };
}

const longMultiplication: SkillContent = {
  id: 'multiply-divide-6',
  example: [
    { say: 'To multiply by one digit, work from the ones, carrying as you go.', show: `2,346 ${X} 7 = 16,422` },
    { say: 'To multiply by a two-digit number, split it into ones and tens.', show: `346 ${X} 27  =  346 ${X} 7  +  346 ${X} 20` },
    { say: 'First row: multiply by the ones.', show: `346 ${X} 7 = 2,422` },
    { say: 'Second row: write a 0 in the ones place, then multiply by the tens digit.', show: `346 ${X} 20 = 6,920` },
    { say: 'Add the two rows to get the answer.', show: '2,422 + 6,920 = 9,342' },
  ],
  generate: (level, r) => multiplyWritten(r, level),
};

// ---------- 7. Short division ----------

export function divisionWorking(dividend: number, divisor: number): string[] {
  const lines: string[] = [];
  let carry = 0;
  const ds = String(dividend).split('').map(Number);
  ds.forEach((d, i) => {
    const cur = carry * 10 + d;
    const q = Math.floor(cur / divisor);
    carry = cur % divisor;
    const last = i === ds.length - 1;
    if (q === 0 && !last) lines.push(`${divisor} into ${cur} does not go${i ? ', so write 0' : ''}. Carry the ${cur}.`);
    else lines.push(`${divisor} into ${cur} goes ${q}${carry ? ` with ${carry} left over` : ''}.${carry && !last ? ` Carry the ${carry}.` : ''}`);
  });
  const q = Math.floor(dividend / divisor);
  lines.push(`Answer: ${fmt(q)}${carry ? ` remainder ${carry}` : ''}.`);
  return lines;
}

function divideWritten(r: Rng, digits: number, withRemainder: boolean): Question {
  const divisor = r.int(3, 9);
  let dividend: number;
  do dividend = r.int(10 ** (digits - 1), 10 ** digits - 1);
  while ((dividend % divisor === 0) === withRemainder);
  return {
    kind: 'division',
    dividend,
    divisor,
    answer: Math.floor(dividend / divisor),
    remainder: dividend % divisor,
    askRemainder: withRemainder,
    prompt: withRemainder ? 'Divide. Write the remainder in the box marked r.' : 'Divide. Start from the left.',
    explain: divisionWorking(dividend, divisor),
  };
}

function remainderInContext(r: Rng): Question {
  const size = r.int(4, 9);
  let total: number;
  do total = r.int(1012, 4999);
  while (total % size === 0);
  const q = Math.floor(total / size), rem = total % size;
  const work = `${fmt(total)} ${DIV} ${size} = ${fmt(q)} remainder ${rem}.`;
  return r.pick([
    () => num(`${fmt(total)} people are going to a match by minibus. Each minibus holds ${size} people. How many minibuses are needed?`, q + 1, [work, `The ${rem} left over still need a minibus, so round up: ${fmt(q + 1)}.`]),
    () => num(`A farm packs eggs into boxes of ${size}. There are ${fmt(total)} eggs. How many boxes can be filled?`, q, [work, `The ${rem} left over cannot fill a box, so the answer is ${fmt(q)}.`]),
    () => num(`${fmt(total)} stickers are shared equally between ${size} classes. How many stickers are left over?`, rem, [work, `The remainder is what is left over: ${rem}.`]),
  ])();
}

const shortDivision: SkillContent = {
  id: 'multiply-divide-7',
  example: [
    { say: 'Short division works from the left, one digit at a time. The answer goes above the line.', show: `952 ${DIV} 4` },
    { say: '4 into 9 goes 2, with 1 left over. Write 2 above and carry the 1 to make 15.' },
    { say: '4 into 15 goes 3, with 3 left over. Write 3 and carry the 3 to make 32.' },
    { say: '4 into 32 goes 8 exactly.', show: `952 ${DIV} 4 = 238` },
    { say: 'If something is left at the end, it is the remainder. In a word problem, think about what the remainder means.', show: `953 ${DIV} 4 = 238 remainder 1` },
  ],
  generate(level, r) {
    if (level === 1) return divideWritten(r, 3, false);
    if (level === 2) return divideWritten(r, 4, r.next() < 0.5);
    return r.pick([() => remainderInContext(r), () => divideWritten(r, 4, true)])();
  },
};

// ---------- 8. Mixed problems ----------

function mixed(r: Rng, level: number): Question {
  if (level === 1) {
    return r.pick([
      () => {
        const size = r.pick([6, 8, 12, 24]), packs = r.int(12, 40);
        const used = r.int(20, size * packs - 20);
        return num(`Pencils come in packs of ${size}. A school buys ${packs} packs and gives out ${used} pencils. How many pencils are left?`, size * packs - used, [`Pencils bought: ${packs} ${X} ${size} = ${fmt(size * packs)}.`, `Left: ${fmt(size * packs)} ${MINUS} ${used} = ${fmt(size * packs - used)}.`]);
      },
      () => {
        const a = r.int(3, 9), b = r.int(3, 9), big = r.pick([24, 36, 48]), small = r.pick([6, 8, 12]);
        return num(`A shop has ${a} large boxes with ${big} oranges in each, and ${b} small boxes with ${small} oranges in each. How many oranges is that altogether?`, a * big + b * small, [`Large boxes: ${a} ${X} ${big} = ${a * big}.`, `Small boxes: ${b} ${X} ${small} = ${b * small}.`, `Altogether: ${a * big} + ${b * small} = ${a * big + b * small}.`]);
      },
    ])();
  }
  if (level === 2) {
    return r.pick([
      () => {
        const a = r.int(4, 9), b = r.int(4, 9), c = r.int(5, a * b - 5);
        return num('The two sides must be equal. What is the missing number?', a * b - c, [`Left side: ${a} ${X} ${b} = ${a * b}.`, `So ? + ${c} must also make ${a * b}.`, `${a * b} ${MINUS} ${c} = ${a * b - c}.`], `${a} ${X} ${b} = ? + ${c}`);
      },
      () => {
        const c = r.int(3, 9), q = r.int(4, 12), a = r.int(10, c * q - 10);
        return num('The two sides must be equal. What is the missing number?', q, [`Left side: ${a} + ${c * q - a} = ${c * q}.`, `So ${c} ${X} ? must also make ${c * q}.`, `${c * q} ${DIV} ${c} = ${q}.`], `${a} + ${c * q - a} = ${c} ${X} ?`);
      },
      () => {
        const d = r.int(3, 9), e = r.int(12, 30), f = r.int(2, 9);
        return num('The two sides must be equal. What is the missing number?', (e - f) * d, [`Right side: ${e} ${MINUS} ${f} = ${e - f}.`, `So ? ${DIV} ${d} must also make ${e - f}.`, `${e - f} ${X} ${d} = ${(e - f) * d}.`], `? ${DIV} ${d} = ${e} ${MINUS} ${f}`);
      },
    ])();
  }
  return r.pick([
    () => {
      const rows = r.int(14, 36), seats = r.int(18, 42);
      const empty = r.int(40, rows * seats - 100);
      return num(`A cinema has ${rows} rows with ${seats} seats in each row. ${empty} seats are empty. How many seats are taken?`, rows * seats - empty, [`Seats altogether: ${rows} ${X} ${seats} = ${fmt(rows * seats)}.`, `Taken: ${fmt(rows * seats)} ${MINUS} ${empty} = ${fmt(rows * seats - empty)}.`]);
    },
    () => {
      const n = r.int(6, 15), m = r.int(3, 9), add = r.int(8, 30);
      const end = n * m + add;
      return num(`I think of a number. I multiply it by ${m} and then add ${add}. The answer is ${end}. What was my number?`, n, [`Work backwards. Undo the adding: ${end} ${MINUS} ${add} = ${n * m}.`, `Undo the multiplying: ${n * m} ${DIV} ${m} = ${n}.`]);
    },
    () => {
      const adult = r.int(8, 15), child = r.int(4, adult - 2), a = r.int(2, 6), c = r.int(3, 9);
      return { ...num(`Tickets cost £${adult} for an adult and £${child} for a child. How much do ${a} adults and ${c} children pay altogether?`, a * adult + c * child, [`Adults: ${a} ${X} ${adult} = ${a * adult}.`, `Children: ${c} ${X} ${child} = ${c * child}.`, `Altogether: ${a * adult} + ${c * child} = ${a * adult + c * child}.`]), unit: ' pounds' };
    },
    () => {
      const side = r.int(6, 15), spare = r.int(5, 30);
      return num(`A square patio is ${side} tiles long and ${side} tiles wide. Tiles come in one box of ${side * side + spare}. How many tiles will be left over?`, spare, [`Tiles needed: ${side}${SQ} = ${side} ${X} ${side} = ${side * side}.`, `Left over: ${side * side + spare} ${MINUS} ${side * side} = ${spare}.`]);
    },
  ])();
}

const mixedProblems: SkillContent = {
  id: 'multiply-divide-8',
  example: [
    { say: 'Some problems need more than one kind of sum. Read it through and plan the steps.', show: 'Pens come in packs of 12. A school buys 25 packs and gives out 180 pens. How many are left?' },
    { say: 'Step one: how many pens were bought?', show: `25 ${X} 12 = 300` },
    { say: 'Step two: take away the pens given out.', show: `300 ${MINUS} 180 = 120` },
    { say: 'The equals sign means "is the same as". Both sides must have the same value.', show: `6 ${X} 8 = ? + 30   so   ? = 18` },
  ],
  generate: (level, r) => mixed(r, level),
};

// ---------- 9. Scaling and rates ----------

function scaling(r: Rng, level: number): Question {
  if (level === 1) {
    const people = r.pick([2, 4, 5]), k = r.int(2, 6);
    const amount = r.int(3, 12) * 25;
    const food = r.pick(['flour', 'rice', 'pasta', 'oats']);
    return { ...num(`A recipe for ${people} people uses ${amount} g of ${food}. How much ${food} is needed for ${people * k} people?`, amount * k, [`${people * k} people is ${k} times as many as ${people}.`, `So use ${k} times as much: ${amount} ${X} ${k} = ${fmt(amount * k)}.`]), unit: 'g' };
  }
  if (level === 2) {
    return r.pick([
      () => {
        const den = r.pick([2, 4, 5, 10]);
        const model = r.int(6, 40);
        const thing = r.pick(['bridge', 'ship', 'tower', 'plane']);
        return { ...num(`A model ${thing} is 1/${den} of the size of the real one. The real ${thing} is ${model * den} m long. How long is the model?`, model, [`Finding 1/${den} is the same as dividing by ${den}.`, `${model * den} ${DIV} ${den} = ${model}.`]), unit: 'm' };
      },
      () => {
        const rate = r.int(12, 60), mins = r.int(4, 25);
        return num(`A machine fills ${rate} bottles every minute. How many bottles does it fill in ${mins} minutes?`, rate * mins, [`Each minute gives another ${rate}.`, `${rate} ${X} ${mins} = ${fmt(rate * mins)}.`]);
      },
      () => {
        const rate = r.int(6, 15), mins = r.int(8, 30);
        return { ...num(`A tap fills ${rate} litres every minute. How long does it take to fill a ${rate * mins} litre tank?`, mins, [`Find how many lots of ${rate} make ${rate * mins}.`, `${rate * mins} ${DIV} ${rate} = ${mins}.`]), unit: ' minutes' };
      },
    ])();
  }
  return r.pick([
    () => {
      const n = r.int(3, 8), each = r.int(3, 12) * 5;
      let m: number;
      do m = r.int(5, 14);
      while (m % n === 0);
      return { ...num(`${n} apples cost ${n * each}p. At the same price, how much do ${m} apples cost?`, m * each, [`Find the cost of one: ${n * each} ${DIV} ${n} = ${each}p.`, `Then ${m} apples: ${each} ${X} ${m} = ${m * each}p.`]), unit: 'p' };
    },
    () => {
      const speed = r.int(3, 9) * 10 + r.pick([0, 5]), h1 = r.int(2, 4);
      let h2: number;
      do h2 = r.int(5, 9);
      while (h2 % h1 === 0);
      return { ...num(`A coach travels ${speed * h1} km in ${h1} hours. At the same speed, how far does it travel in ${h2} hours?`, speed * h2, [`Distance in one hour: ${speed * h1} ${DIV} ${h1} = ${speed}.`, `In ${h2} hours: ${speed} ${X} ${h2} = ${speed * h2}.`]), unit: 'km' };
    },
    () => {
      const den = r.pick([4, 5, 10]), small = r.int(12, 60), k = r.int(3, 8);
      return { ...num(`A photo is ${small * den} mm wide. It is printed at 1/${den} of the size, and then that print is made ${k} times as wide. How wide is the final picture?`, small * k, [`First: ${small * den} ${DIV} ${den} = ${small}.`, `Then: ${small} ${X} ${k} = ${small * k}.`]), unit: 'mm' };
    },
  ])();
}

const scalingRates: SkillContent = {
  id: 'multiply-divide-9',
  example: [
    { say: 'Scaling means making everything bigger or smaller by the same number of times.', show: 'A recipe for 4 people uses 300 g of flour' },
    { say: 'For 12 people you need 3 times as many portions, so use 3 times as much of everything.', show: `300 ${X} 3 = 900 g` },
    { say: 'Scaling down by a fraction means dividing. A model that is 1/10 of the size has every length divided by 10.', show: `350 cm ${DIV} 10 = 35 cm` },
    { say: 'A rate tells you how much for each one. If 4 apples cost 180p, find one apple first, then as many as you need.', show: `180 ${DIV} 4 = 45p     45 ${X} 10 = 450p` },
  ],
  generate: (level, r) => scaling(r, level),
};

export const MULTIPLY_DIVIDE_SKILLS: SkillContent[] = [
  multiplesAndFactors, primes, squaresCubes, powersOfTen, mentalMethods, longMultiplication, shortDivision, mixedProblems, scalingRates,
];
