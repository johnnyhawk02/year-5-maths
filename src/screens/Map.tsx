import { useState } from 'preact/hooks';
import { UNITS } from '../curriculum';
import { tickedCount, type Progress } from '../progress';
import { hasContent } from '../skills';
import { loadChecks } from '../checks';

export function MapScreen({ progress }: { progress: Progress }) {
  const [open, setOpen] = useState<string | null>(UNITS[0].id);
  const checks = loadChecks();
  return (
    <div class="stack">
      <h1>Map</h1>
      <p class="lede">Eight units cover everything in Year 5. All eight are ready.</p>
      <ol class="units">
        {UNITS.map((u) => {
          const isOpen = open === u.id;
          const done = tickedCount(progress, u.skills.map((s) => s.id));
          return (
            <li key={u.id} class="unit">
              <button
                class="unit-head"
                aria-expanded={isOpen}
                aria-controls={`unit-${u.id}`}
                onClick={() => setOpen(isOpen ? null : u.id)}
              >
                <span class="unit-num">{u.number}</span>
                <span class="unit-name">{u.name}</span>
                <span class="unit-count">{done} / {u.skills.length}</span>
                <span class="chev" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <ul class="skills" id={`unit-${u.id}`}>
                  {u.skills.map((s) => {
                    const ticked = !!progress[s.id]?.ticked;
                    const inner = (
                      <>
                        <span class={`tick ${ticked ? 'done' : ''}`} aria-hidden="true" />
                        <span>{s.name}</span>
                      </>
                    );
                    return hasContent(s.id) ? (
                      <li key={s.id}>
                        <a class="skill ready" href={`#/skill/${s.id}`}>
                          {inner}
                          <span class="soon">{ticked ? 'Ticked' : progress[s.id] ? 'Started' : 'Start'} {'›'}</span>
                        </a>
                      </li>
                    ) : (
                      <li key={s.id} class="skill">
                        {inner}
                        <span class="soon">Coming soon</span>
                      </li>
                    );
                  })}
                  <li key="test">
                    <a class="skill ready" href={`#/check/${u.id}`}>
                      <span class={`tick ${checks[u.id] && checks[u.id].best >= checks[u.id].last.total * 0.8 ? 'done' : ''}`} aria-hidden="true" />
                      <span><strong>Unit test</strong></span>
                      <span class="soon">{checks[u.id] ? `Best ${checks[u.id].best} / ${checks[u.id].last.total}` : 'Start'} {'›'}</span>
                    </a>
                  </li>
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <div class="row">
        <a class="btn" href="#/check/end">End of year check</a>
        <a class="btn" href="#/check/start">Start check</a>
      </div>
    </div>
  );
}
