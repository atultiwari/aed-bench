/* ============================================================
   AED Bench, Turntable: the style's own constants. Every name, label, time, note and total comes from
   window.AED (../shared/aed-spec.js, loaded first). This file only adds colours, the 3D mapping, how
   fast each station plays in real time, and the few speech-bubble words docs/scene.md gives that
   aed-spec.js does not carry yet.
   ============================================================ */
if (!window.AED) throw new Error('aed-spec.js did not load');
if (AED.CHECK.length) throw new Error('aed-spec.js self-check: ' + AED.CHECK.join('; '));

const INK = '#231e16';
const PAPER = '#fbf8f0';
const ACCENT = '#f4b829';                         // the Sketchbook's accent: lit labels, the active ring
const COL = Object.freeze({
  shirt: '#5b7fb5', trousers: '#4a4f5a', skin: '#c98f6a', hair: '#3a2b22',
  rescuerA: '#4f9a6a', helperB: '#e08a3a', aed: '#2f9e5b', panel: '#3b3e42', on: '#3fc46d', shock: '#f08a24',
  floor: '#c99a66', floorDark: '#b5875a', mat: '#a9b8a3', phone: '#3a4250', pad: '#fbfbf7', cable: '#6b6f74',
  plug: '#e08a3a', current: '#ffe14d', jeans: '#3f4a5c',
});

const f = v => v.toFixed(1);
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
const seg = (u, a, b) => clamp01((u - a) / (b - a));          // 0..1 while u runs from a to b
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/* ---------- AED.WORLD (cm: x depth toward the viewer, y width toward viewer-left, z up) to Three.js ---------- */
const AW = AED.WORLD;
const AED_CX = (AW.floor.x0 + AW.floor.x1) / 2, AED_CY = (AW.floor.y0 + AW.floor.y1) / 2;
// Three: X = to the right (= -y), Y = up (= z), Z = toward the viewer (= x)
const aedW = (T, x, y, z) => new T.Vector3(AED_CY - y, z, x - AED_CX);
const aedWv = (T, x, y, z) => new T.Vector3(-y, z, x);

/* ---------- stations, steps, clock ---------- */
const S = AED.STATIONS, I = AED.IDX, STEPS = AED.STEPS;
const stepOf = key => STEPS.findIndex(s => s.path.includes(key));
const STATION_STEP = S.map(s => stepOf(s.key));          // -1 for START
const mmss = AED.mmss;

// real seconds each station plays for: the long CPR stations run 8x faster than the scenario clock,
// the short ones are stretched a little so the action can be seen. A full run is about 75 s.
const AED_FAST = 8;
const REAL_MIN = 2.4;
const REAL_OVERRIDE = { helper: 3.4, lid: 5.2, bare: 3.6, clear: 3, shock: 2.6, next: 3 };
const realDur = s => REAL_OVERRIDE[s.key] || (s.secs >= 60 ? s.secs / AED_FAST : Math.max(REAL_MIN, s.secs * .4));
const speedText = s => {
  if (!s.secs) return 'no clock time';
  const r = s.secs / realDur(s);
  return r >= 1.5 ? `clock ${Math.round(r)}× faster` : r <= .7 ? 'slowed down to watch' : 'about real time';
};

// the stretch of unbroken CPR the clock time t is in (for the 1-30 counter and the breath pauses)
const CPR_RUNS = S.reduce((runs, s, i) => {
  if (!s.cpr) return runs;
  const last = runs[runs.length - 1];
  if (last && last.end === AED.START_AT[i]) return [...runs.slice(0, -1), { ...last, end: AED.START_AT[i] + s.secs }];
  return [...runs, { start: AED.START_AT[i], end: AED.START_AT[i] + s.secs }];
}, []);
// where in the 30:2 cycle a CPR run is at clock time t: pushing (with the push number) or breathing
function cprPhase(t, mode) {
  const run = CPR_RUNS.find(r => t >= r.start && t <= r.end);
  if (!run) return null;
  const el = t - run.start, push = 60 / AED.NUM.rate;
  if (mode !== '30:2') return { pushing: true, n: Math.floor(el / push) % AED.NUM.ratio[0] + 1, el };
  const c = AED.cycleSecs(mode), inC = el % c, pushT = AED.NUM.ratio[0] * push;
  return inC < pushT ? { pushing: true, n: Math.floor(inC / push) + 1, el } : { pushing: false, breath: (inC - pushT) / AED.NUM.breathPause, el };
}

/* ---------- words that are drawn as speech bubbles ----------
   Most come straight from the spec (a station's screen, or a phrase quoted in its name or note).
   Two (call and helper) are given only in docs/scene.md, so they live here. */
const quoted = text => (text.match(/"([^"]+)"/) || [, text])[1];
const sentenceWith = (text, word) => (text.split(/(?<=\.)\s+/).find(x => x.includes(word)) || '').replace(/:.*$/, '');
const PHONE_TEXT = S[I.call].lines[1].replace('/', ' / ');          // "108 / 112"
const BREATHS_TEXT = `${AED.NUM.ratio[1]} breaths`;
const BUBBLES = {
  shoulders: { who: 'A', text: quoted(S[I.shoulders].name) },
  call: { who: 'phone', text: 'Ambulance please: collapsed, not breathing normally' },      // docs/scene.md
  airway: { who: 'A', text: sentenceWith(STEPS[0].note, 'Gasping') },
  helper: { who: 'B', text: 'Get the AED!' },                                                 // docs/scene.md
  power: { who: 'AED', text: S[I.power].screen },
  plug: { who: 'AED', text: S[I.plug].screen },
  analyse: { who: 'AED', text: S[I.analyse].screen },
  clear: { who: 'B', text: quoted(S[I.clear].name.replace(/^"[^"]+"/, '')) },
  shock: { who: 'AED', text: S[I.shock].screen },
  chest2: { who: 'AED', text: S[I.chest2].screen },
  next: { who: 'AED', text: quoted(S[I.next].name) + '.' },
};

/* ---------- the window panel's words (docs/spec.md, "The window") ---------- */
const WIN_TEXT = {
  strip: 'What the AED is reading',
  noAed: 'AED not here yet',
  noFlow: 'no blood flow',
  flow: 'CPR: blood moving',
  stunned: 'A shock stops the chaos; CPR keeps blood moving until the heart pumps on its own.',
  analysing: 'Analysing…',
  again: 'analysing again',                 // NEXT CHECK: no rhythm claimed (docs/scene.md)
  delivered: 'Shock delivered',
  next: 'next analysis',
  heart: { 'vf': 'Ventricular fibrillation: quivering, not pumping', 'vf+cpr': 'Still quivering; each push squeezes blood out',
    'paused-vf': 'Hands off: no blood moving', 'current': 'The shock passes through the whole heart',
    'stunned+cpr': 'Quiver stopped; heart stunned, CPR pumps', 'stunned': 'Quiver stopped; not pumping yet' },
};

const READY = 'An adult has collapsed. Press Play, a step button, or tap the SAFE? flag. Drag to turn the scene.';
