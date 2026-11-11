// Unit 2: Addition and subtraction. All wording and questions are our own.
import { additionPicture, subtractionPicture } from '../engine/written';
import { fmt, PLACES, roundTo } from '../engine/format';
import type { Rng } from '../engine/rng';
import type { Question, SkillContent } from '../engine/types';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const digitsFromRight = (n: number) => String(n).split('').reverse().map(Number);
const MINUS = '−';

// ---------- Working, written out column by column ----------

export function additionWorking(rows: number[]): string[] {
  const lines: string[] = [];
  const cols = rows.map(digitsFromRight);
  const width = Math.max(...cols.map((c) => c.length));
  let carry = 0;
  for (let i = 0; i < width; i++) {
    const ds = cols.map((c) => c[i]).filter((d) => d !== undefined);
    const sum = ds.reduce((a, b) => a + b, 0) + carry;
    const parts = ds.join(' + ') + (carry ? ` + ${carry} carried` : '');
    const tail = sum >= 10 ? ` Write ${sum % 10} and carry ${Math.floor(sum / 10)}.` : '';
    lines.push(`${cap(PLACES[i])}: ${parts} = ${sum}.${tail}`);
    carry = Math.floor(sum / 10);
  }
  if (carry) lines.push(`Write the carried ${carry} in the ${PLACES[width]} place.`);
  lines.push(`Answer: ${fmt(rows.reduce((a, b) => a + b, 0))}.`);
  return lines;
}

export function subtractionWorking(a: number, b: number): string[] {
  const lines: string[] = [];
  const top = digitsFromRight(a);
  const bottom = digitsFromRight(b);
  let borrow = 0;
  for (let i = 0; i < top.length; i++) {
    const take = bottom[i] ?? 0;
    let t = top[i] - borrow;
    let note = borrow ? `The ${top[i]} is now ${t < 0 ? 9 : t}. ` : '';
    borrow = 0;
    if (t < 0) {
      // A zero that has been exchanged through becomes 9 and passes the exchange on.
      t += 10;
      borrow = 1;
    }
    if (t < take) {
      note += `${t} is less than ${take}, so exchange one from the next place. `;
      t += 10;
      borrow = 1;
    }
    if (i >= bottom.length && !note && i > 0) continue; // nothing to take away and nothing changed
    lines.push(`${cap(PLACES[i])}: ${note}${t} ${MINUS} ${take} = ${t - take}.`);
  }
  lines.push(`Answer: ${fmt(a - b)}.`);
  return lines;
}

// ---------- 1. Column addition ----------

function columnAdd(r: Rng, ranges: [number, number][]): Question {
  const rows = ranges.map(([lo, hi]) => r.int(lo, hi));
  return {
    kind: 'column',
    op: '+',
    rows,
    answer: rows.reduce((a, b) => a + b, 0),
    prompt: 'Add these numbers. Start with the ones.',
    explain: additionWorking(rows),
  };
}

const columnAddition: SkillContent = {
  id: 'add-subtract-1',
  example: [
    { say: 'Line the numbers up so that ones are under ones, tens under tens, and so on. Draw a line underneath for the answer.', show: '46,275 + 8,163', written: additionPicture([46275, 8163], 0) },
    { say: 'Add the ones first. 5 + 3 = 8. Write 8 in the ones column.', written: additionPicture([46275, 8163], 1) },
    { say: 'Tens: 7 + 6 = 13. That is 3 tens and 1 hundred. Write 3 in the tens column and carry the 1 by writing it small under the hundreds column.', written: additionPicture([46275, 8163], 2) },
    { say: 'Hundreds: 2 + 1 = 3, and the carried 1 makes 4.', written: additionPicture([46275, 8163], 3) },
    { say: 'Thousands: 6 + 8 = 14. Write 4 and carry 1 to the ten thousands.', written: additionPicture([46275, 8163], 4) },
    { say: 'Ten thousands: 4, and the carried 1 makes 5. The answer is 54,438.', written: additionPicture([46275, 8163], 5) },
  ],
  generate(level, r) {
    if (level === 1) return columnAdd(r, [[10_000, 79_999], [1_000, 9_999]]);
    if (level === 2) return columnAdd(r, [[20_000, 499_999], [10_000, 499_999]]);
    return columnAdd(r, [[10_000, 320_000], [10_000, 320_000], [1_000, 320_000]]);
  },
};

// ---------- 2. Column subtraction ----------

