/* ============================================================
   AED Bench, Turntable: the app. Loads Three.js (pinned, through the import map), builds the floor,
   runs the 7 steps forward only (stations 1..18, each once) and drives the panel.
   A classic script using dynamic import(), so the page also opens straight from disk.
   ============================================================ */
const AED_URL = new URLSearchParams(location.search);
const AED_SPEED = Math.min(20, Math.max(.1, +AED_URL.get('speed') || 1));      // ?speed=4 for quick checks

/* ---------- state ---------- */
const aedFresh = () => ({ step: 0, now: 0, u: 1, busy: false, view: null });
const st = { playing: false, paused: false, loop: false, token: 0, mode: '30:2', ...aedFresh() };

/* ---------- a tiny runner: each move runs a function of u over a real duration ---------- */
const aedAnims = new Set();
function aedRun(moves, done) {
  const token = st.token;
  let i = -1, mv = null, t = 0;
  const next = () => { if (++i >= moves.length) return false; mv = moves[i](); t = 0; return true; };
  next();
  aedAnims.add(dt => {
    if (token !== st.token) return false;
    if (st.paused) return true;
    t += dt; const u = Math.min(1, t / mv.dur); mv.step(u);
    if (u < 1) return true;
    if (next()) return true;
    done(); return false;
  });
}
const aedStationMove = key => () => {
  const i = I[key];
  if (i <= st.now && !(i === 0)) throw new Error(`station ${i + 1} would move backward from ${st.now + 1}`);
  st.now = i; st.u = 0;
  return { dur: realDur(S[i]), step: u => { st.u = u; } };
};

/* ---------- steps, taps and the player ---------- */
function aedGo(n, after) {
  if (st.busy) return aedFlash('Still going: wait for this step to finish');
  if (n < st.step) return aedFlash(`${STEPS[n].label} is already done`);
  if (n > st.step) return aedFlash(AED.WHY_NOT[n]);
  const S1 = STEPS[n];
  st.busy = true;
  aedFollow.paused = false;
  aedNote(n, false);
  aedRun(S1.path.map(aedStationMove), () => {
    st.busy = false; st.step++;
    aedNote(n, true);
    aedSyncPanel();
    if (after) after();
    else if (st.playing) aedWait(1.2, aedPlayNext);
  });
  aedSyncPanel();
}
const aedNextHint = () => {
  if (st.step >= STEPS.length) return 'All done: press Stop to start over';
  const s1 = S[I[STEPS[st.step].path[0]]];
  return `Next: ${STEPS[st.step].label}. Tap ${s1.num} ${s1.label}`;
};
// a part on the drawing runs the step it belongs to, or says why not yet
function aedTapStation(i) {
  if (st.playing) return aedFlash('Autoplay is running: pause or stop it first');
  if (st.busy) return aedFlash('Still going: wait for this step to finish');
  if (st.step >= STEPS.length) return aedFlash(aedNextHint());
  const n = STATION_STEP[i];
  if (n === st.step) return aedGo(n);
  if (n > st.step) return aedFlash(AED.WHY_NOT[n]);
  aedFlash(n < 0 ? `${S[i].label}: the person on the floor. ${aedNextHint()}` : `${S[i].label} is already done. ${aedNextHint()}`);
}
const AED_BODY = ['shoulders', 'airway', 'chest1', 'bare', 'pad1', 'pad2', 'clear', 'chest2'].map(k => I[k]);
const aedIsChest = i => S[i].key === 'chest1' || S[i].key === 'chest2';
function aedTapBody(i) {
  if (st.now === I.analyse && st.u < 1) return aedFlash(AED.HANDS_OFF);       // hands off while it analyses
  if (i !== undefined && !(st.step < STEPS.length && STEPS[st.step].path.includes(S[i].key))) return aedTapStation(i);
  if (st.step >= STEPS.length) return aedFlash(aedNextHint());
  const hit = STEPS[st.step].path.map(k => I[k]).find(j => AED_BODY.includes(j));
  if (hit !== undefined) return aedTapStation(hit);
  aedFlash(aedNextHint());
}
function aedTapRescuer() {
  if (st.playing) return aedFlash('Autoplay is running: pause or stop it first');
  if (st.step >= STEPS.length) return aedFlash(aedNextHint());
  aedGo(st.step);
}
function aedWait(sec, then) { aedRun([() => ({ dur: sec, step: () => {} })], then); }
function aedPlayNext() {
  if (!st.playing) return;
  if (st.step < STEPS.length) return aedGo(st.step, () => aedWait(1.2, aedPlayNext));
  if (st.loop) return aedWait(3, () => { aedResetState(); st.playing = true; aedSyncPlayer(); aedWait(1, aedPlayNext); });
  st.playing = false; aedSyncPlayer();
}
function aedPlay() {
  if (st.playing && st.paused) { st.paused = false; return aedSyncPlayer(); }
  if (st.playing) return;
  if (st.step >= STEPS.length) aedResetState();
  st.playing = true; st.paused = false; aedSyncPlayer();
  if (!st.busy) aedPlayNext();
  else aedFlash('Autoplay picks up after this step');
}
function aedPause() { if (!st.playing || st.paused) return; st.paused = true; aedSyncPlayer(); }
function aedStop() { st.playing = false; st.paused = false; aedResetState(); aedSyncPlayer(); }
function aedResetState() {
  st.token++;
  Object.assign(st, aedFresh());
  aedNote(-1);
  aedSyncPanel();
}

