// What the child has done so far, kept on this device.
import { UNITS } from './curriculum';
import { hasContent } from './skills';
import { recordEnrol } from './review';

export interface SkillProgress {
  best: number; // best score out of 10
  ticked: boolean;
  attempts: number;
  last: string; // ISO date of the latest practice
}

export type Progress = Record<string, SkillProgress>;

export const SET_SIZE = 10;
export const PASS_MARK = 8;

const KEY = 'y5m.progress.v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    /* storage unavailable */
  }
  return {};
}

export function recordPractice(skillId: string, score: number): Progress {
  const all = loadProgress();
  const before = all[skillId];
  all[skillId] = {
    best: Math.max(before?.best ?? 0, score),
    ticked: (before?.ticked ?? false) || score >= PASS_MARK,
    attempts: (before?.attempts ?? 0) + 1,
    last: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  // A skill ticked for the first time joins the daily review list.
  if (all[skillId].ticked && !before?.ticked) recordEnrol(all, skillId);
  return all;
}

export const tickedCount = (p: Progress, ids?: string[]): number =>
  (ids ?? Object.keys(p)).filter((id) => p[id]?.ticked).length;

/** The first skill with lessons that is not ticked yet, in map order. */
export function nextSkill(p: Progress): { unit: string; id: string; name: string } | null {
  for (const u of UNITS) {
    for (const s of u.skills) {
      if (hasContent(s.id) && !p[s.id]?.ticked) return { unit: u.name, id: s.id, name: s.name };
    }
  }
  return null;
}
