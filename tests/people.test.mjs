// Posture tests for the shared people (shared/aed-people.js): the teaching points are checked, not hoped for.
// node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('../shared/aed-people.js');
const P = globalThis.AEDPeople, V = P.V;
const patient = P.solve(P.POSES.patient()), LM = P.landmarks(patient);

test('every person stands about 7 heads tall at their own height', () => {
  for (const who of Object.keys(P.CAST)) {
    const p = P.solve({ who, mode: 'stand', at: [0, 0], facing: [1, 0, 0] }), D = p.D;
    const top = p.J.head[2] + D.headR, want = 160 * P.CAST[who].scale;
    assert.ok(Math.abs(top - want) / want < .05, `${who}: ${top.toFixed(1)} cm tall, expected about ${want}`);
    const heads = top / (2 * D.headR);
    assert.ok(heads > 6.6 && heads < 7.8, `${who}: ${heads.toFixed(2)} heads tall`);
  }
});

test('compressions: shoulders over the hands, elbows locked, heel of the hand on the lower sternum (ERC 2025 Fig. 7)', () => {
  for (const dip of [0, 5.5]) {
    const p = P.solve(P.POSES.A_compress({ dip })), q = P.posture(p);
    assert.ok(q.shoulderOverHandsCm <= 3, `shoulders ${q.shoulderOverHandsCm.toFixed(1)} cm from over the hands`);
    q.elbowDeg.forEach(a => assert.ok(a >= 170, `elbow bent to ${a.toFixed(0)} degrees`));
    assert.ok(q.kneesOnFloor, 'knees on the floor');
    const mid = V.lerp(p.J.wristL, p.J.wristR, .5);
    assert.ok(Math.hypot(mid[0] - LM.sternumLow[0], mid[1] - LM.sternumLow[1]) <= 4, 'hands over the lower half of the sternum');
  }
});

test('a push moves the hands down by the depth pushed (5-6 cm)', () => {
  const up = P.solve(P.POSES.A_compress()), down = P.solve(P.POSES.A_compress({ dip: 5.5 }));
  const d = up.J.wristL[2] - down.J.wristL[2];
  assert.ok(d >= 5 && d <= 6, `hands moved ${d.toFixed(1)} cm`);
});

test('hands off: both hands lifted clear of the patient', () => {
  const p = P.solve(P.POSES.A_handsOff());
  for (const k of ['L', 'R']) assert.ok(p.J['wrist' + k][2] > 60, `${k} hand only ${p.J['wrist' + k][2].toFixed(0)} cm off the floor`);
  assert.equal(p.hands.L.shape, 'open');
});

test('kneeling: knees and shins on the floor, ankles behind the knees', () => {
  const p = P.solve(P.POSES.A_kneel());
  assert.ok(P.posture(p).kneesOnFloor);
  for (const k of ['L', 'R']) assert.ok(p.J['ankle' + k][0] < p.J['knee' + k][0] - 30, 'shins lie back along the floor');
});

test('helper B can reach the AED buttons from a kneel', () => {
  const p = P.solve(P.POSES.B_reach());
  assert.ok(P.posture(p).handsReached, 'a hand falls short of its target');
});

test('the hands go on the centre of the chest: lower half of the sternum, not the belly', () => {
  const sp = patient.J.chest[1] - patient.J.pelvis[1], t = (LM.sternumLow[1] - patient.J.pelvis[1]) / sp;
  assert.ok(t > .7 && t < .86, `hand point at ${(t * 100).toFixed(0)}% of the way from the hips to the shoulders`);
});

test('the patient lies flat: pelvis, chest and head all near the floor', () => {
  for (const j of ['pelvis', 'chest', 'head']) assert.ok(patient.J[j][2] < 16, `${j} at ${patient.J[j][2].toFixed(1)} cm`);
  assert.ok(LM.padRight[0] < 100 && LM.padLeft[0] > 100, "right pad on the patient's right (-x), left pad on the left (+x)");
});
