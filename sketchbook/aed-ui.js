/* AED Bench · Sketchbook: the page around the figure. Panel (window, active card, notes, readouts), player,
   footer, the phone "follow the action" layout, and mounting. Layout rules: pradarshan references/ui.md. */

const AED_WHO = { A: 'Rescuer A', B: 'Helper B', AED: 'The AED', '-': '' };
const AED_RAIL_COL = { A: '#cfe6d6', B: '#f7d9bd', AED: '#bfe3cb', '-': '#efe9dc' };

function aedNote(title, text, S1) {
  const t = document.getElementById('aedNoteTitle');
  if (!t) return;
  t.textContent = title;
  document.getElementById('aedNoteText').textContent = text;
  const c = document.getElementById('aedClin'), m = document.getElementById('aedNoteMore');
  c.hidden = !(S1 && S1.clinician); c.querySelector('span').textContent = S1 && S1.clinician ? S1.clinician : '';
  m.hidden = !(S1 && S1.more); m.textContent = S1 && S1.more ? S1.more : '';
}

const AED_PHONE_CSS = `    .actions{flex-wrap:nowrap!important;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:6px;-webkit-overflow-scrolling:touch}
    .actions .stepwrap{scroll-snap-align:start;flex:0 0 auto}
    .act{min-height:40px;font-size:13px!important}
    .scope-panel{grid-template-columns:1fr;gap:6px}
    .player{position:sticky;bottom:0;z-index:5;background:var(--paper);border-top:1px solid var(--rule);padding:8px 0 calc(8px + env(safe-area-inset-bottom));margin:0 0 10px;justify-content:space-between}
    .player button{flex:1 1 auto;padding:8px 10px;font-size:13px;white-space:nowrap;min-height:40px}
    .player{flex-wrap:wrap;row-gap:6px}
    .toast{position:fixed!important;left:12px!important;right:12px;top:auto!important;bottom:78px;max-width:none!important}
    header h1{font-size:15px} header span{display:none}
    .actions{position:sticky;top:0;z-index:6;background:var(--paper);margin:0 -12px!important;padding:6px 12px 6px!important;scroll-behavior:smooth}
    .aed-cam{position:relative;width:100%}
    #fig{height:44vh;overflow:hidden!important;border:1.5px solid var(--rule);border-radius:12px;background:color-mix(in srgb,var(--paper) 70%,#fff)}
    .aed-rail{display:flex!important}
    .now-chip{position:static!important;max-width:none!important;width:100%;margin:8px 0 4px;box-shadow:2px 2px 0 var(--ink)}
    .now-chip .v{font-size:14px} .now-chip .n{width:26px;height:26px;font-size:12px}
    .aed-inset{display:block!important}
    .scope-panel>.win{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    .note p.txt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .note .xtra{display:none}
    .note.open p.txt{display:block} .note.open .xtra{display:block}
    .aed-more{display:inline-block!important}
    .player label{display:none!important}
    .aed-phone-only{display:inline-block!important}
    .aed-qr-link{position:static;margin:10px auto 0;width:max-content}
    .aed-qr-link .aed-qr{display:none}
    .aed-qr-link span{font-size:13px;color:var(--ink);text-decoration:underline;letter-spacing:.02em}`;
