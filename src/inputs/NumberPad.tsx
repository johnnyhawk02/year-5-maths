import { fmt } from '../engine/format';

interface Props {
  value: string; // digits with an optional leading "-"
  onChange: (v: string) => void;
  allowNegative?: boolean;
  decimal?: boolean;
  unit?: string;
  disabled?: boolean;
}

const MAX_DIGITS = 7;

export const padValue = (v: string): number | null => (v === '' || v === '-' ? null : Number(v));

export function NumberPad({ value, onChange, allowNegative, decimal, unit, disabled }: Props) {
  const press = (k: string) => {
    if (disabled) return;
    if (k === 'del') return onChange(value.slice(0, -1));
    if (k === '-') return onChange(value.startsWith('-') ? value.slice(1) : '-' + value);
    const digits = value.replace('-', '');
    if (k === '.') {
      if (digits.includes('.')) return;
      return onChange(digits === '' ? value + '0.' : value + '.');
    }
    if (digits.replace('.', '').length >= MAX_DIGITS) return;
    if (digits === '0') return onChange(value.replace('0', k));
    onChange(value + k);
  };
  const n = padValue(value);
  const shown = n === null ? (value === '-' ? '−' : '') : (value.startsWith('-') && n === 0 ? '−0' : fmt(n));
  return (
    <div class="pad-wrap">
      <div class="answer-box" aria-live="polite" aria-label="Your answer">
        <span>{shown || ' '}</span>
        {unit && <span class="suffix">{unit}</span>}
      </div>
      <div class="pad" role="group" aria-label="Number pad">
        {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
          <button key={k} type="button" class="key" disabled={disabled} onClick={() => press(k)}>{k}</button>
        ))}
        {decimal ? (
          <button type="button" class="key" disabled={disabled} aria-label="Decimal point" onClick={() => press('.')}>.</button>
        ) : allowNegative ? (
          <button type="button" class="key" disabled={disabled} aria-label="Minus" onClick={() => press('-')}>{'−'}</button>
        ) : (
          <span />
        )}
        <button type="button" class="key" disabled={disabled} onClick={() => press('0')}>0</button>
        <button type="button" class="key" disabled={disabled} aria-label="Delete" onClick={() => press('del')}>{'⌫'}</button>
      </div>
    </div>
  );
}
