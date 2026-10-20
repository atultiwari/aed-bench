/* AED Bench: the spec as data (docs/spec.md), shared by every style so names, order and numbers never drift.
   A plain script: in a page it sets window.AED; in Node, `await import('../../shared/aed-spec.js')` sets globalThis.AED.
   Coordinates are in cm, in the Sketchbook's frame: x = depth (toward viewer-right), y = width (toward viewer-left),
   z = up, floor at z = 0. The person lies along y with the head at +y; their right side is -x (far), left is +x (near).
   Turntable maps these once to Three.js (X = y, Y = z, Z = x, or its own mapping); Working Model reads the same table. */
(function (g) {
  'use strict';

  /* ---------- the people and things on the floor ---------- */
  const WORLD = Object.freeze({
    floor: { x0: 0, x1: 190, y0: -20, y1: 285 },
    // the person: supine, centreline x = 100
    body: { x: 100, torso: { y0: 122, y1: 190, halfW: 19, h: 22 }, head: { y: 207, r: 11, z: 11 },
            hips: { y0: 100, y1: 124 }, feetY: 18, armHalfSpread: 26 },
    chest: [100, 160, 22],                 // lower half of the sternum, where the hands go
    padRight: [89, 180, 22.5],             // below the right collarbone, right of the sternum (patient's right = -x)
    padLeft: [119.5, 166, 13],             // left mid-axillary line, below the armpit (near side)
    rescuerA: { knees: [56, 162], kneelsAt: 'far side, level with the chest' },
    helperB: { start: [22, 30], away: [22, -60], kneel: [26, 214] },
    aed: { x0: 42, x1: 74, y0: 226, y1: 258, h: 10, lidH: 4 },   // the case sits on the floor beyond the head, far side
    phone: [150, 230, 0.8],
  });

  /* ---------- the 18 stations: each visited once, in order ---------- */
  // key, label lines (printed on the part), full name (active card), seconds on the scenario clock, who acts,
  // anchor (cm, where the active ring sits), source (short), and the window/AED state while there.
  // heart: 'vf' | 'vf+cpr' | 'paused-vf' | 'current' | 'stunned+cpr' | 'stunned'
  // strip: 'none' | 'blank' | 'cpr' | 'vf' | 'charge' | 'spike' | 'reading' (analysing again: no rhythm claimed)
  const STATIONS = [
    ['start', ['START'], 'A person collapses: an adult lying still on the floor', 0, '-', [100, 156, 24], '-',
      { heart: 'vf', strip: 'none', screen: '', cpr: false }],
    ['safe', ['SAFE?'], 'Check it is safe: traffic, water, electricity, danger to you', 3, 'A', [56, 162, 92], 'ERC-BLS Fig. 7 "Safety"; time typical',
      { heart: 'vf', strip: 'none', screen: '', cpr: false }],
    ['shoulders', ['SHOUL-', 'DERS'], 'Check for a response: shake the shoulders, ask loudly "Are you all right?"', 5, 'A', [100, 188, 20], 'ERC-BLS Fig. 7 "Response"; time typical',
      { heart: 'vf', strip: 'none', screen: '', cpr: false }],
    ['call', ['CALL', '108/112'], 'Call the emergency number on speaker (India: 108 ambulance or 112; Europe: 112)', 5, 'A', [150, 230, 2], 'ERC-BLS Fig. 7 "Alert emergency services"; Table 1; AHA-P7 Initiation (Lay) #2-3',
      { heart: 'vf', strip: 'none', screen: '', cpr: false }],
    ['airway', ['HEAD +', 'CHIN'], 'Open the airway (head tilt, chin lift) and look, listen, feel for breathing', 10, 'A', [100, 207, 20], 'ERC-BLS Fig. 7 "Airway", "Breathing": no more than 10 s; AHA-P7 Recognition #1',
      { heart: 'vf', strip: 'none', screen: '', cpr: false }],
    ['helper', ['HELPER'], 'Send someone for the AED', 2, 'A', [22, 30, 170], 'ERC-BLS Fig. 7 "Send for AED"; time typical',
      { heart: 'vf', strip: 'none', screen: '', cpr: false }],
    ['chest1', ['CHEST'], 'CPR while the AED comes: 30 compressions, 2 breaths', 90, 'A', [100, 160, 24], 'ERC-BLS Fig. 7 "Circulation", "Combine rescue breathing"; AHA-P7 CPR Before Defibrillation #1; time illustrative',
      { heart: 'vf+cpr', strip: 'none', screen: '', cpr: true }],
    ['lid', ['LID'], 'Open the AED case or lid', 3, 'B', [58, 242, 14], 'ERC-BLS "Using an AED": "Open the AED case (if present)"; time typical',
      { heart: 'vf+cpr', strip: 'none', screen: '', cpr: true }],
    ['power', ['ON'], 'Power button (some AEDs switch on when the lid opens)', 2, 'B', [68, 233, 11], 'ERC-BLS "Using an AED": "identify the power button and turn it on"; time typical',
      { heart: 'vf+cpr', strip: 'blank', screen: 'Attach pads to the patient\'s bare chest', cpr: true }],
    ['bare', ['BARE', 'CHEST'], 'Bare the chest and open the pad packet (move a bra rather than remove it, if pads can sit on bare skin)', 10, 'B', [100, 172, 24], 'ERC-BLS "Removing a bra prior to defibrillation"; AHA-P7 Pads #2; time typical',
      { heart: 'vf+cpr', strip: 'blank', screen: 'Attach pads to the patient\'s bare chest', cpr: true }],
    ['pad1', ['PAD 1'], 'Right pad: below the right collarbone, right of the breastbone', 5, 'B', [89, 180, 23], 'ERC-BLS "Positioning of defibrillation pads", Fig. 6a; AHA-P7 Pads #1',
      { heart: 'vf+cpr', strip: 'blank', screen: 'Attach pads to the patient\'s bare chest', cpr: true }],
    ['pad2', ['PAD 2'], 'Left pad: left side, mid-axillary line, below the armpit', 5, 'B', [119.5, 166, 14], 'ERC-BLS "Positioning of defibrillation pads", Fig. 6a; AHA-P7 Pads #1',
      { heart: 'vf+cpr', strip: 'blank', screen: 'Attach pads to the patient\'s bare chest', cpr: true }],
    ['plug', ['PLUG'], 'Pad connector into the AED (many come pre-connected)', 2, 'B', [72, 252, 11], 'Typical (manufacturer); ERC-BLS: follow the AED\'s prompts',
      { heart: 'vf+cpr', strip: 'cpr', screen: 'Pads connected', cpr: true }],
    ['analyse', ['ANALYS-', 'ING'], 'AED analyses the rhythm: nobody touches the person', 8, 'AED', [52, 240, 11], 'ERC-BLS "Using an AED": "Ensure that nobody touches the person whilst the AED is analysing"; time typical',
      { heart: 'paused-vf', strip: 'vf', screen: 'Analysing heart rhythm. Do not touch the patient.', cpr: false }],
    ['clear', ['STAND', 'CLEAR'], '"Shock advised": AED charges; look along the body, call "Everyone clear!"', 6, 'B', [26, 214, 70], 'ERC-BLS Fig. 7 "Follow the spoken/visual directions"; charge time typical',
      { heart: 'paused-vf', strip: 'charge', screen: 'Shock advised. Charging. Stand clear!', cpr: false }],
    ['shock', ['SHOCK'], 'Press the flashing shock button (a fully automatic AED shocks by itself)', 1, 'B', [64, 247, 11], 'ERC-BLS "Using an AED" (semi- vs fully automatic)',
      { heart: 'current', strip: 'spike', screen: 'Shock delivered', cpr: false }],
    ['chest2', ['CHEST'], 'Resume CPR immediately: 2 minutes of 30:2', 120, 'A', [100, 160, 24], 'ERC-BLS Fig. 7 "Then immediately resume CPR"; ERC-ALS 2 min; AHA-P7 Pauses #3',
      { heart: 'stunned+cpr', strip: 'cpr', screen: 'Start CPR now', cpr: true }],
    ['next', ['NEXT', 'CHECK'], 'AED says "Stop CPR, analysing": swap compressors, repeat', 0, 'AED', [52, 240, 11], 'ERC-BLS "after a set time interval the AED will instruct the rescuer to pause CPR"; AHA-P7 Pauses #4',
      { heart: 'stunned', strip: 'reading', screen: 'Stop CPR. Do not touch the patient. Analysing.', cpr: false }],
  ].map(([key, lines, name, secs, who, at, source, look], i) =>
    Object.freeze({ key, num: i + 1, lines, label: lines.join(' ').replace('- ', ''), name, secs, who, at, source, ...look }));

  const IDX = Object.freeze(Object.fromEntries(STATIONS.map((s, i) => [s.key, i])));

  /* ---------- the 7 steps (one button each) ---------- */
  const STEPS = [
    { label: 'Check and call', path: ['safe', 'shoulders', 'call', 'airway', 'helper'],
      note: 'Make sure it is safe, shake and shout. No answer: call 108 or 112 on speaker straight away, or ask someone with you to call while you stay with the person (ERC Fig. 7). Then tilt the head and look for normal breathing for up to 10 s. Gasping is not normal breathing: it is a sign of cardiac arrest. Send someone for the AED.',
      done: 'Unresponsive, not breathing normally: cardiac arrest. Help and an AED are coming.',
      clinician: 'Healthcare professionals may check a carotid pulse at the same time, for no more than 10 s; if no definite pulse, treat as cardiac arrest. (AHA-P7 Recognition #2)' },
    { label: 'Start CPR', path: ['chest1'],
      note: 'Kneel beside the chest. Heel of one hand on the lower half of the breastbone, other hand on top, fingers interlocked, arms straight, shoulders above your hands. Push 5-6 cm deep, 100-120 a minute, let the chest come all the way up. If trained: 30 pushes, 2 breaths. If not: keep pushing without stopping. Alone? Fetch an AED only if you can have it on within 1 minute.',
      done: 'Blood is being pushed to the brain while the AED is on its way.',
      clinician: 'Breaths over about 1 s each, just enough for visible chest rise; pause no more than 10 s for two breaths. (ERC-BLS Fig. 7; AHA-P7 Ventilation #2, #4)' },
    { label: 'Open and switch on', path: ['lid', 'power'],
      note: 'B opens the lid and presses the power button; the AED starts talking. A keeps pushing: do not stop CPR to set up the AED.',
      done: 'The AED is on and giving spoken instructions.' },
    { label: 'Attach the pads', path: ['bare', 'pad1', 'pad2', 'plug'],
      note: 'Bare the chest (move clothing or a bra; modesty comes second). Peel each pad and press it on bare skin exactly where the picture on the pad shows: one below the right collarbone, one on the left side below the armpit. A keeps pushing around B\'s hands.',
      more: 'Wet chest: wipe it dry. Medicine patch where a pad goes: peel it off and wipe the skin. Very hairy chest: shave the pad sites only if the pads will not stick, without delaying the shock. A bump under the collarbone (pacemaker or ICD): keep the pad at least 8 cm away from it. (ERC-ALS 2025 "Pad position"; wet chest and patches: typical, AED makers\' instructions)',
      done: 'Pads on, plugged in. The AED can now see the heart.' },
    { label: 'Analyse: hands off', path: ['analyse'],
      note: 'The AED says "Analysing, do not touch the patient". A lifts both hands. Any movement can confuse the analysis.',
      more: 'If it says "No shock advised": restart compressions immediately and follow the AED; it will check again in 2 minutes. (ERC-BLS Fig. 7 "If no shock is advised")',
      done: 'Rhythm read: ventricular fibrillation. "Shock advised."' },
    { label: 'Stand clear and shock', path: ['clear', 'shock'],
      note: 'The AED charges. B looks from head to toe and says "Everyone clear!", then presses the flashing button. The body may jerk. Keep this pause as short as you can.',
      done: 'Shock delivered.',
      clinician: 'Pre- and post-shock pauses should be as short as possible (AHA-P7 Pauses #1). With a manual defibrillator, ERC-ALS aims for an interruption under 5 s; an AED\'s own analysis and charge set the pause here.' },
    { label: 'Resume CPR at once', path: ['chest2', 'next'],
      note: 'Straight back to compressions: don\'t feel for a pulse, don\'t wait. Even a successful shock leaves a heart that cannot pump well for a while, often for more than 2 minutes. After 2 minutes the AED will ask to analyse again; swap who is pushing. Keep going until a healthcare professional takes over or tells you to stop, the person is definitely waking up (moving, opening their eyes and breathing normally), or you are exhausted (ERC Fig. 7).',
      done: 'CPR running. Next analysis in 2 minutes.',
      clinician: 'No post-shock rhythm or pulse check; resume compressions immediately. (AHA-P7 Pauses #3; ERC-ALS)' },
  ].map(s => Object.freeze(s));

  // what the page says when a step is pressed before its turn (index = the step pressed)
  const WHY_NOT = Object.freeze([
    'Start with Check and call.',
    'First make sure it\'s safe and call 108 or 112: the call-taker can coach you through CPR.',
    'Start pushing first. CPR keeps the brain alive while the AED is fetched; your helper sets it up.',
    'Switch the AED on first: its voice tells you where each pad goes.',
    'The AED can only read the heart through the pads: attach them first.',
    'Only the AED decides if a shock is needed. The shock button lights up only after it says "Shock advised".',
    'A shock was advised: give it now. Don\'t delay a shock for more CPR.',
  ]);
  const HANDS_OFF = 'Hands off while it analyses: movement confuses the rhythm reading.';

  /* ---------- numbers (docs/spec.md, "Numbers") ---------- */
  const NUM = Object.freeze({
    rate: 110,                  // per minute, inside 100-120 (ERC-BLS Fig. 7; AHA-P7)
    depthCm: [5, 6],            // at least 5, not more than 6
    ratio: [30, 2],
    breathPause: 5,             // s for two breaths (typical; never more than 10)
    breathPauseMax: 10,
    breathCheckMax: 10,
    nextAnalysis: 120,          // s (ERC-ALS)
    shockEnergy: 'Set by the AED (usually 150-200 J biphasic for adults)',
  });
  const cycleSecs = (mode = '30:2') => mode === '30:2' ? NUM.ratio[0] * 60 / NUM.rate + NUM.breathPause : 60 / NUM.rate;

  /* ---------- the scenario clock ---------- */
  const START_AT = STATIONS.reduce((acc, s, i) => [...acc, i ? acc[i - 1] + STATIONS[i - 1].secs : 0], []);
  const TOTAL = START_AT[STATIONS.length - 1] + STATIONS[STATIONS.length - 1].secs;   // 277 s = 4 min 37 s
  const clockAt = (i, u = 1) => START_AT[i] + STATIONS[i].secs * Math.max(0, Math.min(1, u));
  // compressions given during `secs` of CPR: 30:2 cycles (with 5 s breath pauses), or continuous at the rate
  const compressionsIn = (secs, mode = '30:2') => {
    if (mode !== '30:2') return Math.floor(secs * NUM.rate / 60);
    const c = cycleSecs(mode), push = NUM.ratio[0] * 60 / NUM.rate, full = Math.floor(secs / c), rest = secs - full * c;
    return full * NUM.ratio[0] + Math.min(NUM.ratio[0], Math.floor(rest / push * NUM.ratio[0]));
  };
  // seconds with nobody pushing on the chest, from the first compression up to clock time t
  const handsOffUntil = t => STATIONS.reduce((sum, s, i) => {
    if (i < IDX.chest1 || s.cpr) return sum;
    return sum + Math.max(0, Math.min(t, START_AT[i] + s.secs) - START_AT[i]);
  }, 0);
  // compressions given up to clock time t: each unbroken run of CPR stations restarts the 30:2 cycle
  // (CHEST 7 through PLUG is one run of 117 s; CHEST 17 is another of 120 s)
  const compressionsUntil = (t, mode = '30:2') => {
    let total = 0, run = 0;
    STATIONS.forEach((s, i) => {
      const secs = Math.max(0, Math.min(t, START_AT[i] + s.secs) - START_AT[i]);
      if (s.cpr) run += secs;
      if (!s.cpr || i === STATIONS.length - 1) { total += compressionsIn(run, mode); run = 0; }
    });
    return total;
  };
  const mmss = v => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;

  // self-check: the totals the spec promises
  const SPLIT = {
    check: STEPS[0].path.reduce((a, k) => a + STATIONS[IDX[k]].secs, 0),
    pads: ['lid', 'power', 'bare', 'pad1', 'pad2', 'plug'].reduce((a, k) => a + STATIONS[IDX[k]].secs, 0),
    handsOff: ['analyse', 'clear', 'shock'].reduce((a, k) => a + STATIONS[IDX[k]].secs, 0),
  };
  const CHECK = [
    [TOTAL === 277, `total ${TOTAL} s, expected 277 (4:37)`],
    [SPLIT.check === 25, `check and call ${SPLIT.check} s, expected 25`],
    [SPLIT.pads === 27, `AED on and pads ${SPLIT.pads} s, expected 27`],
    [SPLIT.handsOff === 15, `hands-off around the shock ${SPLIT.handsOff} s, expected 15`],
    [STATIONS.length === 18 && STEPS.length === 7, 'expected 18 stations and 7 steps'],
    [STEPS.flatMap(s => s.path).join() === STATIONS.slice(1).map(s => s.key).join(), 'steps must visit stations 2..18 once, in order'],
  ].filter(([ok]) => !ok).map(([, msg]) => msg);

  const SITE = Object.freeze({
    name: 'AED Bench', tagline: 'An interactive guide to using an AED',
    bigIdea: 'The AED decides; you keep the blood moving. Push hard and fast until it\'s on, hands off only while it reads and shocks, then push again at once.',
    safety: 'A teaching figure, not a substitute for a CPR course. In a real emergency, call your emergency number and follow the AED\'s voice.',
    phoneNote: 'Elsewhere, call your local emergency number (911 in the US and Canada).',
    sources: [
      'ERC Guidelines 2025: Adult Basic Life Support. Smyth MA et al. Resuscitation 2025;215:110771 (Fig. 7 "BLS step by step"; "Using an AED"; "Positioning of defibrillation pads"; Fig. 6).',
      'ERC Guidelines 2025: Adult Advanced Life Support. Soar J et al. Resuscitation 2025;215:110769 ("Defibrillation strategy"; "Energy levels").',
      'AHA 2025 Guidelines for CPR and ECC, Part 7: Adult Basic Life Support. Circulation 2025. doi:10.1161/CIR.0000000000001369.',
      '"Typical" marks values neither guideline gives (device analysis and charge times, set-up times).',
    ],
    credit: 'Made with ♥ and a passion for teaching medicine · Dr. Atul Tiwari', url: 'https://atultiwari.com/',
  });

  g.AED = Object.freeze({ WORLD, STATIONS, IDX, STEPS, WHY_NOT, HANDS_OFF, NUM, START_AT, TOTAL, SPLIT, CHECK, SITE,
    clockAt, cycleSecs, compressionsIn, compressionsUntil, handsOffUntil, mmss });
})(typeof window !== 'undefined' ? window : globalThis);
