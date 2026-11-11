// Draws text that may contain fractions written as {3/4} or {2 3/4}.
const FRACTION = /\{(?:(\d+|\?) )?(\d+|\?)\/(\d+|\?)\}/g;

export function Rich({ text }: { text: string }) {
  const out: preact.ComponentChildren[] = [];
  let last = 0;
  for (const m of text.matchAll(FRACTION)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, whole, num, den] = m;
    out.push(
      <span class="frac" role="img" aria-label={`${whole ? whole + ' and ' : ''}${num} over ${den}`}>
        {whole && <span class="frac-whole">{whole}</span>}
        <span class="frac-stack" aria-hidden="true">
          <span>{num}</span>
          <span class="frac-den">{den}</span>
        </span>
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
