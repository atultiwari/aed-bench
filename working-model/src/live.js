// The page. Inlined after the shared spec, the kit, the model, the world, figures, poses, the
// window and live-draw.js, so `AED`, `STATIONS`, `stationAtReal`, `sceneAt`, `windowAt`… are in scope.
// Every number written to the page is read from the model here; nothing is typed in.

const ui = (sel) => document.querySelector(sel);
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = matchMedia("(max-width: 560px), (orientation: landscape) and (max-height: 500px)");
const params = new URLSearchParams(location.search);
const pills = [...document.querySelectorAll(".wm-pill")];
const cells = [...document.querySelectorAll(".wm-cell")];
const RUN_END = RUN_SECONDS;

// ---- state ------------------------------------------------------------------------------
let mode = params.get("mode") === "manual" ? "manual" : "auto";
const autoplay = params.get("autoplay"); // null: one run; "0": still; "1": loop
let loop = autoplay === "1";
let runState = mode === "auto" && autoplay !== "0" ? "running" : "idle"; // idle | running | paused | ended
let T = 0; // real seconds into the whole run
let stopAt = mode === "auto" ? RUN_END : 0;
let breaths = "30:2";
let overview = false;
let loopWait = 0;
let frozen = false;

const doneSteps = () => STEPS.reduce((n, _, k) => (stepEndReal(k) <= T + 1e-6 ? k + 1 : n), 0);

// ---- sound words: short-lived, placed on the action ----------------------------------
const words = [];
const say = (text, at, now) => { words.push({ text, at, born: now }); if (words.length > 8) words.shift(); };
let lastKey = -1, lastCount = -1, lastBreath = false;
function soundsFor(m, sc, chest, now) {
  const st = STATIONS[m.i];
  if (m.i !== lastKey) {
    lastKey = m.i;
    if (st.key === "power") say("click", [...ON_AT.slice(0, 2), 22], now);
    if (st.key === "bare") say("rip", [BX + 14, 176, 40], now);
    if (st.key === "pad1" || st.key === "pad2") say("peel", [AED_BOX.x + 2, AED_BOX.y + 16, 50], now);
    if (st.key === "plug") setTimeout(() => say("snap", [SOCKET_AT[0], SOCKET_AT[1], 26], performance.now()), 1200);
    if (st.key === "shock") say("click", [SHOCK_AT[0], SHOCK_AT[1], 24], now);
  }
  if (!st.cpr || !chest) { lastCount = -1; lastBreath = false; return; }
  if (chest.breathing && !lastBreath && breaths === "30:2") say("2 breaths", [BX, BODY.head.y - 4, 36], now);
  lastBreath = chest.breathing;
  if (m.speed <= 2.2 && chest.count !== lastCount && !chest.breathing) say("push", [W_CHEST[0] + 12, W_CHEST[1] + 18, 52], now);
  lastCount = chest.count;
}

// ---- one moment -------------------------------------------------------------------------
function momentAt(Treal) {
  const m = stationAtReal(Treal);
  const st = STATIONS[m.i];
  const t = clockAt(m.i, m.secs);
  const run = st.cpr ? cprRunAt(Math.min(t, TOTAL - 1e-6)) : null;
  const chest = run ? chestAt(run.secs, breaths) : null;
  // the drawn push: exact at ×1 or ×2; when fast-forwarding it pushes at a readable pace
  // (the counter and the clock still read the model)
  let dip = chest ? chest.dip : 0;
  if (chest && m.speed > 2.2) dip = chest.breathing ? 0 : Math.sin(Math.PI * ((Treal * NUM.rate * 1.6) / 60 % 1)) ** 2;
  return { m, st, t, chest, dip };
}

