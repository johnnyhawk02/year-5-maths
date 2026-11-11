import type { CubesPicture, LinePicture, Picture, ShapePicture } from '../engine/pictures';

const W = 600, PAD = 34;

function Line({ p }: { p: LinePicture }) {
  const jumps = p.jumps ?? [];
  const top = jumps.length ? 62 : 16;
  const y = top;
  const below = p.points?.length ? 60 : 36;
  const x = (v: number) => PAD + ((v - p.min) / (p.max - p.min)) * (W - 2 * PAD);
  const count = Math.round((p.max - p.min) / p.step);
  return (
    <svg viewBox={`0 0 ${W} ${top + below}`} class="pic-line" role="img" aria-label={p.alt}>
      <line x1={PAD - 14} y1={y} x2={W - PAD + 14} y2={y} class="pl-axis" />
      {Array.from({ length: count + 1 }, (_, i) => {
        const tx = x(p.min + i * p.step);
        return <line key={i} x1={tx} y1={y - 5} x2={tx} y2={y + 5} class="pl-axis" />;
      })}
      {p.labels.map((l) => <line key={`t${l.at}`} x1={x(l.at)} y1={y - 9} x2={x(l.at)} y2={y + 9} class="pl-axis" />)}
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

function Shape({ p }: { p: ShapePicture }) {
  const xs = p.points.map((q) => q[0]), ys = p.points.map((q) => q[1]);
  const w = Math.max(...xs), h = Math.max(...ys);
  // One grid unit is drawn at a size that keeps the whole picture a sensible width.
  const u = Math.min(46, 300 / w, 220 / h);
  const padX = 74, padTop = 30, padBottom = 40;
  const X = (x: number) => padX + x * u, Y = (y: number) => padTop + y * u;
  const path = p.points.map(([x, y], i) => `${i ? 'L' : 'M'} ${X(x)} ${Y(y)}`).join(' ') + ' Z';
  const id = `clip-${p.points.flat().join('-')}`;
  const lines = [];
  if (p.squares) {
    for (let x = 1; x < w; x++) lines.push(<line key={`v${x}`} x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(h)} />);
    for (let y = 1; y < h; y++) lines.push(<line key={`h${y}`} x1={X(0)} y1={Y(y)} x2={X(w)} y2={Y(y)} />);
  }
  const width = w * u + padX * 2, height = h * u + padTop + padBottom;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} class="pic-shape" role="img" aria-label={p.alt}>
      <clipPath id={id}><path d={path} /></clipPath>
      <path d={path} class="ps-fill" />
      <g class="ps-grid" clip-path={`url(#${id})`}>{lines}</g>
      {p.cuts?.map(([a, b, c, d], i) => <line key={i} x1={X(a)} y1={Y(b)} x2={X(c)} y2={Y(d)} class="ps-cut" />)}
      <path d={path} class="ps-edge" />
      {p.labels.map((l, i) => {
        return <text key={i} x={X(l.x)} y={Y(l.y) + 6} text-anchor={l.anchor ?? 'middle'} class="ps-label">{l.text}</text>;
      })}
    </svg>
  );
}

function Cubes({ p }: { p: CubesPicture }) {
  const u = Math.min(40, 260 / (p.wide + p.deep * 0.5), 200 / (p.high + p.deep * 0.5));
  const dx = u * 0.5, dy = u * 0.4;
  const ox = 4, oy = 4 + p.deep * dy;
  const W = p.wide * u, H = p.high * u;
  const out = [];
  // Front face
  for (let i = 0; i <= p.wide; i++) out.push(<line key={`fv${i}`} x1={ox + i * u} y1={oy} x2={ox + i * u} y2={oy + H} />);
  for (let j = 0; j <= p.high; j++) out.push(<line key={`fh${j}`} x1={ox} y1={oy + j * u} x2={ox + W} y2={oy + j * u} />);
  // Top face
  for (let i = 0; i <= p.wide; i++) out.push(<line key={`tv${i}`} x1={ox + i * u} y1={oy} x2={ox + i * u + p.deep * dx} y2={oy - p.deep * dy} />);
  for (let k = 1; k <= p.deep; k++) out.push(<line key={`th${k}`} x1={ox + k * dx} y1={oy - k * dy} x2={ox + W + k * dx} y2={oy - k * dy} />);
  // Side face
  for (let j = 1; j <= p.high; j++) out.push(<line key={`sv${j}`} x1={ox + W} y1={oy + j * u} x2={ox + W + p.deep * dx} y2={oy + j * u - p.deep * dy} />);
  for (let k = 1; k <= p.deep; k++) out.push(<line key={`sh${k}`} x1={ox + W + k * dx} y1={oy - k * dy} x2={ox + W + k * dx} y2={oy + H - k * dy} />);
  const width = W + p.deep * dx + 8, height = H + p.deep * dy + 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} class="pic-cubes" role="img" aria-label={p.alt}>
      <path class="ps-fill" d={`M ${ox} ${oy} L ${ox + p.deep * dx} ${oy - p.deep * dy} L ${ox + W + p.deep * dx} ${oy - p.deep * dy} L ${ox + W + p.deep * dx} ${oy + H - p.deep * dy} L ${ox + W} ${oy + H} L ${ox} ${oy + H} Z`} />
      <g class="ps-edge">{out}</g>
    </svg>
  );
}

/** Draws one teaching picture. */
export function PictureView({ picture: p }: { picture: Picture }) {
  let body;
  if (p.kind === 'line') body = <Line p={p} />;
  else if (p.kind === 'shape') body = <Shape p={p} />;
  else if (p.kind === 'cubes') body = <Cubes p={p} />;
  else if (p.kind === 'chart') {
    const cols = p.headers.map((_, i) => (i === p.point ? '0.7em max-content' : 'max-content')).join(' ');
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
