interface Props {
  items: string[];
  value: string[]; // the cards placed so far, in order
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

// Tap a card to place it in the next space. Tap a placed card to take it back.
export function Order({ items, value, onChange, disabled }: Props) {
  const left = items.filter((i) => !value.includes(i));
  return (
    <div class="order">
      <div class="slots" aria-label="Your order">
        {items.map((_, i) =>
          value[i] !== undefined ? (
            <button key={i} type="button" class="card-btn placed" disabled={disabled} onClick={() => onChange(value.filter((v) => v !== value[i]))}>
              {value[i]}
            </button>
          ) : (
            <span key={i} class="slot" aria-hidden="true">{i + 1}</span>
          ),
        )}
      </div>
      <div class="tray" aria-label="Cards to place">
        {left.map((item) => (
          <button key={item} type="button" class="card-btn" disabled={disabled} onClick={() => onChange([...value, item])}>
            {item}
          </button>
        ))}
        {!left.length && <span class="hint-text">Tap a card above to move it back.</span>}
      </div>
    </div>
  );
}
