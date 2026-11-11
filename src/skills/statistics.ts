// Unit 8: Statistics. All wording, data and questions are our own.
import { dataTable, lineGraph, type GraphPicture, type TablePicture } from '../engine/pictures';
import type { Rng } from '../engine/rng';
import type { NumberQuestion, Question, SkillContent } from '../engine/types';

const MINUS = '−';

const numQ = (prompt: string, answer: number, explain: string[], extra: Partial<NumberQuestion> = {}): NumberQuestion => ({
  kind: 'number', prompt, answer, explain, ...extra,
});

const choiceOf = (r: Rng, prompt: string, right: string, wrong: string[], explain: string[], extra: Partial<Question> = {}): Question => {
  const options = r.shuffle([right, ...wrong]);
  return { kind: 'choice', prompt, options, answer: options.indexOf(right), explain, ...extra } as Question;
};

// ---------- 1. Line graphs ----------

interface Story {
  xs: string[];
  xTitle: string;
  yTitle: string;
  unit: string;
  step: number;
  /** How many labelled lines the side scale has above zero. */
  lines: number;
  /** Whether the line can only go up, like the height of a plant. */
  rising?: boolean;
  /** Whether adding two readings makes sense. */
  adds?: boolean;
  /** Names of two lines that can be compared. */
  pair?: [string, string];
  /** The thing measured, as in "the temperature". */
  thing: string;
  /** "at 11:00", "in Week 3", "on Tuesday" */
  when: (x: string) => string;
  read: (x: string) => string;
  count: (t: number) => string;
  compare: (big: string, small: string, x: string) => string;
}

const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };

export const STORIES: Story[] = [
  {
    xs: TIMES, xTitle: 'Time', yTitle: 'Temperature (°C)', unit: '°C', step: 2, lines: 8, pair: ['Monday', 'Tuesday'], thing: 'the temperature',
    when: (x) => `at ${x}`,
    read: (x) => `What was the temperature at ${x}?`,
    count: (t) => `At how many of the times shown was the temperature more than ${t}°C?`,
    compare: (big, small, x) => `How many degrees warmer was it on ${big} than on ${small} at ${x}?`,
  },
  {
    xs: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'], xTitle: 'Week', yTitle: 'Height (cm)', unit: 'cm', step: 10, lines: 7, rising: true, pair: ['Plant A', 'Plant B'], thing: 'the height of the plant',
    when: (x) => `in ${x}`,
    read: (x) => `How tall was the plant in ${x}?`,
    count: (t) => `In how many of the weeks shown was the plant more than ${t} cm tall?`,
    compare: (big, small, x) => `How much taller was ${big} than ${small} in ${x}?`,
  },
  {
    xs: DAYS, xTitle: 'Day', yTitle: 'Visitors', unit: '', step: 20, lines: 7, adds: true, thing: 'the number of visitors',
    when: (x) => `on ${DAY_NAMES[x]}`,
    read: (x) => `How many visitors came to the museum on ${DAY_NAMES[x]}?`,
    count: (t) => `On how many of the days shown did the museum have more than ${t} visitors?`,
    compare: () => '',
  },
  {
    xs: DAYS, xTitle: 'Day', yTitle: 'Water (litres)', unit: 'litres', step: 10, lines: 8, thing: 'the amount of water in the barrel',
    when: (x) => `on ${DAY_NAMES[x]}`,
    read: (x) => `How much water was in the barrel on ${DAY_NAMES[x]}?`,
    count: (t) => `On how many of the days shown was there more than ${t} litres in the barrel?`,
    compare: () => '',
  },
];

/** Readings for one line. With `halves`, some readings sit halfway between two lines of the scale. */
function readings(r: Rng, s: Story, halves: boolean): number[] {
  const u = halves ? 1 : 2, top = s.lines * 2;
  for (;;) {
    const v: number[] = [s.rising ? r.int(1, 2) * 2 : r.int(2, s.lines - 1) * 2];
    while (v.length < s.xs.length) {
      const next = v[v.length - 1] + (s.rising ? r.int(0, 3) : r.int(-3, 3)) * u;
      v.push(Math.min(top, Math.max(2, next)));
    }
    const flat = v.filter((x, i) => i > 0 && x === v[i - 1]).length;
    if (flat <= 1 && new Set(v).size >= 4 && (!halves || v.some((x) => x % 2))) return v.map((x) => (x * s.step) / 2);
  }
}

