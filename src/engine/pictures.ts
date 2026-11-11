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

export type Picture = ChartPicture | LinePicture | ModelPicture | ArrayPicture | GridPicture;

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
