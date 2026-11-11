import { useRef } from 'preact/hooks';
import { fmt } from '../engine/format';

interface Props {
  min: number;
  max: number;
  step: number;
  labelEvery: number;
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
  /** Shown after checking, when the child's marker was in the wrong place. */
  reveal?: number;
}

const W = 1000, PADX = 50, Y = 60;

export function NumberLine({ min, max, step, labelEvery, value, onChange, disabled, reveal }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const x = (v: number) => PADX + ((v - min) / (max - min)) * (W - PADX * 2);
  const ticks: number[] = [];
  for (let v = min; v <= max; v += step) ticks.push(v);

  const place = (clientX: number) => {
    if (disabled || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const px = ((clientX - box.left) / box.width) * W;
    const raw = min + ((px - PADX) / (W - PADX * 2)) * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, snapped)));
  };

  const nudge = (by: number) => {
    if (disabled) return;
    onChange(Math.min(max, Math.max(min, (value ?? 0) + by)));
  };

  return (
    <svg
      ref={ref}
      class="line"
      viewBox={`0 0 ${W} 130`}
      role="slider"
      tabIndex={0}
      aria-label="Number line"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      onPointerDown={(e) => {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        place(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && place(e.clientX)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') nudge(-step);
        if (e.key === 'ArrowRight') nudge(step);
      }}
    >
      <line x1={x(min)} y1={Y} x2={x(max)} y2={Y} class="line-axis" />
      {ticks.map((v) => {
        const major = v % labelEvery === 0;
        return (
          <g key={v}>
            <line x1={x(v)} y1={Y - (major ? 16 : 9)} x2={x(v)} y2={Y + (major ? 16 : 9)} class="line-axis" />
            {major && <text x={x(v)} y={Y + 48} class="line-label">{fmt(v)}</text>}
          </g>
        );
      })}
      {reveal !== undefined && <circle cx={x(reveal)} cy={Y} r={15} class="line-reveal" />}
      {value !== null && <circle cx={x(value)} cy={Y} r={15} class="line-marker" />}
    </svg>
  );
}