/* ---------- the panel ---------- */
let aedToastT = 0;
function aedFlash(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.classList.add('on');
  clearTimeout(aedToastT); aedToastT = setTimeout(() => t.classList.remove('on'), 3200);
}
// the note for step n (running or done); n = -1 is the opening line
function aedNote(n, done) {
  const S1 = STEPS[n], title = document.getElementById('noteTitle'), text = document.getElementById('noteText');
  const clin = document.getElementById('noteClin'), more = document.getElementById('noteExtra'), note = document.querySelector('.note');
  title.textContent = n < 0 ? 'Ready' : `Step ${n + 1} of ${STEPS.length}: ${S1.label}${done ? ', done' : ''}`;
  text.textContent = n < 0 ? READY : done ? S1.done : S1.note;
  clin.hidden = !(S1 && S1.clinician);
  if (S1 && S1.clinician) document.getElementById('noteClinText').textContent = S1.clinician;
  more.textContent = S1 && S1.more ? S1.more : '';
  note.classList.toggle('has-more', !!(S1 && S1.more));
}
function aedSyncPlayer() {
  const pb = document.getElementById('aedPlay'), ps = document.getElementById('aedPause');
  const run = st.playing && !st.paused;
  pb.textContent = run ? '▶ Playing' : st.paused ? '▶ Resume' : '▶ Play';
  pb.disabled = run;
  pb.setAttribute('aria-pressed', String(run));
  ps.disabled = !run;
  document.getElementById('aedStop').disabled = !st.playing;
  document.getElementById('aedLoop').checked = st.loop;
}
const aedSet = (id, text) => { const e = document.getElementById(id); if (e.textContent !== text) e.textContent = text; };
function aedSyncPanel() {
  const s0 = S[st.now], t = AED.clockAt(st.now, st.u);
  aedSet('nowNum', String(s0.num));
  aedSet('nowName', s0.name);
  aedSet('nowTime', s0.secs ? `${mmss(st.u * s0.secs)} of ${mmss(s0.secs)}` : 'no time on the clock');
  aedSet('nowWho', s0.who === '-' ? '' : s0.who === 'AED' ? 'The AED' : s0.who === 'A' ? 'Rescuer A' : 'Helper B');
  document.getElementById('nowChip').classList.toggle('busy', st.busy);
  aedSet('statClock', `${mmss(t)} of ${mmss(AED.TOTAL)}`);
  aedSet('statStep', `${st.step} / ${STEPS.length}`);
  aedSet('statComp', String(AED.compressionsUntil(t, st.mode)));
  aedSet('statOff', t > AED.START_AT[I.chest1] ? mmss(AED.handsOffUntil(t)) : '–');
  aedSet('statSpeed', st.busy ? speedText(s0) : 'paused between steps');
  const ph = st.view && st.view.cpr;
  aedSet('nowCount', ph ? (ph.pushing ? `push ${ph.n} of ${st.mode === '30:2' ? AED.NUM.ratio[0] : AED.NUM.ratio[0] + ' (counting on)'}` : BREATHS_TEXT) : '');
  document.querySelectorAll('#btns .act').forEach((b, i) => {
    b.classList.toggle('done', i < st.step);
    b.classList.toggle('next', i === st.step && !st.busy);
    b.classList.toggle('on', i === st.step && st.busy);
  });
  aedPhoneSync();
}
function aedSetMode(mode) {
  st.mode = mode;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  aedSyncPanel();
}
function aedBuildButtons() {
  const nav = document.getElementById('btns');
  STEPS.forEach((S1, n) => {
    const b = document.createElement('button');
    b.className = 'act'; b.textContent = `${n + 1}. ${S1.label}`;
    b.onclick = () => st.playing ? aedFlash('Autoplay is running: pause or stop it first') : aedGo(n);
    nav.appendChild(b);
  });
  document.getElementById('aedPlay').onclick = aedPlay;
  document.getElementById('aedPause').onclick = aedPause;
  document.getElementById('aedStop').onclick = aedStop;
  document.getElementById('aedLoop').onchange = e => { st.loop = e.target.checked; };
  document.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => aedSetMode(b.dataset.mode); });
  document.getElementById('bigIdea').textContent = AED.SITE.bigIdea;
  document.getElementById('safety').textContent = AED.SITE.safety;
  const src = document.getElementById('sourcesList');
  AED.SITE.sources.forEach(s => { const li = document.createElement('li'); li.textContent = s; src.appendChild(li); });
  aedPhoneBuild();
}
// ?state=3 starts just after step 3; ?at=chest1&u=.5 holds the scene inside a station (for screenshots)
function aedApplyParams() {
  const at = AED_URL.get('at'), n = +AED_URL.get('state');
  if (at && at in I) {
    const i = I[at], k = STATION_STEP[i];
    Object.assign(st, { step: Math.max(0, k), now: i, u: Math.min(1, Math.max(0, +(AED_URL.get('u') || .5))) });
    return 'at';
  }
  if (n >= 1 && n <= STEPS.length) {
    const path = STEPS[n - 1].path;
    Object.assign(st, { step: n, now: I[path[path.length - 1]], u: 1 });
    return 'state';
  }
  return false;
}

