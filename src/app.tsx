import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';
import { applySettings, loadSettings, normalise, saveSettings, type Settings } from './theme';
import { isInstalled, requestPersistence } from './platform';
import { Home } from './screens/Home';
import { MapScreen } from './screens/Map';
import { Options } from './screens/Options';
import { InstallGuide } from './screens/InstallGuide';

type Route = 'home' | 'map' | 'options';
const ROUTES: Route[] = ['home', 'map', 'options'];
const LABELS: Record<Route, string> = { home: 'Home', map: 'Map', options: 'Options' };

const readRoute = (): Route => {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'home';
};

const SKIP_KEY = 'y5m.useInBrowser';

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [installed] = useState(isInstalled);
  const [skipped, setSkipped] = useState(() => sessionStorage.getItem(SKIP_KEY) === '1');
  const [update, setUpdate] = useState<null | (() => void)>(null);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh: () => setUpdate(() => () => void updateSW(true)),
      onOfflineReady: () => setOfflineReady(true),
    });
    if (installed) void requestPersistence();
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(t);
  }, [offlineReady]);

  const change = (patch: Partial<Settings>) => {
    const next = normalise({ ...settings, ...patch });
    setSettings(next);
    applySettings(next);
    saveSettings(next);
  };

  if (!installed && !skipped) {
    return (
      <InstallGuide
        onSkip={() => {
          sessionStorage.setItem(SKIP_KEY, '1');
          setSkipped(true);
        }}
      />
    );
  }

  return (
    <div class="shell">
      <header class="bar">
        <a class="brand" href="#/home">Year 5 Maths</a>
        <nav class="tabs" aria-label="Main">
          {ROUTES.map((r) => (
            <a key={r} href={`#/${r}`} class="tab" aria-current={route === r ? 'page' : undefined}>
              {LABELS[r]}
            </a>
          ))}
        </nav>
      </header>

      {update && (
        <div class="note" role="status">
          <span>A new version is ready.</span>
          <button class="btn small" onClick={update}>Update</button>
        </div>
      )}
      {offlineReady && !update && (
        <div class="note" role="status">
          <span>Saved to this device. It now works without the internet.</span>
        </div>
      )}

      <main class="main">
        {route === 'home' && <Home />}
        {route === 'map' && <MapScreen />}
        {route === 'options' && <Options settings={settings} onChange={change} />}
      </main>
    </div>
  );
}
