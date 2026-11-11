import { UNITS } from '../curriculum';
import { PASS_MARK, SET_SIZE, type Progress } from '../progress';
import { hasContent } from '../skills';

export function findSkill(id: string) {
  for (const u of UNITS) {
    const s = u.skills.find((k) => k.id === id);
    if (s) return { unit: u, skill: s };
  }
  return null;
}

export function SkillScreen({ id, progress }: { id: string; progress: Progress }) {
  const found = findSkill(id);
  if (!found || !hasContent(id)) {
    return (
      <div class="stack">
        <h1>Not ready yet</h1>
        <p class="lede">This lesson has not been written yet.</p>
        <div class="row"><a class="btn" href="#/map">Back to the map</a></div>
      </div>
    );
  }
  const p = progress[id];
  return (
    <div class="stack">
      <p class="eyebrow"><a class="crumb" href="#/map">Map</a> / Unit {found.unit.number}: {found.unit.name}</p>
      <h1>{found.skill.name}</h1>
      {p && (
        <p class="mark">
          <span class={`tick ${p.ticked ? 'done' : ''}`} aria-hidden="true" />
          {p.ticked ? 'Ticked.' : 'Not ticked yet.'} Best score {p.best} out of {SET_SIZE}.
        </p>
      )}
      <ol class="steps-list">
        <li class="card step-card">
          <div>
            <h2>1. See it</h2>
            <p>A worked example, one step at a time.</p>
          </div>
          <a class={`btn ${p ? '' : 'primary'}`} href={`#/learn/${id}`}>See it</a>
        </li>
        <li class="card step-card">
          <div>
            <h2>2. Try it</h2>
            <p>Three questions with a hint if you want one. No score.</p>
          </div>
          <a class="btn" href={`#/try/${id}`}>Try it</a>
        </li>
        <li class="card step-card">
          <div>
            <h2>3. Practise</h2>
            <p>{SET_SIZE} questions. Get {PASS_MARK} or more right to tick this skill.</p>
          </div>
          <a class={`btn ${p ? 'primary' : ''}`} href={`#/practise/${id}`}>Practise</a>
        </li>
      </ol>
    </div>
  );
}