function columnSubtract(r: Rng, a: number, b: number): Question {
  return {
    kind: 'column',
    op: '-',
    rows: [a, b],
    answer: a - b,
    prompt: 'Subtract. Start with the ones.',
    explain: subtractionWorking(a, b),
  };
}

const columnSubtraction: SkillContent = {
  id: 'add-subtract-2',
  example: [
    { say: 'Line the numbers up, with the bigger number on top.', show: `52,364 ${MINUS} 7,138`, written: subtractionPicture(52364, 7138, 0) },
    { say: 'Ones: 4 is less than 8, so exchange one ten for ten ones. Cross out the 6 and write 5 above it. Put a small 1 by the 4 to make 14. Then 14 take away 8 is 6.', written: subtractionPicture(52364, 7138, 1) },
    { say: 'Tens: there are 5 tens now. 5 take away 3 is 2.', written: subtractionPicture(52364, 7138, 2) },
    { say: 'Hundreds: 3 take away 1 is 2.', written: subtractionPicture(52364, 7138, 3) },
    { say: 'Thousands: 2 is less than 7, so exchange again. Cross out the 5 and write 4. Now it is 12 take away 7, which is 5.', written: subtractionPicture(52364, 7138, 4) },
    { say: 'Ten thousands: 4 take away nothing is 4. The answer is 45,226.', written: subtractionPicture(52364, 7138, 5) },
  ],
  generate(level, r) {
    if (level === 1) {
      const a = r.int(20_000, 99_999);
      return columnSubtract(r, a, r.int(1_000, 9_999));
    }
    if (level === 2) {
      const a = r.int(200_000, 999_999);
      return columnSubtract(r, a, r.int(10_000, a - 10_000));
    }
    // Greater depth: zeros on top, so the exchange has to pass through them.
    const a = r.int(2, 9) * r.pick([10_000, 100_000]) + r.int(0, 9) * r.pick([1, 10, 100]);
    return columnSubtract(r, a, r.int(1_111, a - 1_000));
  },
};

// ---------- 3. Adding and subtracting in your head ----------

function roundSteps(r: Rng): Question {
  const step = r.pick([1_000, 10_000]);
  const k = r.int(2, 8) * step;
  const add = r.next() < 0.5;
  const n = r.int(11, 89) * 1_000 + r.int(1, 9) * 100 + (add ? 0 : k);
  const answer = add ? n + k : n - k;
  return {
    kind: 'number',
    prompt: `Work this out in your head: ${fmt(n)} ${add ? '+' : MINUS} ${fmt(k)}`,
    answer,
    explain: [
      `${add ? 'Add' : 'Take away'} the ${step === 1_000 ? 'thousands' : 'ten thousands'}. The hundreds, tens and ones stay the same.`,
      `${fmt(n)} ${add ? '+' : MINUS} ${fmt(k)} = ${fmt(answer)}.`,
    ],
  };
}

function nearMultiple(r: Rng): Question {
  const base = r.pick([1_000, 2_000, 5_000, 10_000, 20_000]);
  const off = r.pick([1, 2, 10]);
  const k = base - off;
  const add = r.next() < 0.5;
  const n = r.int(base + 5_000, 480_000);
  const answer = add ? n + k : n - k;
  return {
    kind: 'number',
    prompt: `Work this out in your head: ${fmt(n)} ${add ? '+' : MINUS} ${fmt(k)}`,
    answer,
    explain: [
      `${fmt(k)} is ${off} less than ${fmt(base)}.`,
      `${add ? 'Add' : 'Take away'} ${fmt(base)}: ${fmt(add ? n + base : n - base)}.`,
      `That was ${off} too ${add ? 'many' : 'much taken'}, so ${add ? 'take' : 'add'} ${off} ${add ? 'off' : 'back'}: ${fmt(answer)}.`,
    ],
  };
}

function makeTheTotal(r: Rng): Question {
  const total = r.pick([10_000, 100_000, 1_000_000]);
  const unit = total / 100;
  const n = r.int(11, 98) * unit + (r.next() < 0.5 ? 0 : r.int(1, 9) * (unit / 10));
  const nextUnit = Math.ceil(n / (unit * 10)) * unit * 10;
  return {
    kind: 'number',
    prompt: `What must be added to ${fmt(n)} to make ${fmt(total)}?`,
    answer: total - n,
    explain: [
      ...(nextUnit > n ? [`Count up from ${fmt(n)} to ${fmt(nextUnit)}: that is ${fmt(nextUnit - n)}.`] : []),
      ...(nextUnit < total ? [`${nextUnit > n ? 'Then from' : 'Count up from'} ${fmt(nextUnit)} to ${fmt(total)}: that is ${fmt(total - nextUnit)}.`] : []),
      `Altogether: ${fmt(total - n)}.`,
    ],
  };
}

