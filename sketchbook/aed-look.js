/* AED Bench · Sketchbook: what everything looks like at a moment.
   The page state is just (station index `at`, progress `u` 0..1 in that station); aedLook() turns it into poses,
   positions and window states, so any moment can be drawn (and screenshotted) without replaying the run.
   Names are prefixed (aed…, AED_…) so they never clash with the engine's short globals. */

// real seconds each station takes on screen (the scenario clock runs from AED.STATIONS[i].secs)
const AED_DUR = { start: 0, safe: 1.8, shoulders: 2.4, call: 2.6, airway: 3.0, helper: 2.2, chest1: 9, lid: 3.0,
  power: 2.2, bare: 2.6, pad1: 2.4, pad2: 2.4, plug: 1.8, analyse: 3.4, clear: 2.6, shock: 2.0, chest2: 10, next: 2.8 };

const aedClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const aedSeg = (u, a, b) => aedClamp((u - a) / (b - a));
const aedLerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const aedKey = i => AED.STATIONS[i].key;
// the Sketchbook draws the AED a little larger than life (44 cm) so its buttons and printing read; parts on its top panel
const AEDB = { x0: 36, x1: 80, y0: 222, y1: 266, h: 12, lidH: 4,
  on: [68, 231], shock: [67, 254], screen: [48, 244], socket: [80.4, 244, 6] };

/* the chest dip (0 = up, 1 = fully down) and whether this moment is a breath pause, from real time */
function aedCompressPhase(now, mode, clock) {
  const dip = Math.pow(Math.abs(Math.sin(now * Math.PI * 2.3)), 1.6);   // about 2.3 pushes a second on screen
  if (mode !== '30:2') return { dip, breath: false };
  const c = AED.cycleSecs(mode), push = c - AED.NUM.breathPause;
  return (clock % c) > push ? { dip: 0, breath: true } : { dip, breath: false };
}