const AED_CSS = `
  .player{width:100%;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:2px 0 8px}
  .player button{font-size:13px;padding:7px 16px;min-height:38px}
  .player button[aria-pressed=true]{background:var(--ink);color:var(--paper)}
  .player button:disabled{opacity:.38;cursor:not-allowed}
  .player #aedPlay:disabled{opacity:1;cursor:default}
  .player label{display:flex;align-items:center;gap:6px;margin-left:4px;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:.08em}
  .player input{width:18px;height:18px;accent-color:var(--ink)}
  .aed-mode{display:inline-flex;margin-left:auto;border:1.5px solid var(--ink);border-radius:999px;overflow:hidden}
  .aed-mode button{border:0;border-radius:0;min-height:32px;padding:4px 12px;font-size:12px;background:transparent}
  .aed-mode button[aria-pressed=true]{background:var(--ink);color:var(--paper)}
  .scope-panel{width:100%;display:grid;grid-template-columns:1fr;gap:8px;align-content:start}
  .scope-panel svg{width:100%;height:auto;display:block}
  .scope-cap{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:center;margin-top:2px}
  .note .k,.aed-k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .note h2{font-size:14px;margin:2px 0 3px;font-weight:800}
  .note p{margin:0;font-size:13px;line-height:1.45}
  .note .clin{margin-top:5px;font-size:12px;color:#4d463c;border-left:3px solid var(--accent,#f4b829);padding-left:8px}
  .note .clin b{font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-right:4px}
  .note .more{margin-top:5px;font-size:12px;color:#4d463c}
  .aed-reads{display:flex;flex-wrap:wrap;gap:6px}
  .aed-reads span{border:1.5px solid var(--ink);border-radius:9px;padding:3px 8px;font-size:12px;background:#fffdf6;font-variant-numeric:tabular-nums}
  .aed-reads b{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:4px;font-weight:700}
  .aed-idea{margin:0;font-size:13px;line-height:1.4}
  .aed-idea b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .aed-safety{margin:0;font-size:11.5px;color:var(--muted);line-height:1.4}
  .aed-src{font-size:11.5px;color:var(--muted)} .aed-src summary{cursor:pointer;text-transform:uppercase;letter-spacing:.08em;font-size:11px}
  .aed-src ul{margin:4px 0 0;padding-left:16px;line-height:1.4}
  .now-chip{position:relative;z-index:2;display:flex;align-items:center;gap:10px;background:var(--paper);border:2px solid var(--ink);border-radius:14px;box-shadow:3px 3px 0 var(--ink);padding:8px 14px 8px 10px;max-width:none;margin:2px 4px 2px 0}
  .now-chip.busy{border-left:8px solid var(--accent,#f4b829)}
  .now-chip .n{flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:var(--ink);color:var(--paper);display:grid;place-items:center;font-weight:800;font-size:14px}
  .now-chip .k{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
  .now-chip .v{display:block;font-size:15px;font-weight:800;line-height:1.2}
  .now-chip .t{display:block;font-size:11px;color:var(--muted);margin-top:2px;font-variant-numeric:tabular-nums}
  .act.next{background:var(--accent,#f4b829);animation:aedPulse 1.4s ease-in-out infinite}
  .act.done{opacity:.5}
  @keyframes aedPulse{50%{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent,#f4b829) 45%,transparent)}}
  .controls,.made-with,#readout,.stats{display:none!important}
  .aed-footer{width:100%;text-align:center;font-size:12px;letter-spacing:.04em;color:var(--muted);margin-top:4px;position:relative;min-height:20px}
  .aed-footer .heart{color:#d63a4a;font-size:14px}
  .aed-qr-link{position:absolute;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--muted);text-decoration:none;font-size:10px;letter-spacing:.06em}
  .aed-qr-link .aed-qr{width:76px;height:76px;background:#fbf8f0;border:1.5px solid var(--ink);border-radius:8px;padding:4px}
  .aed-qr-link:hover{color:var(--ink)}
  @media (min-width:900px){header,.stage,#fig,.player,.scope-panel,.aed-footer{max-width:1040px!important}}
  @media (min-width:1100px){
    body{display:grid!important;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);column-gap:36px;align-items:start;padding:18px max(36px,calc((100vw - 1560px) / 2)) 14px!important}
    .site-bar{grid-row:1}
    header{grid-column:1 / 3;grid-row:2}
    .stage{grid-column:1;grid-row:3}
    #fig{max-height:calc(100vh - 250px)}
    .player{grid-column:1;grid-row:4}
    .scope-panel{grid-column:2;grid-row:3 / span 2;padding-bottom:64px}
    .scope-panel .win svg{max-height:calc(100vh - 640px);min-height:150px}
    .aed-footer{grid-column:1 / 3;grid-row:5}
    header,.stage,#fig,.player,.scope-panel,.aed-footer{max-width:none!important}
    header h1{font-size:20px}
    .aed-qr-link{bottom:0}
  }
  @media (min-width:1100px) and (max-height:860px){ .note p{font-size:12.5px} .aed-idea{font-size:12.5px} .scope-panel{gap:6px} }
  @media (prefers-reduced-motion:reduce){.act.next{animation:none}}
  @media (max-width:560px){
${AED_PHONE_CSS}
  }
  @media (orientation:landscape) and (max-height:500px) and (min-width:561px){
    body{padding:10px 16px 16px!important} .actions .cap{display:none}
    .stats{position:static!important;flex-direction:row!important;justify-content:flex-end;gap:18px;margin-bottom:4px}
    .actions{position:static;max-width:none!important;flex-direction:row!important;gap:6px!important;margin:4px 0!important}
    .act{font-size:12px;padding:4px 11px}
${AED_PHONE_CSS}
    #fig{height:64vh}
  }
  .aed-rail,.aed-inset,.aed-more,.aed-phone-only{display:none}
  .aed-rail{gap:5px;overflow-x:auto;padding:8px 2px 4px;scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
  .aed-rail button{flex:0 0 auto;width:34px;height:34px;padding:0;border-radius:9px;font:inherit;font-size:12px;font-weight:800;color:var(--ink);border:1.5px solid var(--ink)}
  .aed-rail button.done{opacity:.45}
  .aed-rail button.on{outline:3px solid var(--accent,#f4b829);outline-offset:1px}
  .aed-inset{position:absolute;top:8px;right:8px;width:58px;height:58px;padding:0;border:1.5px solid var(--ink);border-radius:50%;overflow:hidden;background:#f3e2d3;z-index:3;transition:width .25s,height .25s,border-radius .25s}
  .aed-inset svg{width:100%;height:100%;display:block}
  .aed-inset.big{width:80%;height:auto;aspect-ratio:400/260;border-radius:10px;background:var(--paper);box-shadow:2px 2px 0 var(--ink)}
  .aed-more{font:inherit;font-size:12px;border:0;background:none;padding:2px 0;color:var(--ink);text-decoration:underline;min-height:0}
  @media (prefers-reduced-motion:reduce){.aed-rail,.actions{scroll-behavior:auto}.aed-inset{transition:none}}`;

