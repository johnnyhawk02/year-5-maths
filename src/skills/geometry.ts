// Unit 7: Geometry. All wording and questions are our own.
import { angle, anglesAround, coords, polygon, table, type AnglePicture, type DrawingPicture, type Picture, type ShapePicture } from '../engine/pictures';
import type { Rng } from '../engine/rng';
import { SOLIDS, solid, type Solid } from '../engine/solids';
import type { NumberQuestion, Question, SkillContent } from '../engine/types';

const X = '×';
const DIV = '÷';
const MINUS = '−';
const DEG = '°';

const numQ = (prompt: string, answer: number, explain: string[], extra: Partial<NumberQuestion> = {}): NumberQuestion => ({
  kind: 'number', prompt, answer, explain, ...extra,
});

/** A choice question. Options are shuffled unless `fixed` keeps them in the order given (right answer first is then not assumed). */
const choiceOf = (r: Rng, prompt: string, right: string, wrong: string[], explain: string[], pics?: Picture[]): Question => {
  const options = r.shuffle([right, ...wrong]);
  return { kind: 'choice', prompt, options, answer: options.indexOf(right), explain, pics };
};

/** A choice question whose options stay in a set order. */
const fixedChoice = (prompt: string, options: string[], right: string, explain: string[], pics?: Picture[]): Question => ({
  kind: 'choice', prompt, options, answer: options.indexOf(right), explain, pics,
});

// ---------- 1. 3-D shapes ----------

const FLAT = SOLIDS.filter((s) => s.flat);
const withNets = SOLIDS.filter((s) => s.net);
const a = (name: string) => (/^[aeiou]/.test(name) ? `an ${name}` : `a ${name}`);

const describeSolid = (s: Solid) => `${a(s.name)} has ${s.faces} faces, ${s.edges} edges and ${s.vertices} vertices`;

function nameSolid(r: Rng): Question {
  const s = r.pick(SOLIDS);
  const wrong = r.shuffle(SOLIDS.filter((o) => o !== s)).slice(0, 3).map((o) => o.name);
  return choiceOf(r, 'What is this 3-D shape called?', s.name, wrong, [
    s.flat ? `Count the faces: there are ${s.faces}. Look at their shapes.` : 'Look for flat faces and curved surfaces.',
    `It is ${a(s.name)}.`,
  ], [s.picture]);
}

function countParts(r: Rng, picture: boolean): Question {
  const s = r.pick(FLAT);
  const [word, n, hint] = r.pick<[string, number, string]>([
    ['faces', s.faces, 'A face is a flat surface.'],
    ['edges', s.edges, 'An edge is a line where two faces meet. The dashed lines are edges at the back.'],
    ['vertices', s.vertices, 'A vertex is a corner, where edges meet.'],
  ]);
  return numQ(`How many ${word} does ${a(s.name)} have?`, n, [hint, `${describeSolid(s)[0].toUpperCase()}${describeSolid(s).slice(1)}.`], picture ? { pics: [s.picture] } : {});
}

function nameNet(r: Rng): Question {
  const s = r.pick(withNets);
  const wrong = withNets.filter((o) => o !== s).map((o) => o.name);
  const shapes = s.name === 'cube' ? '6 squares' : s.name === 'cuboid' ? '6 rectangles' : s.name === 'square-based pyramid' ? '1 square and 4 triangles' : s.name === 'triangular prism' ? '3 rectangles and 2 triangles' : '4 triangles';
  return choiceOf(r, 'This net is folded up. Which 3-D shape does it make?', s.name, r.shuffle(wrong).slice(0, 3), [
    `The net has ${shapes}. Each one becomes a face.`,
    `It folds into ${a(s.name)}.`,
  ], [s.net!]);
}

function whichSolid(r: Rng): Question {
  // Cubes and cuboids have the same counts, so only one of them is offered.
  const drop = r.pick(['cube', 'cuboid']);
  const pool = r.shuffle(FLAT.filter((s) => s.name !== drop)).slice(0, 4);
  const s = pool[0];
  return choiceOf(r, `Which shape has ${s.faces} faces, ${s.edges} edges and ${s.vertices} vertices?`, s.name, pool.slice(1).map((o) => o.name), [
    'Picture each shape and count its faces first.',
    `${describeSolid(s)[0].toUpperCase()}${describeSolid(s).slice(1)}.`,
  ]);
}

