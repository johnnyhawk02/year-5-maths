import { SKILL_COUNT, UNITS } from '../curriculum';
import { nextSkill, tickedCount, type Progress } from '../progress';

export function Home({ progress }: { progress: Progress }) {
  const next = nextSkill(progress);
  const ticked = tickedCount(progress);
  const started = Object.keys(progress).length > 0;
  return (
    <div class="stack">
      <h1>Hello</h1>
      <section class="card">
        {next ? (
          <>
            <p class="eyebrow">{started ? 'Carry on' : 'Start here'}</p>
            <h2>{next.name}</h2>
            <p>{next.unit}</p>
            <div class="row">
              <a class="btn primary" href={`#/skill/${next.id}`}>{started ? 'Carry on' : 'Start'}</a>
              <a class="btn" href="#/map">Open the map</a>
            </div>
          </>
        ) : (
          <>
            <p class="eyebrow">All done for now</p>
            <h2>You have ticked every lesson so far</h2>
            <p>More units are being written. You can practise any skill again from the map.</p>
            <div class="row"><a class="btn primary" href="#/map">Open the map</a></div>
          </>
        )}
      </section>
      <section class="card">
        <p class="eyebrow">Your year</p>
        <div class="meter" role="img" aria-label={`${ticked} of ${SKILL_COUNT} skills ticked`}>
          <div class="meter-fill" style={{ width: `${(ticked / SKILL_COUNT) * 100}%` }} />
        </div>
        <p>
          <strong>{ticked}</strong> of {SKILL_COUNT} skills ticked across {UNITS.length} units.
        </p>
      </section>
    </div>
  );
}