// ---- camera: follow the active station, or the whole floor -----------------------------
let cam = null;
function follow(st, dt) {
  const box = svg.getBoundingClientRect();
  const aspect = box.width > 0 && box.height > 0 ? box.height / box.width : HEIGHT / WIDTH;
  if (overview) { svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`); cam = null; return 1; }
  const phone = window.matchMedia("(max-width: 560px)").matches;
  const w = phone ? 330 : WIDTH * 0.56, h = phone ? 330 * aspect : HEIGHT * 0.56;
  const [fx, fy] = iso(st.at, P);
  const want = [Math.max(0, Math.min(WIDTH - w, fx - w / 2)), Math.max(0, Math.min(HEIGHT - h, fy - h * 0.55))];
  if (!cam || dt == null || reduce.matches) cam = want;
  else { const q = 1 - Math.exp(-dt / 0.45); cam = [cam[0] + (want[0] - cam[0]) * q, cam[1] + (want[1] - cam[1]) * q]; }
  svg.setAttribute("viewBox", `${cam[0].toFixed(1)} ${cam[1].toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  return WIDTH / w;
}

// ---- the panel --------------------------------------------------------------------------
const set = (sel, text) => { const el = ui(sel); if (el && el.textContent !== text) el.textContent = text; };
const WHO = { A: "Rescuer A", B: "Helper B", AED: "The AED", "-": "" };
function drawPanel(mo) {
  const { m, st, t } = mo;
  const done = doneSteps();
  const playingStep = runState === "running" && STEP_OF[m.i] >= 0 ? STEP_OF[m.i] : -1;
  const r = readoutsAt(m.i, m.secs, breaths);
  set('[data-chip="clock"]', r.clockText);
  set('[data-chip="station"]', r.inStation);
  set('[data-chip="comp"]', String(r.compressions));
  set('[data-chip="rate"]', r.rate);
  set('[data-chip="handsoff"]', r.handsOff == null ? "–" : `${Math.round(r.handsOff)} s`);
  set('[data-chip="ccf"]', r.fractionText);
  const badgeText = runState === "running" || runState === "paused" ? badge(m.speed) : "";
  set('[data-chip="speed"]', badgeText || (st.secs === 0 && runState === "running" ? "clock stopped" : "–"));
  ui(".wm-depth i").style.bottom = `${((mo.dip * DEPTH_CM) / 7) * 100}%`;
  set(".wm-readout", `Clock ${r.clockText} · step ${Math.max(1, Math.min(7, STEP_OF[m.i] + 1 || done + 1))} of ${STEPS.length}`);
  set(".wm-mrow-step", done === STEPS.length && runState !== "running" ? "All 7 steps done" : `Step ${playingStep >= 0 ? playingStep + 1 : Math.min(done + 1, 7)} of ${STEPS.length}`);
  set(".wm-mrow-clock", `${mmss(t)} / ${mmss(TOTAL)}`);
  set(".wm-mrow-badge", badgeText);
  set(".wm-speed", badgeText);
  ui(".wm-speed").hidden = !badgeText;
  // active card
  set(".wm-active-no", String(st.num));
  set(".wm-active-name", st.name);
  set(".wm-active-sub", `${r.inStation}${WHO[st.who] ? ` · ${WHO[st.who]}` : ""}`);
  // note: the step being played, or the next one
  const k = playingStep >= 0 ? playingStep : STEP_OF[m.i] >= 0 && m.real < playOf(m.i) - 1e-6 && runState === "paused" ? STEP_OF[m.i] : Math.min(done, STEPS.length - 1);
  const step = STEPS[k];
  const finished = done === STEPS.length && runState !== "running";
  set(".wm-note-no", finished ? "✓" : String(k + 1));
  set(".wm-note-label", finished ? "All done" : step.label);
  set(".wm-note-text", step.note);
  set(".wm-note-clin", step.clinician || "");
  ui(".wm-note-clinwrap").hidden = !step.clinician;
  set(".wm-note-more", step.more || "");
  ui(".wm-more-detail").hidden = !step.more;
  const justDone = done > 0 && (playingStep < 0) ? STEPS[done - 1].done : "";
  set(".wm-note-done", justDone ? `Step ${done} done: ${justDone}` : "");
  // steps, stations, tapes
  pills.forEach((pill, i) => {
    const state = i < done ? "done" : i === playingStep ? "running" : i === done && playingStep < 0 ? "next" : "locked";
    if (pill.dataset.state !== state) pill.dataset.state = state;
    pill.classList.toggle("is-cue", state === "next" && mode === "manual" && runState !== "running");
  });
  cells.forEach((el, i) => { el.classList.toggle("is-here", i === m.i); el.classList.toggle("is-past", i < m.i); });
  TAPES.forEach((el) => { const i = Number(el.dataset.station); el.classList.toggle("is-active", i === m.i); el.classList.toggle("is-past", i < m.i); });
  centrePhone(k, m.i);
  syncPlayer();
}
const smooth = () => (reduce.matches ? "auto" : "smooth");
let centredStep = -1, centredCell = -1;
function centreIn(box, el) {
  // horizontal only: scrollIntoView would also scroll the page
  const left = el.offsetLeft - box.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
  box.scrollTo({ left: Math.max(0, left), behavior: smooth() });
}
function centrePhone(k, i) {
  if (!narrow.matches) { centredStep = centredCell = -1; return; }
  if (k !== centredStep) { centredStep = k; centreIn(ui(".wm-steps"), pills[k]); }
  if (i !== centredCell) { centredCell = i; centreIn(ui(".wm-rail"), cells[i]); }
}

// ---- toasts -------------------------------------------------------------------------------
let toastTimer = 0;
function toast(text) {
  const el = ui(".wm-toast");
  el.textContent = text;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 4200);
}

// ---- loop ---------------------------------------------------------------------------------
let frame = 0, last = 0;
function render(now, dt = null) {
  const mo = momentAt(T);
  const sc = sceneAt({ i: mo.m.i, secs: mo.m.secs, r: mo.m.real, dip: mo.dip });
  const w = windowAt(mo.m.i, mo.m.secs, breaths);
  setLit(mo.st.key);
  drawFloor(sc, w);
  const zoom = follow(mo.st, dt);
  if (runState === "running") soundsFor(mo.m, sc, mo.chest, now);
  for (let n = words.length - 1; n >= 0; n--) if (now - words[n].born > 1100) words.splice(n, 1);
  const counter = mo.chest && !mo.chest.breathing ? `${mo.chest.count} / ${NUM.ratio[0]}` : mo.chest && mo.chest.breathing ? "breaths" : "";
  drawOverlay(sc, mo.st, { words, counter }, zoom, now);
  const beat = mo.m.speed > 2.2 ? (NUM.rate * 1.6) / 60 : (NUM.rate / 60) * Math.max(1, mo.m.speed);
  paintWindow(w, sc, now, mo.dip, w.strip === "cpr" ? beat : 0);
  drawPanel(mo);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.25) : 0;
  last = now;
  frame = 0;
  if (frozen) return;
  if (runState === "running") {
    T = Math.min(stopAt, T + dt);
    if (T >= stopAt - 1e-9) {
      if (T >= RUN_END - 1e-9) { runState = "ended"; loopWait = loop && mode === "auto" ? 2.5 : 0; }
      else if (mode === "manual") runState = "idle";
    }
  } else if (runState === "ended" && loop && mode === "auto") {
    loopWait -= dt;
    if (loopWait <= 0) { T = 0; stopAt = RUN_END; runState = "running"; lastKey = -1; }
  }
  render(now, dt);
  frame = requestAnimationFrame(tick);
}
const run = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };

