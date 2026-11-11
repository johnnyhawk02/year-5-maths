import type { Bar } from '../engine/types';

const W = 600, H = 44, GAP = 14;

// Bars cut into equal parts with some shaded, so fractions can be seen and compared.
export function FractionBars({ bars }: { bars: Bar[] }) {
  return (
    <div class="bars">
      {bars.map((b, bi) => {
        const wholes = Math.max(1, Math.ceil(b.shaded / b.parts));
        const each = (W - GAP * (wholes - 1)) / wholes;
        const part = each / b.parts;
        return (
          <svg key={bi} viewBox={`-2 -2 ${W + 4} ${H + 4}`} class="bar" role="img" aria-label={`${b.shaded} out of ${b.parts} equal parts shaded`}>
            {Array.from({ length: wholes * b.parts }, (_, i) => {
              const whole = Math.floor(i / b.parts);
              const x = whole * (each + GAP) + (i % b.parts) * part;
              return <rect key={i} x={x} y={0} width={part} height={H} class={i < b.shaded ? 'bar-on' : 'bar-off'} />;
            })}
          </svg>
        );
      })}
    </div>
  );
}