/* ============================================================
   3D: renderer, camera, picking and the per-frame sync
   ============================================================ */
const AED_VIEWS = {                       // azimuth (0 = front, - = from the head side), polar from straight up, degrees
  iso: [-32, 57], front: [0, 66], back: [180, 60], left: [-82, 60], right: [82, 60], top: [0, 1],
};
const AED_TARGET = [92, 140, 28];

async function aedBoot() {
  aedBuildButtons();
  const held = aedApplyParams();
  if (held === 'at') aedNote(st.step, false); else aedNote(st.step ? st.step - 1 : -1, !!st.step);
  aedSyncPlayer(); aedSyncPanel();
  let T, L;
  try {
    T = await import('three');
    const [oc, ls2, lsg, lm] = await Promise.all(['controls/OrbitControls.js', 'lines/LineSegments2.js', 'lines/LineSegmentsGeometry.js', 'lines/LineMaterial.js']
      .map(p => import('three/addons/' + p)));
    L = { OrbitControls: oc.OrbitControls, LineSegments2: ls2.LineSegments2, LineSegmentsGeometry: lsg.LineSegmentsGeometry, LineMaterial: lm.LineMaterial };
  } catch (err) {
    document.getElementById('msg').textContent = 'Could not load the 3D library (Three.js needs an internet connection the first time).';
    throw err;
  }
  const canvas = document.getElementById('gl');
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true }); }
  catch (err) { document.getElementById('msg').textContent = 'This browser cannot show 3D (WebGL is off or unavailable).'; throw err; }
  document.getElementById('msg').remove();
  aedStart(T, L, renderer, canvas, held);
}

