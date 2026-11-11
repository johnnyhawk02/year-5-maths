import { useRef, useState } from 'preact/hooks';
import { eraseAll, makeBackup, readBackup, restoreBackup } from '../backup';
import { checkTitle, loadChecks } from '../checks';
import { UNITS } from '../curriculum';
import { SET_SIZE, tickedCount, type Progress } from '../progress';
import { dayKey, loadReview } from '../review';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** The grown-up's view: what has been practised, check results, and backup. */
export function ProgressScreen({ progress, onChanged }: { progress: Progress; onChanged: () => void }) {
  const [message, setMessage] = useState('');
  const [confirmErase, setConfirmErase] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const checks = loadChecks();
  const today = dayKey(new Date());
  const review = loadReview(progress, today);
  const dueNow = Object.values(review).filter((e) => e.due <= today).length;
  const checkIds = ['start', ...UNITS.map((u) => u.id), 'end'].filter((id) => checks[id]);

  const save = async () => {
    const text = JSON.stringify(makeBackup(localStorage), null, 2);
    const name = `year-5-maths-backup-${today}.json`;
    // On an iPad the share sheet is the dependable way to save a file from a Home Screen app.
    try {
      const shared = new File([text], name, { type: 'application/json' });
      if (navigator.canShare?.({ files: [shared] })) {
        await navigator.share({ files: [shared], title: 'Year 5 Maths backup' });
        setMessage('Backup shared. Save it somewhere safe, such as Files.');
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before the link is withdrawn.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage('Backup saved to your downloads.');
  };

  const restore = async (f: File | undefined) => {
    if (!f) return;
    const backup = readBackup(await f.text());
    if (!backup) {
      setMessage('That file is not a Year 5 Maths backup. Nothing was changed.');
      return;
    }
    restoreBackup(localStorage, backup);
    // Reload so that colours and every screen pick up the restored data.
    location.reload();
  };

  return (
    <div class="stack">
      <p class="eyebrow"><a class="crumb" href="#/options">Options</a> / For grown-ups</p>
      <h1>Progress</h1>
      <p class="lede">
        <strong>{tickedCount(progress)}</strong> skills ticked. A skill is ticked by scoring 8 or more out of {SET_SIZE} in a practice set.
        {' '}{Object.keys(review).length} are in daily review, with {dueNow} due today.
      </p>

      {UNITS.map((u) => (
        <section class="card" key={u.id}>
          <p class="eyebrow">Unit {u.number} · {tickedCount(progress, u.skills.map((s) => s.id))} of {u.skills.length} ticked</p>
          <h2>{u.name}</h2>
          <div class="pic-table-wrap">
            <table class="pic-table progress-table">
              <thead><tr><th scope="col">Skill</th><th scope="col">Best</th><th scope="col">Sets</th><th scope="col">Last</th><th scope="col">Next review</th></tr></thead>
              <tbody>
                {u.skills.map((s) => {
                  const p = progress[s.id];
                  return (
                    <tr key={s.id}>
                      <th scope="row"><span class={`tick ${p?.ticked ? 'done' : ''}`} aria-hidden="true" /> {s.name}</th>
                      <td>{p ? `${p.best} / ${SET_SIZE}` : ''}</td>
                      <td>{p?.attempts ?? ''}</td>
                      <td>{p ? shortDate(p.last) : ''}</td>
                      <td>{review[s.id] ? (review[s.id].due <= today ? 'Due' : shortDate(review[s.id].due)) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {checkIds.length > 0 && (
        <section class="card">
          <h2>Checks and tests</h2>
          <div class="pic-table-wrap">
            <table class="pic-table progress-table">
              <thead><tr><th scope="col">Check</th><th scope="col">Last</th><th scope="col">Best</th><th scope="col">Date</th></tr></thead>
              <tbody>
                {checkIds.map((id) => (
                  <tr key={id}>
                    <th scope="row">{checkTitle(id)}{id !== 'start' && id !== 'end' ? `: ${UNITS.find((u) => u.id === id)!.name}` : ''}</th>
                    <td>{checks[id].last.score} / {checks[id].last.total}</td>
                    <td>{checks[id].best} / {checks[id].last.total}</td>
                    <td>{shortDate(checks[id].last.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section class="card">
        <h2>Backup</h2>
        <p>Progress is kept only on this device. Save a backup file now and then, so it can be put back after a new iPad or a reset.</p>
        <div class="row">
          <button class="btn primary" onClick={() => void save()}>Save a backup</button>
          <button class="btn" onClick={() => file.current?.click()}>Restore from a backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void restore(e.currentTarget.files?.[0])} />
        </div>
        {message && <p role="status">{message}</p>}
      </section>

      <section class="card">
        <h2>Start again</h2>
        <p>This removes all ticks, scores, check results and colour choices from this device. It cannot be undone, so save a backup first.</p>
        <div class="row">
          {confirmErase ? (
            <>
              <button class="btn danger" onClick={() => { eraseAll(localStorage); onChanged(); location.reload(); }}>Yes, erase everything</button>
              <button class="btn" onClick={() => setConfirmErase(false)}>Keep it</button>
            </>
          ) : (
            <button class="btn" onClick={() => setConfirmErase(true)}>Erase all progress</button>
          )}
        </div>
      </section>
    </div>
  );
}