function partition(r: Rng): Question {
  const a = r.int(12, 88) * 1_000 + r.int(1, 9) * 100;
  const b = r.int(2, 9) * 1_000 + r.int(1, 9) * 100;
  const add = r.next() < 0.5;
  const n = add ? a : a + b;
  const answer = add ? a + b : a;
  const th = Math.floor(b / 1_000) * 1_000;
  const mid = add ? n + th : n - th;
  return {
    kind: 'number',
    prompt: `Work this out in your head: ${fmt(n)} ${add ? '+' : MINUS} ${fmt(b)}`,
    answer,
    explain: [
      `Split ${fmt(b)} into ${fmt(th)} and ${b - th}.`,
      `${fmt(n)} ${add ? '+' : MINUS} ${fmt(th)} = ${fmt(mid)}.`,
      `${fmt(mid)} ${add ? '+' : MINUS} ${b - th} = ${fmt(answer)}.`,
    ],
  };
}

const mentalMethods: SkillContent = {
  id: 'add-subtract-3',
  example: [
    { say: 'Big numbers can still be easy. Adding thousands only changes the thousands.', show: '23,500 + 4,000 = 27,500' },
    { say: 'You can split a number into parts and add one part at a time.', show: '46,200 + 3,800  =  46,200 + 3,000 + 800  =  50,000' },
    { say: 'For a number that is nearly round, use the round number and then fix it.', show: '45,672 + 9,999  =  45,672 + 10,000 − 1  =  55,671' },
  ],
  generate(level, r) {
    if (level === 1) return roundSteps(r);
    if (level === 2) return r.pick([() => partition(r), () => nearMultiple(r)])();
    return r.pick([() => makeTheTotal(r), () => nearMultiple(r)])();
  },
};

// ---------- 4. Estimating to check ----------

/** Two numbers that are not close to halfway, so the rounding is clear cut. */
function clearPair(r: Rng, p: number, lo: number, hi: number): [number, number] {
  const one = () => r.int(lo, hi) * p + r.pick([r.int(p / 20, (p * 7) / 20), r.int((p * 13) / 20, (p * 19) / 20)]);
  return [one(), one()];
}

function estimateByRounding(r: Rng): Question {
  const p = r.pick([1_000, 10_000]);
  let [a, b] = clearPair(r, p, 2, 8);
  const add = r.next() < 0.5;
  if (!add && roundTo(a, p) <= roundTo(b, p)) [a, b] = [b + 2 * p, a];
  const ra = roundTo(a, p), rb = roundTo(b, p);
  const answer = add ? ra + rb : ra - rb;
  return {
    kind: 'number',
    prompt: `Estimate ${fmt(a)} ${add ? '+' : MINUS} ${fmt(b)} by rounding each number to the nearest ${fmt(p)}.`,
    answer,
    explain: [
      `${fmt(a)} rounds to ${fmt(ra)}.`,
      `${fmt(b)} rounds to ${fmt(rb)}.`,
      `${fmt(ra)} ${add ? '+' : MINUS} ${fmt(rb)} = ${fmt(answer)}.`,
    ],
  };
}

function bestEstimate(r: Rng): Question {
  const p = r.pick([10_000, 100_000]);
  const [a, b] = clearPair(r, p, 1, 4);
  const est = roundTo(a, p) + roundTo(b, p);
  const options = r.shuffle([est, est + p * 2, est - p * 2 > 0 ? est - p * 2 : est + p * 4, est * 10]).map(fmt);
  return {
    kind: 'choice',
    prompt: `Which is the best estimate for ${fmt(a)} + ${fmt(b)}?`,
    options,
    answer: options.indexOf(fmt(est)),
    explain: [
      `Round each number to the nearest ${fmt(p)}.`,
      `${fmt(roundTo(a, p))} + ${fmt(roundTo(b, p))} = ${fmt(est)}.`,
    ],
  };
}

