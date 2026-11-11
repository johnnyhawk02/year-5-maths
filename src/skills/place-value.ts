// Unit 1: Number and place value. All wording and questions are our own.
import { numberLine, placeChart, table } from '../engine/pictures';
import { fmt, PLACES, romanParts, roundTo, toRoman, toWords } from '../engine/format';
import type { Rng } from '../engine/rng';
import type { Level, Question, SkillContent } from '../engine/types';

const pow10 = (n: number) => 10 ** n;
const digitsOf = (n: number) => String(n).split('').map(Number);
const STEP_WORDS: Record<number, string> = {
  10: '10', 100: '100', 1000: '1,000', 10000: '10,000', 100000: '100,000',
};

/** A whole number with the given count of digits, all different, not starting with 0. */
function distinctNumber(r: Rng, count: number): number {
  let ds: number[];
  do ds = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count);
  while (ds[0] === 0);
  return Number(ds.join(''));
}

/** Any whole number with exactly this many digits. */
const anyNumber = (r: Rng, count: number) => r.int(pow10(count - 1), pow10(count) - 1);

// ---------- 1. Numbers to 1,000,000 ----------

function digitValue(r: Rng, count: number): Question {
  const n = distinctNumber(r, count);
  const ds = digitsOf(n);
  let i: number;
  do i = r.int(0, ds.length - 1);
  while (ds[i] === 0);
  const place = ds.length - 1 - i;
  return {
    kind: 'number',
    prompt: `What is the value of the digit ${ds[i]} in this number?`,
    show: fmt(n),
    answer: ds[i] * pow10(place),
    explain: [
      `The ${ds[i]} is in the ${PLACES[place]} place.`,
      `${ds[i]} ${PLACES[place]} is ${fmt(ds[i] * pow10(place))}.`,
    ],
    pics: [placeChart([fmt(n)])],
  };
}

/** A near neighbour of n: one digit changed, same number of digits. */
function neighbour(r: Rng, n: number): number {
  const ds = digitsOf(n);
  for (;;) {
    const i = r.int(0, ds.length - 1);
    const d = r.int(i === 0 ? 1 : 0, 9);
    if (d === ds[i]) continue;
    const copy = [...ds];
    copy[i] = d;
    return Number(copy.join(''));
  }
}

function compare(r: Rng, count: number): Question {
  const a = anyNumber(r, count);
  const b = neighbour(r, a);
  const larger = r.next() < 0.5;
  const options = [fmt(a), fmt(b)];
  const want = larger ? Math.max(a, b) : Math.min(a, b);
  const da = digitsOf(a), db = digitsOf(b);
  const i = da.findIndex((d, k) => d !== db[k]);
  const place = da.length - 1 - i;
  return {
    kind: 'choice',
    prompt: `Which number is ${larger ? 'larger' : 'smaller'}?`,
    options,
    answer: options.indexOf(fmt(want)),
    explain: [
      'Compare the digits from the left until two are different.',
      `They first differ in the ${PLACES[place]} place: ${da[i]} and ${db[i]}.`,
      `So ${fmt(want)} is ${larger ? 'larger' : 'smaller'}.`,
    ],
    pics: [placeChart([fmt(a), fmt(b)])],
  };
}

function orderNumbers(r: Rng, count: number, allowDescending: boolean): Question {
  const set = new Set<number>([anyNumber(r, count)]);
  while (set.size < 4) set.add(neighbour(r, r.pick([...set])));
  const descending = allowDescending && r.next() < 0.5;
  const sorted = [...set].sort((a, b) => (descending ? b - a : a - b));
  let items = r.shuffle(sorted);
  if (items.every((v, i) => v === sorted[i])) items = [...sorted].reverse();
  return {
    kind: 'order',
    prompt: `Put these in order, ${descending ? 'largest' : 'smallest'} first.`,
    items: items.map(fmt),
    answer: sorted.map(fmt),
    explain: [
      'Compare the digits from the left, starting with the biggest place.',
      `In order: ${sorted.map(fmt).join(', ')}.`,
    ],
  };
}

