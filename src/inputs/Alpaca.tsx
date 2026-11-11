import type { ComponentChildren } from 'preact';

/** The alpaca's head and neck, drawn in code so it needs no image file. */
// A long woolly neck with scalloped edges, running well below the head so it can reach in from off screen.
const NECK = 'M41 92 q-10 11 -1 22 q-10 11 -1 22 q-10 11 -1 22 q-10 11 -1 22 q-10 11 -1 22 q-10 11 -1 22 q-10 11 -1 22 q-10 11 -1 22 H88 q10 -11 -1 -22 q10 -11 -1 -22 q10 -11 -1 -22 q10 -11 -1 -22 q10 -11 -1 -22 q10 -11 -1 -22 q10 -11 -1 -22 q10 -11 -1 -22 Z';
const TUFTS = [112, 134, 156, 178, 200, 222, 244].map((y, i) => `M${i % 2 ? 50 : 42} ${y} q5 5 10 0 M${i % 2 ? 70 : 62} ${y + 9} q5 5 10 0`).join(' ');

export type Place = 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';
export const PLACES: Place[] = ['bottom-left', 'bottom-right', 'left', 'right', 'top'];

export function AlpacaFace({ neck = false }: { neck?: boolean }) {
  return (
    <svg class="alpaca-face" viewBox={neck ? '0 0 120 270' : '0 0 120 150'} aria-hidden="true">
      <path class="alpaca-neck" d={NECK} />
      <path class="alpaca-fluff" d={TUFTS} />
      <g class="alpaca-wool">
        <ellipse cx="30" cy="30" rx="9" ry="19" transform="rotate(-22 30 30)" />
        <ellipse cx="90" cy="30" rx="9" ry="19" transform="rotate(22 90 30)" />
      </g>
      <g class="alpaca-pink">
        <ellipse cx="30" cy="31" rx="4" ry="12" transform="rotate(-22 30 31)" />
        <ellipse cx="90" cy="31" rx="4" ry="12" transform="rotate(22 90 31)" />
      </g>
      <g class="alpaca-wool">
        <ellipse cx="60" cy="64" rx="35" ry="31" />
        <circle cx="44" cy="34" r="13" />
        <circle cx="60" cy="27" r="14" />
        <circle cx="76" cy="34" r="13" />
      </g>
      <ellipse class="alpaca-muzzle" cx="60" cy="76" rx="19" ry="14" />
      <g class="alpaca-pink cheeks"><circle cx="35" cy="72" r="6" /><circle cx="85" cy="72" r="6" /></g>
      <g class="alpaca-eyes">
        <circle cx="45" cy="58" r="5" /><circle cx="75" cy="58" r="5" />
      </g>
      <g class="alpaca-shine"><circle cx="46.8" cy="56.2" r="1.7" /><circle cx="76.8" cy="56.2" r="1.7" /></g>
      <path class="alpaca-mouth" d="M55 70 Q60 75 65 70 M60 73 V78 M52 79 Q60 87 68 79" />
    </svg>
  );
}

/**
 * Pops the alpaca in from an edge of the screen with something to say.
 * With `onTap` the alpaca is a button that gives a hint.
 */
export function AlpacaHelper({ show, place, children, onTap, onClose }: { show: boolean; place: Place; children?: ComponentChildren; onTap?: () => void; onClose: () => void }) {
  if (!show) return <div aria-live="polite" />;
  return (
    <div class={`alpaca at-${place}`} aria-live="polite">
      <button class="alpaca-body" onClick={onTap ?? onClose} aria-label={onTap ? 'Show a hint' : 'Hide the alpaca'}>
        <AlpacaFace neck />
      </button>
      <div class="alpaca-bubble">
        <div>{children}</div>
        {onTap ? <button class="link" onClick={onTap}>Show me</button> : <button class="link" onClick={onClose}>Thanks</button>}
      </div>
    </div>
  );
}