function sensibleAnswer(r: Rng): Question {
  const p = 10_000;
  let [a, b] = clearPair(r, p, 2, 8);
  const add = r.next() < 0.5;
  if (!add && roundTo(a, p) <= roundTo(b, p)) [a, b] = [b + 2 * p, a];
  const real = add ? a + b : a - b;
  const slip = r.pick([0, 0, 20_000, -20_000, 100_000]);
  const claimed = real + slip > 0 ? real + slip : real + 20_000;
  const off = claimed - real;
  const options = ['Yes, it is about right', 'No, it is far too big', 'No, it is far too small'];
  const est = add ? roundTo(a, p) + roundTo(b, p) : roundTo(a, p) - roundTo(b, p);
  const name = r.pick(['Sam', 'Aisha', 'Tom', 'Priya', 'Leo', 'Mei']);
  return {
    kind: 'choice',
    prompt: `${name} says ${fmt(a)} ${add ? '+' : MINUS} ${fmt(b)} = ${fmt(claimed)}. Use rounding to check. Is the answer sensible?`,
    options,
    answer: off === 0 ? 0 : off > 0 ? 1 : 2,
    explain: [
      `Round to the nearest 10,000: ${fmt(roundTo(a, p))} ${add ? '+' : MINUS} ${fmt(roundTo(b, p))} = ${fmt(est)}.`,
      off === 0
        ? `${fmt(claimed)} is close to ${fmt(est)}, so it is sensible.`
        : `${fmt(claimed)} is a long way ${off > 0 ? 'above' : 'below'} ${fmt(est)}, so something went wrong.`,
    ],
  };
}

const estimating: SkillContent = {
  id: 'add-subtract-4',
  example: [
    { say: 'An estimate is a quick, rough answer. It tells you if your real answer is sensible.', show: '48,729 + 31,240' },
    { say: 'Round each number to something easy.', show: '50,000 + 30,000' },
    { say: 'Add the rounded numbers. The real answer should be close to this.', show: 'about 80,000' },
    { say: 'If your written answer came out as 179,969, the estimate tells you to look again.' },
  ],
  generate(level, r) {
    if (level === 1) return estimateByRounding(r);
    if (level === 2) return r.pick([() => bestEstimate(r), () => estimateByRounding(r)])();
    return sensibleAnswer(r);
  },
};

// ---------- 5. Multi-step problems ----------

const h = (r: Rng, lo: number, hi: number, step: number) => r.int(lo / step, hi / step) * step;

function oneStep(r: Rng): Question {
  return r.pick([
    () => {
      const seats = h(r, 20_000, 80_000, 500);
      const sold = h(r, 5_000, seats - 2_000, 10);
      return {
        kind: 'number' as const,
        prompt: `A stadium has ${fmt(seats)} seats. ${fmt(sold)} tickets have been sold. How many seats are left?`,
        answer: seats - sold,
        explain: ['"Left" means take away.', `${fmt(seats)} ${MINUS} ${fmt(sold)} = ${fmt(seats - sold)}.`],
      };
    },
    () => {
      const a = h(r, 12_000, 60_000, 50);
      const b = h(r, 3_000, 30_000, 50);
      return {
        kind: 'number' as const,
        prompt: `A website had ${fmt(a)} visitors on Saturday and ${fmt(b)} on Sunday. How many visitors was that altogether?`,
        answer: a + b,
        explain: ['"Altogether" means add.', `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`],
      };
    },
    () => {
      const now = h(r, 30_000, 90_000, 100);
      const more = h(r, 2_000, 15_000, 100);
      return {
        kind: 'number' as const,
        prompt: `A town has ${fmt(now)} people. That is ${fmt(more)} more than ten years ago. How many people lived there ten years ago?`,
        answer: now - more,
        explain: ['There were fewer people before, so take away.', `${fmt(now)} ${MINUS} ${fmt(more)} = ${fmt(now - more)}.`],
      };
    },
  ])();
}