function wordsToDigits(r: Rng, withZeros: boolean): Question {
  let n: number;
  if (withZeros) {
    // Zeros as place holders are the classic slip, so build some in.
    const th = r.pick([r.int(1, 9) * 100 + r.int(1, 9), r.int(1, 9) * 10, r.int(11, 99) * 10]);
    const rest = r.pick([r.int(1, 99), r.int(1, 9) * 100 + r.int(1, 9), r.int(1, 9)]);
    n = th * 1000 + rest;
  } else {
    n = r.int(10, 99) * 1000 + r.int(100, 999);
  }
  return {
    kind: 'number',
    prompt: 'Write this number in digits.',
    show: toWords(n),
    answer: n,
    explain: [
      `The thousands part is ${fmt(Math.floor(n / 1000))}.`,
      `The rest is ${n % 1000}. It needs three digits, so use zeros to hold empty places.`,
      `The number is ${fmt(n)}.`,
    ],
  };
}

function digitCards(r: Rng): Question {
  for (;;) {
    const cards = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, r.int(5, 6));
    const rule = r.pick(['smallest', 'largest even', 'largest odd', 'smallest odd'] as const);
    const wantOdd = rule.endsWith('odd') ? 1 : rule.endsWith('even') ? 0 : null;
    const all: number[] = [];
    const walk = (left: number[], made: number[]) => {
      if (!left.length) {
        if (made[0] !== 0 && (wantOdd === null || made[made.length - 1] % 2 === wantOdd)) all.push(Number(made.join('')));
        return;
      }
      left.forEach((d, i) => walk([...left.slice(0, i), ...left.slice(i + 1)], [...made, d]));
    };
    walk(cards, []);
    if (!all.length) continue;
    const answer = rule.startsWith('smallest') ? Math.min(...all) : Math.max(...all);
    const tip = rule.startsWith('smallest')
      ? 'Put the smallest digits in the biggest places. A number cannot start with 0.'
      : 'Put the largest digits in the biggest places.';
    return {
      kind: 'number',
      prompt: `Use each of these digit cards once. What is the ${rule} ${cards.length}-digit number you can make?`,
      show: cards.join('   '),
      answer,
      explain: [
        tip,
        ...(wantOdd === null ? [] : [`It must be ${wantOdd ? 'odd' : 'even'}, so choose the ones digit with care.`]),
        `The answer is ${fmt(answer)}.`,
      ],
    };
  }
}

const numbersToMillion: SkillContent = {
  id: 'place-value-1',
  example: [
    { say: 'Every digit in a number has a place, and the place tells you what it is worth.', show: '472,318', pics: [placeChart(['472318'])] },
    { say: 'From the right the places are ones, tens, hundreds, thousands, ten thousands and hundred thousands.', pics: [placeChart(['472318'], { caption: 'O ones, T tens, H hundreds, Th thousands, TTh ten thousands, HTh hundred thousands' })] },
    { say: 'The 7 is in the ten thousands place, so it is worth 70,000.', show: '7 ten thousands = 70,000', pics: [placeChart(['472318'], { hi: ['TTh'] })] },
    { say: 'To compare two numbers, look at the digits from the left. The first place where they differ decides it.', show: '472,318  >  469,950', pics: [placeChart(['472318', '469950'], { hi: ['TTh'], caption: 'The hundred thousands match. In the ten thousands, 7 is more than 6.' })] },
  ],
  generate(level, r) {
    if (level === 1) return r.pick([() => digitValue(r, r.int(4, 5)), () => compare(r, 5)])();
    if (level === 2) return r.pick([() => digitValue(r, 6), () => orderNumbers(r, 6, false), () => wordsToDigits(r, false), () => compare(r, 6)])();
    return r.pick([() => digitCards(r), () => orderNumbers(r, 6, true), () => wordsToDigits(r, true)])();
  },
};

// ---------- 2. Counting in powers of 10 ----------

function moreLess(r: Rng, steps: number[], forceCrossing: boolean): Question {
  for (;;) {
    const step = r.pick(steps);
    const more = r.next() < 0.5;
    let n = r.int(step * 2, 989_999);
    if (forceCrossing) {
      // Make the digit that changes a 9 (going up) or a 0 (going down) so the next place changes too.
      const digit = Math.floor(n / step) % 10;
      n += ((more ? 9 : 0) - digit) * step;
    }
    const answer = more ? n + step : n - step;
    if (n < step * 2 || answer < 0 || answer > 1_000_000) continue;
    const place = PLACES[String(step).length - 1];
    return {
      kind: 'number',
      prompt: `What is ${STEP_WORDS[step]} ${more ? 'more' : 'less'} than ${fmt(n)}?`,
      answer,
      explain: [
        `Only the ${place} digit needs to change, unless it passes ${more ? '9' : '0'}.`,
        `${fmt(n)} ${more ? '+' : '−'} ${STEP_WORDS[step]} = ${fmt(answer)}.`,
      ],
    };
  }
}

