// Backup and restore of everything the app keeps on this device.
const PREFIX = 'y5m.';

export interface Backup { app: 'year-5-maths'; version: 1; saved: string; data: Record<string, string> }

type Store = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

const ownKeys = (store: Store): string[] =>
  Array.from({ length: store.length }, (_, i) => store.key(i)).filter((k): k is string => !!k && k.startsWith(PREFIX));

export function makeBackup(store: Store, now = new Date()): Backup {
  const data: Record<string, string> = {};
  for (const k of ownKeys(store)) data[k] = store.getItem(k) ?? '';
  return { app: 'year-5-maths', version: 1, saved: now.toISOString(), data };
}

/** Checks that text is one of our backups. Returns null if it is not. */
export function readBackup(text: string): Backup | null {
  try {
    const b = JSON.parse(text) as Backup;
    if (b?.app !== 'year-5-maths' || b.version !== 1 || typeof b.data !== 'object' || b.data === null) return null;
    for (const [k, v] of Object.entries(b.data)) {
      if (!k.startsWith(PREFIX) || typeof v !== 'string') return null;
      JSON.parse(v);
    }
    return b;
  } catch {
    return null;
  }
}

/** Replaces what is on this device with the backup. */
export function restoreBackup(store: Store, b: Backup): void {
  for (const k of ownKeys(store)) store.removeItem(k);
  for (const [k, v] of Object.entries(b.data)) store.setItem(k, v);
}

export function eraseAll(store: Store): void {
  for (const k of ownKeys(store)) store.removeItem(k);
}