const solids: SkillContent = {
  id: 'geometry-1',
  example: [
    { say: 'A 3-D shape has faces, edges and vertices. A face is a flat surface. An edge is where two faces meet. A vertex is a corner.', pics: [{ ...solid('cube').picture, caption: 'A cube. The dashed lines are the edges you cannot see from the front.' }] },
    { say: 'Count them in order so none are missed. A cube has 6 faces, 12 edges and 8 vertices.', show: '6 faces, 12 edges, 8 vertices', pics: [table(['Faces', 'Edges', 'Vertices'], ['6', '12', '8'], 'A cube has 6 faces, 12 edges and 8 vertices')] },
    { say: 'A prism has the same shape at both ends, all the way through. A pyramid has a base and triangles that meet at a point.', pics: [{ ...solid('triangular prism').picture, caption: 'Triangular prism' }, { ...solid('square-based pyramid').picture, caption: 'Square-based pyramid' }] },
    { say: 'Some 3-D shapes have curved surfaces. A cylinder has two flat circles and one curved surface. A cone has one flat circle and comes to a point.', pics: [{ ...solid('cylinder').picture, caption: 'Cylinder' }, { ...solid('cone').picture, caption: 'Cone' }] },
    { say: 'A net is a 3-D shape opened out flat. Count the shapes in the net to work out what it folds into. Six squares fold into a cube.', pics: [{ ...solid('cube').net!, caption: 'The net of a cube' }, { ...solid('cube').picture, caption: 'Folded up' }] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.6 ? nameSolid(r) : countParts(r, true);
    if (level === 2) return r.next() < 0.5 ? countParts(r, true) : nameNet(r);
    const p = r.next();
    return p < 0.4 ? whichSolid(r) : p < 0.7 ? countParts(r, false) : nameNet(r);
  },
};

// ---------- 2. Types of angle ----------

export const ANGLE_TYPES = ['Acute', 'Right angle', 'Obtuse', 'Straight line', 'Reflex'];

export const angleType = (size: number): string => (size < 90 ? 'Acute' : size === 90 ? 'Right angle' : size < 180 ? 'Obtuse' : size === 180 ? 'Straight line' : 'Reflex');

const whyType = (size: number): string => {
  const t = angleType(size);
  if (t === 'Acute') return 'It is less than a right angle (90°), so it is acute.';
  if (t === 'Right angle') return 'It is exactly a quarter turn (90°), so it is a right angle.';
  if (t === 'Obtuse') return 'It is more than a right angle (90°) but less than a straight line (180°), so it is obtuse.';
  if (t === 'Straight line') return 'It is exactly a half turn (180°), so it makes a straight line.';
  return 'It is more than a straight line (180°), so it is reflex.';
};

/** An angle size of a random type, kept clear of the borders so the picture is easy to read. */
function anySize(r: Rng, types: string[]): number {
  const t = r.pick(types);
  if (t === 'Acute') return r.int(4, 14) * 5;
  if (t === 'Right angle') return 90;
  if (t === 'Obtuse') return r.int(22, 33) * 5;
  if (t === 'Straight line') return 180;
  return r.int(40, 66) * 5;
}

function typeFromPicture(r: Rng, labelled: boolean): Question {
  const size = anySize(r, labelled ? ANGLE_TYPES : ['Acute', 'Right angle', 'Obtuse', 'Reflex', 'Acute', 'Obtuse']);
  const start = size > 180 ? 0 : r.pick([0, 0, 10, 20]);
  const options = labelled ? ANGLE_TYPES : ANGLE_TYPES.filter((t) => t !== 'Straight line');
  const pic: AnglePicture = { ...angle(start, start + size, labelled ? `${size}${DEG}` : undefined), arcs: [{ from: start, to: start + size, text: labelled ? `${size}${DEG}` : undefined, square: size === 90 && labelled }] };
  return fixedChoice(labelled ? `This angle measures ${size}${DEG}. What type of angle is it?` : 'What type of angle is marked?', options, angleType(size), [
    labelled ? `Compare ${size}${DEG} with 90° and 180°.` : 'Compare it with a right angle, like the corner of a page.',
    whyType(size),
  ], [pic]);
}

function whichIs(r: Rng): Question {
  const want = r.pick(['Acute', 'Obtuse', 'Reflex']);
  const others = ['Acute', 'Obtuse', 'Reflex'].filter((t) => t !== want);
  const right = anySize(r, [want]);
  let wrong: number[];
  do wrong = [anySize(r, [others[0]]), anySize(r, [others[1]]), anySize(r, others)]; while (new Set(wrong).size < 3);
  return choiceOf(r, `Which of these angles is ${want === 'Reflex' ? 'a reflex' : want === 'Acute' ? 'an acute' : 'an obtuse'} angle?`, `${right}${DEG}`, wrong.map((w) => `${w}${DEG}`), [
    'Acute is less than 90°. Obtuse is between 90° and 180°. Reflex is more than 180°.',
    `${right}${DEG}: ${whyType(right).toLowerCase().replace('it is', 'this is')}`,
  ]);
}

function rightAngles(r: Rng): Question {
  const n = r.int(1, 4);
  const turn = ['a quarter turn', 'a half turn', 'a three-quarter turn', 'a full turn'][n - 1];
  if (r.next() < 0.5) {
    return numQ(`How many degrees are there in ${turn}?`, n * 90, [
      `${turn[0].toUpperCase()}${turn.slice(1)} is ${n} right angle${n > 1 ? 's' : ''}.`,
      `${n} ${X} 90${DEG} = ${n * 90}${DEG}.`,
    ], { unit: DEG, pics: n === 4 ? undefined : [angle(0, n * 90, `${n === 1 ? '' : '?'}`)] });
  }
  return numQ(`How many right angles make ${n * 90}${DEG}?`, n, [
    `One right angle is 90${DEG}.`,
    `${n * 90} ${DIV} 90 = ${n}.`,
  ]);
}

const angleTypes: SkillContent = {
  id: 'geometry-2',
  example: [
    { say: 'An angle is an amount of turn. It is measured in degrees. A quarter turn is 90 degrees, and it is called a right angle. It is marked with a small square.', show: 'Right angle = 90°', pics: [angle(0, 90, '90°')] },
    { say: 'An angle smaller than a right angle is acute.', show: 'Acute: less than 90°', pics: [angle(0, 40, '40°', { caption: 'Acute' })] },
    { say: 'An angle bigger than a right angle, but less than a straight line, is obtuse.', show: 'Obtuse: between 90° and 180°', pics: [angle(0, 130, '130°', { caption: 'Obtuse' })] },
    { say: 'A half turn is two right angles. It makes a straight line, which is 180 degrees.', show: 'Straight line = 180°', pics: [angle(0, 180, '180°')] },
    { say: 'An angle bigger than a straight line is reflex. A full turn is four right angles, which is 360 degrees.', show: 'Reflex: between 180° and 360°', pics: [angle(0, 250, '250°', { caption: 'Reflex' })] },
  ],
  generate(level, r) {
    if (level === 1) return typeFromPicture(r, false);
    if (level === 2) return r.next() < 0.7 ? typeFromPicture(r, true) : rightAngles(r);
    return r.next() < 0.6 ? whichIs(r) : rightAngles(r);
  },
};

// ---------- 3. Measuring and drawing angles ----------

function readProtractor(r: Rng, step: number): Question {
  const size = r.int(20 / step, 160 / step) * step;
  return numQ('What size is this angle?', size, [
    'One arm is on the zero line. Follow the scale round from 0 to the other arm.',
    `The other arm points at ${size}. The angle is ${size}${DEG}.`,
    `Check: it is ${angleType(size).toLowerCase()}, so ${size < 90 ? 'less than 90°' : size === 90 ? 'exactly 90°' : 'more than 90°'} makes sense.`,
  ], { unit: DEG, pics: [angle(0, size, undefined, { protractor: true })] });
}

function offZero(r: Rng): Question {
  const from = r.int(2, 7) * 5;
  const to = from + r.int(6, 22) * 5;
  return numQ('Neither arm is on the zero line. What size is this angle?', to - from, [
    `The arms point at ${from} and ${to}.`,
    `Subtract to find the turn between them: ${to} ${MINUS} ${from} = ${to - from}.`,
    `The angle is ${to - from}${DEG}.`,
  ], { unit: DEG, pics: [angle(from, to, undefined, { protractor: true })] });
}

function reflexFrom(r: Rng): Question {
  const size = r.int(8, 32) * 5;
  const pic: AnglePicture = { kind: 'angle', alt: `An angle of ${size} degrees and the reflex angle on its other side`, rays: [0, size], arcs: [{ from: 0, to: size, text: `${size}${DEG}` }, { from: size, to: 360, text: '?' }] };
  return numQ('A protractor only goes up to 180°. What is the size of the reflex angle marked ?', 360 - size, [
    'The two angles make a full turn, which is 360°.',
    `360 ${MINUS} ${size} = ${360 - size}.`,
  ], { unit: DEG, pics: [pic] });
}

const measuring: SkillContent = {
  id: 'geometry-3',
  example: [
    { say: 'A protractor measures angles in degrees. First look at the angle and estimate. This one is acute, so it will be less than 90 degrees.', pics: [angle(0, 60)] },
    { say: 'Put the centre of the protractor exactly on the corner of the angle. Line up the zero line with one arm.', pics: [angle(0, 60, undefined, { protractor: true })] },
    { say: 'Start at 0 on that arm and follow the scale round to the other arm. Read the number there.', show: '60°', pics: [angle(0, 60, '60°', { protractor: true })] },
    { say: 'To draw an angle of 125 degrees, draw one arm, put the centre on its end and make a dot at 125. Then join the dot to the end of the arm with a ruler.', show: '125°', pics: [angle(0, 125, '125°', { protractor: true })] },
    { say: 'A real protractor has two scales. Always use the one that starts at 0 on the arm you lined up. Your estimate tells you if you read the wrong one.', pics: [angle(0, 125, '125°', { caption: 'Obtuse, so 125° makes sense and 55° would not.' })] },
  ],
  generate(level, r) {
    if (level === 1) return readProtractor(r, 10);
    if (level === 2) return readProtractor(r, 5);
    return r.next() < 0.6 ? offZero(r) : reflexFrom(r);
  },
};

// ---------- 4. Angles at a point and on a line ----------

/** Split a total into `n` angles in multiples of `step`, each at least `min`. */
function split(r: Rng, total: number, n: number, step: number, min: number): number[] {
  for (;;) {
    const parts = Array.from({ length: n - 1 }, () => r.int(min / step, (total - min * (n - 1)) / step) * step);
    const last = total - parts.reduce((x, y) => x + y, 0);
    if (last >= min) return [...parts, last];
  }
}

const sumText = (known: number[]) => known.join(' + ');

function onLine(r: Rng, n: number, step: number): Question {
  const parts = split(r, 180, n, step, 30);
  const miss = r.int(0, n - 1);
  const known = parts.filter((_, i) => i !== miss);
  const explain = ['Angles on a straight line add up to 180°.'];
  if (known.length > 1) explain.push(`Add the angles you know: ${sumText(known)} = ${known.reduce((x, y) => x + y, 0)}.`);
  explain.push(`180 ${MINUS} ${known.reduce((x, y) => x + y, 0)} = ${parts[miss]}.`);
  return numQ('These angles are on a straight line. What is the missing angle?', parts[miss], explain, {
    unit: DEG, pics: [anglesAround(0, parts, parts.map((p, i) => (i === miss ? '?' : `${p}${DEG}`)))],
  });
}

function atPoint(r: Rng, n: number, step: number, rightAngle: boolean): Question {
  let parts: number[];
  if (rightAngle) parts = [90, ...split(r, 270, n - 1, step, 40)];
  else parts = split(r, 360, n, step, 40);
  // The missing angle is never the marked right angle.
  const miss = r.int(rightAngle ? 1 : 0, n - 1);
  const known = parts.filter((_, i) => i !== miss);
  const total = known.reduce((x, y) => x + y, 0);
  const explain = ['Angles around a point add up to 360°.'];
  if (rightAngle) explain.push('The small square shows a right angle, which is 90°.');
  explain.push(`Add the angles you know: ${sumText(known)} = ${total}.`, `360 ${MINUS} ${total} = ${parts[miss]}.`);
  return numQ('These angles meet at a point. What is the missing angle?', parts[miss], explain, {
    unit: DEG, pics: [anglesAround(0, parts, parts.map((p, i) => (i === miss ? '?' : rightAngle && i === 0 ? undefined : `${p}${DEG}`)))],
  });
}

function equalPair(r: Rng): Question {
  const each = r.int(7, 14) * 5;
  const known = 180 - each * 2;
  return numQ('The two angles marked ? are equal. What size is each one?', each, [
    'Angles on a straight line add up to 180°.',
    `180 ${MINUS} ${known} = ${180 - known}. That is shared between the two equal angles.`,
    `${180 - known} ${DIV} 2 = ${each}.`,
  ], { unit: DEG, pics: [anglesAround(0, [each, known, each], ['?', `${known}${DEG}`, '?'])] });
}

const anglesAt: SkillContent = {
  id: 'geometry-4',
  example: [
    { say: 'A straight line is a half turn, which is 180 degrees. So angles that sit together on a straight line add up to 180.', show: '130° + 50° = 180°', pics: [anglesAround(0, [50, 130], ['50°', '130°'])] },
    { say: 'To find a missing angle on a straight line, subtract the angle you know from 180.', show: '180 − 65 = 115', pics: [anglesAround(0, [65, 115], ['65°', '?'])] },
    { say: 'A full turn is 360 degrees. So angles that meet around a point add up to 360.', show: '150° + 120° + 90° = 360°', pics: [anglesAround(0, [90, 120, 150], ['90°', '120°', '150°'])] },
    { say: 'To find a missing angle around a point, add up the angles you know, then subtract from 360.', show: '140 + 100 = 240, and 360 − 240 = 120', pics: [anglesAround(0, [140, 100, 120], ['140°', '100°', '?'])] },
  ],
  generate(level, r) {
    if (level === 1) return onLine(r, 2, 10);
    if (level === 2) return r.next() < 0.5 ? onLine(r, r.pick([2, 3]), 5) : atPoint(r, 3, 10, false);
    const p = r.next();
    return p < 0.35 ? atPoint(r, 4, 5, true) : p < 0.7 ? atPoint(r, r.pick([3, 4]), 5, false) : equalPair(r);
  },
};

// ---------- 5. Rectangles and missing lengths ----------

/** A rectangle drawn to a comfortable size, with any of its four sides labelled. */
export function labelledRectangle(w: number, h: number, texts: { bottom?: string; left?: string; top?: string; right?: string }, caption?: string): ShapePicture {
  const k = 6 / Math.max(w, h);
  const dw = Math.max(2.4, w * k), dh = Math.max(2.4, h * k);
  const labels: ShapePicture['labels'] = [];
  if (texts.bottom) labels.push({ x: dw / 2, y: dh + 0.7, text: texts.bottom });
  if (texts.left) labels.push({ x: -0.3, y: dh / 2, text: texts.left, anchor: 'end' });
  if (texts.top) labels.push({ x: dw / 2, y: -0.35, text: texts.top });
  if (texts.right) labels.push({ x: dw + 0.25, y: dh / 2, text: texts.right, anchor: 'start' });
  return { kind: 'shape', alt: 'A rectangle with some of its sides labelled', caption, points: [[0, 0], [dw, 0], [dw, dh], [0, dh]], labels };
}

/** A rectangle with one diagonal, and the two angles the diagonal makes in the bottom left corner. */
export function diagonalRectangle(x: number, lowText: string, highText: string, caption?: string): DrawingPicture {
  const w = 4, h = Math.round(4 * Math.tan((x * Math.PI) / 180) * 100) / 100;
  const at = (deg: number, rad: number) => ({ x: rad * Math.cos((deg * Math.PI) / 180), y: h - rad * Math.sin((deg * Math.PI) / 180) });
  return {
    kind: 'drawing', alt: 'A rectangle with a diagonal line from corner to corner', caption, w, h,
    polys: [[[0, 0], [w, 0], [w, h], [0, h]]],
    lines: [[0, 0, w, 0], [w, 0, w, h], [w, h, 0, h], [0, h, 0, 0], [0, h, w, 0]],
    labels: [{ ...at(x / 2, 1.5), text: lowText }, { ...at((x + 90) / 2, 0.85), text: highText }],
  };
}

function oppositeSide(r: Rng): Question {
  const w = r.int(6, 15), h = r.int(2, w - 2);
  const top = r.next() < 0.5;
  return numQ('This is a rectangle. What is the length of the side marked ?', top ? w : h, [
    'Opposite sides of a rectangle are equal.',
    `The side marked ? is opposite the ${top ? w : h} cm side, so it is ${top ? w : h} cm.`,
  ], { unit: 'cm', pics: [labelledRectangle(w, h, { bottom: `${w} cm`, left: `${h} cm`, ...(top ? { top: '?' } : { right: '?' }) })] });
}

function sideFromPerimeter(r: Rng, decimal: boolean): Question {
  const w = r.int(7, 16), h = r.int(2, w - 2) + (decimal ? 0.5 : 0);
  const p = 2 * (w + h);
  return numQ(`The perimeter of this rectangle is ${p} cm. What is the length of the side marked ?`, h, [
    `The two long sides are ${w} cm each: ${w} ${X} 2 = ${w * 2}.`,
    `${p} ${MINUS} ${w * 2} = ${p - w * 2}. That is the two short sides together.`,
    `${p - w * 2} ${DIV} 2 = ${h}.`,
  ], { unit: 'cm', decimal, pics: [labelledRectangle(w, h, { bottom: `${w} cm`, left: '?' })] });
}

function diagonalAngle(r: Rng): Question {
  const x = r.int(25, 40);
  const askHigh = r.next() < 0.5;
  const given = askHigh ? x : 90 - x;
  return numQ('This is a rectangle with a diagonal drawn. What is the missing angle?', 90 - given, [
    'Every corner of a rectangle is a right angle, which is 90°.',
    'The diagonal splits the corner into two angles that add up to 90°.',
    `90 ${MINUS} ${given} = ${90 - given}.`,
  ], { unit: DEG, pics: [diagonalRectangle(x, askHigh ? `${x}${DEG}` : '?', askHigh ? '?' : `${90 - x}${DEG}`)] });
}

function squareSide(r: Rng): Question {
  const s = r.int(4, 25);
  return numQ(`A square has a perimeter of ${s * 4} cm. How long is each side?`, s, [
    'A square is a rectangle with four equal sides.',
    `${s * 4} ${DIV} 4 = ${s}.`,
  ], { unit: 'cm', pics: [labelledRectangle(4, 4, { bottom: '?' })] });
}

const rectangles: SkillContent = {
  id: 'geometry-5',
  example: [
    { say: 'A rectangle has four right angles. Its opposite sides are equal and parallel.', pics: [labelledRectangle(9, 4, { bottom: '9 cm', left: '4 cm', top: '9 cm', right: '4 cm' })] },
    { say: 'So if you know one side, you know the side opposite it. The side marked with a question mark must be 9 centimetres.', show: '? = 9 cm', pics: [labelledRectangle(9, 4, { bottom: '9 cm', left: '4 cm', top: '?' })] },
    { say: 'The perimeter of this rectangle is 30 centimetres. The two long sides use 11 times 2, which is 22. That leaves 8 for the two short sides, so each is 4 centimetres.', show: '30 − 22 = 8, and 8 ÷ 2 = 4', pics: [labelledRectangle(11, 4, { bottom: '11 cm', left: '?' }, 'Perimeter = 30 cm')] },
    { say: 'A diagonal splits a corner into two angles. The corner is a right angle, so the two angles add up to 90 degrees.', show: '90 − 35 = 55', pics: [diagonalRectangle(35, '35°', '?')] },
  ],
  generate(level, r) {
    if (level === 1) return oppositeSide(r);
    if (level === 2) return r.next() < 0.6 ? sideFromPerimeter(r, false) : squareSide(r);
    const p = r.next();
    return p < 0.5 ? diagonalAngle(r) : sideFromPerimeter(r, true);
  },
};

// ---------- 6. Regular and irregular polygons ----------

export const POLYGON_NAMES: Record<number, string> = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };

