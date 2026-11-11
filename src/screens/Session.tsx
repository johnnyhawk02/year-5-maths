import { useMemo, useState } from 'preact/hooks';
import { fmt } from '../engine/format';
import { makeRng } from '../engine/rng';
import { isCorrect, type Level, type Question, type Response } from '../engine/types';
import { Choice } from '../inputs/Choice';
import { ColumnGrid, columnValue } from '../inputs/ColumnGrid';
import { DivisionGrid, divisionValue, emptyDivision } from '../inputs/DivisionGrid';
import { FractionBars } from '../inputs/FractionBars';
import { FractionInput, emptyFraction, fractionValue } from '../inputs/FractionInput';
import { PictureView } from '../inputs/PictureView';
import { Rich } from '../inputs/Rich';
import { WrittenPicture } from '../inputs/WrittenPicture';
import { additionPicture, additionSteps, divisionPicture, divisionSteps, longMultiplicationPicture, LONG_MULTIPLICATION_STEPS, shortMultiplicationPicture, shortMultiplicationSteps, subtractionPicture, subtractionSteps, type Written } from '../engine/written';
import { showFrac } from '../engine/fractions';
import { NumberLine } from '../inputs/NumberLine';
import { NumberPad, padValue } from '../inputs/NumberPad';
import { Order } from '../inputs/Order';
import { PASS_MARK, SET_SIZE, recordPractice } from '../progress';
import { getSkillContent } from '../skills';
import { findSkill } from './Skill';

type Mode = 'try' | 'practise';

const PRACTISE_LEVELS: Level[] = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
const TRY_LEVELS: Level[] = [1, 1, 2];
const MAX_EXTRA = 3;

interface Item { q: Question; level: Level; extra: boolean }

const rightAnswer = (q: Question): string => {
  switch (q.kind) {
    case 'number': return q.money ? `£${q.answer.toFixed(2)}` : fmt(q.answer) + (q.unit ? (/^[%°]/.test(q.unit) ? q.unit : ` ${q.unit}`) : '');
    case 'choice': return q.options[q.answer];
    case 'order': return q.answer.join(',  ');
    case 'line': return fmt(q.answer);
    case 'column': return fmt(q.answer);
    case 'division': return fmt(q.answer) + (q.askRemainder ? ` remainder ${q.remainder}` : '');
    case 'fraction': return showFrac(q.answer);
  }
};

/** The finished working for a written calculation, drawn as it would look on paper. */
const finishedWorking = (q: Question): Written | null => {
  const plain = (w: Written): Written =>
    w.kind === 'division'
      ? { ...w, digits: w.digits.map((c) => ({ ...c, hi: false })), answer: w.answer.map((c) => ({ ...c, hi: false })) }
      : { ...w, rows: w.rows.map((r) => (r === 'rule' ? r : { ...r, cells: r.cells.map((c) => ({ ...c, hi: false })) })) };
  if (q.kind === 'division') return plain(divisionPicture(q.dividend, q.divisor, divisionSteps(q.dividend)));
  if (q.kind !== 'column') return null;
  if (q.op === '+') return plain(additionPicture(q.rows, additionSteps(q.rows)));
  if (q.op === '-') return plain(subtractionPicture(q.rows[0], q.rows[1], subtractionSteps(q.rows[0])));
  const [a, b] = q.rows;
  return plain(b < 10 ? shortMultiplicationPicture(a, b, shortMultiplicationSteps(a, b)) : longMultiplicationPicture(a, b, LONG_MULTIPLICATION_STEPS));
};

