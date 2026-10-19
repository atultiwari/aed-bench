/* AED Bench · Sketchbook: state, the step runner, the player and taps. The panel and phone layout are in aed-ui.js.
   The state is just where we are: the step, the active station `at` and the progress `u` in it. */

const aedNow = () => performance.now() / 1000;
const aedFresh = () => ({ step: 0, at: 0, u: 0, busy: false });
const st = { pal: 'cobalt', playing: false, paused: false, loop: false, token: 0, benchView: false, mode: '30:2', ...aedFresh() };
let ui, aedLast = null;

/* ---------- the runner: a step is a list of moves; each move eases values over time ---------- */
function aedRun(moves, done) {
  const token = st.token;
  let i = -1, mv = null, t = 0;
  const next = () => { if (++i >= moves.length) return false; mv = moves[i](); t = 0; return true; };
  next();
  ui.animate(dt => {
    if (token !== st.token) return false;
    if (st.paused) return true;
    t += dt; const u = Math.min(1, t / mv.dur); mv.step(u);
    if (u < 1) return true;
    if (next()) return true;
    done(); return false;
  });
}
const aedStationMove = key => () => { st.at = AED.IDX[key]; st.u = 0; return { dur: AED_DUR[key], step: u => { st.u = u; } }; };
const aedWait = (sec, then) => aedRun([() => ({ dur: sec, step: () => {} })], then);

function aedGo(n, after) {
  if (st.busy) return ui.flash('Wait for this step to finish');
  if (n < st.step) return ui.flash(`${AED.STEPS[n].label} is already done`);
  if (n > st.step) return ui.flash(AED.WHY_NOT[n]);
  const S1 = AED.STEPS[n];
  st.busy = true;
  aedNote(`Step ${n + 1} of ${AED.STEPS.length}: ${S1.label}`, S1.note, S1);
  aedRun(S1.path.map(aedStationMove), () => {
    st.busy = false; st.step++;
    aedNote(`Step ${n + 1} of ${AED.STEPS.length}: ${S1.label}, done`, S1.done, S1);
    if (after) after();
    else if (st.playing) aedWait(1.2, aedPlayNext);
  });
}

/* ---------- taps on the drawing: a tape names its station; a part may serve several stations ---------- */
const AED_PART_STATIONS = {
  helper: ['helper', 'clear'], aed: ['lid', 'power', 'plug', 'analyse', 'shock', 'next'], rescuerA: ['safe', 'chest1', 'chest2'],
  body: ['shoulders', 'airway', 'chest1', 'bare', 'pad1', 'pad2', 'chest2'], phone: ['call'],
};
const aedStepOf = key => AED.STEPS.findIndex(S1 => S1.path.includes(key));
function aedTapKeys(keys) {
  if (st.playing) return ui.flash('Autoplay is running: pause or stop it first');
  if (st.busy) {
    if (aedKey(st.at) === 'analyse' && keys.includes('chest1')) return ui.flash(AED.HANDS_OFF);
    return ui.flash('Wait for this step to finish');
  }
  if (st.step >= AED.STEPS.length) return ui.flash('All done: press Play or Stop to start over');
  if (keys.some(k => aedStepOf(k) === st.step)) return aedGo(st.step);
  const ahead = keys.map(aedStepOf).filter(n => n > st.step);
  if (ahead.length) return ui.flash(AED.WHY_NOT[Math.min(...ahead)]);
  const S1 = AED.STEPS[st.step], first = AED.STATIONS[AED.IDX[S1.path[0]]];
  ui.flash(`Next: ${S1.label}. Tap ${first.label} (${first.num})`);
}
const aedTapStation = i => aedTapKeys([aedKey(i)]);

/* ---------- player: play, pause, stop, loop ---------- */
function aedPlayNext() {
  if (!st.playing) return;
  if (st.step < AED.STEPS.length) return aedGo(st.step, () => aedWait(1.2, aedPlayNext));
  if (st.loop) return aedWait(3, () => { aedResetState(); ui.render(); aedWait(1, aedPlayNext); });
  st.playing = false; aedSyncPlayer();
}
function aedPlay() {
  if (st.playing && st.paused) { st.paused = false; return aedSyncPlayer(); }
  if (st.playing) return;
  if (st.step >= AED.STEPS.length) aedResetState();
  st.playing = true; st.paused = false; aedSyncPlayer();
  if (!st.busy) aedPlayNext();
  else ui.flash('Autoplay picks up after this step');
}
function aedPause() { if (!st.playing || st.paused) return; st.paused = true; aedSyncPlayer(); }
function aedStop() { st.token++; st.playing = false; st.paused = false; aedResetState(); aedSyncPlayer(); ui.render(); }
function aedResetState() {
  st.token++;
  Object.assign(st, aedFresh());
  aedNote('Ready', 'An adult has collapsed on the floor. Press Play, press a step, or tap the SAFE? tape to begin.');
}
function aedSyncPlayer() {
  const pb = document.getElementById('aedPlay'), ps = document.getElementById('aedPause');
  if (!pb) return;
  const run = st.playing && !st.paused;
  pb.textContent = run ? '▶ Playing' : st.paused ? '▶ Resume' : '▶ Play';
  pb.disabled = run;
  pb.setAttribute('aria-pressed', String(run));
  ps.disabled = !run;
  document.getElementById('aedStop').disabled = !st.playing;
  document.getElementById('aedLoop').checked = st.loop;
}

/* ---------- ?at=pad1&u=.5 (or ?step=4) opens at any moment, for screenshots and teaching ---------- */
function aedParams(s1, q) {
  const key = q.get('at'), n = q.get('step');
  if (key && AED.IDX[key] != null) {
    const i = AED.IDX[key], k = aedStepOf(key), u = Math.max(0, Math.min(1, +(q.get('u') ?? 1)));
    Object.assign(s1, { at: i, u, step: k, busy: false });
  } else if (n != null && +n > 0) {
    const k = Math.min(AED.STEPS.length, +n), last = AED.STEPS[k - 1].path.slice(-1)[0];
    Object.assign(s1, { step: k, at: AED.IDX[last], u: 1 });
  }
  if (q.get('mode') === 'cco') s1.mode = 'cco';
}
