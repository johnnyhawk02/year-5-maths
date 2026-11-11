// Pictures that show an idea: place value charts, number lines, bar models, dot arrays and hundred squares.
// They are plain data so that skills can describe a picture and the screen can draw it.

interface Common {
  /** Read out by screen readers in place of the picture. */
  alt: string;
  /** A short line of text under the picture. */
  caption?: string;
}

export interface ChartPicture extends Common {
  kind: 'chart';
  headers: string[];
  rows: string[][];
  /** Columns to pick out, by index. */
  hi?: number[];
  /** A decimal point is drawn before this column. */
  point?: number;
}

export interface LinePicture extends Common {
  kind: 'line';
  min: number;
  max: number;
  /** Gap between ticks. */
  step: number;
  labels: { at: number; text: string }[];
  points?: { at: number; text: string }[];
  jumps?: { from: number; to: number; text?: string }[];
}

export interface ModelPicture extends Common {
  kind: 'model';
  /** Bars drawn one under another. Each part's width matches its size. */
  rows: { text: string; size: number; hi?: boolean }[][];
}

export interface ArrayPicture extends Common {
  kind: 'array';
  rows: number;
  cols: number;
  /** Draws the same array several times, for layers of a cube. */
  copies?: number;
}

export interface GridPicture extends Common {
  kind: 'grid';
  /** How many of the 100 squares are shaded. */
  shaded: number;
}

export interface ShapePicture extends Common {
  kind: 'shape';
  /** Corners in order, in grid units. x goes right and y goes down. */
  points: [number, number][];
  /** Text placed at a point in grid units, such as a side length. */
  labels: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }[];
  /** Draw the unit squares inside the shape, for counting area. */
  squares?: boolean;
  /** Dashed lines inside the shape, such as where it splits into rectangles. */
  cuts?: [number, number, number, number][];
}

export interface CubesPicture extends Common {
  kind: 'cubes';
  /** A block of unit cubes: how many wide, deep and high. */
  wide: number;
  deep: number;
  high: number;
}

export interface AnglePicture extends Common {
  kind: 'angle';
  /** Directions of the arms from the corner, in degrees anticlockwise from "pointing right". */
  rays: number[];
  /** Arcs drawn between two directions, anticlockwise from `from` to `to`, with optional text. */
  arcs: { from: number; to: number; text?: string; square?: boolean }[];
  /** Draw a protractor with its centre on the corner and zero pointing right. */
  protractor?: boolean;
}

export interface DrawingPicture extends Common {
  kind: 'drawing';
  /** Size of the drawing in its own units. */
  w: number;
  h: number;
  /** Filled outlines. */
  polys?: [number, number][][];
  /** Lines as x1, y1, x2, y2, with true for a dashed (hidden) line. */
  lines?: [number, number, number, number, boolean?][];
  /** Ovals as centre x, centre y, radius x, radius y, with true for dashed. */
  ovals?: [number, number, number, number, boolean?][];
  labels?: { x: number; y: number; text: string }[];
}

export interface CoordsPicture extends Common {
  kind: 'coords';
  /** The grid runs from 0 to this number on both axes. */
  size: number;
  shapes: { points: [number, number][]; name?: string; hi?: boolean }[];
  /** A dashed mirror line: x = at (vertical) or y = at (horizontal). */
  mirror?: { vertical: boolean; at: number };
}

export interface GraphPicture extends Common {
  kind: 'graph';
  /** Labels along the bottom, one for each point. */
  xLabels: string[];
  xTitle: string;
  yTitle: string;
  /** The side scale runs from 0 to yMax with a labelled line every yStep. */
  yMax: number;
  yStep: number;
  /** One or two lines. Names are shown in a key when given. */
  series: { name?: string; values: number[] }[];
  /** Points on the first line to pick out with dashed guide lines to both scales. */
  guides?: number[];
}

export interface TablePicture extends Common {
  kind: 'table';
  headers: string[];
  /** Each row starts with its own label. */
  rows: string[][];
  /** Cells to pick out, as [row, column] counting from 0 and including the label column. */
  hi?: [number, number][];
}

export type Picture = ChartPicture | LinePicture | ModelPicture | ArrayPicture | GridPicture | ShapePicture | CubesPicture | AnglePicture | DrawingPicture | CoordsPicture | GraphPicture | TablePicture;

const WHOLE = ['O', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];
const PART = ['t', 'h', 'th'];

