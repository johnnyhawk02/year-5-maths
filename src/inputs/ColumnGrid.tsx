import { useState } from 'preact/hooks';

interface Props {
  op: '+' | '-';
  rows: number[];
  answer: number;
  value: string[]; // one entry per answer box, left to right, '' when empty
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

/** The number in the boxes, or null while a box inside the number is still empty. */
export function columnValue(cells: string[]): number | null {
  const first = cells.findIndex((c) => c !== '');
  if (first === -1) return null;
  const used = cells.slice(first);
  if (used.some((c) => c === '')) return null;
  return Number(used.join(''));
}

// Sets the calculation out in columns. The child fills the answer from the
// ones column leftwards, the way it is done on paper.
export function ColumnGrid({ op, rows, answer, value, onChange, disabled }: Props) {
  // One spare column so the width never gives away whether the answer carries over.
  const width = Math.max(...rows.map((r) => String(r).length), String(answer).length) + (op === '+' ? 1 : 0);
  const cells = value.length === width ? value : Array<string>(width).fill('');
  const [active, setActive] = useState(width - 1);

  const digitsOf = (n: number) => String(n).padStart(width, ' ').split('');

  const press = (k: string) => {
    if (disabled) return;
    const next = [...cells];
    if (k === 'del') {
      if (next[active] !== '') next[active] = '';
      else if (active < width - 1) {
        next[active + 1] = '';
        setActive(active + 1);
      }
      return onChange(next);
    }
    next[active] = k;
    onChange(next);
    if (active > 0) setActive(active - 1);
  };

  const cols = { gridTemplateColumns: `1.2em repeat(${width}, minmax(0, 1fr))` };

  return (
    <div class="pad-wrap">
      <div class="column" style={cols} aria-label="Written calculation">
        {rows.map((r, ri) => (
          <>
            <span class="col-op">{ri === rows.length - 1 ? (op === '+' ? '+' : '−') : ''}</span>
            {digitsOf(r).map((d, i) => <span key={`${ri}-${i}`} class="col-digit">{d}</span>)}
          </>
        ))}
        <span class="col-rule" style={{ gridColumn: `1 / span ${width + 1}` }} />
        <span class="col-op" />
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
      </div>
      <div class="pad" role="group" aria-label="Number pad">
        {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
          <button key={k} type="button" class="key" disabled={disabled} onClick={() => press(k)}>{k}</button>
        ))}
        <span />
        <button type="button" class="key" disabled={disabled} onClick={() => press('0')}>0</button>
        <button type="button" class="key" disabled={disabled} aria-label="Delete" onClick={() => press('del')}>{'⌫'}</button>
      </div>
    </div>
  );
}