function sequence(r: Rng, steps: number[], level: Level): Question {
  for (;;) {
    const step = r.pick(steps);
    const up = r.next() < 0.5;
    const start = r.int(step * 6, 900_000);
    const terms = [0, 1, 2, 3, 4].map((i) => start + (up ? i : -i) * step);
    if (terms.some((t) => t < 0 || t > 1_000_000)) continue;
    const dir = up ? 'up' : 'down';
    if (level < 3) {
      return {
        kind: 'number',
        prompt: 'What number comes next?',
        show: `${terms.slice(0, 3).map(fmt).join(',  ')},  ?`,
        answer: terms[3],
        explain: [`The numbers go ${dir} in steps of ${STEP_WORDS[step]}.`, `The next number is ${fmt(terms[3])}.`],
      };
    }
    if (r.next() < 0.5) {
      return {
        kind: 'number',
        prompt: 'What is the missing first number?',
        show: `?,  ${terms.slice(1, 4).map(fmt).join(',  ')}`,
        answer: terms[0],
        explain: [
          `The numbers go ${dir} in steps of ${STEP_WORDS[step]}.`,
          `Work backwards from ${fmt(terms[1])}: the first number is ${fmt(terms[0])}.`,
        ],
      };
    }
    return {
      kind: 'number',
      prompt: `A sequence starts at ${fmt(terms[0])} and counts ${up ? 'on' : 'back'} in steps of ${STEP_WORDS[step]}. What is the fifth number?`,
      answer: terms[4],
      explain: [
        'The fifth number is four steps from the first.',
        `Four steps of ${STEP_WORDS[step]} is ${fmt(4 * step)}.`,
        `${fmt(terms[0])} ${up ? '+' : '−'} ${fmt(4 * step)} = ${fmt(terms[4])}.`,
      ],
    };
  }
}

const countingInPowers: SkillContent = {
  id: 'place-value-2',
  example: [
    { say: 'Counting in 10s, 100s or 1,000s changes just one digit at a time.', show: '45,320', pics: [placeChart(['45320'])] },
    { say: 'To find 1,000 more, add one to the thousands digit.', show: '45,320  →  46,320', pics: [placeChart(['45320', '46320'], { hi: ['Th'] })] },
    { say: 'Watch out when the digit is a 9. It goes to 0 and the next place goes up by one.', show: '49,320  →  50,320', pics: [placeChart(['49320', '50320'], { hi: ['TTh', 'Th'] })] },
    { say: 'Counting back works the same way. A 0 becomes 9 and the next place goes down by one.', show: '50,320  →  49,320', pics: [placeChart(['50320', '49320'], { hi: ['TTh', 'Th'] })] },
  ],
  generate(level, r) {
    if (level === 1) return r.pick([() => moreLess(r, [10, 100, 1000], false), () => sequence(r, [10, 100, 1000], 1)])();
    if (level === 2) return r.pick([() => moreLess(r, [1000, 10000, 100000], true), () => moreLess(r, [10, 100], true), () => sequence(r, [10000, 100000], 2)])();
    return sequence(r, [100, 1000, 10000, 100000], 3);
  },
};

// ---------- 3. Negative numbers ----------

function placeOnLine(r: Rng): Question {
  const answer = r.int(-9, -1);
  return {
    kind: 'line',
    prompt: `Tap ${fmt(answer)} on the number line.`,
    min: -10,
    max: 10,
    step: 1,
    labelEvery: 5,
    answer,
    explain: ['Negative numbers are to the left of zero.', `Count ${Math.abs(answer)} steps left from 0 to reach ${fmt(answer)}.`],
  };
}

function temperatureFall(r: Rng): Question {
  const start = r.int(1, 6);
  const fall = r.int(start + 1, start + 8);
  return {
    kind: 'number',
    allowNegative: true,
    unit: '°C',
    prompt: `The temperature is ${start}°C. It falls by ${fall} degrees. What is the temperature now?`,
    answer: start - fall,
    explain: [
      `Count back ${start} to reach 0.`,
      `There are ${fall - start} more to count back, so you land on ${fmt(start - fall)}.`,
    ],
    pics: [numberLine(-10, 10, 1, [-10, -5, 0, 5, 10], { points: [start] })],
  };
}