/**
 * A place value chart with one row per number. Numbers are given as text so that "0.40" keeps its zero.
 * `hi` names the columns to pick out, such as ['TTh'] or ['t', 'h'].
 */
export function placeChart(nums: string[], opts: { hi?: string[]; caption?: string } = {}): ChartPicture {
  const split = nums.map((n) => n.replace(/,/g, '').split('.'));
  const w = Math.max(...split.map((s) => s[0].length));
  const d = Math.max(...split.map((s) => (s[1] ?? '').length));
  const headers = [...WHOLE.slice(0, w).reverse(), ...PART.slice(0, d)];
  return {
    kind: 'chart',
    alt: `Place value chart showing ${nums.join(' and ')}`,
    caption: opts.caption,
    headers,
    rows: split.map(([i, f = '']) => [...i.padStart(w, ' '), ...f.padEnd(d, ' ')].map((c) => c.trim())),
    hi: (opts.hi ?? []).map((h) => headers.indexOf(h)).filter((i) => i >= 0),
    point: d ? w : undefined,
  };
}

/** A table with its own headings, used for things like Roman numerals. */
export const table = (headers: string[], row: string[], alt: string, caption?: string): ChartPicture => ({ kind: 'chart', alt, caption, headers, rows: [row] });

const text = (n: number): string => {
  const s = Math.abs(n) >= 1000 ? Math.abs(n).toLocaleString('en-GB') : String(Math.abs(n));
  return n < 0 ? `−${s}` : s;
};

/** A number line. `labels` lists the ticks that get a number under them. */
export function numberLine(
  min: number, max: number, step: number, labels: number[],
  opts: { points?: number[]; jumps?: [number, number, string?][]; caption?: string } = {},
): LinePicture {
  return {
    kind: 'line',
    alt: `Number line from ${text(min)} to ${text(max)}${opts.points?.length ? ` with ${opts.points.map(text).join(' and ')} marked` : ''}`,
    caption: opts.caption,
    min, max, step,
    labels: labels.map((at) => ({ at, text: text(at) })),
    points: opts.points?.map((at) => ({ at, text: text(at) })),
    jumps: opts.jumps?.map(([from, to, t]) => ({ from, to, text: t })),
  };
}

type Part = [string, number, boolean?];
/** A bar model. Each row is a list of [text, size] parts; add true to pick a part out. */
export const barModel = (rows: Part[][], alt: string, caption?: string): ModelPicture => ({
  kind: 'model', alt, caption, rows: rows.map((r) => r.map(([t, size, hi]) => ({ text: t, size, hi }))),
});

export const dotArray = (rows: number, cols: number, caption?: string, copies?: number): ArrayPicture => ({
  kind: 'array', alt: `${copies ? `${copies} lots of ` : ''}${rows} rows of ${cols} dots`, caption, rows, cols, copies,
});

export const hundredSquare = (shaded: number, caption?: string): GridPicture => ({
  kind: 'grid', alt: `A hundred square with ${shaded} of the 100 squares shaded`, caption, shaded,
});

/** A number line whose labels and points carry their own text, such as times or measures. */
export function scaleLine(
  min: number, max: number, step: number, labels: [number, string][],
  opts: { points?: [number, string][]; jumps?: [number, number, string?][]; caption?: string; alt?: string } = {},
): LinePicture {
  return {
    kind: 'line',
    alt: opts.alt ?? `A scale from ${labels[0][1]} to ${labels[labels.length - 1][1]}`,
    caption: opts.caption,
    min, max, step,
    labels: labels.map(([at, t]) => ({ at, text: t })),
    points: opts.points?.map(([at, t]) => ({ at, text: t })),
    jumps: opts.jumps?.map(([from, to, t]) => ({ from, to, text: t })),
  };
}

/** A rectangle with its width labelled underneath and its height labelled at the side. */
export function rectangle(w: number, h: number, wText: string, hText: string, opts: { squares?: boolean; caption?: string; scale?: number } = {}): ShapePicture {
  // Long thin rectangles are drawn to a gentler shape so the labels stay readable.
  const k = opts.scale ?? 1;
  const dw = w * k, dh = h * k;
  return {
    kind: 'shape',
    alt: `A rectangle ${wText} wide and ${hText} high`,
    caption: opts.caption,
    points: [[0, 0], [dw, 0], [dw, dh], [0, dh]],
    labels: [{ x: dw / 2, y: dh + 0.7, text: wText }, { x: -0.3, y: dh / 2, text: hText, anchor: 'end' }],
    squares: opts.squares,
  };
}

