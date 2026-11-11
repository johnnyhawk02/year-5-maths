import { useEffect, useState } from 'preact/hooks';
import { isAppleTouch } from '../platform';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 15V3" />
    <path d="M8 7l4-4 4 4" />
    <path d="M7 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);

const AddIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);

export function InstallGuide({ onSkip }: { onSkip: () => void }) {
  const apple = isAppleTouch();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);

  // Browsers other than Safari can offer a one-tap install.
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  return (
    <div class="install">
      <img class="install-icon" src="./icons/icon-192.png" width="96" height="96" alt="" />
      <h1>Year 5 Maths</h1>
      <p class="lede">Put the app on your Home Screen. Then it opens full screen, works without the internet, and keeps your progress.</p>

      {apple ? (
        <ol class="steps">
          <li>
            <span class="step-icon"><ShareIcon /></span>
            <span>Tap the <strong>Share</strong> button in Safari's toolbar.</span>
          </li>
          <li>
            <span class="step-icon"><AddIcon /></span>
            <span>Choose <strong>Add to Home Screen</strong>. You may need to scroll down to find it.</span>
          </li>
          <li>
            <span class="step-icon num">3</span>
            <span>Tap <strong>Add</strong>, then open Year 5 Maths from your Home Screen.</span>
          </li>
        </ol>
      ) : prompt ? (
        <button class="btn primary" onClick={() => void prompt.prompt()}>Install the app</button>
      ) : (
        <p class="card">On an iPad, open this page in Safari to add it to the Home Screen. On a computer, use your browser's Install option if it has one.</p>
      )}

      <button class="link" onClick={onSkip}>Use it in the browser for now</button>
    </div>
  );
}