const graphOf = (s: Story, series: GraphPicture['series'], guides?: number[], caption?: string): GraphPicture =>
  lineGraph({ xLabels: s.xs, xTitle: s.xTitle, yTitle: s.yTitle, yMax: s.lines * s.step, yStep: s.step, series, guides, caption });

const withUnit = (v: number, s: Story) => (s.unit === '°C' ? `${v}°C` : s.unit ? `${v} ${s.unit}` : `${v}`);

const how = (s: Story, x: string, v: number) => [
  `Find ${x} along the bottom. Go straight up to the line.`,
  `Go across to the scale at the side${v % s.step ? `. The point is halfway between ${v - s.step / 2} and ${v + s.step / 2}` : ''}.`,
];

function readValue(r: Rng, halves: boolean): Question {
  const s = r.pick(STORIES);
  const v = readings(r, s, halves);
  const pool = v.map((_, i) => i).filter((i) => !halves || v[i] % s.step);
  const i = r.pick(pool);
  return numQ(s.read(s.xs[i]), v[i], [...how(s, s.xs[i], v[i]), `It reads ${withUnit(v[i], s)}.`], { unit: s.unit || undefined, pics: [graphOf(s, [{ values: v }])] });
}

function extreme(r: Rng): Question {
  for (;;) {
    const s = r.pick(STORIES.filter((x) => !x.rising));
    const v = readings(r, s, false);
    const high = r.next() < 0.5;
    const best = high ? Math.max(...v) : Math.min(...v);
    if (v.filter((x) => x === best).length !== 1) continue;
    const i = v.indexOf(best);
    const label = (x: string) => DAY_NAMES[x] ?? x;
    const wrong = r.shuffle(s.xs.filter((_, k) => k !== i)).slice(0, 3).map(label);
    return choiceOf(r, `When was ${s.thing} ${high ? 'highest' : 'lowest'}?`, label(s.xs[i]), wrong, [
      `Look for the ${high ? 'highest' : 'lowest'} point on the line.`,
      `Go straight down from it to the bottom scale. It is ${s.when(s.xs[i])}, when the graph reads ${withUnit(best, s)}.`,
    ], { pics: [graphOf(s, [{ values: v }])] });
  }
}

function difference(r: Rng, halves: boolean): Question {
  for (;;) {
    const s = r.pick(STORIES);
    const v = readings(r, s, halves);
    const [i, j] = r.shuffle(v.map((_, k) => k)).slice(0, 2).sort((x, y) => x - y);
    if (v[i] === v[j]) continue;
    const big = Math.max(v[i], v[j]), small = Math.min(v[i], v[j]);
    return numQ(`What is the difference between ${s.thing} ${s.when(s.xs[i])} and ${s.when(s.xs[j])}?`, big - small, [
      `Read both points. ${s.xs[i]} is ${withUnit(v[i], s)} and ${s.xs[j]} is ${withUnit(v[j], s)}.`,
      `Subtract the smaller from the bigger: ${big} ${MINUS} ${small} = ${big - small}.`,
    ], { unit: s.unit || undefined, pics: [graphOf(s, [{ values: v }])] });
  }
}

function altogether(r: Rng): Question {
  const s = STORIES.find((x) => x.adds)!;
  const v = readings(r, s, false);
  const i = r.int(0, v.length - 2);
  return numQ(`How many visitors came to the museum on ${DAY_NAMES[s.xs[i]]} and ${DAY_NAMES[s.xs[i + 1]]} altogether?`, v[i] + v[i + 1], [
    `Read both points. ${s.xs[i]} is ${v[i]} and ${s.xs[i + 1]} is ${v[i + 1]}.`,
    `Add them: ${v[i]} + ${v[i + 1]} = ${v[i] + v[i + 1]}.`,
  ], { pics: [graphOf(s, [{ values: v }])] });
}