const sideLengths = (pts: [number, number][]) => pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]); });

/** A polygon whose sides are clearly not all the same length. */
function irregular(r: Rng, n: number): DrawingPicture {
  for (;;) {
    // A triangle needs a bigger spread before its sides look different.
    const pic = polygon(n, Array.from({ length: n }, () => r.pick(n === 3 ? [0.4, 0.7, 1] : [0.72, 0.85, 1])));
    const sides = sideLengths(pic.polys![0]);
    if (Math.max(...sides) / Math.min(...sides) > 1.3) return pic;
  }
}

/** A rectangle that is not a square, as a plain outline. */
const oblong = (): DrawingPicture => ({ kind: 'drawing', alt: 'A shape with 4 straight sides', w: 3.6, h: 2, polys: [[[0, 0], [3.6, 0], [3.6, 2], [0, 2]]] });

function regularOrNot(r: Rng): Question {
  const n = r.int(3, 8);
  const regular = r.next() < 0.5;
  return fixedChoice('Is this polygon regular or irregular?', ['Regular', 'Irregular'], regular ? 'Regular' : 'Irregular', [
    'A regular polygon has all its sides equal and all its angles equal.',
    regular ? 'Every side is the same length and every angle is the same, so it is regular.' : 'Its sides are not all the same length, so it is irregular.',
  ], [regular ? polygon(n) : irregular(r, n)]);
}