/**
 * An L shape: a w by h rectangle with a cw by ch corner cut from the top right.
 * Labels are given in order: bottom, left, top, step down, step across, right.
 */
export function lShape(w: number, h: number, cw: number, ch: number, texts: string[], opts: { squares?: boolean; caption?: string; cut?: boolean } = {}): ShapePicture {
  const [bottom, left, top, down, across, right] = texts;
  return {
    kind: 'shape',
    alt: 'An L shape made from two rectangles',
    caption: opts.caption,
    points: [[0, 0], [w - cw, 0], [w - cw, ch], [w, ch], [w, h], [0, h]],
    labels: [
      { x: w / 2, y: h + 0.7, text: bottom }, { x: -0.3, y: h / 2, text: left, anchor: 'end' as const }, { x: (w - cw) / 2, y: -0.35, text: top },
      { x: w - cw + 0.25, y: ch / 2, text: down, anchor: 'start' as const }, { x: w - cw / 2, y: ch - 0.35, text: across }, { x: w + 0.25, y: (h + ch) / 2, text: right, anchor: 'start' as const },
    ].filter((l) => l.text),
    squares: opts.squares,
    cuts: opts.cut ? [[0, ch, w - cw, ch]] : undefined,
  };
}

export const cubes = (wide: number, deep: number, high: number, caption?: string): CubesPicture => ({
  kind: 'cubes', alt: `A block of cubes ${wide} wide, ${deep} deep and ${high} high`, caption, wide, deep, high,
});

/** An angle between two arms, with an arc. `text` labels the arc, such as "40°" or "?". */
export function angle(from: number, to: number, text?: string, opts: { protractor?: boolean; caption?: string } = {}): AnglePicture {
  const size = (((to - from) % 360) + 360) % 360;
  return {
    kind: 'angle', alt: opts.protractor ? 'An angle with a protractor placed on it' : `An angle of about ${size} degrees`, caption: opts.caption,
    rays: [from, to], arcs: [{ from, to, text, square: size === 90 }], protractor: opts.protractor,
  };
}

/** Several angles round one corner. `turns` are the sizes in order, starting from `start` and going anticlockwise. */
export function anglesAround(start: number, turns: number[], texts: (string | undefined)[], caption?: string): AnglePicture {
  const rays = [start];
  for (const t of turns) rays.push(rays[rays.length - 1] + t);
  return {
    kind: 'angle', alt: `${turns.length} angles meeting at a point`, caption,
    rays: [...new Set(rays.map((d) => ((d % 360) + 360) % 360))],
    arcs: turns.map((t, i) => ({ from: rays[i], to: rays[i] + t, text: texts[i], square: t === 90 })),
  };
}

/** A polygon with n corners on a circle. Uneven `radii` make it irregular. */
export function polygon(n: number, radii?: number[], caption?: string): DrawingPicture {
  const pts: [number, number][] = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + (n % 2 ? 0 : Math.PI / n);
    const r = 1.5 * (radii?.[i] ?? 1);
    return [Math.round((1.6 + r * Math.cos(a)) * 100) / 100, Math.round((1.6 + r * Math.sin(a)) * 100) / 100];
  });
  return { kind: 'drawing', alt: `A shape with ${n} straight sides`, caption, w: 3.2, h: 3.2, polys: [pts] };
}

export function coords(size: number, shapes: CoordsPicture['shapes'], opts: { mirror?: CoordsPicture['mirror']; caption?: string } = {}): CoordsPicture {
  return { kind: 'coords', alt: `A coordinate grid from 0 to ${size}`, caption: opts.caption, size, shapes, mirror: opts.mirror };
}

export function lineGraph(g: Omit<GraphPicture, 'kind' | 'alt'> & { caption?: string }): GraphPicture {
  return { kind: 'graph', alt: `A line graph of ${g.yTitle.toLowerCase()} against ${g.xTitle.toLowerCase()}`, ...g };
}

export function dataTable(headers: string[], rows: string[][], alt: string, opts: { hi?: [number, number][]; caption?: string } = {}): TablePicture {
  return { kind: 'table', alt, headers, rows, hi: opts.hi, caption: opts.caption };
}
