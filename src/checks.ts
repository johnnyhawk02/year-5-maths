// Checks: a start check, a test for each unit and an end of year check.
import { UNITS } from './curriculum';
import type { Rng } from './engine/rng';
import type { Level } from './engine/types';
import { loadProgress } from './progress';
import { REVIEW_SIZE, dueSkills, loadReview, type ReviewState } from './review';

export interface Slot { skillId: string; level: Level }

export interface CheckResult {
  score: number;
  total: number;
  date: string;
  /** Skills with at least one wrong answer. */
  missed: string[];
}

export type Checks = Record<string, { last: CheckResult; best: number }>;

export const CHECK_PASS = 0.8;

const KEY = 'y5m.checks.v1';

export function checkTitle(id: string): string {
  if (id === 'start') return 'Start check';
  if (id === 'end') return 'End of year check';
  const unit = UNITS.find((u) => u.id === id);
  return unit ? `Unit ${unit.number} test` : 'Check';
}

export const isCheckId = (id: string): boolean => id === 'start' || id === 'end' || UNITS.some((u) => u.id === id);

/** The questions for a check, as skills and levels. */
export function checkPlan(id: string, r: Rng): Slot[] {
  if (id === 'start') {
    // Two easy questions from each unit, to see what is already known.
    return UNITS.flatMap((u) => r.shuffle(u.skills).slice(0, 2).map((s): Slot => ({ skillId: s.id, level: 1 })));
  }
  if (id === 'end') {
    return UNITS.flatMap((u) => r.shuffle(u.skills).slice(0, u.skills.length >= 7 ? 3 : 2).map((s, i): Slot => ({ skillId: s.id, level: i % 2 ? 3 : 2 })));
  }
  const unit = UNITS.find((u) => u.id === id);
  if (!unit) return [];
  // About ten questions, covering every skill in the unit.
  const each = Math.max(1, Math.round(10 / unit.skills.length));
  const levels: Level[] = [2, 3, 2, 1, 2];
  return unit.skills.flatMap((s) => Array.from({ length: each }, (_, k): Slot => ({ skillId: s.id, level: levels[k % levels.length] })));
}

/** Today's review questions: one for each skill that is due, up to the daily limit. */
export function reviewPlan(state: ReviewState, today: string): Slot[] {
  return dueSkills(state, today).slice(0, REVIEW_SIZE).map((skillId) => ({ skillId, level: state[skillId].box >= 3 ? 3 : 2 }));
}

export function todaysReview(today: string): Slot[] {
  return reviewPlan(loadReview(loadProgress(), today), today);
}

export function loadChecks(): Checks {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Checks;
  } catch {
    /* storage unavailable */
  }
  return {};
}

export function recordCheck(id: string, score: number, total: number, missed: string[]): void {
  const all = loadChecks();
  const last: CheckResult = { score, total, date: new Date().toISOString(), missed: [...new Set(missed)] };
  all[id] = { last, best: Math.max(all[id]?.best ?? 0, score) };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
