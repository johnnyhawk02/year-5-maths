import type { Rng } from './rng';

// 1 = warm-up, 2 = core practice, 3 = greater depth.
export type Level = 1 | 2 | 3;

interface Base {
  prompt: string;
  /** An optional large line under the prompt, such as a sequence or a Roman numeral. */
  show?: string;
  /** The worked solution, one short step per line. */
  explain: string[];
}

export interface NumberQuestion extends Base {
  kind: 'number';
  answer: number;
  allowNegative?: boolean;
  /** Adds a decimal point key to the number pad. */
  decimal?: boolean;
  unit?: string;
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

export type Question = NumberQuestion | ChoiceQuestion | OrderQuestion | LineQuestion | ColumnQuestion | DivisionQuestion;
export interface DivisionResponse { quotient: number; remainder: number }
export type Response = number | string[] | DivisionResponse | null;

export interface Step {
  say: string;
  show?: string;
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
        typeof r === 'object' && !Array.isArray(r) && r.quotient === q.answer && (!q.askRemainder || r.remainder === q.remainder)
      );
    case 'order':
      return Array.isArray(r) && r.length === q.answer.length && r.every((v, i) => v === q.answer[i]);
  }
}
