import { useEffect, useMemo, useState } from 'preact/hooks';
import { makeRng } from '../engine/rng';
import { NumberPad, padValue } from '../inputs/NumberPad';
import { MIXED, ROUND_SIZE, TABLES, clock, isTableKey, loadTables, makeRound, recordRound, saveTables, type Fact, type TablesState } from '../tables';

const nameOf = (key: string) => (key === MIXED ? 'Mixed tables' : `${key} times table`);

/** The list of tables to choose from, with the two switches. */
export function TablesMenu() {
  const [state, setState] = useState<TablesState>(loadTables);
  const set = (patch: Partial<TablesState>) => {
    const next = { ...state, ...patch };
    setState(next);
    saveTables(next);
  };
  return (
    <div class="stack">
      <h1>Times tables</h1>
      <p class="lede">Pick a table. Each round has {ROUND_SIZE} quick questions. Knowing these by heart makes the rest of maths easier.</p>
      <ul class="table-grid">
        {[...TABLES.map(String), MIXED].map((key) => {
          const s = state.scores[key];
          const full = s?.best === ROUND_SIZE;
          return (
            <li key={key}>
              <a class={`table-btn ${key === MIXED ? 'mixed' : ''}`} href={`#/tables/${key}`} aria-label={nameOf(key)}>
                <span class="table-name">{key === MIXED ? 'Mixed' : `${key} ×`}</span>
                <span class="table-best">
                  {full && <span class="tick done" aria-hidden="true" />}
                  {s ? `Best ${s.best} / ${ROUND_SIZE}` : 'Not tried'}
                </span>
                {s?.time !== undefined && <span class="table-best">Fastest {clock(s.time)}</span>}
              </a>
            </li>
          );
        })}
      </ul>
      <section class="card">
        <label class="toggle">
          <input type="checkbox" checked={state.division} onChange={(e) => set({ division: e.currentTarget.checked })} />
          <span>Include division facts, such as 56 ÷ 7</span>
        </label>
        <label class="toggle">
          <input type="checkbox" checked={state.timed} onChange={(e) => set({ timed: e.currentTarget.checked })} />
          <span>Show a stopwatch</span>
        </label>
      </section>
    </div>
  );
}

export function TablesRound({ id }: { id: string }) {
  const settings = useMemo(loadTables, [id]);
  const [facts, setFacts] = useState<Fact[]>(() => (isTableKey(id) ? makeRound(id, settings.division, makeRng(Date.now())) : []));
  const [index, setIndex] = useState(0);
  const [pad, setPad] = useState('');
  const [results, setResults] = useState<boolean[]>([]);
  const [wrong, setWrong] = useState(false);
  const [started, setStarted] = useState(() => Date.now());
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState<TablesState | null>(null);

  const done = saved !== null;
  useEffect(() => {
    if (!settings.timed || done) return;
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(t);
  }, [started, done]);

  if (!isTableKey(id)) return null;

  const score = results.filter(Boolean).length;

  const again = () => {
    setFacts(makeRound(id, settings.division, makeRng(Date.now())));
    setIndex(0);
    setPad('');
    setResults([]);
    setWrong(false);
    setStarted(Date.now());
    setSeconds(0);
    setSaved(null);
  };

  if (done) {
    const missed = facts.filter((_, i) => !results[i]);
    const best = saved.scores[id];
    return (
      <div class="stack results">
        <p class="eyebrow">{nameOf(id)}</p>
        <h1>{score} out of {ROUND_SIZE}</h1>
        <div class="meter" aria-hidden="true"><div class="meter-fill" style={{ width: `${(score / ROUND_SIZE) * 100}%` }} /></div>
        {score === ROUND_SIZE ? (
          <p class="mark big"><span class="tick done" aria-hidden="true" /> Every one right. Well done.</p>
        ) : (
          <section class="card">
            <p class="eyebrow">Facts to learn</p>
            <ul class="fact-list">{missed.map((f) => <li key={f.full}>{f.full}</li>)}</ul>
          </section>
        )}
        {settings.timed && (
          <p class="lede">
            Time: <strong>{clock(seconds)}</strong>.
            {best?.time !== undefined && ` Your fastest round with every one right is ${clock(best.time)}.`}
          </p>
        )}
        <div class="row">
          <button class="btn primary" onClick={again}>Go again</button>
          <a class="btn" href="#/tables">Choose another table</a>
        </div>
      </div>
    );
  }

  const fact = facts[index];
  const value = padValue(pad);

  const advance = (all: boolean[]) => {
    if (index + 1 >= facts.length) {
      const took = Math.floor((Date.now() - started) / 1000);
      setSeconds(took);
      setSaved(recordRound(id, all.filter(Boolean).length, settings.timed ? took : null));
      return;
    }
    setIndex(index + 1);
    setPad('');
    setWrong(false);
  };

  const check = () => {
    if (value === null) return;
    const ok = value === fact.answer;
    const all = [...results, ok];
    setResults(all);
    // A right answer moves straight on. A slip stops to show the fact.
    if (ok) advance(all);
    else setWrong(true);
  };

  return (
    <div class="session">
      <div class="session-top">
        <a class="crumb" href="#/tables">Stop</a>
        <ol class="dots" aria-label={`Question ${index + 1} of ${facts.length}`}>
          {facts.map((_, i) => (
            <li key={i} class={`dot ${results[i] === true ? 'yes' : results[i] === false ? 'no' : i === index ? 'now' : ''}`} />
          ))}
        </ol>
        <span class="count">{settings.timed ? clock(seconds) : `${index + 1} / ${facts.length}`}</span>
      </div>
      <div class="q-layout">
        <section class="q-side">
          <p class="prompt">{nameOf(id)}</p>
          <p class="show fact">{fact.text}</p>
          {wrong && (
            <div class="card feedback wrong" role="status">
              <p class="mark big"><span class="verdict no" aria-hidden="true">✕</span>Not quite</p>
              <p class="show">{fact.full}</p>
              <p>Say it to yourself, then carry on.</p>
            </div>
          )}
        </section>
        <section class="a-side">
          <NumberPad value={pad} onChange={setPad} disabled={wrong} />
          <div class="row end">
            {wrong ? (
              <button class="btn primary wide" onClick={() => advance(results)}>{index + 1 >= facts.length ? 'Finish' : 'Next'}</button>
            ) : (
              <button class="btn primary wide" disabled={value === null} onClick={check}>Check</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
