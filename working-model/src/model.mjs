// The AED Bench model: one pure module. Every number on the page comes from here:
// the scenario clock, time in each station, compressions given, hands-off time, the
// compression fraction, the speed badge and the state (and colours) of the window.
// Names, times, notes and totals are never typed here: they come from shared/aed-spec.js
// (docs/spec.md as data). In Node the import below sets globalThis.AED; in the page the
// build inlines the same file first.
import "../../shared/aed-spec.js";

export const AED = globalThis.AED;
export const STATIONS = AED.STATIONS;
export const STEPS = AED.STEPS;
export const NUM = AED.NUM;
export const TOTAL = AED.TOTAL;
export const N_STATIONS = STATIONS.length;
export const IDX = AED.IDX;
export const MODES = Object.freeze(["30:2", "continuous"]);

// ---- steps and stations ------------------------------------------------------
// Station 1 (START) comes before step 1; every other station belongs to exactly one step.
export const STEP_OF = Object.freeze(STATIONS.map((s) => STEPS.findIndex((st) => st.path.includes(s.key))));
export const STATIONS_OF = Object.freeze(STEPS.map((st) => st.path.map((k) => IDX[k])));

// ---- the scenario clock -----------------------------------------------------------
export const startOf = (i) => AED.START_AT[i];
export const clockAt = (i, secs) => AED.clockAt(i, STATIONS[i].secs ? secs / STATIONS[i].secs : 1);
export const mmss = AED.mmss;

// CPR runs: unbroken blocks of stations with cpr: true (the 30:2 cycle restarts in each).
export const CPR_RUNS = Object.freeze(
  STATIONS.reduce((runs, s, i) => {
    if (!s.cpr) return runs;
    const last = runs[runs.length - 1];
    if (last && last.to === startOf(i)) return [...runs.slice(0, -1), { ...last, to: startOf(i) + s.secs }];
    return [...runs, { from: startOf(i), to: startOf(i) + s.secs }];
  }, []).map(Object.freeze),
);
export const FIRST_PUSH = CPR_RUNS[0].from;

// seconds of CPR (pushing or the breath pauses in between) up to clock time t
export const cprSecondsUntil = (t) => CPR_RUNS.reduce((a, r) => a + Math.max(0, Math.min(t, r.to) - r.from), 0);
// the CPR run going on at clock t, and how far into it
export function cprRunAt(t) {
  const r = CPR_RUNS.find((run) => t >= run.from && t < run.to);
  return r ? { run: r, secs: t - r.from } : null;
}
// breath pauses inside `secs` of one CPR run (30:2 only)
export function breathPauseIn(secs, mode = "30:2") {
  if (mode !== "30:2") return 0;
  const c = AED.cycleSecs(mode), push = (NUM.ratio[0] * 60) / NUM.rate;
  const full = Math.floor(secs / c);
  return full * NUM.breathPause + Math.max(0, secs - full * c - push);
}
export const compressionsUntil = (t, mode = "30:2") => AED.compressionsUntil(t, mode);
export const handsOffUntil = (t) => AED.handsOffUntil(t);
// seconds with hands actually pushing, up to t
export const pushingUntil = (t, mode = "30:2") =>
  CPR_RUNS.reduce((a, r) => {
    const s = Math.max(0, Math.min(t, r.to) - r.from);
    return a + s - breathPauseIn(s, mode);
  }, 0);
// chest compression fraction since the first push: time pushing / time since the first push
export function fractionUntil(t, mode = "30:2") {
  const since = t - FIRST_PUSH;
  return since <= 0 ? null : pushingUntil(t, mode) / since;
}
// no blood flow: seconds since the collapse with nobody doing CPR
export const noFlowUntil = (t) => t - cprSecondsUntil(t);

// The chest under the hands at `secs` into a CPR run: dip 0..1 of the depth, pushes in this
// cycle (1..30), and whether this is a breath pause.
export function chestAt(secs, mode = "30:2") {
  const period = 60 / NUM.rate;
  if (mode !== "30:2") {
    const ph = (secs / period) % 1;
    return { dip: Math.sin(Math.PI * ph) ** 2, count: (Math.floor(secs / period) % NUM.ratio[0]) + 1, breathing: false };
  }
  const c = AED.cycleSecs(mode), push = NUM.ratio[0] * period, inCycle = secs % c;
  if (inCycle >= push) return { dip: 0, count: NUM.ratio[0], breathing: true, breath: Math.min(NUM.ratio[1], Math.floor(((inCycle - push) / NUM.breathPause) * NUM.ratio[1]) + 1) };
  const ph = (inCycle / period) % 1;
  return { dip: Math.sin(Math.PI * ph) ** 2, count: Math.floor(inCycle / period) + 1, breathing: false };
}
export const DEPTH_CM = (NUM.depthCm[0] + NUM.depthCm[1]) / 2; // 5.5 cm: the middle of the 5-6 cm band

