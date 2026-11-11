import { AlpacaFace } from '../inputs/Alpaca';
import { SKILL_COUNT, UNITS } from '../curriculum';
import { loadChecks, reviewPlan } from '../checks';
import { nextSkill, tickedCount, type Progress } from '../progress';
import { dayKey, loadReview } from '../review';

export function Home({ progress }: { progress: Progress }) {
  const next = nextSkill(progress);
  const ticked = tickedCount(progress);
  const started = Object.keys(progress).length > 0;
  const today = dayKey(new Date());
  const due = reviewPlan(loadReview(progress, today), today).length;
  const checks = loadChecks();
  return (
    <div class="stack">
      <div class="row hello"><div class="home-alpaca"><AlpacaFace /></div><h1>Hello</h1></div>
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
            <p class="eyebrow">All ticked</p>
            <h2>You have ticked every skill in Year 5</h2>
            <p>{checks.end ? `Your best end of year check score is ${checks.end.best}.` : 'Try the end of year check to see how much has stuck.'}</p>
            <div class="row">
              <a class="btn primary" href="#/check/end">End of year check</a>
              <a class="btn" href="#/map">Open the map</a>
            </div>
          </>
        )}
      </section>
      {ticked > 0 && (
        <section class="card">
          <p class="eyebrow">Daily review</p>
          {due > 0 ? (
            <>
              <h2>{due} {due === 1 ? 'question is' : 'questions are'} ready</h2>
              <p>A quick look back at skills you have ticked, so they stick.</p>
              <div class="row"><a class="btn primary" href="#/review">Start review</a></div>
            </>
          ) : (
            <>
              <h2>Nothing to review today</h2>
              <p>Ticked skills come back here after a day, then after longer gaps.</p>
            </>
          )}
        </section>
      )}
      {!started && !checks.start && (
        <section class="card">
          <p class="eyebrow">Not sure where to begin?</p>
          <h2>Start check</h2>
          <p>Sixteen quick questions from across the year, to see what you know already.</p>
          <div class="row"><a class="btn" href="#/check/start">Take the start check</a></div>
        </section>
      )}
      <section class="card">
        <p class="eyebrow">Quick practice</p>
        <h2>Times tables</h2>
        <p>Twelve quick questions on any table up to 12 × 12.</p>
        <div class="row"><a class="btn" href="#/tables">Practise times tables</a></div>
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
