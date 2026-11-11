// Spaced review: a ticked skill comes back after 1 day, then 3, 7, 14 and 30 days.
// A wrong answer sends it back to the start. Kept on this device.
import type { Progress } from './progress';

export interface ReviewEntry {
  /** How many times in a row it has been answered correctly in review, capped at the last interval. */
  box: number;
  /** The day it is next due, as YYYY-MM-DD. */
  due: string;
}

export type ReviewState = Record<string, ReviewEntry>;

export const INTERVALS = [1, 3, 7, 14, 30];
export const REVIEW_SIZE = 8;

const KEY = 'y5m.review.v1';

export const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

/** A newly ticked skill joins the review list, first due tomorrow. */
export function enrol(state: ReviewState, skillId: string, today: string): ReviewState {
  return state[skillId] ? state : { ...state, [skillId]: { box: 0, due: addDays(today, INTERVALS[0]) } };
}

/** A right answer moves the skill to a longer gap. A wrong one brings it back tomorrow. */
export function answered(state: ReviewState, skillId: string, correct: boolean, today: string): ReviewState {
  const box = correct ? Math.min((state[skillId]?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
  return { ...state, [skillId]: { box, due: addDays(today, INTERVALS[box]) } };
}

/** Skills due today or earlier, longest overdue first. */
export function dueSkills(state: ReviewState, today: string): string[] {
  return Object.keys(state)
    .filter((id) => state[id].due <= today)
    .sort((a, b) => (state[a].due === state[b].due ? a.localeCompare(b) : state[a].due.localeCompare(state[b].due)));
}

function save(state: ReviewState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** The saved review list. Skills ticked before review existed are added, due today. */
export function loadReview(progress: Progress, today = dayKey(new Date())): ReviewState {
  let state: ReviewState = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw) as ReviewState;
  } catch {
    /* storage unavailable */
  }
  for (const id of Object.keys(progress)) if (progress[id].ticked && !state[id]) state = { ...state, [id]: { box: 0, due: today } };
  return state;
}

export function recordEnrol(progress: Progress, skillId: string): void {
  const today = dayKey(new Date());
  // Load without the new tick so that this skill starts tomorrow rather than today.
  const others = Object.fromEntries(Object.entries(progress).filter(([id]) => id !== skillId));
  save(enrol(loadReview(others, today), skillId, today));
}

export function recordReview(progress: Progress, skillId: string, correct: boolean): void {
  const today = dayKey(new Date());
  save(answered(loadReview(progress, today), skillId, correct, today));
}