function aedStart(T, L, renderer, canvas, held) {
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const world = aedBuild(T, L);
  const camera = new T.PerspectiveCamera(30, 1, 5, 5000);
  const controls = new L.OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: .09, enablePan: false, minDistance: 120, maxDistance: 1600,
    maxPolarAngle: Math.PI * .47, rotateSpeed: .8, zoomSpeed: .9 });
  controls.target.copy(aedW(T, ...AED_TARGET));
  const cam = aedCameraRig(T, camera, controls);
  const stage = document.getElementById('stage');
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    world.lineMats.forEach(m => m.resolution.set(w, h));
    cam.refit();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  cam.go(AED_URL.get('view') in AED_VIEWS ? AED_URL.get('view') : 'iso', 0);
  aedPicking(T, canvas, camera, world, cam);
  document.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { aedFollow.paused = AED_PHONE.matches; cam.go(b.dataset.view); }; });
  aedCameraButtons(cam);
  aedSceneView = () => cam.go('iso');
  let dragFrom = null;
  canvas.addEventListener('pointerdown', e => { dragFrom = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', e => {
    if (dragFrom && e.buttons && AED_PHONE.matches && Math.hypot(e.clientX - dragFrom[0], e.clientY - dragFrom[1]) > 7) aedFollow.paused = true;
  });
  canvas.addEventListener('pointerup', () => { dragFrom = null; });
  canvas.addEventListener('wheel', () => { if (AED_PHONE.matches) aedFollow.paused = true; }, { passive: true });
  let last = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.1, (now - last) / 1000) * AED_SPEED; last = now;
    [...aedAnims].forEach(fn => { if (!fn(dt)) aedAnims.delete(fn); });
    cam.tick(dt / AED_SPEED);
    aedFollowTick(T, camera, controls, cam, dt / AED_SPEED);
    controls.update();
    const time = now / 1000;
    aedPose(T, world, st, time);
    aedSyncPanel();
    aedDrawWindow(st, time);
    renderer.render(world.scene, camera);
  });
  window.AED3D = { st, follow: aedFollow, scene: aedSetScene, view: cam.go, go: aedGo, play: aedPlay, stop: aedStop, tapStation: aedTapStation, tapBody: aedTapBody, setMode: aedSetMode, camera, controls, world };
  // one full run on load; ?autoplay=1 loops; ?autoplay=0 (or a held ?state / ?at) starts still
  const auto = AED_URL.get('autoplay');
  if (auto === '1') { st.loop = true; aedSyncPlayer(); aedPlay(); }
  else if (auto !== '0' && !held) setTimeout(() => { if (!st.playing && !st.busy && !st.step) aedPlay(); }, 1200);
}

function aedCameraRig(T, camera, controls) {
  let tween = null, fitDist = 700, current = 'iso';
  const sph = new T.Spherical();
  const place = (az, pol, r) => {
    sph.set(r, pol, az);
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(sph));
    camera.lookAt(controls.target);
  };
  const fit = () => {
    const tanV = Math.tan(T.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
    return camera.aspect < 1.2 ? Math.max(175 / tanH, 150 / tanV) + 20 : Math.max(205 / tanH, 150 / tanV) + 30;
  };
  return {
    refit() { fitDist = fit(); controls.maxDistance = fitDist * 2.2; },
    go(name, dur = .9) {
      current = name;
      if (!AED_PHONE.matches || aedFollow.scene) controls.target.copy(aedW(T, ...AED_TARGET));
      const [az, pol] = AED_VIEWS[name].map(T.MathUtils.degToRad);
      const r = fitDist * ({ top: 1.05, left: 1.2, right: 1.2 }[name] || 1);
      const from = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (!dur) return place(az, pol, r);
      let dAz = az - from.theta; dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
      tween = { t: 0, dur, a: [from.theta, from.phi, from.radius], d: [dAz, pol - from.phi, r - from.radius] };
    },
    reset() {
      if (AED_PHONE.matches) { aedSetScene(false); aedFollow.paused = false; return; }
      this.go('iso');
    },
    nudge(dAz, dPol, kR) {
      const from = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      const pol = T.MathUtils.clamp(from.phi + dPol, .02, controls.maxPolarAngle);
      const r = T.MathUtils.clamp(from.radius * kR, controls.minDistance, controls.maxDistance);
      tween = { t: 0, dur: .45, a: [from.theta, from.phi, from.radius], d: [dAz, pol - from.phi, r - from.radius] };
    },
    tick(dt) {
      if (!tween) return;
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const u = ease(tween.t), [a, p, r] = tween.a.map((v, i) => v + tween.d[i] * u);
      place(a, p, r);
      if (tween.t >= 1) tween = null;
    },
    get current() { return current; },
    get busy() { return !!tween; },
  };
}

