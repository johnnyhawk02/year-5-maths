import type { AnglePicture, CoordsPicture, CubesPicture, DrawingPicture, GraphPicture, LinePicture, Picture, ShapePicture, TablePicture } from '../engine/pictures';

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

function Angle({ p }: { p: AnglePicture }) {
  // On a protractor the arms stop at the tick marks so the numbers outside stay clear.
  const PR = 150, R = p.protractor ? PR - 14 : 120;
  const norm = (d: number) => ((d % 360) + 360) % 360;
  // Only the top half is needed when nothing points downwards.
  const upper = p.rays.every((d) => norm(d) <= 180) && p.arcs.every((a) => norm(a.to - a.from) <= 180 && norm(a.from) <= 180 && norm(a.from) + norm(a.to - a.from) <= 180);
  const cx = 200, cy = p.protractor ? 185 : 140, height = p.protractor ? 210 : upper ? 170 : 280;
  const pt = (deg: number, r: number): [number, number] => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];
  return (
    <svg viewBox={`0 0 400 ${height}`} width={400} class="pic-angle" role="img" aria-label={p.alt}>
      {p.protractor && (
        <g class="pa-pro">
          <path d={`M ${cx - PR} ${cy} A ${PR} ${PR} 0 0 1 ${cx + PR} ${cy} Z`} />
          {Array.from({ length: 37 }, (_, i) => {
            const d = i * 5, long = d % 10 === 0;
            const [x1, y1] = pt(d, PR), [x2, y2] = pt(d, PR - (long ? 12 : 6));
            return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
          {Array.from({ length: 19 }, (_, i) => {
            const d = i * 10, [x, y] = pt(d, PR + 15);
            return <text key={d} x={x} y={y + 4}>{d}</text>;
          })}
        </g>
      )}
      {p.arcs.map((a, i) => {
        const size = norm(a.to - a.from) || 360;
        const r = p.protractor ? 44 : 34 + (i % 2) * 10;
        const [x1, y1] = pt(a.from, r), [x2, y2] = pt(a.from + size, r);
        const [tx, ty] = pt(a.from + size / 2, r + (size < 40 ? 34 : 24));
        const [sx1, sy1] = pt(a.from, 22), [sx2, sy2] = pt(a.from + 45, 22 * Math.SQRT2), [sx3, sy3] = pt(a.from + 90, 22);
        return (
          <g key={i} class="pa-arc">
            {a.square ? <path d={`M ${sx1} ${sy1} L ${sx2} ${sy2} L ${sx3} ${sy3}`} /> : <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${size > 180 ? 1 : 0} 0 ${x2} ${y2}`} />}
            {a.text && <text x={tx} y={ty + 6}>{a.text}</text>}
          </g>
        );
      })}
      {p.rays.map((d, i) => { const [x, y] = pt(d, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} class="pa-ray" />; })}
      <circle cx={cx} cy={cy} r={4} class="pa-dot" />
    </svg>
  );
}

function Drawing({ p }: { p: DrawingPicture }) {
  const u = Math.min(60, 280 / p.w, 220 / p.h), pad = 8;
  const X = (x: number) => pad + x * u, Y = (y: number) => pad + y * u;
  const width = p.w * u + pad * 2, height = p.h * u + pad * 2;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} class="pic-drawing" role="img" aria-label={p.alt}>
      {p.polys?.map((poly, i) => <path key={`p${i}`} d={poly.map(([x, y], k) => `${k ? 'L' : 'M'} ${X(x)} ${Y(y)}`).join(' ') + ' Z'} class={p.lines || p.ovals ? 'ps-fill' : 'ps-fill ps-edge-on'} />)}
      {p.ovals?.map(([cx, cy, rx, ry, dashed], i) => <ellipse key={`o${i}`} cx={X(cx)} cy={Y(cy)} rx={rx * u} ry={ry * u} class={dashed ? 'pd-line pd-dash' : 'pd-line pd-oval'} />)}
      {p.lines?.map(([a, b, c, d, dashed], i) => <line key={`l${i}`} x1={X(a)} y1={Y(b)} x2={X(c)} y2={Y(d)} class={dashed ? 'pd-line pd-dash' : 'pd-line'} />)}
      {p.labels?.map((l, i) => <text key={`t${i}`} x={X(l.x)} y={Y(l.y) + 6} text-anchor="middle" class="ps-label">{l.text}</text>)}
    </svg>
  );
}

function Coords({ p }: { p: CoordsPicture }) {
  const u = Math.min(34, 300 / p.size), left = 34, top = 14;
  const X = (x: number) => left + x * u, Y = (y: number) => top + (p.size - y) * u;
  const side = p.size * u;
  return (
    <svg viewBox={`0 0 ${side + left + 16} ${side + top + 34}`} width={side + left + 16} class="pic-coords" role="img" aria-label={p.alt}>
      {Array.from({ length: p.size + 1 }, (_, i) => (
        <g key={i} class="pg-grid">
          <line x1={X(i)} y1={Y(0)} x2={X(i)} y2={Y(p.size)} class={i === 0 ? 'pg-axis' : ''} />
          <line x1={X(0)} y1={Y(i)} x2={X(p.size)} y2={Y(i)} class={i === 0 ? 'pg-axis' : ''} />
          <text x={X(i)} y={Y(0) + 20} text-anchor="middle">{i}</text>
          {i > 0 && <text x={X(0) - 8} y={Y(i) + 5} text-anchor="end">{i}</text>}
        </g>
      ))}
      {p.mirror && (p.mirror.vertical
        ? <line x1={X(p.mirror.at)} y1={Y(0)} x2={X(p.mirror.at)} y2={Y(p.size)} class="pg-mirror" />
        : <line x1={X(0)} y1={Y(p.mirror.at)} x2={X(p.size)} y2={Y(p.mirror.at)} class="pg-mirror" />)}
      {p.shapes.map((s, i) => {
        const cx = s.points.reduce((a, q) => a + q[0], 0) / s.points.length, cy = s.points.reduce((a, q) => a + q[1], 0) / s.points.length;
        return (
          <g key={i} class={`pg-shape ${s.hi ? 'hi' : ''}`}>
            {s.points.length > 1
              ? <path d={s.points.map(([x, y], k) => `${k ? 'L' : 'M'} ${X(x)} ${Y(y)}`).join(' ') + ' Z'} />
              : <circle cx={X(cx)} cy={Y(cy)} r={6} />}
            {s.name && <text x={X(cx) + (s.points.length > 1 ? 0 : 12)} y={Y(cy) + (s.points.length > 1 ? 6 : -8)} text-anchor={s.points.length > 1 ? 'middle' : 'start'}>{s.name}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Graph({ p }: { p: GraphPicture }) {
  const named = p.series.some((s) => s.name);
  const W = 470, L = 62, R = 32, T = named ? 34 : 14, B = 58, pw = W - L - R, ph = 220, H = T + ph + B;
  const n = p.xLabels.length;
  const X = (i: number) => L + (i * pw) / (n - 1), Y = (v: number) => T + ph - (v / p.yMax) * ph;
  const lines = Math.round(p.yMax / p.yStep);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} class="pic-graph" role="img" aria-label={p.alt}>
      {Array.from({ length: lines * 2 + 1 }, (_, k) => {
        const v = (k * p.yStep) / 2;
        return <line key={`h${k}`} x1={L} y1={Y(v)} x2={L + pw} y2={Y(v)} class={k % 2 ? 'gr-minor' : 'gr-grid'} />;
      })}
      {Array.from({ length: lines + 1 }, (_, k) => <text key={`y${k}`} x={L - 8} y={Y(k * p.yStep) + 5} text-anchor="end">{k * p.yStep}</text>)}
      {p.xLabels.map((t, i) => (
        <g key={`x${i}`}>
          <line x1={X(i)} y1={T} x2={X(i)} y2={T + ph} class="gr-grid" />
          <text x={X(i)} y={T + ph + 20} text-anchor="middle">{t}</text>
        </g>
      ))}
      <line x1={L} y1={T} x2={L} y2={T + ph} class="gr-axis" />
      <line x1={L} y1={T + ph} x2={L + pw} y2={T + ph} class="gr-axis" />
      <text x={L + pw / 2} y={H - 8} text-anchor="middle" class="gr-title">{p.xTitle}</text>
      <text transform={`translate(16 ${T + ph / 2}) rotate(-90)`} text-anchor="middle" class="gr-title">{p.yTitle}</text>
      {p.guides?.map((i) => <path key={`g${i}`} d={`M ${X(i)} ${T + ph} L ${X(i)} ${Y(p.series[0].values[i])} L ${L} ${Y(p.series[0].values[i])}`} class="gr-guide" />)}
      {p.series.map((s, k) => (
        <g key={`s${k}`} class={`gr-series gr-s${k}`}>
          <path d={s.values.map((v, i) => `${i ? 'L' : 'M'} ${X(i)} ${Y(v)}`).join(' ')} />
          {s.values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={4.5} />)}
          {s.name && (
            <g>
              <line x1={L + k * 170} y1={14} x2={L + k * 170 + 30} y2={14} />
              <circle cx={L + k * 170 + 15} cy={14} r={4.5} />
              <text x={L + k * 170 + 38} y={19}>{s.name}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

function Table({ p }: { p: TablePicture }) {
  const hi = (r: number, c: number) => (p.hi?.some(([a, b]) => a === r && b === c) ? 'hi' : '');
  return (
    <div class="pic-table-wrap">
      <table class="pic-table" aria-label={p.alt}>
        <thead><tr>{p.headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {p.rows.map((row, r) => (
            <tr key={r}>{row.map((c, i) => (i === 0 ? <th key={i} scope="row" class={hi(r, i)}>{c}</th> : <td key={i} class={hi(r, i)}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Draws one teaching picture. */
export function PictureView({ picture: p }: { picture: Picture }) {
  let body;
  if (p.kind === 'line') body = <Line p={p} />;
  else if (p.kind === 'shape') body = <Shape p={p} />;
  else if (p.kind === 'cubes') body = <Cubes p={p} />;
  else if (p.kind === 'angle') body = <Angle p={p} />;
  else if (p.kind === 'drawing') body = <Drawing p={p} />;
  else if (p.kind === 'coords') body = <Coords p={p} />;
  else if (p.kind === 'graph') body = <Graph p={p} />;
  else if (p.kind === 'table') body = <Table p={p} />;
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
