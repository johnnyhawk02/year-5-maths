import type { LinePicture, Picture } from '../engine/pictures';

const W = 600, PAD = 34;

function Line({ p }: { p: LinePicture }) {
  const jumps = p.jumps ?? [];
  const top = jumps.length ? 62 : 16;
  const y = top;
  const below = p.points?.length ? 60 : 36;
  const x = (v: number) => PAD + ((v - p.min) / (p.max - p.min)) * (W - 2 * PAD);
  const count = Math.round((p.max - p.min) / p.step);
  const labelled = new Set(p.labels.map((l) => Math.round((l.at - p.min) / p.step)));
  return (
    <svg viewBox={`0 0 ${W} ${top + below}`} class="pic-line" role="img" aria-label={p.alt}>
      <line x1={PAD - 14} y1={y} x2={W - PAD + 14} y2={y} class="pl-axis" />
      {Array.from({ length: count + 1 }, (_, i) => {
        const big = labelled.has(i);
        const tx = x(p.min + i * p.step);
        return <line key={i} x1={tx} y1={y - (big ? 9 : 5)} x2={tx} y2={y + (big ? 9 : 5)} class="pl-axis" />;
      })}
      {p.labels.map((l) => <text key={`l${l.at}`} x={x(l.at)} y={y + 28} class="pl-label">{l.text}</text>)}
      {jumps.map((j, i) => {
        const a = x(j.from), b = x(j.to), mid = (a + b) / 2;
        const h = Math.min(44, 14 + Math.abs(b - a) / 4);
        const dir = b > a ? 1 : -1;
        return (
          <g key={`j${i}`} class="pl-jump">
            <path d={`M ${a} ${y - 6} Q ${mid} ${y - 6 - h * 2} ${b} ${y - 6}`} />
            <path d={`M ${b} ${y - 5} l ${-dir * 9} ${-3} l ${dir * 2} ${-9} z`} class="pl-head" />
            {j.text && <text x={mid} y={y - h - 12}>{j.text}</text>}
          </g>
        );
      })}
      {p.points?.map((pt) => (
        <g key={`p${pt.at}`} class="pl-point">
          <circle cx={x(pt.at)} cy={y} r={7} />
          <text x={x(pt.at)} y={y + 52}>{pt.text}</text>
        </g>
      ))}
    </svg>
  );
}

function Dots({ rows, cols }: { rows: number; cols: number }) {
  const gap = cols > 10 || rows > 8 ? 22 : 28;
  return (
    <svg viewBox={`0 0 ${cols * gap} ${rows * gap}`} width={cols * gap} height={rows * gap} class="pic-dots" aria-hidden="true">
      {Array.from({ length: rows * cols }, (_, i) => <circle key={i} cx={(i % cols) * gap + gap / 2} cy={Math.floor(i / cols) * gap + gap / 2} r={gap * 0.32} />)}
    </svg>
  );
}

/** Draws one teaching picture. */
export function PictureView({ picture: p }: { picture: Picture }) {
  let body;
  if (p.kind === 'line') body = <Line p={p} />;
  else if (p.kind === 'chart') {
    const cols = p.headers.map((_, i) => (i === p.point ? '0.7em minmax(2.2em, max-content)' : 'minmax(2.2em, max-content)')).join(' ');
    const cells = (row: string[], cls: string) =>
      row.flatMap((c, i) => [
        i === p.point ? <span key={`p${i}`} class={`pc-point ${cls}`}>{cls === 'pc-head' || row.slice(i).every((x) => x === '') ? '' : '.'}</span> : null,
        <span key={i} class={`${cls} ${p.hi?.includes(i) ? 'hi' : ''}`}>{c}</span>,
      ]);
    body = (
      <div class="pic-chart" role="img" aria-label={p.alt} style={{ gridTemplateColumns: cols }}>
        {cells(p.headers, 'pc-head')}
        {p.rows.map((r) => cells(r, 'pc-digit'))}
      </div>
    );
  } else if (p.kind === 'model') {
    const widest = Math.max(...p.rows.map((r) => r.reduce((a, x) => a + x.size, 0)));
    body = (
      <div class="pic-model" role="img" aria-label={p.alt}>
        {p.rows.map((r, ri) => (
          <div key={ri} class="pm-row" style={{ width: `${(r.reduce((a, x) => a + x.size, 0) / widest) * 100}%` }}>
            {r.map((part, i) => <span key={i} class={`pm-part ${part.hi ? 'hi' : ''}`} style={{ flexGrow: part.size, flexBasis: 0 }}>{part.text}</span>)}
          </div>
        ))}
      </div>
    );
  } else if (p.kind === 'array') {
    body = (
      <div class="pic-arrays" role="img" aria-label={p.alt}>
        {Array.from({ length: p.copies ?? 1 }, (_, i) => <Dots key={i} rows={p.rows} cols={p.cols} />)}
      </div>
    );
  } else {
    body = (
      <svg viewBox="-1 -1 202 202" class="pic-grid" role="img" aria-label={p.alt}>
        {Array.from({ length: 100 }, (_, i) => <rect key={i} x={(i % 10) * 20} y={Math.floor(i / 10) * 20} width={20} height={20} class={i < p.shaded ? 'bar-on' : 'bar-off'} />)}
      </svg>
    );
  }
  return (
    <figure class="pic">
      {body}
      {p.caption && <figcaption>{p.caption}</figcaption>}
    </figure>
  );
}
