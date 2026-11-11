// Small checks about where the app is running.

export function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

// iPadOS reports itself as a Mac, so touch support is the tell.
export function isAppleTouch(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// Ask the browser to keep our saved data. iPadOS is more willing to agree for an installed app.
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* not supported */
  }
  return false;
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

// Chrome on Android offers a one-tap install through this event. It can fire
// before any screen is drawn, so it is caught here as soon as the app loads.
export interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let installEvent: InstallEvent | null = null;
const waiting = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as InstallEvent;
    waiting.forEach((f) => f());
  });
}
export const getInstallEvent = (): InstallEvent | null => installEvent;
export const clearInstallEvent = (): void => { installEvent = null; };
export function onInstallEvent(f: () => void): () => void {
  waiting.add(f);
  return () => { waiting.delete(f); };
}