function countThroughZero(r: Rng): Question {
  const forward = r.next() < 0.5;
  const start = forward ? r.int(-9, -2) : r.int(1, 8);
  const jump = forward ? r.int(-start + 1, -start + 9) : r.int(start + 1, start + 9);
  const answer = forward ? start + jump : start - jump;
  const toZero = Math.abs(start);
  return {
    kind: 'number',
    allowNegative: true,
    prompt: `Start at ${fmt(start)}. Count ${forward ? 'on' : 'back'} ${jump}. Where do you land?`,
    answer,
    explain: [
      `It takes ${toZero} to reach 0.`,
      `That leaves ${jump - toZero} more, so you land on ${fmt(answer)}.`,
    ],
    pics: [numberLine(-10, 10, 1, [-10, -5, 0, 5, 10], { points: [start] })],
  };
}

function orderIntegers(r: Rng): Question {
  const set = new Set<number>();
  while (set.size < 5) set.add(r.int(-12, 12));
  if (![...set].some((v) => v < 0)) return orderIntegers(r);
  const sorted = [...set].sort((a, b) => a - b);
  let items = r.shuffle(sorted);
  if (items.every((v, i) => v === sorted[i])) items = [...sorted].reverse();
  return {
    kind: 'order',
    prompt: 'Put these in order, smallest first.',
    items: items.map(fmt),
    answer: sorted.map(fmt),
    explain: [
      'Picture a number line. Further left is smaller.',
      'For negative numbers, the bigger the digits, the smaller the number.',
      `In order: ${sorted.map(fmt).join(', ')}.`,
    ],
  };
}

function colder(r: Rng): Question {
  const a = r.int(-12, -1);
  let b: number;
  do b = r.int(-12, 3);
  while (b === a);
  const wantColder = r.next() < 0.5;
  const options = [`${fmt(a)}°C`, `${fmt(b)}°C`];
  const want = wantColder ? Math.min(a, b) : Math.max(a, b);
  return {
    kind: 'choice',
    prompt: `Which temperature is ${wantColder ? 'colder' : 'warmer'}?`,
    options,
    answer: options.indexOf(`${fmt(want)}°C`),
    explain: [
      'On a number line, colder is further left and warmer is further right.',
      `${fmt(want)}°C is ${wantColder ? 'colder' : 'warmer'}.`,
    ],
  };
}

function difference(r: Rng): Question {
  const low = r.int(-12, -1);
  const high = r.int(1, 12);
  return {
    kind: 'number',
    prompt: `The temperature rose from ${fmt(low)}°C to ${high}°C. By how many degrees did it rise?`,
    answer: high - low,
    explain: [
      `From ${fmt(low)} up to 0 is ${-low}.`,
      `From 0 up to ${high} is ${high}.`,
      `${-low} + ${high} = ${high - low}.`,
    ],
    pics: [numberLine(-15, 15, 1, [-15, -10, -5, 0, 5, 10, 15], { points: [low, high] })],
  };
}

function twoChanges(r: Rng): Question {
  const mon = r.int(-4, 4);
  const down = r.int(3, 9);
  const up = r.int(2, 12);
  const tue = mon - down;
  const wed = tue + up;
  return {
    kind: 'number',
    allowNegative: true,
    unit: '°C',
    prompt: `On Monday it was ${fmt(mon)}°C. Tuesday was ${down} degrees colder. Wednesday was ${up} degrees warmer than Tuesday. What was the temperature on Wednesday?`,
    answer: wed,
    explain: [
      `Tuesday: ${fmt(mon)} count back ${down} is ${fmt(tue)}.`,
      `Wednesday: ${fmt(tue)} count on ${up} is ${fmt(wed)}.`,
    ],
  };
}

function sequenceThroughZero(r: Rng): Question {
  const step = r.int(2, 6);
  const start = r.int(step + 1, step * 2 + 3);
  const terms = [0, 1, 2, 3].map((i) => start - i * step);
  if (terms[3] >= 0) return sequenceThroughZero(r);
  return {
    kind: 'number',
    allowNegative: true,
    prompt: 'What number comes next?',
    show: `${terms.slice(0, 3).map(fmt).join(',  ')},  ?`,
    answer: terms[3],
    explain: [`The numbers go down in steps of ${step}.`, `${fmt(terms[2])} count back ${step} is ${fmt(terms[3])}.`],
  };
}