function countAbove(r: Rng): Question {
  for (;;) {
    const s = r.pick(STORIES);
    const v = readings(r, s, true);
    const t = r.int(2, s.lines - 2) * s.step;
    const n = v.filter((x) => x > t).length;
    if (n === 0 || n === v.length) continue;
    const explain = [`Find ${t} on the side scale and look along that line.`, `Count the points above it: ${n}.`];
    if (v.includes(t)) explain.push(`A point exactly on ${t} is not more than ${t}, so it does not count.`);
    return numQ(s.count(t), n, explain, { pics: [graphOf(s, [{ values: v }])] });
  }
}

function twoLines(r: Rng): Question {
  for (;;) {
    const s = r.pick(STORIES.filter((x) => x.pair));
    const a = readings(r, s, false), b = readings(r, s, false);
    const pool = a.map((_, i) => i).filter((i) => a[i] !== b[i]);
    // Keep the two lines apart at most points so they are easy to tell from each other.
    if (pool.length < a.length - 1) continue;
    const i = r.pick(pool);
    const [big, small] = a[i] > b[i] ? [0, 1] : [1, 0];
    const vals = [a[i], b[i]];
    return numQ(s.compare(s.pair![big], s.pair![small], s.xs[i]), vals[big] - vals[small], [
      `Find ${s.xs[i]} and read both lines. ${s.pair![0]} is ${withUnit(a[i], s)} and ${s.pair![1]} is ${withUnit(b[i], s)}.`,
      `${vals[big]} ${MINUS} ${vals[small]} = ${vals[big] - vals[small]}.`,
    ], { unit: s.unit || undefined, pics: [graphOf(s, [{ name: s.pair![0], values: a }, { name: s.pair![1], values: b }])] });
  }
}

const TEMP = STORIES[0], PLANT = STORIES[1];
const DEMO = [6, 8, 11, 14, 15, 12, 10];

