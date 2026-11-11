// Written methods drawn the way they are set out on paper, one stage at a time.
// Each function returns a picture of the working after `done` steps, with the newest marks highlighted.
import { fmt } from './format';

export interface WCell {
  /** The digit, or '' for an empty place. */
  d: string;
  /** Just written in this step. */
  hi?: boolean;
  /** Crossed out, with the new value written small above it. */
  struck?: boolean;
  above?: string;
  /** A small digit written just in front, such as an exchanged ten or a carried remainder. */
  pre?: string;
}

export interface WRow {
  /** A sign in the left margin. */
  op?: string;
  cells: WCell[];
  /** Small digits, used for the carry row. */
  small?: boolean;
}

export interface ColumnPicture {
  kind: 'column';
  alt: string;
  cols: number;
  rows: (WRow | 'rule')[];
}

export interface DivisionPicture {
  kind: 'division';
  alt: string;
  divisor: number;
  digits: WCell[];
  answer: WCell[];
  /** Shown after the answer as "r 3" once the working is finished. */
  remainder?: number;
}

export type Written = ColumnPicture | DivisionPicture;

const digitsOf = (n: number, width: number): number[] => String(n).padStart(width, '0').split('').map(Number);
const numberRow = (n: number, width: number, op?: string): WRow => ({ op, cells: String(n).padStart(width, ' ').split('').map((d) => ({ d: d.trim() })) });
const blankRow = (width: number): WCell[] => Array.from({ length: width }, () => ({ d: '' }));

/** How many steps the addition takes: one for each column of the answer. */
export const additionSteps = (rows: number[]): number => String(rows.reduce((a, b) => a + b, 0)).length;

/** Column addition after `done` columns, counted from the ones. Carried digits sit small under the answer line. */
export function additionPicture(rows: number[], done: number): Written {
  const total = rows.reduce((a, b) => a + b, 0);
  const width = String(total).length;
  const answer = blankRow(width);
  const carries = blankRow(width);
  let carry = 0;
  for (let step = 0; step < Math.min(done, width); step++) {
    const col = width - 1 - step;
    const sum = rows.reduce((a, r) => a + digitsOf(r, width)[col], 0) + carry;
    const latest = step === done - 1;
    answer[col] = { d: String(sum % 10), hi: latest };
    carry = Math.floor(sum / 10);
    // A carry is written in the next column to the left, unless it is the last digit of the answer.
    if (carry && col > 0 && rows.some((r) => String(r).length >= width - col + 1)) carries[col - 1] = { d: String(carry), hi: latest };
  }
  return {
    kind: 'column',
    alt: `${rows.map(fmt).join(' + ')} set out in columns`,
    cols: width,
    rows: [...rows.map((r, i) => numberRow(r, width, i === rows.length - 1 ? '+' : undefined)), 'rule', { cells: answer }, 'rule', { cells: carries, small: true }],
  };
}

export const subtractionSteps = (a: number): number => String(a).length;

/** Column subtraction after `done` columns. Exchanged digits are crossed out with the new value above. */
export function subtractionPicture(a: number, b: number, done: number): Written {
  const width = String(a).length;
  const top = digitsOf(a, width);
  const cur = [...top];
  const bottom = digitsOf(b, width);
  const answer = blankRow(width);
  const touched = new Set<number>();
  for (let step = 0; step < Math.min(done, width); step++) {
    const col = width - 1 - step;
    const latest = step === done - 1;
    if (latest) touched.clear();
    if (cur[col] < bottom[col]) {
      // Exchange from the nearest column on the left that has something to give.
      let j = col - 1;
      while (cur[j] === 0) j--;
      cur[j]--;
      touched.add(j);
      for (let k = j + 1; k < col; k++) { cur[k] = 9; touched.add(k); }
      cur[col] += 10;
      touched.add(col);
    }
    const d = cur[col] - bottom[col];
    // Leading zeros of the answer are left blank.
    const leading = d === 0 && a - b < 10 ** step;
    answer[col] = { d: leading ? '' : String(d), hi: latest };
  }
  const topCells: WCell[] = top.map((orig, i) => {
    const hi = touched.has(i);
    if (cur[i] === orig) return { d: String(orig) };
    if (cur[i] === orig + 10) return { d: String(orig), pre: '1', hi };
    return { d: String(orig), struck: true, above: String(cur[i]), hi };
  });
  return {
    kind: 'column',
    alt: `${fmt(a)} − ${fmt(b)} set out in columns`,
    cols: width,
    rows: [{ cells: topCells }, numberRow(b, width, '−'), 'rule', { cells: answer }],
  };
}

