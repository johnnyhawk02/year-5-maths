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

export type Question = NumberQuestion | ChoiceQuestion | OrderQuestion | LineQuestion;
export type Response = number | string[] | null;

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
    case 'choice':
    case 'line':
      return typeof r === 'number' && r === q.answer;
    case 'order':
      return Array.isArray(r) && r.length === q.answer.length && r.every((v, i) => v === q.answer[i]);
  }
}