const lineGraphs: SkillContent = {
  id: 'statistics-1',
  example: [
    { say: 'A line graph shows how something changes over time. Time goes along the bottom. The thing being measured goes up the side. Each dot is one reading.', pics: [graphOf(TEMP, [{ values: DEMO }], undefined, 'The temperature in a playground through one day.')] },
    { say: 'To read a value, find the time along the bottom, go straight up to the line, then straight across to the side scale. At 10:00 it was 8 degrees.', show: '10:00 → 8°C', pics: [graphOf(TEMP, [{ values: DEMO }], [1])] },
    { say: 'Check what each line on the side scale is worth. Here they go up in 2s, so a dot halfway between 10 and 12 is 11.', show: '11:00 → 11°C', pics: [graphOf(TEMP, [{ values: DEMO }], [2])] },
    { say: 'To find a difference, read both values and subtract. From 10:00 to 12:00 the temperature rose from 8 to 14 degrees, which is 6 degrees.', show: '14 − 8 = 6°C', pics: [graphOf(TEMP, [{ values: DEMO }], [1, 3])] },
    { say: 'A graph can have two lines. Use the key to see which is which, then read both at the same place. In Week 4, Plant A was 40 centimetres and Plant B was 30, so Plant A was 10 centimetres taller.', show: '40 − 30 = 10 cm', pics: [graphOf(PLANT, [{ name: 'Plant A', values: [10, 20, 30, 40, 50, 55] }, { name: 'Plant B', values: [10, 15, 20, 30, 35, 45] }])] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.7 ? readValue(r, false) : extreme(r);
    if (level === 2) { const p = r.next(); return p < 0.35 ? readValue(r, true) : p < 0.75 ? difference(r, false) : altogether(r); }
    const p = r.next();
    return p < 0.35 ? twoLines(r) : p < 0.65 ? countAbove(r) : difference(r, true);
  },
};

// ---------- 2. Tables and timetables ----------

interface Survey {
  corner: string;
  rows: string[];
  cols: string[];
  cell: (row: string, col: string) => string;
  rowTotal: (row: string) => string;
  colTotal: (col: string) => string;
  more: (row: string, a: string, b: string) => string;
}

export const SURVEYS: Survey[] = [
  {
    corner: 'Class', rows: ['Class 5A', 'Class 5B', 'Class 5C'], cols: ['Apple', 'Banana', 'Grapes', 'Orange'],
    cell: (row, col) => `How many children in ${row} chose ${col.toLowerCase()} as their favourite fruit?`,
    rowTotal: (row) => `How many children in ${row} answered altogether?`,
    colTotal: (col) => `How many children chose ${col.toLowerCase()} altogether?`,
    more: (row, a, b) => `In ${row}, how many more children chose ${a.toLowerCase()} than ${b.toLowerCase()}?`,
  },
  {
    corner: 'Day', rows: ['Friday', 'Saturday', 'Sunday'], cols: ['Adult', 'Child', 'Family', 'Student'],
    cell: (row, col) => `How many ${col} tickets were sold on ${row}?`,
    rowTotal: (row) => `How many tickets were sold on ${row} altogether?`,
    colTotal: (col) => `How many ${col} tickets were sold altogether?`,
    more: (row, a, b) => `On ${row}, how many more ${a} tickets were sold than ${b} tickets?`,
  },
  {
    corner: 'Team', rows: ['Red team', 'Blue team', 'Green team'], cols: ['Running', 'Jumping', 'Throwing', 'Swimming'],
    cell: (row, col) => `How many points did the ${row} score in ${col}?`,
    rowTotal: (row) => `How many points did the ${row} score altogether?`,
    colTotal: (col) => `How many points were scored in ${col} altogether?`,
    more: (row, a, b) => `How many more points did the ${row} score in ${a} than in ${b}?`,
  },
];

interface Counts { s: Survey; cols: string[]; n: number[][] }

function counts(r: Rng): Counts {
  const s = r.pick(SURVEYS);
  const cols = r.shuffle(s.cols).slice(0, 3);
  for (;;) {
    const n = s.rows.map(() => cols.map(() => r.int(3, 28)));
    // Every number different, so a wrong row or column always gives a wrong answer.
    if (new Set(n.flat()).size === 9) return { s, cols, n };
  }
}

const sum = (list: number[]) => list.reduce((x, y) => x + y, 0);

function surveyTable(c: Counts, opts: { totals?: boolean; hide?: [number, number]; hi?: [number, number][] } = {}): TablePicture {
  const text = (i: number, j: number) => (opts.hide?.[0] === i && opts.hide?.[1] === j ? '?' : `${c.n[i][j]}`);
  const rows = c.s.rows.map((name, i) => [name, ...c.cols.map((_, j) => text(i, j)), ...(opts.totals ? [`${sum(c.n[i])}`] : [])]);
  if (opts.totals) rows.push(['Total', ...c.cols.map((_, j) => `${sum(c.n.map((row) => row[j]))}`), `${sum(c.n.flat())}`]);
  return dataTable([c.s.corner, ...c.cols, ...(opts.totals ? ['Total'] : [])], rows, `A table with a row for each ${c.s.corner.toLowerCase()}`, { hi: opts.hi });
}

function readCell(r: Rng): Question {
  const c = counts(r);
  const i = r.int(0, 2), j = r.int(0, 2);
  return numQ(c.s.cell(c.s.rows[i], c.cols[j]), c.n[i][j], [
    `Find the row for ${c.s.rows[i]} and the column for ${c.cols[j]}.`,
    `They meet at ${c.n[i][j]}.`,
  ], { pics: [surveyTable(c)] });
}

function tableTotal(r: Rng): Question {
  const c = counts(r);
  const k = r.int(0, 2);
  if (r.next() < 0.5) {
    return numQ(c.s.rowTotal(c.s.rows[k]), sum(c.n[k]), [
      `Add the numbers along the row for ${c.s.rows[k]}.`,
      `${c.n[k].join(' + ')} = ${sum(c.n[k])}.`,
    ], { pics: [surveyTable(c)] });
  }
  const col = c.n.map((row) => row[k]);
  return numQ(c.s.colTotal(c.cols[k]), sum(col), [
    `Add the numbers down the column for ${c.cols[k]}.`,
    `${col.join(' + ')} = ${sum(col)}.`,
  ], { pics: [surveyTable(c)] });
}

function tableMore(r: Rng): Question {
  const c = counts(r);
  const i = r.int(0, 2);
  const [a, b] = r.shuffle([0, 1, 2]).slice(0, 2).sort((x, y) => c.n[i][y] - c.n[i][x]);
  return numQ(c.s.more(c.s.rows[i], c.cols[a], c.cols[b]), c.n[i][a] - c.n[i][b], [
    `Look along the row for ${c.s.rows[i]}. ${c.cols[a]} is ${c.n[i][a]} and ${c.cols[b]} is ${c.n[i][b]}.`,
    `${c.n[i][a]} ${MINUS} ${c.n[i][b]} = ${c.n[i][a] - c.n[i][b]}.`,
  ], { pics: [surveyTable(c)] });
}

function missingCell(r: Rng): Question {
  const c = counts(r);
  const i = r.int(0, 2), j = r.int(0, 2);
  const others = c.n[i].filter((_, k) => k !== j);
  return numQ('One number in this table is missing. What is it?', c.n[i][j], [
    `The row for ${c.s.rows[i]} has a total of ${sum(c.n[i])}.`,
    `Add the numbers you know in that row: ${others.join(' + ')} = ${sum(others)}.`,
    `${sum(c.n[i])} ${MINUS} ${sum(others)} = ${c.n[i][j]}.`,
  ], { pics: [surveyTable(c, { totals: true, hide: [i, j] })] });
}

// Timetables

export const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const STOPS = ['Mill Lane', 'Market Square', 'Station', 'Park Gate', 'School', 'Harbour', 'Library', 'Hill Top'];
const NAMES = ['Sam', 'Ali', 'Mia', 'Noah', 'Zara', 'Ben'];

interface Timetable { stops: string[]; times: number[][] /* [stop][bus] */ }

function timetable(r: Rng): Timetable {
  const stops = r.shuffle(STOPS).slice(0, 4);
  const first = 7 * 60 + r.int(0, 30) * 5;
  const gaps = [0, r.int(5, 9) * 5];
  gaps.push(gaps[1] + r.int(5, 9) * 5);
  const legs = [0, r.int(6, 19), r.int(6, 19), r.int(6, 19)];
  let at = first;
  const times = legs.map((leg) => { at += leg; return gaps.map((g) => at + g); });
  return { stops, times };
}

function timetablePicture(t: Timetable, hi?: [number, number][]): TablePicture {
  return dataTable(['Bus stop', 'Bus 1', 'Bus 2', 'Bus 3'], t.stops.map((s, i) => [s, ...t.times[i].map(clock)]), 'A bus timetable with four stops and three buses', { hi });
}

const twoStops = (r: Rng): [number, number] => { const a = r.int(0, 2); return [a, r.int(a + 1, 3)]; };

function readTimetable(r: Rng): Question {
  const t = timetable(r);
  const [a, c] = twoStops(r), bus = r.int(0, 2);
  const wrong = r.shuffle([...new Set(t.times.flat())].filter((x) => x !== t.times[c][bus] && x !== t.times[a][bus])).slice(0, 3).map(clock);
  return choiceOf(r, `What time does the ${clock(t.times[a][bus])} bus from ${t.stops[a]} get to ${t.stops[c]}?`, clock(t.times[c][bus]), wrong, [
    `Find ${clock(t.times[a][bus])} in the row for ${t.stops[a]}. That is Bus ${bus + 1}.`,
    `Stay in that column and go down to the row for ${t.stops[c]}.`,
    `It gets there at ${clock(t.times[c][bus])}.`,
  ], { pics: [timetablePicture(t)] });
}

function journeyTime(r: Rng): Question {
  const t = timetable(r);
  const [a, c] = twoStops(r), bus = r.int(0, 2);
  const from = t.times[a][bus], to = t.times[c][bus];
  const explain = [`Stay in one column. Bus ${bus + 1} leaves ${t.stops[a]} at ${clock(from)} and gets to ${t.stops[c]} at ${clock(to)}.`];
  const hour = Math.floor(to / 60) * 60;
  if (hour > from) explain.push(`Count on through the hour: ${clock(from)} to ${clock(hour)} is ${hour - from} minutes, then ${to - hour} more.`);
  explain.push(`The journey takes ${to - from} minutes.`);
  return numQ(`How many minutes does the bus take to get from ${t.stops[a]} to ${t.stops[c]}?`, to - from, explain, { unit: 'minutes', pics: [timetablePicture(t)] });
}

function latestBus(r: Rng): Question {
  const t = timetable(r);
  const [a, d] = twoStops(r), bus = r.int(0, 2);
  const by = t.times[d][bus] + r.int(0, 12);
  const name = r.pick(NAMES);
  const explain = [`Look along the row for ${t.stops[d]}. Find the last time that is ${clock(by)} or earlier: ${clock(t.times[d][bus])}.`];
  if (bus < 2) explain.push(`The next bus gets there at ${clock(t.times[d][bus + 1])}, which is too late.`);
  explain.push(`Go up that column to ${t.stops[a]}. The bus leaves at ${clock(t.times[a][bus])}.`);
  return choiceOf(r, `${name} must be at ${t.stops[d]} by ${clock(by)}. What time does the latest bus ${name} can catch leave ${t.stops[a]}?`, clock(t.times[a][bus]),
    t.times[a].filter((_, k) => k !== bus).map(clock), explain, { pics: [timetablePicture(t)] });
}

function waitForBus(r: Rng): Question {
  const t = timetable(r);
  const a = r.int(0, 2), bus = r.int(0, 2);
  const arrive = t.times[a][bus] - r.int(3, 22);
  const name = r.pick(NAMES);
  return numQ(`${name} gets to ${t.stops[a]} at ${clock(arrive)}. How many minutes is it until the next bus leaves?`, t.times[a][bus] - arrive, [
    `Look along the row for ${t.stops[a]}. The first time after ${clock(arrive)} is ${clock(t.times[a][bus])}.`,
    `From ${clock(arrive)} to ${clock(t.times[a][bus])} is ${t.times[a][bus] - arrive} minutes.`,
  ], { unit: 'minutes', pics: [timetablePicture(t)] });
}

const FRUIT: Counts = { s: SURVEYS[0], cols: ['Apple', 'Banana', 'Grapes'], n: [[9, 12, 7], [11, 6, 13], [8, 14, 5]] };
const BUSES: Timetable = { stops: ['Mill Lane', 'Station', 'Library', 'Harbour'], times: [[540, 575, 610], [552, 587, 622], [561, 596, 631], [578, 613, 648]] };

const tables: SkillContent = {
  id: 'statistics-2',
  example: [
    { say: 'A table sorts information into rows and columns. To find a number, go along the row and down the column until they meet. In Class 5B, 6 children chose banana.', show: 'Class 5B and Banana meet at 6', pics: [surveyTable(FRUIT, { hi: [[1, 0], [1, 2]] })] },
    { say: 'Totals come from adding a whole row or a whole column. For apple, add down the column: 9 add 11 add 8 is 28.', show: '9 + 11 + 8 = 28', pics: [surveyTable(FRUIT, { totals: true, hi: [[0, 1], [1, 1], [2, 1], [3, 1]] })] },
    { say: 'A timetable is a table of times. Each column is one bus. Read down a column to follow that bus from stop to stop.', pics: [timetablePicture(BUSES, [[0, 1], [1, 1], [2, 1], [3, 1]])] },
    { say: 'To find how long a journey takes, stay in one column. Bus 2 leaves Mill Lane at 09:35 and reaches Harbour at 10:13. That is 25 minutes to 10:00, then 13 more, so 38 minutes.', show: '25 + 13 = 38 minutes', pics: [timetablePicture(BUSES, [[0, 2], [3, 2]])] },
    { say: 'To be at the Library by 10:00, look along the Library row for the last time that is not after 10:00. That is 09:56, on Bus 2, which leaves Mill Lane at 09:35.', show: 'Catch the 09:35', pics: [timetablePicture(BUSES, [[2, 2], [0, 2]])] },
  ],
  generate(level, r) {
    if (level === 1) return r.next() < 0.5 ? readCell(r) : readTimetable(r);
    if (level === 2) { const p = r.next(); return p < 0.3 ? tableTotal(r) : p < 0.5 ? tableMore(r) : journeyTime(r); }
    const p = r.next();
    return p < 0.35 ? missingCell(r) : p < 0.7 ? latestBus(r) : waitForBus(r);
  },
};

export const STATISTICS_SKILLS: SkillContent[] = [lineGraphs, tables];