function aedBuildPanel() {
  const style = document.createElement('style'); style.textContent = AED_CSS; document.head.appendChild(style);
  const player = document.createElement('div'); player.className = 'player'; player.setAttribute('role', 'group'); player.setAttribute('aria-label', 'Animation');
  player.innerHTML = `<button id="aedPlay" aria-pressed="false">▶ Play</button><button id="aedPause">❚❚ Pause</button><button id="aedStop">■ Stop</button><label><input type="checkbox" id="aedLoop"> Loop</label>`
    + `<span class="aed-mode" role="group" aria-label="Breaths"><button id="aedM302" aria-pressed="true">30:2</button><button id="aedMcco" aria-pressed="false">Compressions only</button></span>`;
  const panel = document.createElement('section'); panel.className = 'scope-panel';
  panel.innerHTML = `<div class="win"><svg id="aedWin" viewBox="0 0 400 260" role="img" aria-label="The heart and what the AED is reading"><g id="aedWinArt"></g></svg><div class="scope-cap" id="aedWinCap"></div></div>`
    + `<div class="aed-reads" id="aedReads"></div>`
    + `<div class="note" aria-live="polite"><div class="k">What is happening</div><h2 id="aedNoteTitle"></h2><p class="txt" id="aedNoteText"></p>`
    + `<p class="clin xtra" id="aedClin" hidden><b>For clinicians</b><span></span></p><p class="more xtra" id="aedNoteMore" hidden></p></div>`
    + `<p class="aed-idea"><b>The big idea</b>${AED.SITE.bigIdea}</p><p class="aed-safety">${AED.SITE.safety}</p>`
    + `<details class="aed-src"><summary>Sources</summary><ul>${AED.SITE.sources.map(s => `<li>${s}</li>`).join('')}</ul></details>`;
  const stage = document.querySelector('.stage');
  const chip = document.createElement('div'); chip.className = 'now-chip'; chip.setAttribute('aria-live', 'polite');
  chip.innerHTML = '<span class="n" id="aedNowNum">1</span><span><span class="k" id="aedNowK">Active station</span><span class="v" id="aedNow"></span><span class="t" id="aedNowTime"></span></span>';
  stage.after(player); player.after(panel);
  // the active card: in the panel on laptops, under the close-up (after the rail) on phones
  const placeChip = () => { if (aedIsPhone()) document.querySelector('.aed-rail').after(chip); else panel.prepend(chip); };
  matchMedia('(max-width:560px), (orientation:landscape) and (max-height:500px)').addEventListener('change', placeChip);
  aedPlaceChip = placeChip;
  document.getElementById('aedPlay').onclick = aedPlay;
  document.getElementById('aedPause').onclick = aedPause;
  document.getElementById('aedStop').onclick = aedStop;
  document.getElementById('aedLoop').onchange = e => { st.loop = e.target.checked; };
  const setMode = m => { st.mode = m; document.getElementById('aedM302').setAttribute('aria-pressed', m === '30:2'); document.getElementById('aedMcco').setAttribute('aria-pressed', m !== '30:2'); ui.render(); };
  document.getElementById('aedM302').onclick = () => setMode('30:2');
  document.getElementById('aedMcco').onclick = () => setMode('cco');
  const foot = document.createElement('footer'); foot.className = 'aed-footer';
  foot.innerHTML = 'Made with <span class="heart" aria-label="love">&#9829;</span> and a passion for teaching medicine · Dr. Atul Tiwari'
    + `<a class="aed-qr-link" href="${AED.SITE.url}" target="_blank" rel="noopener"><img class="aed-qr" src="../shared/qr.svg" alt="QR code for atultiwari.com" width="76" height="76"><span>atultiwari.com</span></a>`;
  document.body.appendChild(foot);
}