export function Session({ id, mode, onRecorded }: { id: string; mode: Mode; onRecorded: () => void }) {
  const content = getSkillContent(id);
  const found = findSkill(id);
  const rng = useMemo(() => makeRng(Date.now()), [id, mode]);
  const [items, setItems] = useState<Item[]>(() =>
    content ? (mode === 'try' ? TRY_LEVELS : PRACTISE_LEVELS).map((level) => ({ q: content.generate(level, rng), level, extra: false })) : [],
  );
  const [index, setIndex] = useState(0);
  const [pad, setPad] = useState('');
  const [pick, setPick] = useState<number | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [point, setPoint] = useState<number | null>(null);
  const [cells, setCells] = useState<string[]>([]);
  const [division, setDivision] = useState(emptyDivision);
  const [fraction, setFraction] = useState(emptyFraction);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!content || !found) return null;

  if (done) {
    const passed = score >= PASS_MARK;
    return (
      <div class="stack results">
        <p class="eyebrow">{found.skill.name}</p>
        {mode === 'try' ? (
          <>
            <h1>Ready to practise?</h1>
            <p class="lede">You have tried a few. The practice set has {SET_SIZE} questions.</p>
            <div class="row">
              <a class="btn primary" href={`#/practise/${id}`}>Practise</a>
              <a class="btn" href={`#/learn/${id}`}>See it again</a>
            </div>
          </>
        ) : (
          <>
            <h1>{score} out of {SET_SIZE}</h1>
            <div class="meter" aria-hidden="true"><div class="meter-fill" style={{ width: `${(score / SET_SIZE) * 100}%` }} /></div>
            {passed ? (
              <p class="mark big"><span class="tick done" aria-hidden="true" /> Skill ticked. Well done.</p>
            ) : (
              <p class="lede">You need {PASS_MARK} to tick this skill. Have another look at the example, then try again.</p>
            )}
            <div class="row">
              {passed ? <a class="btn primary" href="#/map">Back to the map</a> : <a class="btn primary" href={`#/learn/${id}`}>See it again</a>}
              <a class="btn" href={`#/skill/${id}`}>Practise again</a>
            </div>
          </>
        )}
      </div>
    );
  }

  const item = items[index];
  const q = item.q;
  const response: Response =
    q.kind === 'number' ? padValue(pad) : q.kind === 'column' ? columnValue(cells) : q.kind === 'division' ? divisionValue(division, q.askRemainder) : q.kind === 'fraction' ? fractionValue(fraction) : q.kind === 'choice' ? pick : q.kind === 'line' ? point : placed.length === q.items.length ? placed : null;
  const locked = checked !== null;
  const worked = locked ? finishedWorking(q) : null;

  const check = () => {
    if (response === null) return;
    const ok = isCorrect(q, response);
    setChecked(ok);
    if (mode === 'practise') {
      if (ok && !item.extra) setScore(score + 1);
      // A slip earns one more question of the same kind at the end of the set.
      if (!ok && items.filter((i) => i.extra).length < MAX_EXTRA) {
        setItems([...items, { q: content.generate(item.level, rng), level: item.level, extra: true }]);
      }
    }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      if (mode === 'practise') {
        recordPractice(id, score);
        onRecorded();
      }
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setPad('');
    setPick(null);
    setPlaced([]);
    setPoint(null);
    setCells([]);
    setDivision(emptyDivision());
    setFraction(emptyFraction());
    setChecked(null);
    setHint(false);
  };

  return (
    <div class="session">
      <div class="session-top">
        <a class="crumb" href={`#/skill/${id}`}>Stop</a>
        <div class="meter" role="img" aria-label={`Question ${index + 1} of ${items.length}`}>
          <div class="meter-fill" style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
        <span class="count">{index + 1} / {items.length}</span>
      </div>

      <div class={`q-layout ${q.kind === 'line' ? 'one-col' : ''}`}>
        <section class="q-side">
          <p class="prompt"><Rich text={q.prompt} /></p>
          {q.show && <p class="show"><Rich text={q.show} /></p>}
          {q.pics?.map((p, pi) => <PictureView key={pi} picture={p} />)}
          {q.bars && <FractionBars bars={q.bars} />}

          {mode === 'try' && !locked && (
            hint ? <p class="card hint-card"><Rich text={q.explain[0]} /></p> : <button class="link hint-btn" onClick={() => setHint(true)}>Show a hint</button>
          )}

          {locked && (
            <div class={`card feedback ${checked ? 'right' : 'wrong'}`} role="status">
              <p class="mark big">
                <span class={`verdict ${checked ? 'yes' : 'no'}`} aria-hidden="true">{checked ? '✓' : '✕'}</span>
                {checked ? 'Correct' : 'Not quite'}
              </p>
              {!checked && <p>The answer is <strong><Rich text={rightAnswer(q)} /></strong>.</p>}
              {worked && <WrittenPicture picture={worked} />}
              <ul class="working">
                {q.explain.map((line, i) => <li key={i}><Rich text={line} /></li>)}
              </ul>
            </div>
          )}
        </section>

        <section class="a-side">
          {q.kind === 'number' && <NumberPad value={pad} onChange={setPad} allowNegative={q.allowNegative} decimal={q.decimal} unit={q.unit} prefix={q.money ? '£' : undefined} disabled={locked} />}
          {q.kind === 'column' && <ColumnGrid key={index} op={q.op} rows={q.rows} answer={q.answer} workRows={q.workRows} value={cells} onChange={setCells} disabled={locked} />}
          {q.kind === 'division' && (
            <DivisionGrid key={index} dividend={q.dividend} divisor={q.divisor} askRemainder={q.askRemainder} value={division} onChange={setDivision} disabled={locked} />
          )}
          {q.kind === 'fraction' && <FractionInput key={index} mixed={q.mixed} value={fraction} onChange={setFraction} disabled={locked} />}
          {q.kind === 'choice' && <Choice options={q.options} value={pick} onChange={setPick} disabled={locked} />}
          {q.kind === 'order' && <Order items={q.items} value={placed} onChange={setPlaced} disabled={locked} />}
          {q.kind === 'line' && (
            <NumberLine min={q.min} max={q.max} step={q.step} labelEvery={q.labelEvery} value={point} onChange={setPoint} disabled={locked} reveal={checked === false ? q.answer : undefined} />
          )}
          <div class="row end">
            {locked ? (
              <button class="btn primary wide" onClick={next}>{index + 1 >= items.length ? 'Finish' : 'Next'}</button>
            ) : (
              <button class="btn primary wide" disabled={response === null} onClick={check}>Check</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
