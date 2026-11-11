import { SKILL_COUNT, UNITS } from '../curriculum';

export function Home() {
  return (
    <div class="stack">
      <h1>Hello</h1>
      <section class="card">
        <p class="eyebrow">Start here</p>
        <h2>{UNITS[0].name}</h2>
        <p>The first lessons are being written. For now you can look around the map and choose your colours.</p>
        <div class="row">
          <a class="btn primary" href="#/map">Open the map</a>
          <a class="btn" href="#/options">Choose colours</a>
        </div>
      </section>
      <section class="card">
        <p class="eyebrow">Your year</p>
        <div class="meter" role="img" aria-label={`0 of ${SKILL_COUNT} skills ticked`}>
          <div class="meter-fill" style={{ width: '0%' }} />
        </div>
        <p>
          <strong>0</strong> of {SKILL_COUNT} skills ticked across {UNITS.length} units.
        </p>
      </section>
    </div>
  );
}
