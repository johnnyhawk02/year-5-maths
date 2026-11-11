import { useState } from 'preact/hooks';
import { UNITS } from '../curriculum';

export function MapScreen() {
  const [open, setOpen] = useState<string | null>(UNITS[0].id);
  return (
    <div class="stack">
      <h1>Map</h1>
      <p class="lede">Eight units cover everything in Year 5. Lessons will appear here as they are written.</p>
      <ol class="units">
        {UNITS.map((u) => {
          const isOpen = open === u.id;
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
                <span class="unit-count">0 / {u.skills.length}</span>
                <span class="chev" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <ul class="skills" id={`unit-${u.id}`}>
                  {u.skills.map((s) => (
                    <li key={s.id} class="skill">
                      <span class="tick" aria-hidden="true" />
                      <span>{s.name}</span>
                      <span class="soon">Coming soon</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