// ---- playback: how long each station plays on screen ---------------------------------
// Short stations play in real time (×1); a 1 s shock plays at half speed so it can be seen;
// 8-10 s stations at ×2; the two long CPR stations show 3 s at ×1, then fast-forward.
export const HOLD = 0.8; // a short still at the end of each step (the scenario clock waits)
export const FAST = 15;
export const ZERO_PLAY = 2.5; // START and NEXT CHECK take no scenario time
const lastOfStep = (i) => STEP_OF[i] >= 0 && STATIONS_OF[STEP_OF[i]].at(-1) === i;

export function segmentsOf(i) {
  const secs = STATIONS[i].secs;
  let segs;
  if (secs === 0) segs = [{ dur: ZERO_PLAY, from: 0, to: 0 }];
  else if (secs <= 1) segs = [{ dur: 2, from: 0, to: secs }];
  else if (secs <= 6) segs = [{ dur: secs, from: 0, to: secs }];
  else if (secs <= 10) segs = [{ dur: secs / 2, from: 0, to: secs }];
  else segs = [{ dur: 3, from: 0, to: 3 }, { dur: (secs - 3) / FAST, from: 3, to: secs }];
  if (lastOfStep(i)) segs = [...segs, { dur: HOLD, from: secs, to: secs }];
  return Object.freeze(segs.map(Object.freeze));
}
export const PLAN = Object.freeze(STATIONS.map((_, i) => segmentsOf(i)));
export const playOf = (i) => PLAN[i].reduce((a, s) => a + s.dur, 0);
export const PLAY_AT = Object.freeze(PLAN.reduce((acc, _, i) => [...acc, i ? acc[i - 1] + playOf(i - 1) : 0], []));
export const RUN_SECONDS = PLAY_AT[N_STATIONS - 1] + playOf(N_STATIONS - 1);

// Speed of a segment: scenario seconds per real second (0 = the clock is waiting).
export const speedOf = (seg) => (seg.dur > 0 ? (seg.to - seg.from) / seg.dur : 0);
export function badge(speed) {
  if (!speed) return "";
  if (Math.abs(speed - 1) < 0.05) return "×1 real time";
  return speed > 1 ? `×${Math.round(speed)}` : `×1/${Math.round(1 / speed)}`;
}

// Where a real time T (seconds into the run) falls: station, segment, scenario seconds in it.
export function stationAtReal(T) {
  let i = 0;
  while (i < N_STATIONS - 1 && PLAY_AT[i + 1] < T) i++;
  let t = Math.max(0, T - PLAY_AT[i]);
  for (const seg of PLAN[i]) {
    if (t <= seg.dur || seg === PLAN[i].at(-1)) {
      const p = seg.dur ? Math.min(1, t / seg.dur) : 1;
      return { i, seg, secs: seg.from + (seg.to - seg.from) * p, speed: speedOf(seg), real: T - PLAY_AT[i] };
    }
    t -= seg.dur;
  }
  return null;
}
// real time at which step k starts and ends
export const stepStartReal = (k) => PLAY_AT[STATIONS_OF[k][0]];
export const stepEndReal = (k) => PLAY_AT[STATIONS_OF[k].at(-1)] + playOf(STATIONS_OF[k].at(-1));

