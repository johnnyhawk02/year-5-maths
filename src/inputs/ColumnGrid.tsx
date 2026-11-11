import { useState } from 'preact/hooks';

interface Props {
  op: '+' | '-' | '×';
  rows: number[];
  answer: number;
  /** Labels for working rows the child may fill in. They are not marked. */
  workRows?: string[];
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

const SIGN = { '+': '+', '-': '−', '×': '×' } as const;

// Sets the calculation out in columns. The child fills each row from the
// ones column leftwards, the way it is done on paper.
export function ColumnGrid({ op, rows, answer, workRows = [], value, onChange, disabled }: Props) {
  // One spare column for addition so the width never gives away whether the answer carries over.
  const width = Math.max(...rows.map((r) => String(r).length), String(answer).length) + (op === '+' ? 1 : 0);
  const blank = () => Array<string>(width).fill('');
  const cells = value.length === width ? value : blank();
  const [work, setWork] = useState<string[][]>(() => workRows.map(blank));
  const answerRow = workRows.length;
  const [active, setActive] = useState({ row: 0, col: width - 1 });
  // Jotting space, as on paper. None of it is marked.
  const CARRY = -1;
  const hasCarry = workRows.length === 0 && op !== '-';
  const [carry, setCarry] = useState<string[]>(blank);
  // For subtraction: which top digits have given one to the column on their right.
  const [given, setGiven] = useState<boolean[]>(() => Array<boolean>(width).fill(false));

  const digitsOf = (n: number) => String(n).padStart(width, ' ').split('');
  const rowCells = (row: number) => (row === CARRY ? carry : row === answerRow ? cells : work[row]);
  const setRow = (row: number, next: string[]) => {
    if (row === CARRY) setCarry(next);
    else if (row === answerRow) onChange(next);
    else setWork(work.map((w, i) => (i === row ? next : w)));
  };

  const press = (k: string) => {
    if (disabled) return;
    const { row, col } = active;
    const next = [...rowCells(row)];
    if (row === CARRY) {
      next[col] = k === 'del' ? '' : k;
      return setRow(row, next);
    }
    if (k === 'del') {
      if (next[col] !== '') next[col] = '';
      else if (col < width - 1) {
        next[col + 1] = '';
        setActive({ row, col: col + 1 });
      }
      return setRow(row, next);
    }
    next[col] = k;
    setRow(row, next);
    if (col > 0) setActive({ row, col: col - 1 });
  };

  const cols = { gridTemplateColumns: `1.2em repeat(${width}, minmax(0, 1fr))` };
  const full = { gridColumn: `1 / span ${width + 1}` };

  const boxes = (row: number, label: string) =>
    rowCells(row).map((c, i) => (
      <button
        key={`${row}-${i}`}
        type="button"
        class={`col-cell ${row !== answerRow ? 'work' : ''} ${active.row === row && active.col === i && !disabled ? 'active' : ''}`}
        disabled={disabled}
        aria-label={`${label}, box ${i + 1} of ${width}`}
        onClick={() => setActive({ row, col: i })}
      >
        {c}
      </button>
    ));

  // Exchanging: the digit that gives goes down by one, and its right-hand neighbour gains ten.
  const topDigits = digitsOf(rows[0]);
  const got = (i: number) => i > 0 && given[i - 1];
  const topValue = (i: number) => Number(topDigits[i]) + (got(i) ? 10 : 0) - (given[i] ? 1 : 0);
  const exchange = (i: number) => {
    if (disabled) return;
    if (!given[i] && topValue(i) === 0) return; // nothing to give yet
    // Taking an exchange back also takes back any that depended on it.
    const next = [...given];
    next[i] = !next[i];
    if (!next[i]) for (let k = i + 1; k < width; k++) if (next[k] && Number(topDigits[k]) + (next[k - 1] ? 10 : 0) - 1 < 0) next[k] = false;
    setGiven(next);
  };

  return (
    <div class="pad-wrap">
      <div class={`column ${op === '-' ? 'exchanging' : ''}`} style={cols} aria-label="Written calculation">
        {rows.map((r, ri) => (
          <>
            <span class="col-op">{ri === rows.length - 1 ? SIGN[op] : ''}</span>
            {digitsOf(r).map((d, i) =>
              op === '-' && ri === 0 && d !== ' ' ? (
                <button
                  key={`${ri}-${i}`}
                  type="button"
                  class={`col-digit top-digit ${given[i] ? 'gave' : ''}`}
                  disabled={disabled || i === width - 1}
                  aria-label={`${d}${given[i] ? `, crossed out, now ${topValue(i)}` : got(i) ? `, now ${topValue(i)}` : ''}${i === width - 1 ? '' : '. Tap to exchange'}`}
                  onClick={() => exchange(i)}
                >
                  {given[i] && <span class="w-above">{topValue(i)}</span>}
                  {got(i) && !given[i] && <span class="w-pre">1</span>}
                  <span class={given[i] ? 'w-struck' : ''}>{d}</span>
                </button>
              ) : (
                <span key={`${ri}-${i}`} class="col-digit">{d}</span>
              ),
            )}
          </>
        ))}
        <span class="col-rule" style={full} />
        {workRows.map((label, wi) => (
          <>
            <span class="col-label" style={full}>{label}</span>
            <span class="col-op">{wi === workRows.length - 1 && wi > 0 ? '+' : ''}</span>
            {boxes(wi, label)}
          </>
        ))}
        {workRows.length > 0 && (
          <>
            <span class="col-rule" style={full} />
            <span class="col-label" style={full}>Answer</span>
          </>
        )}
        <span class="col-op" />
        {boxes(answerRow, 'Answer')}
        {hasCarry && (
          <>
            <span class="col-op" />
            {carry.map((c, i) =>
              i === width - 1 ? (
                <span key={`c-${i}`} />
              ) : (
                <button
                  key={`c-${i}`}
                  type="button"
                  class={`col-cell carry ${active.row === CARRY && active.col === i && !disabled ? 'active' : ''}`}
                  disabled={disabled}
                  aria-label={`Carry box ${i + 1} of ${width - 1}`}
                  onClick={() => setActive({ row: CARRY, col: i })}
                >
                  {c}
                </button>
              ),
            )}
          </>
        )}
      </div>
      {hasCarry && <p class="hint-text jot">Small boxes are for carried digits.</p>}
      {op === '-' && <p class="hint-text jot">To exchange, tap the top digit you are taking one from.</p>}
      <Keys press={press} disabled={disabled} />
    </div>
  );
}

export function Keys({ press, disabled }: { press: (k: string) => void; disabled?: boolean }) {
  return (
    <div class="pad" role="group" aria-label="Number pad">
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
        <button key={k} type="button" class="key" disabled={disabled} onClick={() => press(k)}>{k}</button>
      ))}
      <span />
      <button type="button" class="key" disabled={disabled} onClick={() => press('0')}>0</button>
      <button type="button" class="key" disabled={disabled} aria-label="Delete" onClick={() => press('del')}>{'⌫'}</button>
    </div>
  );
}
