import type { WCell, Written } from '../engine/written';

function Cell({ c }: { c: WCell }) {
  return (
    <span class={`w-cell ${c.hi ? 'hi' : ''}`}>
      {c.above !== undefined && <span class="w-above">{c.above}</span>}
      {c.pre !== undefined && <span class="w-pre">{c.pre}</span>}
      <span class={c.struck ? 'w-struck' : ''}>{c.d}</span>
    </span>
  );
}

/** Draws a written method as it looks on paper. Marks made in the latest step are in the spot colour. */
export function WrittenPicture({ picture }: { picture: Written }) {
  if (picture.kind === 'division') {
    const n = picture.digits.length;
    const rem = picture.remainder !== undefined;
    return (
      <div class="written w-division" role="img" aria-label={picture.alt} style={{ gridTemplateColumns: `1.6em repeat(${n}, 1.5em)${rem ? ' auto' : ''}` }}>
        <span />
        {picture.answer.map((c, i) => <Cell key={`a${i}`} c={c} />)}
        {rem && <span class="w-cell w-rem hi">r {picture.remainder}</span>}
        <span class="w-cell w-divisor">{picture.divisor}</span>
        {picture.digits.map((c, i) => <span key={`d${i}`} class={`w-under ${i === 0 ? 'first' : ''}`}><Cell c={c} /></span>)}
        {rem && <span />}
      </div>
    );
  }
  const exchange = picture.rows.some((r) => r !== 'rule' && r.cells.some((c) => c.above !== undefined));
  return (
    <div class={`written ${exchange ? 'w-exchange' : ''}`} role="img" aria-label={picture.alt} style={{ gridTemplateColumns: `1.3em repeat(${picture.cols}, 1.25em)` }}>
      {picture.rows.map((row, ri) =>
        row === 'rule' ? (
          <span key={ri} class="w-rule" style={{ gridColumn: `1 / span ${picture.cols + 1}` }} />
        ) : (
          <>
            <span key={`${ri}-op`} class={`w-cell w-op ${row.small ? 'w-small' : ''}`}>{row.op ?? ''}</span>
            {row.cells.map((c, i) => (
              <span key={`${ri}-${i}`} class={row.small ? 'w-small' : ''}><Cell c={c} /></span>
            ))}
          </>
        ),
      )}
    </div>
  );
}
