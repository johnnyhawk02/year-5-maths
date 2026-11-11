import type { ComponentChildren } from 'preact';

/** The alpaca's head and neck, drawn in code so it needs no image file. */
export function AlpacaFace() {
  return (
    <svg class="alpaca-face" viewBox="0 0 120 150" aria-hidden="true">
      <g class="alpaca-wool">
        <ellipse cx="30" cy="30" rx="9" ry="19" transform="rotate(-22 30 30)" />
        <ellipse cx="90" cy="30" rx="9" ry="19" transform="rotate(22 90 30)" />
      </g>
      <g class="alpaca-pink">
        <ellipse cx="30" cy="31" rx="4" ry="12" transform="rotate(-22 30 31)" />
        <ellipse cx="90" cy="31" rx="4" ry="12" transform="rotate(22 90 31)" />
      </g>
      <g class="alpaca-wool">
        <path d="M38 96 Q34 160 36 160 H84 Q86 160 82 96 Z" />
        <ellipse cx="60" cy="64" rx="35" ry="31" />
        <circle cx="44" cy="34" r="13" />
        <circle cx="60" cy="27" r="14" />
        <circle cx="76" cy="34" r="13" />
      </g>
      <path class="alpaca-fluff" d="M40 112 q5 5 10 0 M58 124 q5 5 10 0 M46 138 q5 5 10 0 M66 108 q5 5 10 0" />
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
 * Pops the alpaca up from the bottom corner with something to say.
 * With `onTap` the whole helper is a button (used to offer a hint).
 */
export function AlpacaHelper({ show, children, onTap, onClose }: { show: boolean; children?: ComponentChildren; onTap?: () => void; onClose: () => void }) {
  return (
    <div class={`alpaca ${show ? 'up' : ''}`} aria-live="polite">
      {show && (
        <>
          <button class="alpaca-body" onClick={onTap ?? onClose} aria-label={onTap ? 'Show a hint' : 'Hide the alpaca'}>
            <AlpacaFace />
          </button>
          <div class="alpaca-bubble">
            <div>{children}</div>
            {onTap ? <button class="link" onClick={onTap}>Show me</button> : <button class="link" onClick={onClose}>Thanks</button>}
          </div>
        </>
      )}
    </div>
  );
}
