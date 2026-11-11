// The whole look is driven by a handful of colour values. Every choice offered
// here has been checked to keep text readable (at least 4.5:1) on every page colour.

export interface PageChoice { id: string; name: string; page: string; panel: string; dark: boolean }
export interface Swatch { id: string; name: string; light: string; dark: string }
export interface InkChoice { id: string; name: string; value: string; forDark: boolean }

export const PAGES: PageChoice[] = [
  { id: 'grey', name: 'Grey', page: '#D9D9D9', panel: '#E8E8E8', dark: false },
  { id: 'white', name: 'White', page: '#FFFFFF', panel: '#F0F0F0', dark: false },
  { id: 'cream', name: 'Cream', page: '#F4EEDD', panel: '#FBF7EC', dark: false },
  { id: 'dark', name: 'Dark', page: '#1C1C1E', panel: '#2C2C2E', dark: true },
];

export const INKS: InkChoice[] = [
  { id: 'black', name: 'Black', value: '#111111', forDark: false },
  { id: 'navy', name: 'Navy', value: '#14213D', forDark: false },
  { id: 'brown', name: 'Brown', value: '#3A2618', forDark: false },
  { id: 'white', name: 'White', value: '#F2F2F2', forDark: true },
  { id: 'warm', name: 'Warm white', value: '#EDE6D6', forDark: true },
];

// Each spot colour has a deep version for light pages and a pale version for the dark page.
export const SPOTS: Swatch[] = [
  { id: 'blue', name: 'Blue', light: '#0A3FD0', dark: '#8AB4FF' },
  { id: 'orange', name: 'Orange', light: '#A83600', dark: '#FFA45C' },
  { id: 'green', name: 'Green', light: '#0B6B2E', dark: '#6FD08C' },
  { id: 'purple', name: 'Purple', light: '#6A1FB5', dark: '#C9A2FF' },
  { id: 'red', name: 'Red', light: '#B3122A', dark: '#FF8A8A' },
  { id: 'teal', name: 'Teal', light: '#00626B', dark: '#5FD3DC' },
  { id: 'pink', name: 'Pink', light: '#A8156E', dark: '#FF8CCB' },
];

export type TextSize = 'normal' | 'large' | 'larger';

export interface Settings {
  page: string;
  ink: string;
  spot1: string;
  spot2: string;
  textSize: TextSize;
  sound: boolean;
  reduceMotion: boolean;
}

export const DEFAULTS: Settings = {
  page: 'grey',
  ink: 'black',
  spot1: 'blue',
  spot2: 'orange',
  textSize: 'normal',
  sound: true,
  reduceMotion: false,
};

const KEY = 'y5m.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalise({ ...DEFAULTS, ...JSON.parse(raw) });
  } catch {
    /* storage unavailable: fall back to defaults */
  }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const find = <T extends { id: string }>(list: T[], id: string, fallback: string): T =>
  list.find((x) => x.id === id) ?? list.find((x) => x.id === fallback)!;

// Keeps a saved or edited set of choices valid: known ids only, an ink that
// suits the page, and two different spot colours.
export function normalise(s: Settings): Settings {
  const page = find(PAGES, s.page, DEFAULTS.page);
  let ink = INKS.find((i) => i.id === s.ink);
  if (!ink || ink.forDark !== page.dark) ink = INKS.find((i) => i.forDark === page.dark)!;
  const spot1 = find(SPOTS, s.spot1, DEFAULTS.spot1);
  let spot2 = find(SPOTS, s.spot2, DEFAULTS.spot2);
  if (spot2.id === spot1.id) spot2 = SPOTS.find((x) => x.id !== spot1.id)!;
  const textSize: TextSize = (['normal', 'large', 'larger'] as const).includes(s.textSize) ? s.textSize : 'normal';
  return {
    page: page.id,
    ink: ink.id,
    spot1: spot1.id,
    spot2: spot2.id,
    textSize,
    sound: !!s.sound,
    reduceMotion: !!s.reduceMotion,
  };
}

const SCALE: Record<TextSize, string> = { normal: '1', large: '1.15', larger: '1.3' };

export function applySettings(s: Settings): void {
  const page = find(PAGES, s.page, DEFAULTS.page);
  const ink = find(INKS, s.ink, DEFAULTS.ink);
  const spot1 = find(SPOTS, s.spot1, DEFAULTS.spot1);
  const spot2 = find(SPOTS, s.spot2, DEFAULTS.spot2);
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set('--page', page.page);
  set('--panel', page.panel);
  set('--ink', ink.value);
  set('--spot1', page.dark ? spot1.dark : spot1.light);
  set('--spot2', page.dark ? spot2.dark : spot2.light);
  set('--on-spot', page.dark ? page.page : '#FFFFFF');
  set('--scale', SCALE[s.textSize]);
  root.dataset.motion = s.reduceMotion ? 'reduce' : 'auto';
  root.style.colorScheme = page.dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', page.page);
}
