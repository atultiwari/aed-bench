import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "./model.mjs";

const sum = (keys) => keys.reduce((a, k) => a + M.STATIONS[M.IDX[k]].secs, 0);

test("totals: 277 s, splits 25 / 27 / 15 s", () => {
  assert.equal(M.TOTAL, 277);
  assert.equal(M.mmss(M.TOTAL), "4:37");
  assert.equal(sum(M.STEPS[0].path), 25);
  assert.equal(sum(["lid", "power", "bare", "pad1", "pad2", "plug"]), 27);
  assert.equal(sum(["analyse", "clear", "shock"]), 15);
  assert.equal(M.STATIONS[M.IDX.chest1].secs, 90);
  assert.equal(M.STATIONS[M.IDX.chest2].secs, 120);
  assert.deepEqual(M.AED.CHECK, []);
});

test("18 stations, 7 steps, forward only; both CHEST stations separate", () => {
  assert.equal(M.N_STATIONS, 18);
  assert.equal(M.STEPS.length, 7);
  assert.deepEqual(M.STATIONS.map((s) => s.num), Array.from({ length: 18 }, (_, i) => i + 1));
  assert.deepEqual(M.STATIONS_OF.flat(), Array.from({ length: 17 }, (_, i) => i + 1));
  assert.equal(M.STEP_OF[0], -1);
  const chests = M.STATIONS.filter((s) => s.label === "CHEST").map((s) => s.num);
  assert.deepEqual(chests, [7, 17]);
  // trace the active station through a whole run at 20 ms: 1, 2, ... 18, never back
  const seen = [];
  for (let T = 0; T <= M.RUN_SECONDS + 0.5; T += 0.02) {
    const { i } = M.stationAtReal(T);
    if (seen.at(-1) !== i) seen.push(i);
  }
  assert.deepEqual(seen, Array.from({ length: 18 }, (_, i) => i));
});

test("scenario clock is monotonic and ends at 4:37", () => {
  let prev = -1;
  for (let T = 0; T <= M.RUN_SECONDS; T += 0.05) {
    const m = M.stationAtReal(T);
    const t = M.clockAt(m.i, m.secs);
    assert.ok(t >= prev - 1e-9, `clock went back at T=${T}`);
    prev = t;
  }
  const end = M.stationAtReal(M.RUN_SECONDS);
  assert.equal(M.clockAt(end.i, end.secs), 277);
});

test("compressions: 30:2 and compressions only", () => {
  assert.equal(M.compressionsUntil(M.FIRST_PUSH), 0);
  assert.equal(M.FIRST_PUSH, 25);
  assert.equal(M.compressionsUntil(M.TOTAL), 342);
  assert.equal(M.compressionsUntil(M.TOTAL, "continuous"), 434);
  // the first cycle: 30 pushes in 30/110 min, then 2 breaths in 5 s
  const c = M.AED.cycleSecs("30:2");
  assert.ok(Math.abs(c - 21.36) < 0.01);
  assert.equal(M.chestAt(c - 1).breathing, true);
  assert.equal(M.chestAt(1).breathing, false);
  assert.equal(M.chestAt(c - 1, "continuous").breathing, false);
  // nobody pushes during the hands-off stations
  const t0 = M.startOf(M.IDX.analyse), t1 = M.startOf(M.IDX.chest2);
  assert.equal(M.compressionsUntil(t0), M.compressionsUntil(t1));
});

test("hands-off and compression fraction", () => {
  assert.equal(M.handsOffUntil(M.TOTAL), 15);
  assert.equal(M.CPR_RUNS.length, 2);
  const cont = M.fractionUntil(M.TOTAL, "continuous");
  assert.ok(Math.abs(cont - 237 / 252) < 1e-9);
  const breaths = M.fractionUntil(M.TOTAL, "30:2");
  assert.ok(breaths < cont && breaths > 0.6);
  assert.equal(M.fractionUntil(10), null);
  assert.equal(M.noFlowUntil(25), 25);
});

test("speed badge comes from real vs scenario seconds; run lasts 60-90 s", () => {
  assert.ok(M.RUN_SECONDS >= 60 && M.RUN_SECONDS <= 90, `run ${M.RUN_SECONDS}`);
  assert.equal(M.badge(M.speedOf(M.PLAN[M.IDX.safe][0])), "×1 real time");
  assert.equal(M.badge(M.speedOf(M.PLAN[M.IDX.chest1][1])), `×${M.FAST}`);
  assert.equal(M.badge(M.speedOf(M.PLAN[M.IDX.shock][0])), "×1/2");
  assert.equal(M.badge(0), "");
  for (let i = 0; i < M.N_STATIONS; i++) {
    const scen = M.PLAN[i].reduce((a, g) => a + (g.to - g.from), 0);
    assert.equal(scen, M.STATIONS[i].secs);
  }
});

test("window end states: never a normal beat", () => {
  const w = (k, u = 1) => M.windowAt(M.IDX[k], M.STATIONS[M.IDX[k]].secs * u);
  assert.equal(w("start").heart, "vf");
  assert.equal(w("start").strip, "none");
  assert.equal(w("chest1", 0.5).heart, "vf+cpr");
  assert.equal(w("analyse").strip, "vf");
  assert.equal(w("analyse", 0.5).analyse, 0.5);
  assert.equal(w("clear").charge, 1);
  assert.equal(w("shock").heart, "current");
  assert.equal(w("shock").strip, "spike");
  assert.equal(w("chest2").heart, "stunned+cpr");
  assert.equal(w("chest2", 0).countdown, 120);
  assert.equal(w("next").heart, "stunned");
  assert.equal(w("next").strip, "reading");   // NEXT CHECK claims no rhythm
  assert.equal(w("pad1").pads.right, true);
  assert.equal(w("pad1", 0.5).pads.right, false);
  assert.equal(w("pad2").pads.left, true);
  const states = new Set(M.STATIONS.map((s) => s.heart));
  for (const h of states) assert.ok(M.HEART[h], h);
  assert.ok(![...states].some((h) => /normal|sinus|pulse/.test(h)));
  assert.equal(w("helper").noFlow, 25);
  // purity
  assert.deepEqual(M.readoutsAt(6, 40), M.readoutsAt(6, 40));
  assert.equal(M.readoutsAt(M.IDX.next, 0).compressions, 342);
});