function twoStep(r: Rng): Question {
  return r.pick([
    () => {
      const start = h(r, 10_000, 40_000, 50);
      const a = h(r, 1_500, 4_500, 5);
      const b = h(r, 1_500, 4_500, 5);
      return {
        kind: 'number' as const,
        prompt: `A warehouse has ${fmt(start)} tins. It sends out ${fmt(a)} on Monday and ${fmt(b)} on Tuesday. How many tins are left?`,
        answer: start - a - b,
        explain: [
          `Find how many were sent: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
          `Take that from the start: ${fmt(start)} ${MINUS} ${fmt(a + b)} = ${fmt(start - a - b)}.`,
        ],
      };
    },
    () => {
      const may = h(r, 8_000, 30_000, 50);
      const extra = h(r, 1_000, 6_000, 50);
      return {
        kind: 'number' as const,
        prompt: `A charity raised £${fmt(may)} in May. In June it raised £${fmt(extra)} more than in May. How many pounds did it raise in the two months altogether?`,
        answer: may + may + extra,
        explain: [
          `June: ${fmt(may)} + ${fmt(extra)} = ${fmt(may + extra)}.`,
          `Both months: ${fmt(may)} + ${fmt(may + extra)} = ${fmt(may + may + extra)}.`,
        ],
      };
    },
    () => {
      const a = h(r, 15_000, 45_000, 100);
      const b = h(r, 15_000, 45_000, 100);
      const cap2 = a + b + h(r, 2_000, 9_000, 100);
      return {
        kind: 'number' as const,
        prompt: `A lorry can carry ${fmt(cap2)} kg. It is loaded with ${fmt(a)} kg of sand and ${fmt(b)} kg of gravel. How many more kilograms can it carry?`,
        answer: cap2 - a - b,
        explain: [
          `Load so far: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
          `Room left: ${fmt(cap2)} ${MINUS} ${fmt(a + b)} = ${fmt(cap2 - a - b)}.`,
        ],
      };
    },
  ])();
}

function harder(r: Rng): Question {
  return r.pick([
    () => {
      const a = h(r, 20_000, 60_000, 100);
      const more = h(r, 2_000, 9_000, 50);
      const fewer = h(r, 1_000, 8_000, 50);
      const total = a + (a + more) + (a - fewer);
      return {
        kind: 'number' as const,
        prompt: `Ashby has ${fmt(a)} people. Barton has ${fmt(more)} more people than Ashby. Corley has ${fmt(fewer)} fewer people than Ashby. How many people live in the three towns altogether?`,
        answer: total,
        explain: [
          `Barton: ${fmt(a)} + ${fmt(more)} = ${fmt(a + more)}.`,
          `Corley: ${fmt(a)} ${MINUS} ${fmt(fewer)} = ${fmt(a - fewer)}.`,
          `Altogether: ${fmt(a)} + ${fmt(a + more)} + ${fmt(a - fewer)} = ${fmt(total)}.`,
        ],
      };
    },
    () => {
      const a = h(r, 20_000, 60_000, 50);
      const total = a + h(r, 15_000, 39_000, 50);
      return {
        kind: 'number' as const,
        prompt: 'What is the missing number?',
        show: `${fmt(a)} + ? = ${fmt(total)}`,
        answer: total - a,
        explain: ['To find a missing part, take the part you know from the total.', `${fmt(total)} ${MINUS} ${fmt(a)} = ${fmt(total - a)}.`],
      };
    },
    () => {
      const diff = h(r, 4_000, 20_000, 100);
      const small = h(r, 10_000, 40_000, 100);
      const total = small + small + diff;
      return {
        kind: 'number' as const,
        prompt: `Two numbers add up to ${fmt(total)}. One number is ${fmt(diff)} bigger than the other. What is the smaller number?`,
        answer: small,
        explain: [
          `Take off the extra ${fmt(diff)}: ${fmt(total)} ${MINUS} ${fmt(diff)} = ${fmt(total - diff)}.`,
          `What is left is two equal parts, so halve it: ${fmt(small)}.`,
        ],
      };
    },
  ])();
}

const problems: SkillContent = {
  id: 'add-subtract-5',
  example: [
    { say: 'Read the whole problem first. Then ask: what do I need to find?', show: 'A shop has 12,450 tins. It sells 3,280 and then 4,115. How many are left?' },
    { say: 'Decide the steps. Here you can add up what was sold, then take that from the start.', show: '3,280 + 4,115 = 7,395' },
    { say: 'Do the second step.', show: `12,450 ${MINUS} 7,395 = 5,055` },
    { say: 'Check with an estimate: 12,000 take away 7,000 is 5,000. So 5,055 is sensible.' },
  ],
  generate(level, r) {
    if (level === 1) return oneStep(r);
    if (level === 2) return twoStep(r);
    return harder(r);
  },
};

export const ADD_SUBTRACT_SKILLS: SkillContent[] = [columnAddition, columnSubtraction, mentalMethods, estimating, problems];
