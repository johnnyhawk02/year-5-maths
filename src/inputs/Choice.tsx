interface Props {
  options: string[];
  value: number | null;
  onChange: (i: number) => void;
  disabled?: boolean;
}

export function Choice({ options, value, onChange, disabled }: Props) {
  return (
    <div class="choices" role="radiogroup" aria-label="Answers">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          class="choice"
          aria-checked={value === i}
          disabled={disabled}
          onClick={() => onChange(i)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
