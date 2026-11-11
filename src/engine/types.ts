import type { Rng } from './rng';
import type { Picture } from './pictures';
import type { Written } from './written';

// 1 = warm-up, 2 = core practice, 3 = greater depth.
export type Level = 1 | 2 | 3;

interface Base {
  prompt: string;
  /** An optional large line under the prompt, such as a sequence or a Roman numeral. */
  show?: string;
  /** The worked solution, one short step per line. */
  explain: string[];
  /** Optional fraction bars drawn under the prompt. */
  bars?: Bar[];
  /** Optional pictures drawn under the prompt, such as a shape to measure. */
  pics?: Picture[];
}

/** A bar cut into equal parts with some shaded. More shaded than parts draws extra bars. */
export interface Bar { parts: number; shaded: number }

/** A fraction or mixed number. `whole` is 0 for a plain fraction. */
export interface Frac { whole: number; num: number; den: number }

export interface NumberQuestion extends Base {
  kind: 'number';
  answer: number;
  allowNegative?: boolean;
  /** Adds a decimal point key to the number pad. */
  decimal?: boolean;
  unit?: string;
  /** An amount in pounds: shows a pound sign and the answer with two decimal places. */
  money?: boolean;
}

export interface ChoiceQuestion extends Base {
  kind: 'choice';
  options: string[];
  /** Index of the correct option. */
  answer: number;
}

export interface OrderQuestion extends Base {
  kind: 'order';
  /** The cards as first shown. */
  items: string[];
  /** The same cards in the correct order. */
  answer: string[];
}

export interface LineQuestion extends Base {
  kind: 'line';
  min: number;
  max: number;
  /** The marker snaps to multiples of this. */
  step: number;
  /** A label is drawn on every tick that is a multiple of this. */
  labelEvery: number;
  answer: number;
}

/** A written calculation set out in columns, answered one digit at a time. */
export interface ColumnQuestion extends Base {
  kind: 'column';
  op: '+' | '-' | '\u00d7';
  /** The numbers being added, or the two numbers of a subtraction or multiplication, top first. */
  rows: number[];
  /** Labels for unmarked working rows above the answer, used for long multiplication. */
  workRows?: string[];
  answer: number;
}

/** Short division set out as a "bus stop", answered left to right. */
export interface DivisionQuestion extends Base {
  kind: 'division';
  dividend: number;
  divisor: number;
  /** The whole-number quotient. */
  answer: number;
  remainder: number;
  /** Whether a remainder box is shown and marked. */
  askRemainder: boolean;
}

/** Answered by typing a numerator and denominator, with a whole-number box for mixed numbers. */
export interface FractionQuestion extends Base {
  kind: 'fraction';
  answer: Frac;
  /** Show the whole-number box and insist on a proper fraction part. */
  mixed: boolean;
  /** Only the simplest form is accepted. Otherwise any equivalent fraction is. */
  simplest?: boolean;
}

export type Question =
  | NumberQuestion | ChoiceQuestion | OrderQuestion | LineQuestion | ColumnQuestion | DivisionQuestion | FractionQuestion;
export interface DivisionResponse { quotient: number; remainder: number }
export type Response = number | string[] | DivisionResponse | Frac | null;

const hcf = (a: number, b: number): number => (b ? hcf(b, a % b) : a);

export interface Step {
  say: string;
  show?: string;
  bars?: Bar[];
  /** A written method drawn as it looks on paper at this point. */
  written?: Written;
  /** Pictures that show the idea in this step. */
  pics?: Picture[];
}

export interface SkillContent {
  id: string;
  /** The worked example, shown one step at a time. */
  example: Step[];
  generate(level: Level, rng: Rng): Question;
}

export function isCorrect(q: Question, r: Response): boolean {
  if (r === null) return false;
  switch (q.kind) {
    case 'number':
      // Decimal answers are built from typed digits, so allow for floating point noise only.
      return typeof r === 'number' && Math.abs(r - q.answer) < 1e-9;
    case 'choice':
    case 'line':
    case 'column':
      return typeof r === 'number' && r === q.answer;
    case 'division':
      return (
        typeof r === 'object' && !Array.isArray(r) && 'quotient' in r && r.quotient === q.answer && (!q.askRemainder || r.remainder === q.remainder)
      );
    case 'fraction': {
      if (typeof r !== 'object' || Array.isArray(r) || !('den' in r) || r.den <= 0) return false;
      const a = q.answer;
      // Same value, compared by cross-multiplying so no rounding is involved.
      const same = (r.whole * r.den + r.num) * a.den === (a.whole * a.den + a.num) * r.den;
      if (!same) return false;
      if (q.mixed && r.num >= r.den) return false;
      if (q.simplest && hcf(r.num, r.den) !== 1) return false;
      return true;
    }
    case 'order':
      return Array.isArray(r) && r.length === q.answer.length && r.every((v, i) => v === q.answer[i]);
  }
}
