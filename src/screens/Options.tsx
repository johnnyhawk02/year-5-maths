import { DEFAULTS, INKS, PAGES, SPOTS, type Settings, type TextSize } from '../theme';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

interface Choice { id: string; name: string; colour: string; disabled?: boolean }

function Swatches(props: { label: string; value: string; choices: Choice[]; onPick: (id: string) => void }) {
  return (
    <fieldset class="group">
      <legend>{props.label}</legend>
      <div class="swatches" role="radiogroup" aria-label={props.label}>
        {props.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            class="swatch"
            aria-checked={props.value === c.id}
            disabled={c.disabled}
            onClick={() => props.onPick(c.id)}
          >
            <span class="dot" style={{ background: c.colour }} />
            <span class="swatch-name">{c.name}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const SIZES: { id: TextSize; name: string }[] = [
  { id: 'normal', name: 'Normal' },
  { id: 'large', name: 'Large' },
  { id: 'larger', name: 'Larger' },
];

export function Options({ settings, onChange }: Props) {
  const page = PAGES.find((p) => p.id === settings.page)!;
  const spotColour = (s: (typeof SPOTS)[number]) => (page.dark ? s.dark : s.light);

  return (
    <div class="stack">
      <h1>Options</h1>

      <section class="card preview" aria-label="Preview">
        <p class="eyebrow">Preview</p>
        <p class="sum">348 + 275 = <span class="blank">?</span></p>
        <div class="meter" aria-hidden="true">
          <div class="meter-fill" style={{ width: '60%' }} />
        </div>
        <div class="row">
          <span class="btn primary as-label">Check</span>
          <span class="mark"><span class="tick done" aria-hidden="true" /> Correct</span>
        </div>
      </section>

      <section class="card">
        <h2>Colours</h2>
        <Swatches
          label="Page"
          value={settings.page}
          choices={PAGES.map((p) => ({ id: p.id, name: p.name, colour: p.page }))}
          onPick={(id) => onChange({ page: id })}
        />
        <Swatches
          label="Writing"
          value={settings.ink}
          choices={INKS.filter((i) => i.forDark === page.dark).map((i) => ({ id: i.id, name: i.name, colour: i.value }))}
          onPick={(id) => onChange({ ink: id })}
        />
        <Swatches
          label="Buttons"
          value={settings.spot1}
          choices={SPOTS.map((s) => ({ id: s.id, name: s.name, colour: spotColour(s), disabled: s.id === settings.spot2 }))}
          onPick={(id) => onChange({ spot1: id })}
        />
        <Swatches
          label="Ticks and progress"
          value={settings.spot2}
          choices={SPOTS.map((s) => ({ id: s.id, name: s.name, colour: spotColour(s), disabled: s.id === settings.spot1 }))}
          onPick={(id) => onChange({ spot2: id })}
        />
      </section>

      <section class="card">
        <h2>Reading</h2>
        <fieldset class="group">
          <legend>Text size</legend>
          <div class="segments" role="radiogroup" aria-label="Text size">
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                class="segment"
                aria-checked={settings.textSize === s.id}
                onClick={() => onChange({ textSize: s.id })}
              >
                {s.name}
              </button>
            ))}
          </div>
        </fieldset>
        <label class="toggle">
          <input type="checkbox" checked={settings.sound} onChange={(e) => onChange({ sound: e.currentTarget.checked })} />
          <span>Sounds</span>
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => onChange({ reduceMotion: e.currentTarget.checked })}
          />
          <span>Less movement</span>
        </label>
      </section>

      <div class="row">
        <button class="btn" onClick={() => onChange({ ...DEFAULTS })}>Back to the starting colours</button>
      </div>

      <section class="card">
        <p class="eyebrow">For grown-ups</p>
        <h2>Progress and backup</h2>
        <p>See what has been practised, save a backup file, or start again.</p>
        <div class="row"><a class="btn" href="#/progress">Open progress</a></div>
      </section>
    </div>
  );
}
