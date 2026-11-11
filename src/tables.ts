// Times tables practice: the questions for a round, and the scores kept on this device.
import type { Rng } from './engine/rng';

export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MIXED = 'mixed';
export const ROUND_SIZE = 12;

export interface Fact {
  /** The question as shown, such as "7 × 8" or "56 ÷ 7". */
  text: string;
  answer: number;
  /** The whole fact, shown after a slip: "7 × 8 = 56". */
  full: string;
}

const times = (a: number, b: number): Fact => ({ text: `${a} × ${b}`, answer: a * b, full: `${a} × ${b} = ${a * b}` });
const divide = (a: number, b: number): Fact => ({ text: `${a * b} ÷ ${a}`, answer: b, full: `${a * b} ÷ ${a} = ${b}` });

export const isTableKey = (key: string): boolean => key === MIXED || TABLES.includes(Number(key));

/** Twelve questions. One table gives every fact from 1 to 12 once. Mixed gives twelve different facts from 2 to 12. */
export function makeRound(key: string, division: boolean, r: Rng): Fact[] {
  let pairs: [number, number][];
  if (key === MIXED) {
    const seen = new Set<string>();
    pairs = [];
    while (pairs.length < ROUND_SIZE) {
      const a = r.int(2, 12), b = r.int(2, 12);
      const id = a < b ? `${a},${b}` : `${b},${a}`;
      if (seen.has(id)) continue;
      seen.add(id);
      pairs.push([a, b]);
    }
  } else {
    const n = Number(key);
    pairs = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((k) => [n, k]);
  }
  return pairs.map(([a, b]) => {
    if (division && r.next() < 0.4) return divide(a, b);
    return r.next() < 0.5 ? times(a, b) : times(b, a);
  });
}

export interface TableScore { best: number; plays: number; /** Fastest full-marks round, in seconds. */ time?: number }
export interface TablesState { timed: boolean; division: boolean; scores: Record<string, TableScore> }

const KEY = 'y5m.tables.v1';

export function loadTables(): TablesState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { timed: false, division: true, scores: {}, ...(JSON.parse(raw) as Partial<TablesState>) };
  } catch {
    /* storage unavailable */
  }
  return { timed: false, division: true, scores: {} };
}

export function saveTables(state: TablesState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Records a finished round. A time only counts when it was timed and every answer was right. */
export function recordRound(key: string, score: number, seconds: number | null): TablesState {
  const state = loadTables();
  const before = state.scores[key];
  const time = seconds !== null && score === ROUND_SIZE ? Math.min(before?.time ?? Infinity, seconds) : before?.time;
  state.scores[key] = { best: Math.max(before?.best ?? 0, score), plays: (before?.plays ?? 0) + 1, ...(time !== undefined ? { time } : {}) };
  saveTables(state);
  return state;
}

export const clock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