export const shortMultiplicationSteps = (a: number, b: number): number => String(a * b).length;

/** Multiplying by one digit after `done` columns, with carried digits small under the answer line. */
export function shortMultiplicationPicture(a: number, b: number, done: number): Written {
  const width = String(a * b).length;
  const top = digitsOf(a, width);
  const places = String(a).length;
  const answer = blankRow(width);
  const carries = blankRow(width);
  let carry = 0;
  for (let step = 0; step < Math.min(done, width); step++) {
    const col = width - 1 - step;
    const latest = step === done - 1;
    const product = (step < places ? top[col] * b : 0) + carry;
    answer[col] = { d: String(product % 10), hi: latest };
    carry = Math.floor(product / 10);
    if (carry && step < places - 1) carries[col - 1] = { d: String(carry), hi: latest };
  }
  return {
    kind: 'column',
    alt: `${fmt(a)} × ${b} set out in columns`,
    cols: width,
    rows: [numberRow(a, width), numberRow(b, width, '×'), 'rule', { cells: answer }, 'rule', { cells: carries, small: true }],
  };
}

export const LONG_MULTIPLICATION_STEPS = 4;

/**
 * Long multiplication by a two-digit number in four stages:
 * 1 the ones row, 2 the zero that starts the tens row, 3 the rest of the tens row, 4 the two rows added.
 */
export function longMultiplicationPicture(a: number, b: number, done: number): Written {
  const ones = b % 10, tens = Math.floor(b / 10);
  const width = String(a * b).length;
  const mark = (row: WRow, on: boolean): WRow => ({ ...row, cells: row.cells.map((c) => (c.d ? { ...c, hi: on } : c)) });
  const rows: (WRow | 'rule')[] = [numberRow(a, width), numberRow(b, width, '×'), 'rule'];
  rows.push(done >= 1 ? mark(numberRow(a * ones, width), done === 1) : { cells: blankRow(width) });
  if (done === 2) {
    const cells = blankRow(width);
    cells[width - 1] = { d: '0', hi: true };
    rows.push({ cells });
  } else if (done >= 3) {
    const row = mark(numberRow(a * tens * 10, width, done >= 4 ? '+' : undefined), done === 3);
    rows.push(row);
  } else rows.push({ cells: blankRow(width) });
  rows.push('rule');
  rows.push(done >= 4 ? mark(numberRow(a * b, width), true) : { cells: blankRow(width) });
  return { kind: 'column', alt: `${fmt(a)} × ${b} set out as long multiplication`, cols: width, rows };
}

export const divisionSteps = (dividend: number): number => String(dividend).length;

/** Short division after `done` digits, working from the left. Each remainder is carried small in front of the next digit. */
export function divisionPicture(dividend: number, divisor: number, done: number): Written {
  const ds = String(dividend).split('').map(Number);
  const digits: WCell[] = ds.map((d) => ({ d: String(d) }));
  const answer = blankRow(ds.length);
  let carry = 0;
  for (let i = 0; i < Math.min(done, ds.length); i++) {
    const latest = i === done - 1;
    const value = carry * 10 + ds[i];
    answer[i] = { d: String(Math.floor(value / divisor)), hi: latest };
    carry = value % divisor;
    if (carry && i + 1 < ds.length) digits[i + 1] = { ...digits[i + 1], pre: String(carry), hi: latest };
  }
  const finished = done >= ds.length;
  return {
    kind: 'division',
    alt: `${fmt(dividend)} ÷ ${divisor} set out as short division`,
    divisor,
    digits,
    answer,
    remainder: finished && carry ? carry : undefined,
  };
}