function namePolygon(r: Rng): Question {
  const n = r.int(3, 8);
  const wrong = r.shuffle(Object.keys(POLYGON_NAMES).map(Number).filter((k) => k !== n)).slice(0, 3).map((k) => POLYGON_NAMES[k]);
  return choiceOf(r, 'What is this polygon called?', POLYGON_NAMES[n], wrong, [
    `Count the sides. There are ${n}.`,
    `A polygon with ${n} sides is ${a(POLYGON_NAMES[n])}.`,
  ], [r.next() < 0.5 ? polygon(n) : irregular(r, n)]);
}

function regularPerimeter(r: Rng, inverse: boolean): Question {
  const n = r.pick([3, 5, 6, 7, 8]);
  const side = r.int(3, 12);
  const name = POLYGON_NAMES[n];
  const regName = n === 3 ? 'An equilateral triangle' : `A regular ${name}`;
  if (inverse) {
    return numQ(`${regName} has a perimeter of ${n * side} cm. How long is each side?`, side, [
      `${regName} has ${n} equal sides.`,
      `${n * side} ${DIV} ${n} = ${side}.`,
    ], { unit: 'cm', pics: [polygon(n)] });
  }
  return numQ(`${regName} has sides of ${side} cm. What is its perimeter?`, n * side, [
    `${regName} has ${n} equal sides.`,
    `${n} ${X} ${side} = ${n * side}.`,
  ], { unit: 'cm', pics: [polygon(n)] });
}

