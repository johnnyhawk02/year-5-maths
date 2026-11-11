import { useState } from 'preact/hooks';
import type { DivisionResponse } from '../engine/types';
import { Keys } from './ColumnGrid';

export interface DivisionEntry { cells: string[]; rem: string }

interface Props {
  dividend: number;
  divisor: number;
  askRemainder: boolean;
  value: DivisionEntry;
  onChange: (v: DivisionEntry) => void;
  disabled?: boolean;
}

export const emptyDivision = (): DivisionEntry => ({ cells: [], rem: '' });

/** The quotient and remainder typed so far, or null while the answer is unfinished. */
export function divisionValue(v: DivisionEntry, askRemainder: boolean): DivisionResponse | null {
  const first = v.cells.findIndex((c) => c !== '');
  if (first === -1) return null;
  const used = v.cells.slice(first);
  if (used.some((c) => c === '')) return null;
  if (askRemainder && v.rem === '') return null;
  return { quotient: Number(used.join('')), remainder: askRemainder ? Number(v.rem) : 0 };
}

// Short division: the answer goes above the line, filled from the left.
export function DivisionGrid({ dividend, divisor, askRemainder, value, onChange, disabled }: Props) {
  const digits = String(dividend).split('');
  const width = digits.length;
  const cells = value.cells.length === width ? value.cells : Array<string>(width).fill('');
  // -1 means the remainder box.
  const [active, setActive] = useState(0);

  const press = (k: string) => {
    if (disabled) return;
    if (active === -1) return onChange({ cells, rem: k === 'del' ? '' : k });
    const next = [...cells];
    if (k === 'del') {
      if (next[active] !== '') next[active] = '';
      else if (active > 0) {
        next[active - 1] = '';
        setActive(active - 1);
      }
      return onChange({ cells: next, rem: value.rem });
    }
    next[active] = k;
    onChange({ cells: next, rem: value.rem });
    if (active < width - 1) setActive(active + 1);
    else if (askRemainder) setActive(-1);
  };

  const cols = { gridTemplateColumns: `2.2em repeat(${width}, minmax(0, 1fr))${askRemainder ? ' 1.4em minmax(0, 1fr)' : ''}` };

  return (
    <div class="pad-wrap">
      <div class="column division" style={cols} aria-label="Short division">
        <span />
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            class={`col-cell ${i === active && !disabled ? 'active' : ''}`}
            disabled={disabled}
            aria-label={`Answer box ${i + 1} of ${width}`}
            onClick={() => setActive(i)}
          >
            {c}
          </button>
        ))}
        {askRemainder && (
          <>
            <span class="col-op rem-label">r</span>
            <button
              type="button"
              class={`col-cell ${active === -1 && !disabled ? 'active' : ''}`}
              disabled={disabled}
              aria-label="Remainder"
              onClick={() => setActive(-1)}
            >
              {value.rem}
            </button>
          </>
        )}
        <span class="col-digit divisor">{divisor}</span>
        {digits.map((d, i) => <span key={i} class={`col-digit under ${i === 0 ? 'first' : ''}`}>{d}</span>)}
        {askRemainder && <><span /><span /></>}
      </div>
      <Keys press={press} disabled={disabled} />
    </div>
  );
}
