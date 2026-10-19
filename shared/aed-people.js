/* AED Bench: the people, as data. One cast, one skeleton, one pose solver, read by every style, so the same three
   people appear in the Sketchbook, the Turntable and the Working Model (docs/characters-plan.md).
   A plain script: in a page it sets window.AEDPeople; in Node, importing it sets globalThis.AEDPeople.
   World frame as in aed-spec.js: cm, x = depth (toward viewer-right), y = width (toward viewer-left), z = up.
   A person's own frame: f = facing, u = up (head direction), r = their right = f × u. */
(function (g) {
  'use strict';

  /* ---------- small vector helpers (prefixed so they never clash with engine globals) ---------- */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    // the part of `a` at right angles to unit vector `n`
    perp: (a, n) => { const d = a[0] * n[0] + a[1] * n[1] + a[2] * n[2]; return [a[0] - n[0] * d, a[1] - n[1] * d, a[2] - n[2] * d]; },
    // rotate `a` toward `b` (both unit, at right angles) by angle t radians
    turn: (a, b, t) => [a[0] * Math.cos(t) + b[0] * Math.sin(t), a[1] * Math.cos(t) + b[1] * Math.sin(t), a[2] * Math.cos(t) + b[2] * Math.sin(t)],
  };
  const UP = [0, 0, 1], D2R = Math.PI / 180;

  /* ---------- the cast (docs/characters-plan.md, "Who they are") ----------
     Body lengths are for a 160 cm adult, scaled per person. About 7 heads tall: natural adults, lightly stylised,
     after the figures in ERC Guidelines 2025 Adult BLS (Figs. 8a-8o). Skin tones from Fitzpatrick types III-V. */
  const BASE = Object.freeze({
    spine: 46, neck: 8, headR: 10.6, upperArm: 28, forearm: 24, hand: 17, thigh: 41, shin: 40, ankleH: 7, foot: 23,
    shoulderHalf: 17, hipHalf: 8.5,
    // half-widths (across, front-to-back) of the torso at the hips, waist, chest and shoulders
    torso: { hip: [17, 10.5], waist: [13.5, 9.5], chest: [16, 11], shoulder: [17.5, 8.5] },
    limb: { upperArm: [4.7, 3.7], forearm: [3.6, 2.5], thigh: [7.6, 5.4], shin: [5.2, 3.4] },
  });
  const CAST = Object.freeze({
    patient: Object.freeze({
      name: 'The patient', role: 'Middle-aged man, collapsed', scale: 1.07, build: 1.12, sex: 'm',
      skin: '#b47b56', hair: '#3b3633', hairStyle: 'side', eyes: 'closed', brows: 'flat',
      top: '#93b8de', topStyle: 'shirt', bottom: '#6b7280', shoes: '#3a3330', sleeve: .62,
    }),
    A: Object.freeze({
      name: 'Rescuer A', role: 'Woman, does the compressions', scale: 1, build: 1, sex: 'f',
      skin: '#8f5c3e', hair: '#1f1a17', hairStyle: 'bun', eyes: 'open', brows: 'focus',
      top: '#4f9a6a', topStyle: 'top', bottom: '#34405a', shoes: '#2b2826', sleeve: .55,
    }),
    B: Object.freeze({
      name: 'Helper B', role: 'Young man, brings and runs the AED', scale: 1.06, build: 1.02, sex: 'm',
      skin: '#d3a07a', hair: '#2a2420', hairStyle: 'crop', eyes: 'open', brows: 'up',
      top: '#e08a3a', topStyle: 'tee', bottom: '#3f5f8f', shoes: '#2f2b28', sleeve: .45,
    }),
  });
  // a person's measurements: lengths scale with height, widths also with build
  function dims(who) {
    const c = CAST[who], k = c.scale, w = c.build, s = v => v * k, sw = v => v * k * w;
    const t = BASE.torso, l = BASE.limb, f = c.sex === 'f';
    return {
      spine: s(BASE.spine), neck: s(BASE.neck), headR: s(BASE.headR), upperArm: s(BASE.upperArm), forearm: s(BASE.forearm),
      hand: s(BASE.hand), thigh: s(BASE.thigh), shin: s(BASE.shin), ankleH: s(BASE.ankleH), foot: s(BASE.foot),
      shoulderHalf: sw(BASE.shoulderHalf) * (f ? .94 : 1.04), hipHalf: sw(BASE.hipHalf) * (f ? 1.06 : 1),
      torso: {
        hip: [sw(t.hip[0]) * (f ? 1.06 : .9), sw(t.hip[1])], waist: [sw(t.waist[0]) * (f ? .94 : 1.05), sw(t.waist[1])],
        chest: [sw(t.chest[0]), sw(t.chest[1]) * (f ? 1.06 : 1)], shoulder: [sw(t.shoulder[0]) * (f ? .93 : 1.05), sw(t.shoulder[1])],
      },
      limb: Object.fromEntries(Object.entries(l).map(([n, [a, b]]) => [n, [sw(a), sw(b)]])),
    };
  }

  /* ---------- two-bone IK: the middle joint between a fixed root and a target, bending toward `pole` ---------- */
  function ik2(A, T, la, lb, pole) {
    const v = V.sub(T, A), dist = V.len(v) || 1e-6, dn = V.mul(v, 1 / dist);
    const d = Math.min(la + lb - 1e-4, Math.max(Math.abs(la - lb) + 1e-4, dist));
    const a = (la * la - lb * lb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, la * la - a * a));
    let p = V.perp(pole, dn);
    if (V.len(p) < 1e-6) p = V.perp([0, 0, 1], dn);
    const J = V.add(V.add(A, V.mul(dn, a)), V.mul(V.norm(p), h));
    return { J, T: V.add(A, V.mul(dn, d)), reached: dist <= la + lb };
  }
  const angleAt = (a, j, b) => Math.acos(Math.max(-1, Math.min(1, V.dot(V.norm(V.sub(a, j)), V.norm(V.sub(b, j)))))) / D2R;

  /* ---------- the hands: a frame (wrist, finger direction h, palm normal p) and a shape ---------- */
  // shapes: 'mitten' (relaxed), 'flat' (palm down on a surface), 'press' (fingertips down on a button),
  // 'open' (hands-off: palm facing out, fingers up), 'lower' / 'upper' (the two hands of a compression, fingers interlaced),
  // 'grip' (holding a handle), 'point'
  function handFrame(spec, elbow, wristIfFree, side, body) {
    const shape = spec.shape || 'mitten';
    let h, p, W;
    switch (shape) {
      case 'lower': case 'upper':
        h = V.norm(V.perp(spec.dir || body.f, UP)); p = [0, 0, -1];
        W = V.add(V.add(spec.to, V.mul(h, -3)), [0, 0, 2]);
        break;
      case 'flat':
        h = V.norm(V.perp(spec.dir || body.f, UP)); p = [0, 0, -1]; W = V.add(V.add(spec.to, V.mul(h, -6)), [0, 0, 1.5]); break;
      case 'press':
        h = V.norm(V.add(V.mul(V.norm(V.perp(spec.dir || body.f, UP)), .35), [0, 0, -1])); p = V.norm(V.perp(spec.dir || body.f, h));
        W = V.add(spec.to, V.mul(h, -13)); break;
      case 'point':   // arm out toward someone: `to` is the wrist, `dir` the way the finger points
        h = V.norm(spec.dir || body.f); p = V.norm(V.perp([0, 0, -1], h)); W = spec.to; break;
      case 'open':
        h = V.norm(V.add([0, 0, 1], V.mul(body.f, .25))); p = body.f; W = spec.to; break;
      default:
        W = wristIfFree; h = V.norm(V.sub(W, elbow));
        p = V.norm(V.perp(V.mul(body.r, -side), h));
        if (shape === 'grip') p = V.norm(V.perp(V.mul(body.r, -side), h));
    }
    return { W, h, p, l: V.norm(V.cross(h, p)), shape, side };
  }

  // kneeling and reaching: tip the trunk from upright toward the hands until both hands are within arm's reach
  function leanFor(pose, K, L0, f, D) {
    const r = V.norm(V.cross(f, UP)), arm = (D.upperArm + D.forearm) * .97, full = D.thigh + D.spine;
    const tg = ['L', 'R'].filter(k => pose.hands[k]).map(k => ({ k, W: handFrame(pose.hands[k], null, [0, 0, 0], k === 'L' ? -1 : 1, { f, r }).W }));
    if (!tg.length) return V.add(K, [0, 0, L0]);
    const mid = tg.reduce((a, t) => V.add(a, V.mul(t.W, 1 / tg.length)), [0, 0, 0]);
    const toward = V.norm(V.sub(mid, K));
    const reach = chest => {
      const sp = V.norm(V.sub(chest, K)), fT = V.norm(V.perp(f, sp)), rT = V.norm(V.cross(fT, sp));
      return Math.max(...tg.map(t => V.len(V.sub(t.W, V.add(chest, V.mul(rT, (t.k === 'L' ? -1 : 1) * D.shoulderHalf)))) - arm));
    };
    // a person working low and close first sits back toward the heels, then leans: try the least bend that reaches
    let best = null;
    for (const L of [L0, full * .9, full * .84, full * .79]) for (let i = 0; i <= 16; i++) {
      const chest = V.add(K, V.mul(V.norm(V.lerp([.06, 0, 1], toward, i / 16 * .62)), L));
      const miss = reach(chest), cost = Math.max(0, miss) * 10 + i / 16 * 2 + (L0 - L) / full;
      if (!best || cost < best.cost) best = { chest, cost };
      if (miss <= 0) break;
    }
    return best.chest;
  }

  /* ---------- solve a pose: every joint in world cm ----------
     pose = { who, mode: 'stand' | 'run' | 'kneel' | 'supine', at: [x, y] (feet, knees or pelvis), facing: [x, y, 0],
              chest: [x,y,z] (kneel: where the chest goes), lean, sit (0..1 kneel back on the heels),
              hands: { L: {to, shape, dir}, R: {...} } (null = relaxed), lockElbows, look: {yaw, pitch} in degrees,
              phase (run, radians), headTilt (supine, 0..1), along (supine: head direction) } */
  function solve(pose) {
    const who = pose.who, D = dims(who), mode = pose.mode || 'stand';
    const J = {}, side = { L: -1, R: 1 };
    let f, s, r, pelvis;
    if (mode === 'supine') {
      s = V.norm(pose.along || [0, 1, 0]); f = [0, 0, 1]; r = V.norm(V.cross(f, s));
      const t = D.torso.hip[1];
      pelvis = [pose.at[0], pose.at[1], t + .5];
    } else {
      f = V.norm(V.perp(pose.facing || [1, 0, 0], UP)); r = V.norm(V.cross(f, UP));
    }
    const body = { f, r };

    /* legs and pelvis */
    if (mode === 'stand' || mode === 'run') {
      const ph = pose.phase || 0, run = mode === 'run';
      const legLen = D.thigh + D.shin, bob = run ? Math.abs(Math.sin(ph)) * 3 : 0;
      pelvis = [pose.at[0], pose.at[1], D.ankleH + legLen * (run ? .955 : .995) + bob];
      s = V.norm(V.add(UP, V.mul(f, (run ? .14 : 0) + (pose.lean || 0))));
      ['L', 'R'].forEach(k => {
        const sd = side[k], hip = V.add(pelvis, V.mul(r, sd * D.hipHalf));
        const sw = run ? Math.sin(ph + (k === 'L' ? 0 : Math.PI)) : 0;
        const ankle = V.add([hip[0], hip[1], D.ankleH + Math.max(0, -sw) * (run ? 14 : 0)], V.mul(f, sw * (run ? 30 : 0)));
        const knee = ik2(hip, ankle, D.thigh, D.shin, V.add(f, [0, 0, .2])).J;
        J['hip' + k] = hip; J['knee' + k] = knee; J['ankle' + k] = ankle;
        J['toe' + k] = V.add(V.add(ankle, V.mul(f, D.foot * .72)), [0, 0, -D.ankleH + 2.2]);
      });
    } else if (mode === 'kneel') {
      const K = [pose.at[0], pose.at[1], 5.5], sit = pose.sit || 0, L = (D.thigh + D.spine) * (.985 - sit * .2);
      let want = pose.chest || V.add(V.add(K, V.mul(f, 4)), [0, 0, L]);
      if (!pose.chest && pose.hands && !pose.lockElbows) want = leanFor(pose, K, L, f, D);
      // the pelvis bends back behind the knees: thigh from the knees, spine up to the chest
      pelvis = ik2(K, want, D.thigh, D.spine, V.add(V.mul(f, -1), [0, 0, .25])).J;
      const chest = ik2(K, want, D.thigh, D.spine, V.add(V.mul(f, -1), [0, 0, .25])).T;
      s = V.norm(V.sub(chest, pelvis));
      ['L', 'R'].forEach(k => {
        const sd = side[k], kneeHalf = D.hipHalf + 3;
        const knee = V.add(K, V.mul(r, sd * kneeHalf)), ankle = V.add(V.add(knee, V.mul(f, -D.shin * .97)), [0, 0, 1.5]);
        J['hip' + k] = V.add(pelvis, V.mul(r, sd * D.hipHalf)); J['knee' + k] = knee; J['ankle' + k] = ankle;
        J['toe' + k] = V.add(V.add(ankle, V.mul(f, -D.foot * .2)), [0, 0, -5]);
      });
    } else {
      ['L', 'R'].forEach(k => {
        const sd = side[k], hip = V.add(pelvis, V.mul(r, sd * D.hipHalf));
        const knee = V.add(V.add(hip, V.mul(s, -D.thigh)), V.add(V.mul(r, sd * 2), [0, 0, -2.6]));
        const ankle = V.add(V.add(knee, V.mul(s, -D.shin)), V.add(V.mul(r, sd * 2.5), [0, 0, -1]));
        J['hip' + k] = hip; J['knee' + k] = knee; J['ankle' + k] = ankle;
        J['toe' + k] = V.add(V.add(ankle, V.add(V.mul(s, -3), V.mul(r, sd * 3.5))), [0, 0, D.foot * .55]);
      });
    }

    /* the trunk frame: f' and r' at right angles to the spine */
    const fT = mode === 'supine' ? f : V.norm(V.perp(f, s)), rT = V.norm(V.cross(fT, s));
    let chest = V.add(pelvis, V.mul(s, D.spine));
    // arms locked straight with the shoulders over the hands (compressions): the chest goes above the hands
    if (pose.lockElbows && pose.hands && mode === 'kneel') {
      const wr = ['L', 'R'].map(k => handFrame(pose.hands[k], null, null, side[k], { f: fT, r: rT }).W);
      const mid = V.lerp(wr[0], wr[1], .5), reach = (D.upperArm + D.forearm) * .998;
      const half = Math.hypot(...V.sub(wr[0], mid)), off = D.shoulderHalf - half;
      const want = [mid[0], mid[1], mid[2] + Math.sqrt(Math.max(0, reach * reach - off * off))];
      const K = [pose.at[0], pose.at[1], 5.5];
      const sol = ik2(K, want, D.thigh, D.spine, V.add(V.mul(f, -1), [0, 0, .25]));
      pelvis = sol.J; chest = sol.T; s = V.norm(V.sub(chest, pelvis));
      ['L', 'R'].forEach(k => { J['hip' + k] = V.add(pelvis, V.mul(r, side[k] * D.hipHalf)); });
    }
    const fS = mode === 'supine' ? f : V.norm(V.perp(f, s)), rS = V.norm(V.cross(fS, s));
    J.pelvis = pelvis; J.chest = chest;
    J.waist = V.add(pelvis, V.mul(s, D.spine * .38)); J.ribs = V.add(pelvis, V.mul(s, D.spine * .74));
    J.shoulderL = V.add(chest, V.mul(rS, -D.shoulderHalf)); J.shoulderR = V.add(chest, V.mul(rS, D.shoulderHalf));

    /* head: on the neck, facing f' turned by look (yaw, pitch); supine: tilted back by headTilt */
    J.neck = V.add(chest, V.mul(s, D.neck));
    let face = fS, headUp = s;
    if (mode === 'supine') {
      const th = (pose.headTilt || 0) * 28 * D2R;
      face = V.norm(V.turn(f, s, th)); headUp = V.norm(V.turn(s, V.mul(f, -1), th));
      J.neck = V.add(V.add(chest, V.mul(s, D.neck)), [0, 0, 0]);
    } else if (pose.look) {
      const yaw = (pose.look.yaw || 0) * D2R, pitch = (pose.look.pitch || 0) * D2R;
      face = V.norm(V.turn(fS, rS, yaw)); const rr = V.norm(V.cross(face, s));
      face = V.norm(V.turn(face, V.mul(s, -1), pitch)); headUp = V.norm(V.cross(rr, face));
    }
    J.head = V.add(J.neck, V.add(V.mul(headUp, D.headR * .92), V.mul(face, D.headR * .12)));
    if (mode === 'supine') J.head[2] = Math.max(J.head[2], D.headR);

    /* arms: relaxed, or reaching hands to targets through two-bone IK, elbows out and down */
    const hands = {};
    ['L', 'R'].forEach(k => {
      const sd = side[k], S = J['shoulder' + k], spec = pose.hands && pose.hands[k];
      let target;
      if (!spec) {
        if (mode === 'supine') target = V.add(V.add(S, V.mul(s, -(D.upperArm + D.forearm) * .9)), V.add(V.mul(rS, sd * 12), [0, 0, -S[2] + 4]));
        else if (mode === 'kneel') target = V.add(V.add(J['knee' + k], V.mul(f, -3)), [0, 0, 22]);
        else {
          const sw = mode === 'run' ? Math.sin((pose.phase || 0) + (k === 'L' ? Math.PI : 0)) : 0;
          target = V.add(V.add(S, V.mul(s, -(D.upperArm + D.forearm) * (mode === 'run' ? .78 : .97))), V.add(V.mul(rS, sd * 4), V.mul(fS, sw * 22 + 2)));
        }
      }
      const pre = spec ? handFrame(spec, null, null, sd, { f: fS, r: rS }) : null;
      const W = pre ? pre.W : target;
      const pole = mode === 'supine' ? V.add(V.mul(rS, sd), [0, 0, -.3])
        : mode === 'run' && !spec ? V.add(V.mul(fS, -1), V.mul(rS, sd * .4))
        : V.add(V.add(V.mul(rS, sd * .9), [0, 0, -.6]), V.mul(fS, -.25));
      const sol = ik2(S, W, D.upperArm, D.forearm, pole);
      if (pose.lockElbows && spec) {      // locked elbows: the arm is a straight line from the shoulder toward the hand
        const dn = V.norm(V.sub(W, S));
        sol.J = V.add(S, V.mul(dn, D.upperArm)); sol.T = V.add(S, V.mul(dn, D.upperArm + D.forearm));
      }
      J['elbow' + k] = sol.J; J['wrist' + k] = sol.T;
      hands[k] = pre ? { ...pre, W: sol.T, reached: sol.reached } : handFrame({ shape: 'mitten' }, sol.J, sol.T, sd, { f: fS, r: rS });
    });

    return { who, cast: CAST[who], D, mode, J, body: { f: fS, r: rS, s, face, headUp }, hands };
  }

  /* ---------- posture checks (tests/people.test.mjs, and printed on the character sheet) ---------- */
  function posture(p) {
    const J = p.J, mid = V.lerp(J.wristL, J.wristR, .5);
    return {
      shoulderOverHandsCm: Math.hypot(J.chest[0] - mid[0], J.chest[1] - mid[1]),
      elbowDeg: [angleAt(J.shoulderL, J.elbowL, J.wristL), angleAt(J.shoulderR, J.elbowR, J.wristR)],
      kneesOnFloor: J.kneeL[2] <= 7 && J.kneeR[2] <= 7,
      handsReached: Object.values(p.hands).every(h => h.reached !== false),
    };
  }

  /* ---------- landmarks on the patient's body (ERC 2025 BLS: hand position, pad positions) ---------- */
  function landmarks(p) {
    const { J, D, body } = p, at = t => V.lerp(J.pelvis, J.chest, t), front = J.pelvis[2] + D.torso.chest[1] * .96;
    const R = D.headR, head = J.head;
    return {
      sternumLow: [...at(.78).slice(0, 2), front],                                 // lower half of the sternum, 'centre of the chest' (nipple line)
      padRight: V.add([...at(.9).slice(0, 2), front - .6], V.mul(body.r, 8.5)),     // below the right collarbone
      padLeft: V.add([...at(.68).slice(0, 2), J.pelvis[2] + 1], V.mul(body.r, -D.torso.chest[0] - .4)),  // left mid-axillary line
      forehead: V.add(head, V.add(V.mul(body.face, R * .62), V.mul(body.headUp, R * .62))),
      chin: V.add(head, V.add(V.mul(body.face, R * .55), V.mul(body.headUp, -R * .9))),
      mouth: V.add(head, V.add(V.mul(body.face, R * 1.02), V.mul(body.headUp, -R * .45))),
      shoulderL: V.add(J.shoulderL, [0, 0, 6]), shoulderR: V.add(J.shoulderR, [0, 0, 6]),
    };
  }

  /* ---------- the poses the scenes use (docs/scene.md), as functions of where things are ---------- */
  const W = () => (g.AED && g.AED.WORLD) || null;
  const POSES = {
    patient: (o = {}) => ({ who: 'patient', mode: 'supine', at: [100, 112], along: [0, 1, 0], headTilt: o.tilt || 0 }),
    A_kneel: (o = {}) => ({ who: 'A', mode: 'kneel', at: o.at || [58, 160], facing: [1, 0, 0], look: o.look || { yaw: 0, pitch: 18 } }),
    A_compress: (o = {}) => {
      const c = o.chest || landmarks(solve(POSES.patient())).sternumLow, h = o.dip ? [c[0], c[1], c[2] - o.dip] : c;
      return { who: 'A', mode: 'kneel', at: o.at || [c[0] - 40, c[1]], facing: [1, 0, 0], lockElbows: true, look: { pitch: 34 },
        hands: { L: { to: h, shape: 'upper' }, R: { to: h, shape: 'lower' } } };
    },
    A_handsOff: (o = {}) => {
      const at = o.at || [58, 142];
      return { who: 'A', mode: 'kneel', at, facing: [1, 0, 0], look: { pitch: 10 },
        hands: { L: { to: [at[0] + 16, at[1] + 30, 86], shape: 'open' }, R: { to: [at[0] + 16, at[1] - 30, 86], shape: 'open' } } };
    },
    B_stand: (o = {}) => ({ who: 'B', mode: 'stand', at: o.at || [30, 40], facing: o.facing || [1, 0, 0], look: o.look }),
    B_run: (o = {}) => ({ who: 'B', mode: 'run', at: o.at || [30, 40], facing: o.facing || [0, 1, 0], phase: o.phase || 0,
      hands: o.carry ? null : null }),
    B_reach: (o = {}) => ({ who: 'B', mode: 'kneel', at: o.at || [34, 222], sit: .15, look: { pitch: 30 },
      facing: o.facing || (o.to ? [o.to[0] - (o.at || [34, 222])[0], o.to[1] - (o.at || [34, 222])[1], 0] : [1, 0, 0]),
      hands: o.rest ? { R: { to: o.to || [62, 236, 13], shape: o.shape || 'press', dir: o.dir }, L: { to: o.rest, shape: 'flat' } }
                    : { R: { to: o.to || [62, 236, 13], shape: o.shape || 'press', dir: o.dir } } }),
  };

  g.AEDPeople = Object.freeze({ V, CAST, BASE, dims, ik2, solve, posture, landmarks, POSES, angleAt, world: W });
})(typeof window !== 'undefined' ? window : globalThis);