const AED_STEP_AZ = Math.PI / 6, AED_STEP_TILT = Math.PI / 15, AED_STEP_ZOOM = .8;
function aedCameraButtons(cam) {
  const acts = {
    'rot-l': () => cam.nudge(-AED_STEP_AZ, 0, 1), 'rot-r': () => cam.nudge(AED_STEP_AZ, 0, 1),
    'tilt-u': () => cam.nudge(0, -AED_STEP_TILT, 1), 'tilt-d': () => cam.nudge(0, AED_STEP_TILT, 1),
    'zoom-in': () => cam.nudge(0, 0, AED_STEP_ZOOM), 'zoom-out': () => cam.nudge(0, 0, 1 / AED_STEP_ZOOM),
    reset: () => cam.reset(), full: aedToggleFullscreen,
  };
  document.querySelectorAll('[data-cam]').forEach(b => {
    b.onclick = () => { if (AED_PHONE.matches && b.dataset.cam !== 'reset') aedFollow.paused = true; acts[b.dataset.cam](); };
  });
}

/* ---------- full screen on the figure's wrapper ---------- */
const aedFsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function aedToggleFullscreen() {
  const wrap = document.getElementById('figwrap');
  const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen, exit = document.exitFullscreen || document.webkitExitFullscreen;
  try {
    const p = aedFsEl() ? exit.call(document) : req.call(wrap);
    if (p && p.catch) p.catch(() => aedFlash('Full screen is not available here'));
  } catch { aedFlash('Full screen is not available here'); }
}
const AED_ICONS = {
  full: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5V3h4.5M12.5 3H17v4.5M17 12.5V17h-4.5M7.5 17H3v-4.5"/></svg>',
  exit: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 3v4.5H3M12.5 3v4.5H17M17 12.5h-4.5V17M3 12.5h4.5V17"/></svg>',
};
function aedSyncFullscreen() {
  const on = !!aedFsEl(), b = document.querySelector('[data-cam=full]');
  b.innerHTML = AED_ICONS[on ? 'exit' : 'full'];
  b.title = on ? 'Exit full screen (Esc)' : 'Full screen';
  b.setAttribute('aria-label', b.title);
  b.setAttribute('aria-pressed', String(on));
}
document.addEventListener('fullscreenchange', aedSyncFullscreen);
document.addEventListener('webkitfullscreenchange', aedSyncFullscreen);
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) document.documentElement.classList.add('no-fs');

// a tap (not a drag) on a part runs its step; a double tap on empty space resets the view
function aedPicking(T, canvas, camera, world, cam) {
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const meaning = o => { for (let x = o; x; x = x.parent) { const d = x.userData; if (d.station !== undefined || d.body || d.rescuer) return d; } return null; };
  const hit = e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(world.scene.children, true).filter(h => h.object.visible && !h.object.isSprite);
    for (const h of hits) { const m = meaning(h.object); if (m) return m; }
    return null;
  };
  let down = null, lastEmpty = 0;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7 || performance.now() - down.t > 600) { down = null; return; }
    down = null;
    const m = hit(e);
    if (m && m.body) return aedTapBody();
    if (m && m.rescuer) return aedTapRescuer();
    if (m && m.station !== undefined) {
      if (aedIsChest(m.station) && st.now === I.analyse && st.u < 1) return aedFlash(AED.HANDS_OFF);
      return AED_BODY.includes(m.station) ? aedTapBody(m.station) : aedTapStation(m.station);
    }
    const now = performance.now();
    if (now - lastEmpty < 380) { cam.reset(); lastEmpty = 0; } else lastEmpty = now;
  });
  canvas.addEventListener('pointermove', e => {
    if (e.buttons || e.pointerType !== 'mouse') return;
    canvas.style.cursor = hit(e) ? 'pointer' : '';
  });
}

aedBoot();
