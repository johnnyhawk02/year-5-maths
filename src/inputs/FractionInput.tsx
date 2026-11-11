import { useState } from 'preact/hooks';
import type { Frac } from '../engine/types';
import { Keys } from './ColumnGrid';

export interface FractionEntry { whole: string; num: string; den: string }
export const emptyFraction = (): FractionEntry => ({ whole: '', num: '', den: '' });

/** The fraction typed so far, or null until the top and bottom are both filled in. */
export function fractionValue(v: FractionEntry): Frac | null {
  if (v.num === '' || v.den === '') return null;
  return { whole: v.whole === '' ? 0 : Number(v.whole), num: Number(v.num), den: Number(v.den) };
}

type Box = keyof FractionEntry;
const NAMES: Record<Box, string> = { whole: 'Whole number', num: 'Top number', den: 'Bottom number' };

interface Props {
  mixed: boolean;
  value: FractionEntry;
  onChange: (v: FractionEntry) => void;
  disabled?: boolean;
}

// Three boxes laid out like a written mixed number. Tap a box, then type.
export function FractionInput({ mixed, value, onChange, disabled }: Props) {
  const [active, setActive] = useState<Box>(mixed ? 'whole' : 'num');

  const press = (k: string) => {
    if (disabled) return;
    const cur = value[active];
    if (k === 'del') return onChange({ ...value, [active]: cur.slice(0, -1) });
    if (cur.length >= 3) return;
    onChange({ ...value, [active]: cur === '0' ? k : cur + k });
  };

  const box = (b: Box) => (
    <button
      type="button"
      class={`frac-box ${active === b && !disabled ? 'active' : ''}`}
      disabled={disabled}
      aria-label={NAMES[b]}
      onClick={() => setActive(b)}
    >
      {value[b]}
    </button>
  );

  return (
    <div class="pad-wrap">
      <div class="frac-entry">
        {mixed && box('whole')}
        <div class="frac-entry-stack">
          {box('num')}
          <span class="frac-entry-line" />
          {box('den')}
        </div>
      </div>
      <p class="hint-text centre">Tap a box, then type.</p>
      <Keys press={press} disabled={disabled} />
    </div>
  );
}
