import { describe, expect, it } from 'vitest';
import { eraseAll, makeBackup, readBackup, restoreBackup } from '../src/backup';
import { checkPlan, checkTitle, isCheckId, reviewPlan } from '../src/checks';
import { UNITS } from '../src/curriculum';
import { makeRng } from '../src/engine/rng';
import { INTERVALS, REVIEW_SIZE, addDays, answered, dayKey, dueSkills, enrol, type ReviewState } from '../src/review';
import { hasContent } from '../src/skills';

describe('spaced review', () => {
  it('counts days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-25', 7)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('brings a new skill back the next day, then after longer gaps', () => {
    let s: ReviewState = enrol({}, 'a-1', '2026-11-11');
    expect(s['a-1']).toEqual({ box: 0, due: '2026-11-12' });
    expect(dueSkills(s, '2026-11-11')).toEqual([]);
    expect(dueSkills(s, '2026-11-12')).toEqual(['a-1']);
    let day = '2026-11-12';
    for (const gap of INTERVALS.slice(1)) {
      s = answered(s, 'a-1', true, day);
      expect(s['a-1'].due).toBe(addDays(day, gap));
      day = s['a-1'].due;
    }
    // After the longest gap it stays there.
    s = answered(s, 'a-1', true, day);
    expect(s['a-1'].due).toBe(addDays(day, INTERVALS.at(-1)!));
  });

  it('sends a missed skill back to tomorrow', () => {
    let s: ReviewState = { 'a-1': { box: 3, due: '2026-11-11' } };
    s = answered(s, 'a-1', false, '2026-11-11');
    expect(s['a-1']).toEqual({ box: 0, due: '2026-11-12' });
  });

  it('does not enrol a skill twice', () => {
    const s: ReviewState = { 'a-1': { box: 2, due: '2026-12-01' } };
    expect(enrol(s, 'a-1', '2026-11-11')).toBe(s);
  });

  it('asks the longest overdue first and stops at the daily limit', () => {
    const s: ReviewState = {};
    for (let i = 0; i < 12; i++) s[`place-value-${i}`] = { box: i % 5, due: addDays('2026-11-01', i) };
    const plan = reviewPlan(s, '2026-11-11');
    expect(plan.length).toBe(REVIEW_SIZE);
    expect(plan[0].skillId).toBe('place-value-0');
    expect(plan.every((p) => p.level === (s[p.skillId].box >= 3 ? 3 : 2))).toBe(true);
    expect(reviewPlan(s, '2026-10-31')).toEqual([]);
  });
});

describe('checks', () => {
  it('unit tests cover every skill in the unit with about ten questions', () => {
    for (const u of UNITS) {
      const plan = checkPlan(u.id, makeRng(1));
      expect(new Set(plan.map((p) => p.skillId))).toEqual(new Set(u.skills.map((s) => s.id)));
      expect(plan.length).toBeGreaterThanOrEqual(7);
      expect(plan.length).toBeLessThanOrEqual(14);
      expect(checkTitle(u.id)).toBe(`Unit ${u.number} test`);
    }
  });

  it('start and end checks draw from every unit', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const start = checkPlan('start', makeRng(seed)), end = checkPlan('end', makeRng(seed));
      expect(start.length).toBe(16);
      expect(end.length).toBe(20);
      for (const plan of [start, end]) {
        for (const u of UNITS) expect(plan.some((p) => p.skillId.startsWith(`${u.id}-`))).toBe(true);
        expect(new Set(plan.map((p) => p.skillId)).size).toBe(plan.length);
        expect(plan.every((p) => hasContent(p.skillId))).toBe(true);
      }
      expect(start.every((p) => p.level === 1)).toBe(true);
    }
  });

  it('knows which check names are real', () => {
    expect(isCheckId('start')).toBe(true);
    expect(isCheckId('geometry')).toBe(true);
    expect(isCheckId('nonsense')).toBe(false);
    expect(checkPlan('nonsense', makeRng(1))).toEqual([]);
  });
});

describe('backup', () => {
  const fakeStore = (initial: Record<string, string>) => {
    const m = new Map(Object.entries(initial));
    return {
      get length() { return m.size; },
      key: (i: number) => [...m.keys()][i] ?? null,
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      dump: () => Object.fromEntries(m),
    };
  };

  it('saves only this app\'s data and puts it back exactly', () => {
    const a = fakeStore({ 'y5m.progress.v1': '{"place-value-1":{"best":9,"ticked":true,"attempts":2,"last":"2026-11-11T10:00:00.000Z"}}', 'y5m.settings.v1': '{"page":"grey"}', other: 'keep me' });
    const text = JSON.stringify(makeBackup(a, new Date('2026-11-11T12:00:00Z')));
    const backup = readBackup(text)!;
    expect(Object.keys(backup.data).sort()).toEqual(['y5m.progress.v1', 'y5m.settings.v1']);
    const b = fakeStore({ 'y5m.progress.v1': '{}', 'y5m.tables.v1': '{"old":1}', mine: 'untouched' });
    restoreBackup(b, backup);
    expect(b.dump()).toEqual({ 'y5m.progress.v1': a.getItem('y5m.progress.v1'), 'y5m.settings.v1': '{"page":"grey"}', mine: 'untouched' });
  });

  it('refuses files that are not backups', () => {
    expect(readBackup('hello')).toBeNull();
    expect(readBackup('{"app":"something-else","version":1,"data":{}}')).toBeNull();
    expect(readBackup('{"app":"year-5-maths","version":1,"data":{"other.key":"{}"}}')).toBeNull();
    expect(readBackup('{"app":"year-5-maths","version":1,"data":{"y5m.progress.v1":"not json"}}')).toBeNull();
    expect(readBackup('{"app":"year-5-maths","version":1,"data":{"y5m.progress.v1":"{}"}}')).not.toBeNull();
  });

  it('erases only this app\'s data', () => {
    const s = fakeStore({ 'y5m.progress.v1': '{}', 'y5m.review.v1': '{}', other: 'x' });
    eraseAll(s);
    expect(s.dump()).toEqual({ other: 'x' });
  });
});
