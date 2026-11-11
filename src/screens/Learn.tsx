import { useState } from 'preact/hooks';
import { getSkillContent } from '../skills';
import { findSkill } from './Skill';

export function Learn({ id }: { id: string }) {
  const content = getSkillContent(id);
  const found = findSkill(id);
  const [shown, setShown] = useState(1);
  if (!content || !found) return null;
  const steps = content.example;
  const last = shown >= steps.length;
  return (
    <div class="stack">
      <p class="eyebrow"><a class="crumb" href={`#/skill/${id}`}>{found.skill.name}</a> / See it</p>
      <h1>{found.skill.name}</h1>
      <ol class="example">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} class="card example-step">
            <p>{s.say}</p>
            {s.show && <p class="show">{s.show}</p>}
          </li>
        ))}
      </ol>
      <p class="hint-text" aria-live="polite">Step {shown} of {steps.length}</p>
      <div class="row">
        {last ? (
          <>
            <a class="btn primary" href={`#/try/${id}`}>Try it</a>
            <a class="btn" href={`#/skill/${id}`}>Back</a>
          </>
        ) : (
          <button class="btn primary" onClick={() => setShown(shown + 1)}>Next step</button>
        )}
      </div>
    </div>
  );
}