function aedLook(st, now) {
  const W = AED.WORLD, I = AED.IDX, at = st.at, u = st.u, key = aedKey(at), s0 = AED.STATIONS[at];
  const past = k => at > I[k], here = k => at === I[k], from = k => at >= I[k];
  const clock = AED.clockAt(at, u);
  const L = { at, u, key, clock, station: s0 };

  /* helper B: stands, is sent, runs off, comes back with the AED, kneels beyond the head */
  // (drawn here at the near-right corner so a standing figure stays in frame; B leaves to the right and comes back
  // from the far left with the AED, never crossing the person)
  const bStart = [172, -4], bAway = [172, -90], bBack = [2, 336], bKneel = [...W.helperB.kneel];
  if (at < I.helper || (here('helper') && u < .35)) L.B = { pos: bStart, stand: true, show: true };
  else if (here('helper')) { const t = ease(aedSeg(u, .35, 1)); L.B = { pos: aedLerp(bStart, bAway, t), stand: true, run: true, show: t < .85 }; }
  else if (at < I.lid) L.B = { pos: bAway, stand: true, show: false };
  else if (here('lid') && u < .4) L.B = { pos: aedLerp(bBack, bKneel, ease(aedSeg(u, 0, .4))), stand: true, run: true, show: true, carry: true };
  else L.B = { pos: bKneel, stand: false, show: true };
  L.aedHere = from('lid') && !(here('lid') && u < .4);

  /* the AED: lid, power, screen, the shock button */
  L.lid = past('lid') ? 1 : here('lid') ? ease(aedSeg(u, .45, 1)) : 0;
  L.on = past('power') || (here('power') && u > .45);
  L.screen = L.on ? (AED.STATIONS[at].screen || AED.STATIONS[I.power].screen) : '';
  if (here('next') && u < .2) L.screen = AED.STATIONS[I.chest2].screen;
  L.shockReady = here('clear') && u > .55;
  L.flash = here('shock') && u > .25 && u < .5 ? 1 - aedSeg(u, .25, .5) : 0;
  L.jerk = here('shock') ? Math.max(0, Math.sin(aedSeg(u, .25, .45) * Math.PI)) : 0;
  L.analyseBar = here('analyse') ? u : past('analyse') ? 1 : 0;
  L.chargeBar = here('clear') ? aedSeg(u, .1, .9) : past('clear') ? 1 : 0;
  L.countdown = here('chest2') ? AED.NUM.nextAnalysis * (1 - u) : null;

  /* shirt, pads, cable plug */
  L.shirt = past('bare') ? 1 : here('bare') ? ease(aedSeg(u, 0, .6)) : 0;
  L.packet = past('bare') ? 1 : here('bare') ? aedSeg(u, .6, 1) : 0;
  L.pad1 = past('pad1') ? 1 : here('pad1') ? ease(aedSeg(u, .05, .85)) : 0;
  L.pad2 = past('pad2') ? 1 : here('pad2') ? ease(aedSeg(u, .05, .85)) : 0;
  L.plug = past('plug') ? 1 : here('plug') ? ease(aedSeg(u, 0, .7)) : 0;

  /* rescuer A */
  const cpr = s0.cpr && !(here('chest1') && u < .04);
  const ph = cpr ? aedCompressPhase(now, st.mode, clock - AED.START_AT[at]) : { dip: 0, breath: false };
  L.dip = cpr ? ph.dip : 0;
  L.breath = cpr && ph.breath;
  L.headTilt = past('airway') ? 1 : here('airway') ? ease(aedSeg(u, .1, .4)) : 0;
  L.A = { mode: 'kneel', look: 0 };
  if (here('safe')) L.A = { mode: 'kneel', look: Math.sin(u * Math.PI * 2) };
  else if (here('shoulders')) L.A = { mode: 'shoulders', shake: Math.sin(now * 22) * (u > .1 && u < .85 ? 1 : 0) };
  else if (here('call')) L.A = { mode: 'kneel', look: .6 };
  else if (here('airway')) L.A = { mode: 'airway' };
  else if (here('helper')) L.A = { mode: 'point' };
  else if (cpr) L.A = { mode: L.breath ? 'breath' : 'compress' };
  else if (from('analyse')) L.A = { mode: 'handsup' };

  /* helper B's hands */
  L.Bhands = null;
  if (L.B.show && !L.B.stand) {
    const lidFront = aedLidPoint(L.lid, 40, 16), aed = AEDB;
    if (here('lid')) L.Bhands = [lidFront, aedLidPoint(L.lid, 40, 30)];
    else if (here('power')) L.Bhands = [[...AEDB.on, aed.h + (u > .35 && u < .55 ? 1 : 4)], [50, 258, aed.h + 1]];
    else if (here('bare')) { const t = L.shirt; L.Bhands = [[96 - 10 * t, 176, 23], [104 + 8 * t, 176, 23]]; }
    else if (here('pad1') && u < .9) L.Bhands = [aedPadPos(1, L.pad1), [60, 236, aed.h + 1]];
    else if (here('pad2') && u < .9) L.Bhands = [aedPadPos(2, L.pad2), [60, 236, aed.h + 1]];
    else if (here('plug')) L.Bhands = [aedPlugPos(L.plug), [60, 236, aed.h + 1]];
    else if (here('clear')) { const t = Math.sin(u * Math.PI * 2); L.Bhands = [[60 + 20 * t, 150 + 30 * t, 70], [44, 238, aed.h + 1]]; }
    else if (here('shock')) L.Bhands = [[...AEDB.shock, aed.h + (u > .15 && u < .35 ? 1 : 4)], [44, 238, aed.h + 1]];
    else L.Bhands = [[52, 220, 30], [44, 236, aed.h + 1]];
  }

  /* speech: one bubble at a time */
  L.bubble = null;
  const say = (who, text, a = .08, b = .95) => { if (u >= a && u <= b) L.bubble = { who, text }; };
  if (here('shoulders')) say('A', '"Are you all right?"');
  if (here('call')) say('phone', '"Ambulance please: an adult has collapsed and is not responding"', .2);
  if (here('airway')) say('A', 'Gasping is not normal breathing', .45);
  if (here('helper')) say('A', '"Get the AED!"', .05, .6);
  if (here('chest1') && L.breath) L.bubble = { who: 'mouth', text: '2 breaths' };
  if (here('power')) say('AED', '"Attach pads to bare chest"', .5);
  if (here('analyse')) say('AED', '"Do not touch the patient"', .1);
  if (here('clear')) say('B', '"Everyone clear!"', .2);
  if (here('chest2')) say('AED', '"Start CPR now"', 0, .22);
  if (here('chest2') && L.breath && u > .22) L.bubble = { who: 'mouth', text: '2 breaths' };
  if (here('next')) say('AED', '"Stop CPR. Analysing."', .1);
  L.scan = here('safe') ? u : -1;
  L.airwayRing = here('airway') ? aedSeg(u, .4, 1) : -1;
  L.swap = here('next') && u > .45;
  L.phoneOn = from('call');

  /* the window */
  L.heart = s0.heart;
  if (here('shock')) L.heart = u < .25 ? 'paused-vf' : u < .55 ? 'current' : 'stunned';
  if (here('chest1') && u < .04) L.heart = 'vf';
  L.strip = s0.strip;
  if (here('lid') || (here('power') && !L.on)) L.strip = 'none';
  if (here('shock') && u < .25) L.strip = 'charge';
  L.padsOn = [L.pad1 >= 1, L.pad2 >= 1];
  return L;
}

/* a point on the AED lid: `d` cm from the hinge across the lid, `h` cm along y from the case's near-right corner */
function aedLidPoint(open, d, yOff) {
  const a = AEDB, ang = open * 110 * Math.PI / 180, lz = a.h + a.lidH;
  return [a.x0 + d * Math.cos(ang), a.y0 + yOff, lz + d * Math.sin(ang)];
}
/* the pads travel from the packet in the open lid to their places, in an arc */
function aedPadPos(n, t) {
  const src = aedLidPoint(1, 22, n === 1 ? 14 : 30), dst = n === 1 ? AED.WORLD.padRight : AED.WORLD.padLeft;
  const p = aedLerp(src, dst, t);
  p[2] += Math.sin(t * Math.PI) * 26;
  return p;
}
const aedPlugPos = t => aedLerp([96, 252, 5], AEDB.socket, t);