// ---- controls -----------------------------------------------------------------------------
function playStep(k) {
  if (runState === "running") return;
  const done = doneSteps();
  if (k < done) { toast(`Step ${k + 1} is done: the steps only go forward.`); return; }
  if (k > done) { toast(`${AED.WHY_NOT[k]} Next: step ${done + 1}, ${STEPS[done].label}.`); return; }
  if (mode !== "manual") setMode("manual", true);
  T = Math.max(T, stepStartReal(k));
  stopAt = stepEndReal(k);
  runState = "running";
  run();
}
function playAll() {
  if (runState === "running") return;
  if (runState === "ended" || doneSteps() === STEPS.length) { T = 0; lastKey = -1; }
  if (mode === "manual") { playStep(doneSteps()); return; }
  stopAt = RUN_END;
  runState = "running";
  run();
}
function stopAll() { T = 0; runState = "idle"; lastKey = -1; words.length = 0; cam = null; render(performance.now()); }
function setMode(next, quiet) {
  mode = next;
  document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  if (mode === "manual" && runState === "running" && !quiet) { stopAt = Math.min(RUN_END, stepEndReal(Math.max(0, STEP_OF[stationAtReal(T).i]))); }
  if (mode === "auto" && !quiet && runState !== "ended") { stopAt = RUN_END; if (runState === "idle") runState = "running"; }
  render(performance.now());
}
const playerBtn = (name) => ui(`[data-player="${name}"]`);
function syncPlayer() {
  const play = playerBtn("play"), pause = playerBtn("pause"), stop = playerBtn("stop");
  const txt = runState === "running" ? "Playing" : runState === "paused" ? "Resume" : "Play";
  if (play.dataset.label !== txt) { play.dataset.label = txt; play.lastElementChild.textContent = txt; }
  play.disabled = runState === "running";
  play.classList.toggle("is-playing", runState === "running");
  pause.disabled = runState !== "running";
  stop.disabled = !(runState === "running" || runState === "paused");
  playerBtn("loop").setAttribute("aria-pressed", String(loop));
  playerBtn("view").setAttribute("aria-pressed", String(overview));
}
playerBtn("play").addEventListener("click", () => { if (runState === "paused") { runState = "running"; run(); } else playAll(); syncPlayer(); });
playerBtn("pause").addEventListener("click", () => { if (runState === "running") runState = "paused"; syncPlayer(); });
playerBtn("stop").addEventListener("click", stopAll);
playerBtn("loop").addEventListener("click", () => { loop = !loop; if (loop && runState === "ended") loopWait = 0.5; syncPlayer(); });
const viewBtns = [...document.querySelectorAll(".wm-view, [data-player='view']")];
const syncView = () => viewBtns.forEach((b) => { b.setAttribute("aria-pressed", String(overview)); if (b.classList.contains("wm-view")) b.textContent = overview ? "Follow the action" : "Whole floor"; });
viewBtns.forEach((b) => b.addEventListener("click", () => { overview = !overview; syncView(); render(performance.now()); }));
syncView();
pills.forEach((pill, k) => pill.addEventListener("click", () => {
  if (mode === "auto" && runState === "running") { toast("Auto is playing every step. Switch to Manual to press the steps yourself."); return; }
  playStep(k);
}));
document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
document.querySelectorAll("[data-breaths]").forEach((b) => b.addEventListener("click", () => {
  breaths = b.dataset.breaths;
  document.querySelectorAll("[data-breaths]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  render(performance.now());
}));
ui(".wm-restart").addEventListener("click", (e) => { e.preventDefault(); stopAll(); });

// tapping a part (or its tape, or its chip) acts like pressing its step
const PART_STATIONS = {
  patient: ["start"], "p-arm-far": ["shoulders"], "p-arm-near": ["shoulders"], phone: ["call"], "p-head": ["airway"],
  "p-torso": ["chest1", "bare", "chest2"], "p-legs": ["start"], "aed-on": ["power"], "aed-shock": ["shock"], "aed-screen": ["analyse", "next"],
  pad1: ["pad1"], pad2: ["pad2"], plug: ["plug"], "lid-back": ["lid"], "lid-front": ["lid"], "a-low": ["safe"], "a-up": ["safe"],
  "b-low": ["helper", "clear"], "b-up": ["helper", "clear"], "b-arms": ["helper", "clear"],
};
function tapStation(i, viaChest) {
  const cur = stationAtReal(T).i;
  if (viaChest && STATIONS[cur].key === "analyse") { toast(AED.HANDS_OFF); return; }
  if (runState === "running") { toast(`${STATIONS[i].num} ${STATIONS[i].label}: ${STATIONS[i].name}.`); return; }
  const k = STEP_OF[i], done = doneSteps();
  if (k < 0) { toast(`Station 1 is the start. Next: step ${done + 1}, ${STEPS[Math.min(done, 6)].label}.`); return; }
  if (k === done) { playStep(k); return; }
  const first = STATIONS[STATIONS_OF[Math.min(done, 6)][0]];
  if (k < done) toast(`Station ${STATIONS[i].num} is done: the steps only go forward.`);
  else toast(`${AED.WHY_NOT[k]} Next: step ${done + 1}, ${STEPS[done].label}: tap ${first.label} (${first.num}).`);
}
svg.addEventListener("click", (e) => {
  const tape = e.target.closest("[data-station]");
  if (tape) { tapStation(Number(tape.dataset.station), false); return; }
  const node = e.target.closest("[data-part], [data-slot]");
  if (!node) return;
  const name = node.dataset.part || node.dataset.slot;
  const list = PART_STATIONS[name];
  if (!list) return;
  const done = doneSteps();
  const idx = list.map((key) => IDX[key]);
  const pick = idx.find((i) => STEP_OF[i] === done) ?? idx.find((i) => STEP_OF[i] > done) ?? idx[idx.length - 1];
  tapStation(pick, ["p-torso", "patient", "p-legs"].includes(name) || STATIONS[stationAtReal(T).i].key === "analyse" && name.startsWith("p-"));
});
cells.forEach((cell, i) => cell.addEventListener("click", () => tapStation(i, false)));

// the window: on phones an inset in the figure (tap to enlarge), elsewhere the side column
const side = ui(".wm-side"), figBox = ui(".wm-fig");
const phoneWide = matchMedia("(max-width: 560px)");
function placeWindow() {
  if (phoneWide.matches && win.parentNode !== figBox) figBox.appendChild(win);
  if (!phoneWide.matches && win.parentNode !== side) { side.insertBefore(win, side.firstChild); win.classList.remove("is-big"); }
}
phoneWide.addEventListener("change", () => { placeWindow(); centredStep = centredCell = -1; render(performance.now()); });
placeWindow();
win.addEventListener("click", () => { if (phoneWide.matches) win.classList.toggle("is-big"); });
const moreBtn = ui(".wm-more-btn"), stage = ui(".wm-stage");
moreBtn.addEventListener("click", () => {
  const open = stage.classList.toggle("is-more");
  moreBtn.textContent = open ? "Less" : "More";
  moreBtn.setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", (e) => {
  if ((e.key === " " || e.key === "Enter") && e.target === document.body) { e.preventDefault(); if (mode === "manual") playStep(doneSteps()); else playAll(); }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) last = 0; });

// test hooks: jump to any moment; read the state
window.WM = {
  perf(n = 30) { const t0 = performance.now(); for (let j = 0; j < n; j++) render(performance.now(), 0.016); return (performance.now() - t0) / n; },
  still(Treal) { frozen = true; T = Treal; words.length = 0; cam = null; render(performance.now()); return { station: stationAtReal(T).i + 1, T }; },
  thaw() { frozen = false; run(); },
  state: () => ({ T, mode, runState, loop, breaths, overview, station: stationAtReal(T).i + 1, done: doneSteps() }),
  RUN_END,
  tap: (i) => tapStation(i, false),
};
document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
render(performance.now());
run();
