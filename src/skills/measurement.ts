// Unit 6: Measurement. All wording and questions are our own.
import { fmt } from '../engine/format';
import { barModel, cubes, lShape, placeChart, rectangle, scaleLine, table, type Picture } from '../engine/pictures';
import type { Rng } from '../engine/rng';
import type { NumberQuestion, Question, SkillContent } from '../engine/types';
import { dec } from './decimals-percentages';

const X = '×';
const DIV = '÷';
const MINUS = '−';
const SQ = '²';
const CU = '³';

const numQ = (prompt: string, answer: number, explain: string[], extra: Partial<NumberQuestion> = {}): NumberQuestion => ({
  kind: 'number', prompt, answer, explain, ...extra,
});

const choiceOf = (r: Rng, prompt: string, right: string, wrong: string[], explain: string[]): Question => {
  const options = r.shuffle([right, ...wrong]);
  return { kind: 'choice', prompt, options, answer: options.indexOf(right), explain };
};

const repeat = <T>(item: T, n: number): T[] => Array.from({ length: n }, () => item);

// ---------- 1. Metric units ----------

/** [bigger unit, smaller unit, how many small in one big] */
export const METRIC: [string, string, number][] = [
  ['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['litres', 'ml', 1000],
];

/** An amount in the bigger unit, written as a decimal, given the amount in the smaller unit. */
const inBig = (small: number, factor: number) => dec((small * 1000) / factor);

function toSmaller(r: Rng, decimal: boolean): Question {
  const [big, small, f] = r.pick(METRIC);
  // In small units. A decimal amount has one or two decimal places in the big unit.
  const amount = decimal ? r.int(11, 99) * (f / 10) + (f >= 100 && r.next() < 0.4 ? r.int(1, 9) * (f / 100) : 0) : r.int(2, 12) * f;
  return numQ('What is the missing number?', amount, [
    `1 ${big === 'litres' ? 'litre' : big} = ${fmt(f)} ${small}, so multiply by ${fmt(f)}.`,
    `${inBig(amount, f)} ${X} ${fmt(f)} = ${fmt(amount)}.`,
  ], { show: `${inBig(amount, f)} ${big} = ? ${small}`, unit: small });
}

function toBigger(r: Rng): Question {
  const [big, small, f] = r.pick(METRIC);
  const amount = r.next() < 0.3 ? r.int(2, 12) * f : r.int(11, 99) * (f / 10) + (f >= 100 && r.next() < 0.4 ? r.int(1, 9) * (f / 100) : 0);
  return numQ('What is the missing number?', amount / f, [
    `${fmt(f)} ${small} = 1 ${big === 'litres' ? 'litre' : big}, so divide by ${fmt(f)}.`,
    `${fmt(amount)} ${DIV} ${fmt(f)} = ${inBig(amount, f)}.`,
  ], { show: `${fmt(amount)} ${small} = ? ${big}`, unit: big, decimal: true });
}

function compareUnits(r: Rng): Question {
  const [big, small, f] = r.pick(METRIC);
  const a = r.int(11, 99) * (f / 10); // shown in the big unit
  let b: number;
  do b = a + r.pick([-1, 1]) * r.int(1, 9) * (f / 10) + (f >= 100 ? r.int(-4, 4) * (f / 100) : 0);
  while (b === a || b <= 0);
  const more = r.next() < 0.5;
  const word = big === 'kg' ? (more ? 'heavier' : 'lighter') : big === 'litres' ? (more ? 'more' : 'less') : more ? 'longer' : 'shorter';
  const textA = `${inBig(a, f)} ${big}`, textB = `${fmt(b)} ${small}`;
  const right = (a > b) === more ? textA : textB;
  return choiceOf(r, `Which is ${word}?`, right, [right === textA ? textB : textA], [
    `Change them into the same unit. ${textA} = ${fmt(a)} ${small}.`,
    `Compare ${fmt(a)} ${small} and ${fmt(b)} ${small}.`,
    `${right} is ${word}.`,
  ]);
}

function addMixedUnits(r: Rng): Question {
  const [big, small, f] = r.pick(METRIC.filter((m) => m[2] === 1000));
  const a = r.int(11, 49) * 100, b = r.int(2, 18) * 50;
  return numQ('What is the missing number?', a + b, [
    `Change ${inBig(a, f)} ${big} into ${small}: ${fmt(a)} ${small}.`,
    `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
  ], { show: `${inBig(a, f)} ${big} + ${fmt(b)} ${small} = ? ${small}`, unit: small });
}

const metric: SkillContent = {
  id: 'measurement-1',
  example: [
    { say: 'Metric units are linked by 10s, 100s and 1,000s. These are the links to learn.', pics: [table(['1 km', '1 m', '1 cm', '1 kg', '1 litre'], ['1,000 m', '100 cm', '10 mm', '1,000 g', '1,000 ml'], 'The links between metric units')] },
    { say: 'To change to a smaller unit you need more of them, so multiply. Kilometres to metres is times 1,000.', show: '3.2 km = 3,200 m', pics: [placeChart(['3.2', '3200'], { caption: 'Times 1,000: each digit moves three places to the left.' })] },
    { say: 'To change to a bigger unit you need fewer of them, so divide. Centimetres to metres is divide by 100.', show: '450 cm = 4.5 m', pics: [placeChart(['450', '4.5'], { caption: 'Divide by 100: each digit moves two places to the right.' })] },
    { say: 'Check that the answer makes sense. 450 cm should be between 4 m and 5 m.', pics: [scaleLine(0, 500, 50, [[0, '0 m'], [100, '1 m'], [200, '2 m'], [300, '3 m'], [400, '4 m'], [500, '5 m']], { points: [[450, '450 cm']] })] },
  ],
  generate(level, r) {
    if (level === 1) return toSmaller(r, false);
    if (level === 2) return r.next() < 0.5 ? toSmaller(r, true) : toBigger(r);
    return r.pick([() => compareUnits(r), () => addMixedUnits(r), () => toBigger(r)])();
  },
};

// ---------- 2. Imperial units ----------

/** [imperial unit, plural, metric unit, tenths of the metric unit in one imperial unit, the fact as a sentence] */
const IMPERIAL: [string, string, string, number, string][] = [
  ['inch', 'inches', 'cm', 25, '1 inch is about 2.5 cm.'],
  ['foot', 'feet', 'cm', 300, '1 foot is about 30 cm.'],
  ['mile', 'miles', 'km', 16, '1 mile is about 1.6 km.'],
];
/** [metric unit, imperial plural, tenths of the imperial unit in one metric unit, the fact] */
const TO_IMPERIAL: [string, string, number, string][] = [
  ['kg', 'pounds', 22, '1 kg is about 2.2 pounds.'],
];

function imperialToMetric(r: Rng, easy: boolean): Question {
  const [one, many, metricUnit, tenths, fact] = r.pick(IMPERIAL);
  // Even numbers keep inches and miles to whole answers at the first level.
  const n = easy ? r.pick([2, 4, 6, 8, 10]) : r.int(3, 12);
  const answer = (n * tenths) / 10;
  return numQ(`${fact} About how many ${metricUnit} is ${n} ${n === 1 ? one : many}?`, answer, [
    `Each ${one} is about ${tenths / 10} ${metricUnit}, so multiply by ${tenths / 10}.`,
    `${n} ${X} ${tenths / 10} = ${answer}.`,
  ], { unit: metricUnit, decimal: !Number.isInteger(answer) });
}

function metricToImperial(r: Rng): Question {
  if (r.next() < 0.5) {
    const [metricUnit, many, tenths, fact] = r.pick(TO_IMPERIAL);
    const n = r.pick([5, 10, 15, 20, 25, 30]);
    return numQ(`${fact} About how many ${many} is ${n} ${metricUnit}?`, (n * tenths) / 10, [
      `Each ${metricUnit} is about ${tenths / 10} ${many}, so multiply by ${tenths / 10}.`,
      `${n} ${X} ${tenths / 10} = ${(n * tenths) / 10}.`,
    ], { unit: many });
  }
  const [one, many, metricUnit, tenths, fact] = r.pick(IMPERIAL);
  const n = r.int(2, 12);
  const amount = (n * tenths) / 10;
  return numQ(`${fact} About how many ${many} is ${amount} ${metricUnit}?`, n, [
    `Each ${one} is about ${tenths / 10} ${metricUnit}, so divide by ${tenths / 10}.`,
    `${amount} ${DIV} ${tenths / 10} = ${n}.`,
  ], { unit: many });
}

function imperialChoice(r: Rng): Question {
  const [prompt, right, wrong] = r.pick<[string, string, string[]]>([
    ['Which is about the same as 1 pint?', 'a bit more than half a litre', ['2 litres', '10 ml', '5 litres']],
    ['Which is about the same as 1 pound?', 'a bit less than half a kilogram', ['2 kg', '10 g', '5 kg']],
    ['Which is about the same as 1 inch?', '2.5 cm', ['25 cm', '1 mm', '1 m']],
    ['Which is about the same as 1 foot?', '30 cm', ['3 cm', '3 m', '300 m']],
    ['Which is about the same as 1 mile?', '1.6 km', ['16 km', '160 m', '100 km']],
  ]);
  return choiceOf(r, prompt, right, wrong, ['These are worth learning: 1 inch is about 2.5 cm, 1 foot about 30 cm, 1 mile about 1.6 km.', 'A pound is a bit less than half a kilogram, and a pint is a bit more than half a litre.', `The answer is ${right}.`]);
}

const imperial: SkillContent = {
  id: 'measurement-2',
  example: [
    { say: 'Imperial units are older units that are still used for some things, such as miles on road signs and pints of milk.', pics: [table(['1 inch', '1 foot', '1 mile', '1 pound', '1 pint'], ['2.5 cm', '30 cm', '1.6 km', '0.45 kg', '0.57 litres'], 'Imperial units and roughly what they equal in metric units', 'Each one is only roughly equal, so say "about".')] },
    { say: 'To change inches into centimetres, multiply by 2.5.', show: `6 inches is about 6 ${X} 2.5 = 15 cm`, pics: [barModel([repeat(['1 inch', 1] as [string, number], 6), [['15 cm', 6, true]]], 'Six inches side by side, the same length as 15 cm')] },
    { say: 'A kilogram is about 2.2 pounds. Multiply to change kilograms into pounds.', show: `5 kg is about 5 ${X} 2.2 = 11 pounds`, pics: [barModel([repeat(['1 kg', 1] as [string, number], 5), repeat(['2.2 lb', 1] as [string, number], 5)], 'Five kilograms, each matched by 2.2 pounds')] },
    { say: 'These are only roughly equal, so say "about". To go back the other way, divide.', show: `8 km is about 8 ${DIV} 1.6 = 5 miles`, pics: [scaleLine(0, 8, 0.8, [[0, '0'], [1.6, '1 mile'], [3.2, '2'], [4.8, '3'], [6.4, '4'], [8, '5 miles']], { points: [[8, '8 km']], alt: 'A line showing that 5 miles reach as far as 8 km' })] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.6 ? imperialToMetric(r, true) : imperialChoice(r);
    if (level === 2) return r.next() < 0.7 ? imperialToMetric(r, false) : imperialChoice(r);
    return metricToImperial(r);
  },
};

// ---------- 3. Perimeter ----------

/** A scale that keeps big rectangles a sensible size on screen. */
const fit = (w: number, h: number) => Math.min(1, 9 / Math.max(w, h));

function rectanglePerimeter(r: Rng, big: boolean): Question {
  const unit = big ? 'm' : 'cm';
  let w: number, h: number;
  do { w = big ? r.int(12, 45) : r.int(3, 12); h = big ? r.int(6, 30) : r.int(2, 9); } while (h >= w);
  return numQ('Find the perimeter of this rectangle.', 2 * (w + h), [
    'The perimeter is the distance all the way round.',
    `Add the length and the width: ${w} + ${h} = ${w + h}.`,
    `There are two of each, so double it: ${w + h} ${X} 2 = ${2 * (w + h)} ${unit}.`,
  ], { unit, pics: [rectangle(w, h, `${w} ${unit}`, `${h} ${unit}`, { scale: fit(w, h) })] });
}

function missingSide(r: Rng): Question {
  let w: number, h: number;
  do { w = r.int(5, 20); h = r.int(2, 12); } while (h >= w);
  const p = 2 * (w + h);
  return numQ(`The perimeter of this rectangle is ${p} cm. How long is the side marked with a question mark?`, h, [
    `Half of the perimeter is one length and one width: ${p} ${DIV} 2 = ${p / 2}.`,
    `Take away the side you know: ${p / 2} ${MINUS} ${w} = ${h} cm.`,
  ], { unit: 'cm', pics: [rectangle(w, h, `${w} cm`, '?', { scale: fit(w, h) })] });
}

/** An L shape small enough to draw to scale: overall w by h with a cw by ch corner missing. */
function randomL(r: Rng): { w: number; h: number; cw: number; ch: number } {
  const w = r.int(5, 10), h = r.int(4, 8);
  return { w, h, cw: r.int(2, w - 2), ch: r.int(1, h - 2) };
}

function lPerimeter(r: Rng, hidden: boolean): Question {
  const { w, h, cw, ch } = randomL(r);
  const sides = [w, h, w - cw, ch, cw, h - ch];
  const texts = sides.map((s) => `${s} cm`);
  // At the harder level the two short sides have to be worked out.
  if (hidden) { texts[4] = '?'; texts[5] = '?'; }
  const total = 2 * (w + h);
  return numQ('Find the perimeter of this shape.', total, [
    ...(hidden ? [`Find the missing sides first. Across: ${w} ${MINUS} ${w - cw} = ${cw} cm. Down: ${h} ${MINUS} ${ch} = ${h - ch} cm.`] : []),
    `Add all six sides: ${sides.join(' + ')} = ${total} cm.`,
  ], { unit: 'cm', pics: [lShape(w, h, cw, ch, texts)] });
}

const perimeter: SkillContent = {
  id: 'measurement-3',
  example: [
    { say: 'The perimeter of a shape is the distance all the way round its edge.', pics: [rectangle(6, 3, '6 cm', '3 cm')] },
    { say: 'A rectangle has two lengths and two widths. Add all four sides.', show: '6 + 3 + 6 + 3 = 18 cm', pics: [rectangle(6, 3, '6 cm', '3 cm', { caption: 'The top is also 6 cm and the right side is also 3 cm.' })] },
    { say: 'A quicker way: add the length and the width, then double.', show: `(6 + 3) ${X} 2 = 18 cm`, pics: [barModel([[['6', 6], ['3', 3], ['6', 6], ['3', 3]], [['18 cm', 18, true]]], 'The four sides laid end to end make 18 cm')] },
    { say: 'For an L shape, find any missing sides first. The two short tops add up to the bottom, so the missing top is 6 − 4 = 2 cm. The missing side is 5 − 2 = 3 cm.', show: '6 + 5 + 4 + 2 + 2 + 3 = 22 cm', pics: [lShape(6, 5, 2, 2, ['6 cm', '5 cm', '4 cm', '2 cm', '?', '?'])] },
  ],
  generate(level, r) {
    if (level === 1) return rectanglePerimeter(r, false);
    if (level === 2) return r.pick([() => rectanglePerimeter(r, true), () => lPerimeter(r, false), () => missingSide(r)])();
    return r.next() < 0.7 ? lPerimeter(r, true) : missingSide(r);
  },
};

// ---------- 4. Area ----------

function countSquares(r: Rng): Question {
  const w = r.int(3, 8), h = r.int(2, 5);
  return numQ('Each square is 1 cm². What is the area of this rectangle?', w * h, [
    `There are ${h} rows of ${w} squares.`,
    `${w} ${X} ${h} = ${w * h} cm${SQ}.`,
  ], { unit: `cm${SQ}`, pics: [rectangle(w, h, `${w} cm`, `${h} cm`, { squares: true })] });
}

function rectangleArea(r: Rng): Question {
  const big = r.next() < 0.5;
  const unit = big ? 'm' : 'cm';
  const w = r.int(6, 25), h = r.int(3, 12);
  const [a, b] = w >= h ? [w, h] : [h, w];
  return numQ('Find the area of this rectangle.', a * b, [
    'Area of a rectangle = length times width.',
    `${a} ${X} ${b} = ${a * b} ${unit}${SQ}.`,
  ], { unit: `${unit}${SQ}`, pics: [rectangle(a, b, `${a} ${unit}`, `${b} ${unit}`, { scale: fit(a, b) })] });
}

function missingLength(r: Rng): Question {
  const h = r.int(3, 9), w = r.int(h + 1, 15);
  return numQ(`The area of this rectangle is ${w * h} cm${SQ}. How long is the side marked with a question mark?`, w, [
    'Area = length times width, so divide the area by the side you know.',
    `${w * h} ${DIV} ${h} = ${w} cm.`,
  ], { unit: 'cm', pics: [rectangle(w, h, '?', `${h} cm`, { scale: fit(w, h) })] });
}

function lArea(r: Rng): Question {
  const { w, h, cw, ch } = randomL(r);
  const top = (w - cw) * ch, bottom = w * (h - ch);
  return numQ('Find the area of this shape. The dashed line splits it into two rectangles.', top + bottom, [
    `Top rectangle: ${w - cw} ${X} ${ch} = ${top} cm${SQ}.`,
    `Bottom rectangle: ${w} ${X} ${h - ch} = ${bottom} cm${SQ}.`,
    `Add them: ${top} + ${bottom} = ${top + bottom} cm${SQ}.`,
  ], { unit: `cm${SQ}`, pics: [lShape(w, h, cw, ch, [`${w} cm`, '', `${w - cw} cm`, `${ch} cm`, '', `${h - ch} cm`], { cut: true })] });
}

const area: SkillContent = {
  id: 'measurement-4',
  example: [
    { say: 'Area is the amount of surface a shape covers. It is measured in squares, such as square centimetres.', show: `1 cm${SQ}`, pics: [rectangle(1, 1, '1 cm', '1 cm', { squares: true })] },
    { say: 'To find the area of a rectangle, count the squares. Here there are 3 rows of 5.', pics: [rectangle(5, 3, '5 cm', '3 cm', { squares: true })] },
    { say: 'Counting is slow. Multiply the length by the width instead.', show: `5 ${X} 3 = 15 cm${SQ}`, pics: [rectangle(5, 3, '5 cm', '3 cm', { squares: true, caption: 'Area of a rectangle = length times width' })] },
    { say: 'For an L shape, split it into two rectangles, find each area, then add.', show: `(4 ${X} 2) + (6 ${X} 3) = 8 + 18 = 26 cm${SQ}`, pics: [lShape(6, 5, 2, 2, ['6 cm', '', '4 cm', '2 cm', '', '3 cm'], { cut: true, squares: true })] },
  ],
  generate(level, r) {
    if (level === 1) return countSquares(r);
    if (level === 2) return r.next() < 0.65 ? rectangleArea(r) : missingLength(r);
    return r.next() < 0.7 ? lArea(r) : missingLength(r);
  },
};

// ---------- 5. Volume and capacity ----------

function countCubes(r: Rng, layers: boolean): Question {
  const wide = r.int(2, 5), deep = r.int(2, 4), high = layers ? r.int(2, 4) : 1;
  return numQ(`Each cube is 1 cm${CU}. What is the volume of this block?`, wide * deep * high, [
    `One layer has ${deep} rows of ${wide} cubes: ${wide} ${X} ${deep} = ${wide * deep}.`,
    high > 1 ? `There are ${high} layers: ${wide * deep} ${X} ${high} = ${wide * deep * high} cm${CU}.` : `There is one layer, so the volume is ${wide * deep} cm${CU}.`,
  ], { unit: `cm${CU}`, pics: [cubes(wide, deep, high)] });
}

function capacity(r: Rng): Question {
  const cup = r.pick([100, 200, 250, 500]);
  const litres = r.pick([1, 2, 3, 4, 5]);
  const type = r.int(1, 2);
  if (type === 1) {
    return numQ(`A jug holds ${litres} ${litres === 1 ? 'litre' : 'litres'}. How many ${cup} ml cups can it fill?`, (litres * 1000) / cup, [
      `Change the litres into millilitres: ${litres} ${X} 1,000 = ${fmt(litres * 1000)} ml.`,
      `${fmt(litres * 1000)} ${DIV} ${cup} = ${(litres * 1000) / cup}.`,
    ], { unit: 'cups' });
  }
  const n = r.int(2, 9);
  const used = n * cup;
  const start = Math.ceil((used + 100) / 1000) * 1000;
  return numQ(`A tank holds ${start / 1000} ${start === 1000 ? 'litre' : 'litres'} of water. ${n} cups of ${cup} ml are poured out. How many millilitres are left?`, start - used, [
    `Poured out: ${n} ${X} ${cup} = ${fmt(used)} ml.`,
    `The tank started with ${fmt(start)} ml. ${fmt(start)} ${MINUS} ${fmt(used)} = ${fmt(start - used)} ml.`,
  ], { unit: 'ml' });
}

const volume: SkillContent = {
  id: 'measurement-5',
  example: [
    { say: 'Volume is the amount of space a solid shape takes up. It is measured in cubes, such as cubic centimetres.', show: `1 cm${CU}`, pics: [cubes(1, 1, 1)] },
    { say: 'Build one layer first. This layer has 3 rows of 4 cubes.', show: `4 ${X} 3 = 12 cm${CU}`, pics: [cubes(4, 3, 1)] },
    { say: 'Now stack the layers. Two layers of 12 make 24.', show: `12 ${X} 2 = 24 cm${CU}`, pics: [cubes(4, 3, 2)] },
    { say: 'Capacity is how much a container holds. It is measured in litres and millilitres. A 1 litre jug fills four 250 ml cups.', show: `1,000 ml ${DIV} 250 ml = 4`, pics: [barModel([[['1 litre = 1,000 ml', 4]], repeat(['250 ml', 1] as [string, number], 4)], 'One litre split into four cups of 250 ml')] },
  ],
  generate(level, r) {
    if (level === 1) return countCubes(r, false);
    if (level === 2) return countCubes(r, true);
    return r.next() < 0.6 ? capacity(r) : countCubes(r, true);
  },
};

// ---------- 6. Time ----------

/** [bigger unit, plural, smaller unit plural, how many small in one big] */
export const TIME_UNITS: [string, string, string, number][] = [
  ['minute', 'minutes', 'seconds', 60], ['hour', 'hours', 'minutes', 60], ['day', 'days', 'hours', 24], ['week', 'weeks', 'days', 7],
];

export const clockText = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const span = (m: number) => {
  const h = Math.floor(m / 60), rest = m % 60;
  return [h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '', rest ? `${rest} minutes` : ''].filter(Boolean).join(' ');
};

function convertTime(r: Rng): Question {
  const [, many, small, f] = r.pick(TIME_UNITS);
  const n = r.int(2, 9);
  return numQ(`How many ${small} are there in ${n} ${many}?`, n * f, [
    `There are ${f} ${small} in 1 ${many.slice(0, -1)}.`,
    `${n} ${X} ${f} = ${n * f}.`,
  ], { unit: small });
}

function hoursAndMinutes(r: Rng): Question {
  const h = r.int(1, 5), m = r.int(1, 11) * 5;
  if (r.next() < 0.5) {
    return numQ(`How many minutes is ${h} ${h === 1 ? 'hour' : 'hours'} ${m} minutes?`, h * 60 + m, [
      `${h} ${h === 1 ? 'hour' : 'hours'} is ${h} ${X} 60 = ${h * 60} minutes.`,
      `${h * 60} + ${m} = ${h * 60 + m} minutes.`,
    ], { unit: 'minutes' });
  }
  return numQ('What is the missing number?', m, [
    `${h} ${h === 1 ? 'hour' : 'hours'} is ${h * 60} minutes. Another hour would be too many.`,
    `${h * 60 + m} ${MINUS} ${h * 60} = ${m} minutes left over.`,
  ], { show: `${h * 60 + m} minutes = ${h} ${h === 1 ? 'hour' : 'hours'} and ? minutes`, unit: 'minutes' });
}

/** A number line of clock times with a jump to the next hour, whole hours, then the rest. */
function journeyLine(start: number, end: number): Picture {
  const nextHour = Math.ceil(start / 60) * 60, lastHour = Math.floor(end / 60) * 60;
  const stops = [...new Set([start, nextHour, lastHour, end])].filter((t) => t >= start && t <= end).sort((a, b) => a - b);
  const jumps: [number, number, string][] = stops.slice(1).map((t, i) => [stops[i], t, `+${span(t - stops[i]).replace('minutes', 'min')}`]);
  const from = Math.floor(start / 30) * 30, to = Math.ceil(end / 30) * 30;
  return scaleLine(from, to, 15, stops.map((t) => [t, clockText(t)]), { jumps, alt: `A time line from ${clockText(start)} to ${clockText(end)}` });
}

function interval(r: Rng): Question {
  const start = r.int(7, 18) * 60 + r.int(1, 11) * 5;
  const length = r.int(1, 3) * 60 + r.int(1, 11) * 5;
  const end = start + length;
  const nextHour = Math.ceil(start / 60) * 60, lastHour = Math.floor(end / 60) * 60;
  const working = [
    `Count on from ${clockText(start)} to the next hour, ${clockText(nextHour)}: ${nextHour - start} minutes.`,
    ...(lastHour > nextHour ? [`From ${clockText(nextHour)} to ${clockText(lastHour)}: ${lastHour - nextHour} minutes.`] : []),
    ...(end > lastHour ? [`From ${clockText(lastHour)} to ${clockText(end)}: ${end - lastHour} minutes.`] : []),
  ];
  if (r.next() < 0.5) {
    return numQ(`A film starts at ${clockText(start)} and ends at ${clockText(end)}. How many minutes long is it?`, length, [
      ...working,
      `Add the jumps: ${length} minutes.`,
    ], { unit: 'minutes', pics: [scaleLine(Math.floor(start / 30) * 30, Math.ceil(end / 30) * 30, 30, [[start, clockText(start)], [end, clockText(end)]], { alt: `A time line from ${clockText(start)} to ${clockText(end)}` })] });
  }
  const wrong = [...new Set([end + 60, end - 60, end + 10, end - 10, start + length - (length % 60) + 60])].filter((t) => t !== end).slice(0, 3);
  return choiceOf(r, `A train leaves at ${clockText(start)}. The journey takes ${span(length)}. What time does it arrive?`, clockText(end), wrong.map(clockText), [
    `Add the hours first: ${clockText(start)} + ${Math.floor(length / 60)} ${length >= 120 ? 'hours' : 'hour'} = ${clockText(start + Math.floor(length / 60) * 60)}.`,
    `Then add the ${length % 60} minutes: ${clockText(end)}.`,
  ]);
}

const time: SkillContent = {
  id: 'measurement-6',
  example: [
    { say: 'Time does not work in 10s and 100s. These are the links to learn.', pics: [table(['1 minute', '1 hour', '1 day', '1 week', '1 year'], ['60 seconds', '60 minutes', '24 hours', '7 days', '365 days'], 'The links between units of time')] },
    { say: 'To change hours into minutes, multiply by 60.', show: `3 hours = 3 ${X} 60 = 180 minutes`, pics: [barModel([repeat(['1 hour', 1] as [string, number], 3), repeat(['60 min', 1] as [string, number], 3)], 'Three hours, each matched by 60 minutes')] },
    { say: 'To change minutes into hours and minutes, take out as many 60s as you can.', show: '135 minutes = 2 hours 15 minutes', pics: [barModel([[['135 minutes', 135]], [['60 min', 60], ['60 min', 60], ['15 min', 15, true]]], '135 minutes split into two lots of 60 minutes and 15 minutes left over')] },
    { say: 'To find how long something lasts, count on in jumps: to the next hour, then whole hours, then the minutes left.', show: '30 + 60 + 35 = 125 minutes', pics: [journeyLine(14 * 60 + 30, 16 * 60 + 35)] },
  ],
  generate(level, r) {
    if (level === 1) return convertTime(r);
    if (level === 2) return hoursAndMinutes(r);
    return interval(r);
  },
};

// ---------- 7. Measure and money problems ----------

const pounds = (pence: number) => `£${(pence / 100).toFixed(2)}`;
const moneyQ = (prompt: string, pence: number, explain: string[]): NumberQuestion => numQ(prompt, pence / 100, explain, { decimal: true, money: true });

function bagsProblem(r: Rng): Question {
  const each = r.pick([250, 500, 750, 1200, 1500, 2500]);
  const n = r.int(2, 6);
  return numQ(`A bag of apples weighs ${inBig(each, 1000)} kg. How many grams do ${n} bags weigh?`, each * n, [
    `Change to grams first: ${inBig(each, 1000)} kg = ${fmt(each)} g.`,
    `${fmt(each)} ${X} ${n} = ${fmt(each * n)} g.`,
  ], { unit: 'g' });
}

function totalCost(r: Rng): Question {
  const each = r.int(11, 49) * 5, n = r.int(2, 6);
  const thing = r.pick(['notebook', 'pen', 'comic', 'drink']);
  return moneyQ(`One ${thing} costs ${pounds(each)}. How much do ${n} ${thing}s cost?`, each * n, [
    `Work in pence: ${each} ${X} ${n} = ${fmt(each * n)}p.`,
    `${fmt(each * n)}p is ${pounds(each * n)}.`,
  ]);
}

function cutting(r: Rng): Question {
  const n = r.pick([4, 5, 6, 8]);
  const piece = r.int(2, 9) * 5; // cm
  const total = n * piece;
  return numQ(`A ribbon is ${inBig(total, 100)} m long. It is cut into ${n} equal pieces. How long is each piece, in centimetres?`, piece, [
    `Change to centimetres first: ${inBig(total, 100)} m = ${total} cm.`,
    `${total} ${DIV} ${n} = ${piece} cm.`,
  ], { unit: 'cm' });
}

function change(r: Rng): Question {
  const each = r.int(11, 39) * 5, n = r.int(2, 4);
  const note = each * n < 500 ? 500 : 1000;
  const thing = r.pick(['poster', 'ticket', 'magazine']);
  return moneyQ(`Sam buys ${n} ${thing}s at ${pounds(each)} each and pays with a £${note / 100} note. How much change does Sam get?`, note - each * n, [
    `Cost: ${each}p ${X} ${n} = ${fmt(each * n)}p, which is ${pounds(each * n)}.`,
    `Change: ${pounds(note)} ${MINUS} ${pounds(each * n)} = ${pounds(note - each * n)}.`,
  ]);
}

function flour(r: Rng): Question {
  const bag = r.pick([1500, 2000, 3000]);
  const each = r.pick([150, 250, 350, 450]);
  const n = r.int(2, Math.min(6, Math.floor((bag - 100) / each)));
  return numQ(`A bag holds ${inBig(bag, 1000)} kg of flour. Each loaf uses ${each} g. How many grams are left after ${n} loaves?`, bag - each * n, [
    `Flour used: ${each} ${X} ${n} = ${fmt(each * n)} g.`,
    `The bag held ${fmt(bag)} g. ${fmt(bag)} ${MINUS} ${fmt(each * n)} = ${fmt(bag - each * n)} g.`,
  ], { unit: 'g' });
}

const problems: SkillContent = {
  id: 'measurement-7',
  example: [
    { say: 'In a measure problem, get everything into the same unit before you calculate.', show: 'A ribbon is 2.4 m long. It is cut into 6 equal pieces. How long is each piece?', pics: [barModel([[['2.4 m = 240 cm', 6]], repeat(['?', 1] as [string, number], 6)], 'A ribbon of 240 cm cut into six equal pieces')] },
    { say: 'Centimetres are easier here, so change 2.4 m into 240 cm. Then divide.', show: `240 ${DIV} 6 = 40 cm`, pics: [barModel([[['240 cm', 6]], [['40', 1, true], ...repeat(['40', 1] as [string, number], 5)]], '240 cm split into six pieces of 40 cm')] },
    { say: 'Money works the same way. Working in pence avoids mistakes with the decimal point.', show: `3 notebooks at £1.35 each: 135 ${X} 3 = 405p = £4.05`, pics: [barModel([repeat(['£1.35', 1] as [string, number], 3), [['£4.05', 3, true]]], 'Three notebooks at £1.35 make £4.05')] },
    { say: 'For change, take the cost away from the money handed over.', show: `£10.00 ${MINUS} £4.05 = £5.95`, pics: [barModel([[['£10.00', 1000]], [['£4.05 spent', 405], ['£5.95 change', 595, true]]], 'A ten pound note split into £4.05 spent and £5.95 change')] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? bagsProblem(r) : totalCost(r);
    if (level === 2) return r.pick([() => cutting(r), () => totalCost(r), () => bagsProblem(r)])();
    return r.next() < 0.5 ? change(r) : flour(r);
  },
};

export const MEASUREMENT_SKILLS: SkillContent[] = [metric, imperial, perimeter, area, volume, time, problems];
