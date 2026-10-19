/* ============================================================
   AED Bench, Turntable: the phone layout, "follow the action".
   On phones the camera glides after the active station and frames it with its neighbours; a drag pauses
   that until the next step starts; Scene zooms out to the whole floor. Also: the station rail, the window
   inset, the folding camera buttons, the note's More / Less and the step strip centring.
   Loaded before aed-app.js; everything here runs only when called.
   ============================================================ */
const AED_PHONE = matchMedia('(max-width:560px)');
const aedFollow = { paused: false, scene: false, snap: true, at: null };
const aedPhoneLast = { strip: -1, rail: -1 };
const AED_WHO_COL = { A: COL.rescuerA, B: COL.helperB, AED: COL.aed, '-': '#d9d4c6' };

function aedPhoneBuild() {
  const rail = document.getElementById('rail');
  S.forEach((s0, i) => {
    const b = document.createElement('button');
    b.textContent = s0.num; b.title = `${s0.num} ${s0.label}: ${s0.name}`; b.setAttribute('aria-label', b.title);
    b.style.background = AED_WHO_COL[s0.who]; b.style.color = s0.who === '-' ? INK : '#fbf7ea';
    b.onclick = () => (AED_BODY.includes(i) ? aedTapBody(i) : aedTapStation(i));
    rail.appendChild(b);
  });
  const mini = document.getElementById('winMini');
  mini.onclick = () => {
    const big = mini.classList.toggle('big');
    mini.setAttribute('aria-pressed', String(big));
    mini.setAttribute('aria-label', big ? 'The heart and the AED strip: tap to shrink' : 'The heart and the AED strip: tap to enlarge');
  };
  const camBox = document.getElementById('cam'), more = document.getElementById('camMore');
  more.onclick = () => more.setAttribute('aria-expanded', String(camBox.classList.toggle('open')));
  const note = document.querySelector('.note'), noteMore = document.getElementById('noteMore');
  noteMore.onclick = () => {
    const open = note.classList.toggle('open');
    noteMore.textContent = open ? 'Less' : 'More';
    noteMore.setAttribute('aria-expanded', String(open));
  };
  document.getElementById('aedScene').onclick = () => aedSetScene(!aedFollow.scene);
  AED_PHONE.addEventListener('change', () => { aedPhoneLast.strip = aedPhoneLast.rail = -1; aedFollow.snap = true; });
}

let aedSceneView = null;                     // set by aed-app.js: zooms the camera out to the whole floor
function aedSetScene(on) {
  aedFollow.scene = on;
  if (on && aedSceneView) aedSceneView();
  if (!on) aedFollow.paused = false;
  const b = document.getElementById('aedScene');
  b.setAttribute('aria-pressed', String(on));
  b.textContent = on ? '⤡ Follow' : '⤢ Scene';
}

// keep the strip and the rail centred on the action (inside their own boxes, so the page never jumps)
function aedPhoneSync() {
  document.querySelectorAll('#rail button').forEach((b, i) => {
    b.classList.toggle('on', i === st.now);
    b.classList.toggle('done', i < st.now);
  });
  if (!AED_PHONE.matches) return;
  const behavior = AED_REDUCE.matches ? 'auto' : 'smooth';
  const centre = (box, b) => box.scrollTo({ left: b.offsetLeft - box.offsetLeft - (box.clientWidth - b.offsetWidth) / 2, behavior });
  const strip = Math.min(st.busy ? st.step : st.step, STEPS.length - 1);
  if (strip !== aedPhoneLast.strip) {
    aedPhoneLast.strip = strip;
    const box = document.getElementById('btns'), b = box.querySelectorAll('.act')[strip];
    if (b) centre(box, b);
  }
  if (st.now !== aedPhoneLast.rail) {
    aedPhoneLast.rail = st.now;
    const rail = document.getElementById('rail'), b = rail.children[st.now];
    if (b) centre(rail, b);
  }
}

// the follow cam: eased toward the active station's anchor, about a metre and a half wide
function aedFollowTick(T, camera, controls, cam, dt) {
  if (!AED_PHONE.matches || aedFollow.paused || aedFollow.scene || cam.busy) return;
  const at = S[st.now].at, p = aedW(T, at[0], at[1], Math.min(at[2], 40) * .6);
  const goal = aedFollow.at ? aedFollow.at.lerp(p, 1 - Math.exp(-dt * 2.5)) : p.clone();
  aedFollow.at = goal;
  const tanV = Math.tan(T.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
  const r = Math.max(80 / tanH, 62 / tanV) + 40;
  const off = new T.Vector3().setFromSpherical(new T.Spherical(r, T.MathUtils.degToRad(56), T.MathUtils.degToRad(-28)));
  const k = aedFollow.snap ? 1 : 1 - Math.exp(-dt * 3);
  aedFollow.snap = false;
  controls.target.lerp(goal, k);
  camera.position.lerp(goal.clone().add(off), k);
}
