// The look is driven by two choices: the page colour and one spot colour. Every choice offered
// here has been checked to keep text readable (at least 4.5:1) on every page colour.

export interface PageChoice { id: string; name: string; page: string; panel: string; dark: boolean }
export interface Swatch { id: string; name: string; light: string; dark: string }
export const PAGES: PageChoice[] = [
  { id: 'grey', name: 'Grey', page: '#D9D9D9', panel: '#E8E8E8', dark: false },
  { id: 'white', name: 'White', page: '#FFFFFF', panel: '#F0F0F0', dark: false },
  { id: 'cream', name: 'Cream', page: '#F4EEDD', panel: '#FBF7EC', dark: false },
  { id: 'dark', name: 'Dark', page: '#1C1C1E', panel: '#2C2C2E', dark: true },
];

// Writing is always near black on light pages and near white on the dark page.
const INK = { light: '#111111', dark: '#F2F2F2' };

// Right and wrong keep their own colours whatever spot colour is chosen.
const GOOD = { light: '#0B6B2E', dark: '#6FD08C' };
const BAD = { light: '#B3122A', dark: '#FF8A8A' };

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
  spot: string;
  textSize: TextSize;
  sound: boolean;
  reduceMotion: boolean;
  helper: boolean;
}

export const DEFAULTS: Settings = {
  page: 'grey',
  spot: 'blue',
  textSize: 'normal',
  sound: true,
  reduceMotion: false,
  helper: true,
};

const KEY = 'y5m.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Older saves had two spot colours: the first one carries over.
      return normalise({ ...DEFAULTS, ...saved, spot: saved.spot ?? saved.spot1 ?? DEFAULTS.spot });
    }
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

// Keeps a saved or edited set of choices valid: known ids only.
export function normalise(s: Settings): Settings {
  const textSize: TextSize = (['normal', 'large', 'larger'] as const).includes(s.textSize) ? s.textSize : 'normal';
  return {
    page: find(PAGES, s.page, DEFAULTS.page).id,
    spot: find(SPOTS, s.spot, DEFAULTS.spot).id,
    textSize,
    sound: !!s.sound,
    reduceMotion: !!s.reduceMotion,
    helper: s.helper !== false,
  };
}

const SCALE: Record<TextSize, string> = { normal: '1', large: '1.15', larger: '1.3' };

export function applySettings(s: Settings): void {
  const page = find(PAGES, s.page, DEFAULTS.page);
  const spot = find(SPOTS, s.spot, DEFAULTS.spot);
  const tone = page.dark ? 'dark' : 'light';
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set('--page', page.page);
  set('--panel', page.panel);
  set('--ink', INK[tone]);
  set('--spot1', spot[tone]);
  set('--good', GOOD[tone]);
  set('--bad', BAD[tone]);
  set('--on-spot', page.dark ? page.page : '#FFFFFF');
  set('--scale', SCALE[s.textSize]);
  root.dataset.motion = s.reduceMotion ? 'reduce' : 'auto';
  root.style.colorScheme = page.dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', page.page);
}