const negativeNumbers: SkillContent = {
  id: 'place-value-3',
  example: [
    { say: 'Numbers do not stop at zero. Below zero they are negative, and we write a minus sign in front.', show: '−3   −2   −1   0   1   2   3', pics: [numberLine(-5, 5, 1, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5])] },
    { say: 'Temperatures use them. If it is 2°C and it gets 5 degrees colder, count back 5.', show: '2  →  1,  0,  −1,  −2,  −3', pics: [numberLine(-5, 5, 1, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], { jumps: [[2, 1], [1, 0], [0, -1], [-1, -2], [-2, -3]] })] },
    { say: 'A quick way is to split the jump at zero. Two to reach 0, then three more.', show: '2 − 2 = 0,   0 − 3 = −3', pics: [numberLine(-5, 5, 1, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], { jumps: [[2, 0, '−2'], [0, -3, '−3']] })] },
    { say: 'Further left is smaller, so −8 is smaller than −3.', show: '−8  <  −3', pics: [numberLine(-10, 0, 1, [-10, -5, 0], { points: [-8, -3] })] },
  ],
  generate(level, r) {
    if (level === 1) return r.pick([() => placeOnLine(r), () => temperatureFall(r), () => colder(r)])();
    if (level === 2) return r.pick([() => countThroughZero(r), () => orderIntegers(r), () => sequenceThroughZero(r)])();
    return r.pick([() => difference(r), () => twoChanges(r)])();
  },
};

// ---------- 4. Rounding ----------

function roundNumber(r: Rng, digitCounts: number[], powers: number[]): Question {
  for (;;) {
    const n = anyNumber(r, r.pick(digitCounts));
    const p = r.pick(powers);
    if (n <= p || n % p === 0) continue;
    const answer = roundTo(n, p);
    const decider = Math.floor((n % p) / (p / 10));
    const lower = Math.floor(n / p) * p;
    return {
      kind: 'number',
      prompt: `Round ${fmt(n)} to the nearest ${STEP_WORDS[p]}.`,
      answer,
      explain: [
        `${fmt(n)} is between ${fmt(lower)} and ${fmt(lower + p)}.`,
        `Look at the ${PLACES[String(p).length - 2]} digit. It is ${decider}.`,
        `${decider >= 5 ? '5 or more rounds up' : '4 or less rounds down'}, so the answer is ${fmt(answer)}.`,
      ],
      pics: [numberLine(lower, lower + p, p / 10, [lower, lower + p / 2, lower + p], { points: [n] })],
    };
  }
}

function roundingBounds(r: Rng): Question {
  const p = r.pick([100, 1000, 10000]);
  const x = r.int(3, 98) * p;
  const smallest = r.next() < 0.5;
  const answer = smallest ? x - p / 2 : x + p / 2 - 1;
  return {
    kind: 'number',
    prompt: `A whole number rounds to ${fmt(x)} to the nearest ${STEP_WORDS[p]}. What is the ${smallest ? 'smallest' : 'largest'} it could be?`,
    answer,
    explain: smallest
      ? [`Halfway between ${fmt(x - p)} and ${fmt(x)} is ${fmt(x - p / 2)}.`, `Halfway rounds up, so ${fmt(answer)} is the smallest.`]
      : [`Halfway between ${fmt(x)} and ${fmt(x + p)} is ${fmt(x + p / 2)}.`, `That would round up to ${fmt(x + p)}, so the largest is one less: ${fmt(answer)}.`],
  };
}

function whichRounds(r: Rng): Question {
  const p = r.pick([1000, 10000]);
  const x = r.int(3, 9) * p * (p === 1000 ? 10 : 1) + (p === 1000 ? r.int(1, 9) * p : 0);
  const half = p / 2;
  const fine = p / 100;
  const right = x + r.int(-half / fine, half / fine - 1) * fine;
  const wrong = [
    x + half + r.int(0, 20) * fine, // rounds up to the next one
    x - half - r.int(1, 20) * fine, // rounds down to the one before
    x + p + r.int(1, 30) * fine,
  ];
  const options = r.shuffle([right, ...wrong]).map(fmt);
  return {
    kind: 'choice',
    prompt: `Which number rounds to ${fmt(x)} to the nearest ${STEP_WORDS[p]}?`,
    options,
    answer: options.indexOf(fmt(right)),
    explain: [
      `Numbers from ${fmt(x - half)} up to ${fmt(x + half - 1)} round to ${fmt(x)}.`,
      `Only ${fmt(right)} is in that range.`,
    ],
  };
}