function oblongTrick(r: Rng): Question {
  const w = r.int(6, 12), h = r.int(2, w - 2);
  return fixedChoice(`This rectangle is ${w} cm long and ${h} cm wide. All four angles are right angles. Is it a regular polygon?`, ['Regular', 'Irregular'], 'Irregular', [
    'A regular polygon needs equal angles and equal sides.',
    `The angles are equal, but the sides are ${w} cm and ${h} cm, so it is irregular.`,
    'The only regular quadrilateral is a square.',
  ], [oblong()]);
}

const polygons: SkillContent = {
  id: 'geometry-6',
  example: [
    { say: 'A polygon is a flat shape with straight sides. It is named by its number of sides.', pics: [table(['3 sides', '4 sides', '5 sides'], ['triangle', 'quadrilateral', 'pentagon'], 'The names of polygons with 3, 4 and 5 sides'), table(['6 sides', '7 sides', '8 sides'], ['hexagon', 'heptagon', 'octagon'], 'The names of polygons with 6, 7 and 8 sides')] },
    { say: 'A regular polygon has all its sides equal and all its angles equal. These are both regular.', pics: [{ ...polygon(5), caption: 'Regular pentagon' }, { ...polygon(6), caption: 'Regular hexagon' }] },
    { say: 'If the sides or the angles are not all the same, the polygon is irregular. This shape has five sides, so it is still a pentagon, but it is irregular.', pics: [{ ...polygon(5, [1, 0.72, 1, 0.85, 0.72]), caption: 'Irregular pentagon' }] },
    { say: 'Both things must be true. A rectangle has four equal angles, but its sides are not all equal, so it is irregular. A square is the regular one.', pics: [{ ...oblong(), caption: 'Irregular' }, { ...polygon(4), caption: 'Regular' }] },
    { say: 'Equal sides make perimeters quick. A regular hexagon with sides of 4 centimetres has a perimeter of 6 times 4.', show: '6 × 4 = 24 cm', pics: [{ ...polygon(6), caption: 'Each side is 4 cm' }] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? regularOrNot(r) : namePolygon(r);
    if (level === 2) { const p = r.next(); return p < 0.35 ? regularOrNot(r) : p < 0.6 ? namePolygon(r) : regularPerimeter(r, false); }
    return r.next() < 0.7 ? regularPerimeter(r, true) : oblongTrick(r);
  },
};

// ---------- 7. Reflection and translation ----------

type P = [number, number];
const GRID = 10;
const pair = ([x, y]: P) => `(${x}, ${y})`;
const inGrid = ([x, y]: P) => x >= 0 && x <= GRID && y >= 0 && y <= GRID;

/** Words for a move, such as "3 squares right and 2 squares down". */
export function moveText(dx: number, dy: number): string {
  const part = (n: number, plus: string, minus: string) => `${Math.abs(n)} square${Math.abs(n) === 1 ? '' : 's'} ${n > 0 ? plus : minus}`;
  return [dx ? part(dx, 'right', 'left') : '', dy ? part(dy, 'up', 'down') : ''].filter(Boolean).join(' and ');
}

function coordChoice(r: Rng, prompt: string, right: P, candidates: P[], explain: string[], pics: Picture[]): Question {
  const wrong: string[] = [];
  for (const c of candidates) if (inGrid(c) && pair(c) !== pair(right) && !wrong.includes(pair(c)) && wrong.length < 3) wrong.push(pair(c));
  // Top up with near misses in the rare case the usual slips coincide.
  for (let k = 1; wrong.length < 3; k++) for (const c of [[right[0] + k, right[1]], [right[0] - k, right[1]], [right[0], right[1] + k], [right[0], right[1] - k]] as P[]) {
    if (inGrid(c) && !wrong.includes(pair(c)) && wrong.length < 3) wrong.push(pair(c));
  }
  return choiceOf(r, prompt, pair(right), wrong, explain, pics);
}

function translatePoint(r: Rng): Question {
  let x: number, y: number, dx: number, dy: number;
  do { x = r.int(1, 9); y = r.int(1, 9); dx = r.int(-6, 6); dy = r.int(-6, 6); }
  while (!dx || !dy || !inGrid([x + dx, y + dy]));
  return coordChoice(r, `Point A is at ${pair([x, y])}. It is translated ${moveText(dx, dy)}. Where does it land?`, [x + dx, y + dy],
    [[x - dx, y - dy], [x + dx, y - dy], [x - dx, y + dy], [x + dy, y + dx], [y + dy, x + dx], [x + dx, y]], [
      `Left and right change the first number: ${x} ${dx > 0 ? '+' : MINUS} ${Math.abs(dx)} = ${x + dx}.`,
      `Up and down change the second number: ${y} ${dy > 0 ? '+' : MINUS} ${Math.abs(dy)} = ${y + dy}.`,
      `It lands at ${pair([x + dx, y + dy])}.`,
    ], [coords(GRID, [{ points: [[x, y]], name: 'A' }])]);
}

function reflectPoint(r: Rng): Question {
  const vertical = r.next() < 0.5;
  const m = r.int(4, 6);
  let x: number, y: number;
  do { x = r.int(0, GRID); y = r.int(1, 9); } while (x === m || !inGrid([2 * m - x, y]));
  // Work with the mirror line upright, then swap the numbers round for a line lying flat.
  const flip = (p: P): P => (vertical ? p : [p[1], p[0]]);
  const gap = Math.abs(m - x);
  const start = flip([x, y]), right = flip([2 * m - x, y]);
  return coordChoice(r, `Point P is at ${pair(start)}. It is reflected in the dashed mirror line. Where does it land?`, right,
    [flip([m, y]), flip([x + (m > x ? gap * 2 + 1 : -gap * 2 - 1), y]), flip([x, 2 * m - y]), flip([GRID - x, y]), flip([m + (m > x ? gap - 1 : 1 - gap), y]), [start[1], start[0]]], [
      `P is ${gap} square${gap === 1 ? '' : 's'} from the mirror line.`,
      `Its reflection is ${gap} square${gap === 1 ? '' : 's'} from the line on the other side.`,
      `It lands at ${pair(right)}. The ${vertical ? 'second' : 'first'} number stays the same.`,
    ], [coords(GRID, [{ points: [start], name: 'P' }], { mirror: { vertical, at: m } })]);
}

/** A small triangle or rectangle, given by its corners. */
function smallShape(r: Rng, x: number, y: number): P[] {
  const w = r.int(1, 3), h = r.int(1, 3);
  return r.next() < 0.5 ? [[x, y], [x + w, y], [x, y + h]] : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

function describeMove(r: Rng): Question {
  for (;;) {
    const A = smallShape(r, r.int(0, 7), r.int(0, 7));
    const dx = r.int(-7, 7), dy = r.int(-7, 7);
    const B = A.map(([x, y]): P => [x + dx, y + dy]);
    if (!dx || !dy || Math.abs(dx) === Math.abs(dy) || ![...A, ...B].every(inGrid)) continue;
    // Keep the two shapes from overlapping so each can be seen clearly.
    const span = (pts: P[], k: 0 | 1) => [Math.min(...pts.map((p) => p[k])), Math.max(...pts.map((p) => p[k]))];
    const apart = (k: 0 | 1) => span(A, k)[1] < span(B, k)[0] || span(B, k)[1] < span(A, k)[0];
    if (!apart(0) && !apart(1)) continue;
    return choiceOf(r, 'Shape A is translated to shape B. Describe the translation.', moveText(dx, dy), [moveText(-dx, -dy), moveText(dy, dx), moveText(dx, -dy)], [
      'Pick one corner of A and find the same corner on B.',
      `Count across: ${moveText(dx, 0)}. Count up or down: ${moveText(0, dy)}.`,
      'Every corner moves the same way. The shape does not turn or change size.',
    ], [coords(GRID, [{ points: A, name: 'A' }, { points: B, name: 'B', hi: true }])]);
  }
}

function reflectShape(r: Rng): Question {
  const vertical = r.next() < 0.5;
  const m = r.int(4, 6);
  for (;;) {
    const upright = smallShape(r, r.int(0, m - 2), r.int(1, 6));
    if (!upright.every(([x, y]) => x < m && inGrid([2 * m - x, y]))) continue;
    const flip = (p: P): P => (vertical ? p : [p[1], p[0]]);
    const corner = r.pick(upright);
    const from = flip(corner), to = flip([2 * m - corner[0], corner[1]]);
    const gap = m - corner[0];
    const shown = vertical ? `(?, ${to[1]})` : `(${to[0]}, ?)`;
    return numQ(`The shape is reflected in the dashed mirror line. The corner at ${pair(from)} lands at ${shown}. What is the missing number?`, vertical ? to[0] : to[1], [
      `The corner at ${pair(from)} is ${gap} square${gap === 1 ? '' : 's'} from the mirror line.`,
      `Count ${gap} square${gap === 1 ? '' : 's'} past the line on the other side: ${m} + ${gap} = ${m + gap}.`,
      `It lands at ${pair(to)}.`,
    ], { pics: [coords(GRID, [{ points: upright.map(flip) }], { mirror: { vertical, at: m } })] });
  }
}

const TRI: P[] = [[1, 2], [3, 2], [1, 5]];

const transformations: SkillContent = {
  id: 'geometry-7',
  example: [
    { say: 'A point on a grid is named by two numbers. The first says how far across, the second how far up. Point A is at 2 across and 3 up.', show: 'A is at (2, 3)', pics: [coords(GRID, [{ points: [[2, 3]], name: 'A' }])] },
    { say: 'A translation slides a shape. Every corner moves the same way. This triangle moves 5 squares right and 2 squares up.', show: '5 right and 2 up', pics: [coords(GRID, [{ points: TRI, name: 'A' }, { points: TRI.map(([x, y]): P => [x + 5, y + 2]), name: 'B', hi: true }])] },
    { say: 'Moving right adds to the first number. Moving up adds to the second number. The corner at (1, 2) lands at (6, 4).', show: '(1 + 5, 2 + 2) = (6, 4)', pics: [coords(GRID, [{ points: [[1, 2]], name: '(1, 2)' }, { points: [[6, 4]], name: '(6, 4)', hi: true }])] },
    { say: 'A reflection flips a shape in a mirror line. Each corner lands the same distance from the line, on the other side.', pics: [coords(GRID, [{ points: TRI, name: 'A' }, { points: TRI.map(([x, y]): P => [10 - x, y]), name: 'B', hi: true }], { mirror: { vertical: true, at: 5 } })] },
    { say: 'The corner at (1, 5) is 4 squares from the mirror line, so it lands 4 squares past it, at (9, 5). The shape stays the same size, but it faces the other way.', show: '(1, 5) lands at (9, 5)', pics: [coords(GRID, [{ points: [[1, 5]], name: '(1, 5)' }, { points: [[9, 5]], name: '(9, 5)', hi: true }], { mirror: { vertical: true, at: 5 } })] },
  ],
  generate(level, r) {
    if (level === 1) return translatePoint(r);
    if (level === 2) return r.next() < 0.5 ? reflectPoint(r) : describeMove(r);
    return r.next() < 0.6 ? reflectShape(r) : describeMove(r);
  },
};

export const GEOMETRY_SKILLS: SkillContent[] = [solids, angleTypes, measuring, anglesAt, rectangles, polygons, transformations];
