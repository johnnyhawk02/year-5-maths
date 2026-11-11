import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';
import { applySettings, loadSettings, normalise, saveSettings, type Settings } from './theme';
import { isInstalled, requestPersistence } from './platform';
import { Home } from './screens/Home';
import { MapScreen } from './screens/Map';
import { Options } from './screens/Options';
import { InstallGuide } from './screens/InstallGuide';
import { SkillScreen } from './screens/Skill';
import { Learn } from './screens/Learn';
import { Session } from './screens/Session';
import { loadProgress } from './progress';

type Tab = 'home' | 'map' | 'options';
type Page = Tab | 'skill' | 'learn' | 'try' | 'practise';
interface Route { page: Page; id?: string }
const TABS: Tab[] = ['home', 'map', 'options'];
const WITH_ID: Page[] = ['skill', 'learn', 'try', 'practise'];
const LABELS: Record<Tab, string> = { home: 'Home', map: 'Map', options: 'Options' };

const readRoute = (): Route => {
  const [page, id] = location.hash.replace(/^#\/?/, '').split('/') as [Page, string | undefined];
  if ((TABS as Page[]).includes(page)) return { page };
  if (WITH_ID.includes(page) && id) return { page, id };
  return { page: 'home' };
};

const SKIP_KEY = 'y5m.useInBrowser';

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState(loadProgress);
  const [installed] = useState(isInstalled);
  const [skipped, setSkipped] = useState(() => sessionStorage.getItem(SKIP_KEY) === '1');
  const [update, setUpdate] = useState<null | (() => void)>(null);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
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

  // Lesson pages sit under the Map tab.
  const tab: Tab = (TABS as Page[]).includes(route.page) ? (route.page as Tab) : 'map';

  return (
    <div class="shell">
      <header class="bar">
        <a class="brand" href="#/home">Year 5 Maths</a>
        <nav class="tabs" aria-label="Main">
          {TABS.map((r) => (
            <a key={r} href={`#/${r}`} class="tab" aria-current={tab === r ? 'page' : undefined}>
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
        {route.page === 'home' && <Home progress={progress} />}
        {route.page === 'map' && <MapScreen progress={progress} />}
        {route.page === 'options' && <Options settings={settings} onChange={change} />}
        {route.page === 'skill' && <SkillScreen id={route.id!} progress={progress} />}
        {route.page === 'learn' && <Learn key={route.id} id={route.id!} />}
        {(route.page === 'try' || route.page === 'practise') && (
          <Session key={`${route.page}/${route.id}`} id={route.id!} mode={route.page} onRecorded={() => setProgress(loadProgress())} />
        )}
      </main>
    </div>
  );
}