const rounding: SkillContent = {
  id: 'place-value-4',
  example: [
    { say: 'Rounding gives a nearby number that is easier to work with.', show: '4,372', pics: [numberLine(4000, 5000, 100, [4000, 4500, 5000], { points: [4372] })] },
    { say: 'To round to the nearest 100, find the hundreds either side.', show: '4,300   and   4,400', pics: [numberLine(4300, 4400, 10, [4300, 4350, 4400], { points: [4372] })] },
    { say: 'Look at the digit one place to the right, the tens. It is 7.', show: '4,3 7 2', pics: [placeChart(['4372'], { hi: ['T'] })] },
    { say: '5 or more rounds up. 4 or less rounds down. So 4,372 rounds up.', show: '4,372  →  4,400', pics: [numberLine(4300, 4400, 10, [4300, 4350, 4400], { points: [4372], jumps: [[4372, 4400]] })] },
  ],
  generate(level, r) {
    if (level === 1) return roundNumber(r, [4, 5], [10, 100, 1000]);
    if (level === 2) return roundNumber(r, [5, 6], [1000, 10000, 100000]);
    return r.pick([() => roundingBounds(r), () => whichRounds(r)])();
  },
};

// ---------- 5. Roman numerals ----------

const partsLine = (n: number) => romanParts(n).map((p) => `${p.symbol} = ${fmt(p.value)}`).join(',  ');

function readRoman(r: Rng, min: number, max: number, year: boolean): Question {
  const n = r.int(min, max);
  return {
    kind: 'number',
    prompt: year ? 'Which year is this?' : 'What number is this?',
    show: toRoman(n),
    answer: n,
    explain: ['Split it into parts and add them up.', partsLine(n), `Total: ${year ? n : fmt(n)}.`],
  };
}

function pickRoman(r: Rng, min: number, max: number, year: boolean): Question {
  for (;;) {
    const n = r.int(min, max);
    const near = r.shuffle([n + 1, n - 1, n + 10, n - 10, n + 100, n - 100, n + 5, n - 5, n + 50, n - 50])
      .filter((v) => v >= 1 && v <= 3999)
      .slice(0, 3);
    if (near.length < 3) continue;
    const options = r.shuffle([n, ...near]).map(toRoman);
    return {
      kind: 'choice',
      prompt: year ? `Which is the year ${n}?` : `Which is ${fmt(n)} in Roman numerals?`,
      options,
      answer: options.indexOf(toRoman(n)),
      explain: ['Build it one place at a time, biggest first.', partsLine(n), `Together: ${toRoman(n)}.`],
    };
  }
}

const romanNumerals: SkillContent = {
  id: 'place-value-5',
  example: [
    { say: 'Roman numerals use seven letters.', show: 'I = 1   V = 5   X = 10   L = 50   C = 100   D = 500   M = 1,000', pics: [table(['I', 'V', 'X', 'L', 'C', 'D', 'M'], ['1', '5', '10', '50', '100', '500', '1,000'], 'The seven Roman numeral letters and their values')] },
    { say: 'Usually you read left to right and add.', show: 'CLXVI = 100 + 50 + 10 + 5 + 1 = 166', pics: [table(['C', 'L', 'X', 'V', 'I'], ['100', '50', '10', '5', '1'], 'CLXVI split into its letters')] },
    { say: 'A smaller letter in front of a bigger one is taken away.', show: 'IV = 4   IX = 9   XL = 40   XC = 90   CD = 400   CM = 900', pics: [table(['IV', 'IX', 'XL', 'XC', 'CD', 'CM'], ['4', '9', '40', '90', '400', '900'], 'The six pairs where a smaller letter is taken away')] },
    { say: 'Years are read the same way, in parts.', show: 'MCMXCVIII = 1,000 + 900 + 90 + 8 = 1998', pics: [table(['M', 'CM', 'XC', 'VIII'], ['1,000', '900', '90', '8'], 'MCMXCVIII split into parts')] },
  ],
  generate(level, r) {
    if (level === 1) return readRoman(r, 1, 50, false);
    if (level === 2) return r.pick([() => readRoman(r, 51, 1000, false), () => pickRoman(r, 20, 1000, false)])();
    return r.pick([() => readRoman(r, 1066, 2026, true), () => pickRoman(r, 1066, 2026, true)])();
  },
};

export const PLACE_VALUE_SKILLS: SkillContent[] = [numbersToMillion, countingInPowers, negativeNumbers, rounding, romanNumerals];