function aedSyncPanel() {
  const s0 = AED.STATIONS[st.at], started = st.busy || st.u > 0 || st.step > 0;
  const clock = AED.clockAt(st.at, started ? st.u : 0), chip = document.querySelector('.now-chip');
  document.getElementById('aedNowNum').textContent = s0.num;
  document.getElementById('aedNow').textContent = s0.name;
  document.getElementById('aedNowK').textContent = started ? `Active station · ${AED_WHO[s0.who]}`.replace(/ · $/, '') : 'Start';
  const speed = s0.secs / (AED_DUR[s0.key] || 1);
  document.getElementById('aedNowTime').textContent = !s0.secs ? (st.at ? 'no time on the clock' : 'Press Play to begin')
    : `${AED.mmss(s0.secs * st.u)} of ${AED.mmss(s0.secs)} in this station${speed > 1.5 && st.busy ? ` · shown ×${Math.round(speed)}` : ''}`;
  chip.classList.toggle('busy', st.busy);
  const handsOff = AED.handsOffUntil(clock), comps = AED.compressionsUntil(clock, st.mode);
  document.getElementById('aedReads').innerHTML = `<span><b>Step</b>${Math.min(st.step + (st.busy ? 1 : 0), AED.STEPS.length)} / ${AED.STEPS.length}</span><span><b>Clock</b>${AED.mmss(clock)} / ${AED.mmss(AED.TOTAL)}</span>`
    + `<span><b>Compressions</b>${comps}</span><span><b>Hands off</b>${AED.mmss(handsOff)}</span>`
    + `<span><b>Rate</b>${AED.NUM.rate}/min · ${AED.NUM.depthCm.join('-')} cm</span>`;
  document.querySelectorAll('#btns .act').forEach((b, i) => {
    b.classList.toggle('done', i < st.step && i < AED.STEPS.length);
    b.classList.toggle('next', i === st.step && i < AED.STEPS.length && !st.busy);
  });
  aedPhoneSync();
}