// ---- the window: the heart and the AED strip -------------------------------------
// Colours and flags for each named heart state (docs/scene.md "The window"). Never a normal beat.
export const HEART = Object.freeze({
  vf: { wall: "#9a4a6a", inner: "#6e2848", ripple: "#d2577f", ripples: 1, squeeze: 0, arrows: 0, current: 0, caption: "Quivering (ventricular fibrillation): no squeeze, no blood flow" },
  "vf+cpr": { wall: "#9a4a6a", inner: "#6e2848", ripple: "#d2577f", ripples: 1, squeeze: 1, arrows: 1, current: 0, caption: "Still quivering, but each push squeezes blood out" },
  "paused-vf": { wall: "#9a4a6a", inner: "#6e2848", ripple: "#d2577f", ripples: 1, squeeze: 0, arrows: 0, current: 0, caption: "Hands off: quivering, no blood flow" },
  current: { wall: "#9a4a6a", inner: "#6e2848", ripple: "#ffd23f", ripples: 0, squeeze: 0, arrows: 0, current: 1, caption: "The shock passes from pad to pad through the whole heart" },
  "stunned+cpr": { wall: "#a8586e", inner: "#7d3a52", ripple: "#a8586e", ripples: 0, squeeze: 1, arrows: 1, current: 0, caption: "A shock stops the chaos; CPR keeps blood moving until the heart pumps on its own" },
  stunned: { wall: "#a8586e", inner: "#7d3a52", ripple: "#a8586e", ripples: 0, squeeze: 0, arrows: 0, current: 0, caption: "Still, not yet pumping well" },
});
export const BLOOD = Object.freeze({ red: "#d8433b", blue: "#4a6fd1", current: "#ffd23f", brainOn: "#e58fa0", brainOff: "#a9a9b2" });
export const STRIP = Object.freeze({
  none: { trace: "none", caption: "AED not here yet" },
  blank: { trace: "flat", caption: "Pads not on: flat line" },
  cpr: { trace: "cpr", caption: "Big regular bumps: the pushes (CPR artefact)" },
  vf: { trace: "vf", caption: "Fine chaotic wiggle: ventricular fibrillation" },
  charge: { trace: "vf", caption: "Shock advised: charging" },
  spike: { trace: "spike", caption: "One shock spike" },
  reading: { trace: "reading", caption: "Analysing again: the figure does not say what it will find" },
});

// The window at `secs` into station i (all earlier stations ran in full).
export function windowAt(i, secs, mode = "30:2") {
  const s = STATIONS[i];
  const t = clockAt(i, secs);
  const u = s.secs ? Math.min(1, secs / s.secs) : 1;
  const run = cprRunAt(t);
  const chest = s.cpr && run ? chestAt(run.secs, mode) : { dip: 0, count: 0, breathing: false };
  return Object.freeze({
    heart: s.heart, look: HEART[s.heart], strip: s.strip, stripLook: STRIP[s.strip], screen: s.screen,
    pads: { right: i > IDX.pad1 || (i === IDX.pad1 && u >= 1), left: i > IDX.pad2 || (i === IDX.pad2 && u >= 1) },
    analyse: s.key === "analyse" ? u : s.key === "next" ? 0 : null,
    charge: s.strip === "charge" ? Math.min(1, (u * s.secs) / (s.secs - 1)) : null, // 5 s of charge in the 6 s station
    countdown: s.key === "chest2" ? NUM.nextAnalysis - secs : null,
    cpr: s.cpr, chest, noFlow: noFlowUntil(t), brainFlow: s.cpr ? 0.6 : 0,
  });
}

// Every readout at one moment.
export function readoutsAt(i, secs, mode = "30:2") {
  const t = clockAt(i, secs);
  const s = STATIONS[i];
  const f = fractionUntil(t, mode);
  return Object.freeze({
    clock: t, clockText: `${mmss(t)} of ${mmss(TOTAL)}`,
    inStation: s.secs ? `${mmss(secs)} of ${mmss(s.secs)}` : "no clock time",
    compressions: compressionsUntil(t, mode),
    handsOff: t >= FIRST_PUSH ? handsOffUntil(t) : null,
    fraction: f, fractionText: f == null ? "–" : `${Math.round(f * 100)}%`,
    rate: `${NUM.rate}/min`, depth: `${NUM.depthCm[0]}–${NUM.depthCm[1]} cm`,
  });
}

// ---- self-check printed by the build -----------------------------------------------
export function selfCheck() {
  const sum = (keys) => keys.reduce((a, k) => a + STATIONS[IDX[k]].secs, 0);
  return {
    specCheck: AED.CHECK.length ? AED.CHECK : "ok",
    total: `${TOTAL} s = ${mmss(TOTAL)}`,
    checkAndCall: sum(STEPS[0].path), aedAndPads: sum(["lid", "power", "bare", "pad1", "pad2", "plug"]), handsOffShock: sum(["analyse", "clear", "shock"]),
    cprRuns: CPR_RUNS.map((r) => `${mmss(r.from)}-${mmss(r.to)}`).join(", "),
    compressions: `${compressionsUntil(TOTAL)} (30:2) / ${compressionsUntil(TOTAL, "continuous")} (compressions only)`,
    handsOff: `${handsOffUntil(TOTAL)} s`,
    fraction: `${Math.round(fractionUntil(TOTAL) * 100)}% (30:2) / ${Math.round(fractionUntil(TOTAL, "continuous") * 100)}% (compressions only)`,
    run: `${RUN_SECONDS.toFixed(1)} s real`,
    badges: STATIONS.map((s, i) => `${s.num}:${PLAN[i].map((g) => badge(speedOf(g)) || "–").join("/")}`).join(" "),
  };
}