/* ---------- phone: follow the action up close ---------- */
const aedIsPhone = () => matchMedia('(max-width:560px), (orientation:landscape) and (max-height:500px)').matches;
let aedVB0 = null, aedVB = null;
function aedCam(anchor) {
  const svg = document.getElementById('fig');
  if (!svg || !svg.viewBox.baseVal) return;
  const r = svg.getBoundingClientRect(), aspect = r.width && r.height ? r.width / r.height : 4 / 3;
  if (!aedVB0 || Math.abs(aedVB0.aspect - aspect) > .01) {
    // frame the floor tightly (plus room above it for a standing helper and speech bubbles), at the element's shape
    const F = AED_FLOOR, pts = [];
    for (const x of [F.x0, F.x1]) for (const y of [F.y0, F.y1]) pts.push(P(x, y, 0));
    const o = P(0, 0, 0);
    for (const id of ['P1', 'A4', 'A8', 'B1', 'B5', 'B8', 'B6', 'B7']) { const [x, y, w, h] = AED_SPR[id]; pts.push([x + o[0], y + o[1]], [x + w + o[0], y + h + o[1]]); }
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    // on laptops the step buttons sit over the left of the figure, so the drawing keeps to the right 78%
    const room = aedIsPhone() ? 1 : .78, cw = (Math.max(...xs) - Math.min(...xs)) * 1.02, ch = (Math.max(...ys) - Math.min(...ys)) * 1.03;
    const w = Math.max(cw / room, ch * aspect), h = w / aspect;
    const x = room < 1 ? Math.max(...xs) + w * .01 - w : (Math.max(...xs) + Math.min(...xs)) / 2 - w / 2;
    // anchor the top: standing heads must never be cut; spare height goes below the floor
    aedVB0 = { x, y: Math.min(...ys) - ch * .02, w, h, aspect };
    if (!aedVB) aedVB = { ...aedVB0 };
  }
  let target = aedVB0;
  if (aedIsPhone() && !st.benchView && anchor) {
    // a fixed-size window (scene units) around the focus point: the active part plus its neighbours
    let w = 190, h = 150;
    if (w / h < aspect) w = h * aspect; else h = w / aspect;
    target = { x: anchor[0] - w / 2, y: anchor[1] - h / 2, w, h };
  } else if (aedIsPhone()) {
    const w = Math.max(aedVB0.w, aedVB0.h * aspect), h = w / aspect;
    target = { x: aedVB0.x + (aedVB0.w - w) / 2, y: aedVB0.y + (aedVB0.h - h) / 2, w, h };
  }
  const a = matchMedia('(prefers-reduced-motion:reduce)').matches ? 1 : .15;
  for (const k of ['x', 'y', 'w', 'h']) aedVB[k] += (target[k] - aedVB[k]) * a;
  svg.setAttribute('viewBox', `${f(aedVB.x)} ${f(aedVB.y)} ${f(aedVB.w)} ${f(aedVB.h)}`);
  INK_K = aedVB.w / INK_REF_VB;
}
function aedCentre(container, el) {
  if (!container || !el) return;
  const left = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
  container.scrollTo({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
}
function aedBuildPhone() {
  const svg = document.getElementById('fig'), cam = document.createElement('div'); cam.className = 'aed-cam';
  svg.before(cam); cam.appendChild(svg);
  const inset = document.createElement('button'); inset.className = 'aed-inset'; inset.setAttribute('aria-label', 'The heart and the AED strip: tap to enlarge');
  inset.innerHTML = '<svg id="aedInsetSvg" viewBox="70 0 260 200"><use href="#aedWinArt"/></svg>';
  inset.onclick = () => { const big = inset.classList.toggle('big'); document.getElementById('aedInsetSvg').setAttribute('viewBox', big ? '0 0 400 260' : '70 0 260 200'); };
  cam.appendChild(inset);
  const rail = document.createElement('div'); rail.className = 'aed-rail'; rail.setAttribute('aria-label', 'Stations 1 to 18');
  AED.STATIONS.forEach((s0, i) => {
    const b = document.createElement('button');
    b.textContent = s0.num; b.title = `${s0.num}. ${s0.name}`; b.style.background = AED_RAIL_COL[s0.who];
    b.onclick = () => aedTapStation(i);
    rail.appendChild(b);
  });
  cam.after(rail);
  const more = document.createElement('button'); more.className = 'aed-more'; more.textContent = 'More';
  more.onclick = () => { const n = document.querySelector('.note'); n.classList.toggle('open'); more.textContent = n.classList.contains('open') ? 'Less' : 'More'; };
  document.getElementById('aedNoteText').after(more);
  const bench = document.createElement('button'); bench.className = 'aed-phone-only'; bench.id = 'aedBench'; bench.textContent = '⊞ Whole view';
  bench.onclick = () => { st.benchView = !st.benchView; bench.textContent = st.benchView ? '⊡ Close-up' : '⊞ Whole view'; ui.render(); };
  document.getElementById('aedStop').after(bench);
}
let aedLastActive = -1, aedLastStep = -1, aedPlaceChip = () => {};
function aedPhoneSync() {
  const rail = document.querySelector('.aed-rail');
  if (!rail) return;
  [...rail.children].forEach((b, i) => { b.classList.toggle('on', i === st.at); b.classList.toggle('done', i < st.at); });
  if (!aedIsPhone()) return;
  if (st.at !== aedLastActive) { aedLastActive = st.at; aedCentre(rail, rail.children[st.at]); }
  if (st.step !== aedLastStep) { aedLastStep = st.step; const acts = document.querySelectorAll('#btns .stepwrap'); aedCentre(document.getElementById('btns'), acts[Math.min(st.step, acts.length - 1)]); }
}

/* ---------- mount ---------- */
ui = mountFigure({
  fig: '01', title: 'Using an AED', hint: 'press Play, a step, or tap the next part',
  size: [205, 300, 62], palette: 'cobalt', state: st,
  scene: () => { aedLast = aedScene(st, aedNow()); return aedLast.svg; },
  buttonsLabel: 'Steps',
  buttons: AED.STEPS.map((S1, n) => ({ label: `${n + 1}. ${S1.label}`, onClick: () => st.playing ? ui.flash('Autoplay is running: pause or stop it first') : aedGo(n) })),
  stats: s1 => [{ label: 'Steps done', value: `${s1.step} / ${AED.STEPS.length}` }],
  acts: { station: (s1, el) => el.dataset.i != null ? aedTapStation(+el.dataset.i) : aedTapKeys(AED_PART_STATIONS[el.dataset.k] || []) },
  params: aedParams,
});
const aedBaseRender = ui.render;
ui.render = () => {
  const anchor = aedLast ? aedLast.camAt : null;
  aedCam(anchor); aedBaseRender(); aedSyncPanel();
  if (aedLast) aedDrawWindow(aedLast.L, aedNow());
};
aedBuildPanel();
aedBuildPhone();
aedPlaceChip();
document.querySelector('header h1').textContent = 'Using an AED';
document.title = 'AED Bench · Using an AED';
if (st.step) aedNote(`After step ${st.step}`, AED.STEPS[st.step - 1].done, AED.STEPS[st.step - 1]);
else aedNote('Ready', 'An adult has collapsed on the floor. Press Play, press a step, or tap the SAFE? tape to begin.');
if (st.mode !== '30:2') document.getElementById('aedMcco').click();
aedSyncPlayer(); ui.render();
setInterval(() => { if (!st.busy || st.paused) ui.render(); }, 60);      // ripples, the strip and the phone keep moving
const aedAuto = new URLSearchParams(location.search).get('autoplay');
if (aedAuto === '1') { st.loop = true; aedSyncPlayer(); aedPlay(); }
else if (aedAuto !== '0' && !st.step && !st.u) setTimeout(() => { if (!st.playing && !st.busy && !st.step) aedPlay(); }, 800);
