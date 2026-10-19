/* ============================================================
   AED Bench, Turntable: everything on the floor is a function of (active station, progress u, real time).
   aedPose(T, world, st, time) places the people, the AED, the pads, the labels and the marks every frame.
   All points are AED.WORLD cm arrays [x, y, z].
   ============================================================ */
const AED_REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const ARM = [31, 30];                                  // upper arm, forearm (cm)
const v3 = {
  add: (a, b) => a.map((v, i) => v + b[i]), sub: (a, b) => a.map((v, i) => v - b[i]), mul: (a, s) => a.map(v => v * s),
  len: a => Math.hypot(...a), norm: a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); },
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
};

// two-bone reach: the elbow, bent toward `pole`; the hand is pulled in if it is out of reach
function aedIK(S0, H, pole) {
  const [a, b] = ARM, d0 = v3.sub(H, S0), d = Math.min(v3.len(d0), a + b - .05), u = v3.norm(d0);
  const hand = v3.add(S0, v3.mul(u, d));
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
  const pp = v3.sub(pole, v3.mul(u, v3.dot(pole, u))), pn = v3.norm(pp);
  return { elbow: v3.add(v3.add(S0, v3.mul(u, x)), v3.mul(pn, h)), hand };
}

// a kneeling person at knees `base` [x, y], facing angle phi; hands go to `hands` (null = resting on the thighs).
// lean: 'auto' leans just enough for the hands to be reached with nearly straight arms
function aedKneel(base, phi, hands, lean = 0, yaw = 0) {
  const f = [Math.cos(phi), Math.sin(phi), 0], l = [-Math.sin(phi), Math.cos(phi), 0], up = [0, 0, 1];
  const at = (o, a, b, z) => [o[0] + f[0] * a + l[0] * b, o[1] + f[1] * a + l[1] * b, z];
  const B0 = [base[0], base[1]];
  const kn = [at(B0, 0, 10, 6.4), at(B0, 0, -10, 6.4)], an = kn.map(k => [k[0] - f[0] * 32, k[1] - f[1] * 32, 5]);
  const hip = at(B0, 2, 0, 50), hp = [at(B0, 2, 8, 46), at(B0, 2, -8, 46)];
  const rest = [at(B0, 20, 10, 42), at(B0, 20, -10, 42)];
  const target = hands ? hands.map((h, j) => h || rest[j]) : rest;
  const torso = ln => { const dir = v3.add(v3.mul(f, Math.sin(ln)), v3.mul(up, Math.cos(ln))); return { dir, c: v3.add(hip, v3.mul(dir, 50)) }; };
  const shoulders = c => [v3.add(c, v3.mul(l, 15)), v3.add(c, v3.mul(l, -15))].map(s => [s[0], s[1], s[2] - 2]);
  let ln = typeof lean === 'number' ? lean : 0;
  if (lean === 'auto') {                  // the least lean that brings the hands within (nearly straight) reach
    const far = x => { const sh = shoulders(torso(x).c); return Math.max(0, ...target.map((h, j) => hands && hands[j] ? v3.len(v3.sub(h, sh[j])) : 0)); };
    let best = 0, bestFar = Infinity;
    for (let x = 0; x <= 1.35; x += .025) {
      const d = far(x);
      if (d <= ARM[0] + ARM[1] - 3) {
        let lo = Math.max(0, x - .025), hi = x;
        for (let n = 0; n < 8 && x > 0; n++) { const m = (lo + hi) / 2; if (far(m) <= ARM[0] + ARM[1] - 3) hi = m; else lo = m; }
        best = hi; break;
      }
      if (d < bestFar) { best = x; bestFar = d; }
    }
    ln = best;
  }
  const { dir, c } = torso(ln), sh = shoulders(c), head = v3.add(c, v3.mul(dir, 21));
  const arms = [0, 1].map(j => aedIK(sh[j], target[j], v3.add(v3.mul(l, j ? -1 : 1), [0, 0, -.6])));
  return { hip, chest: c, head, sh, el: arms.map(a => a.elbow), ha: arms.map(a => a.hand), hp, kn, an, yaw: -(phi + yaw) };
}

// a standing (or running) person at `base` [x, y]; run = stride phase in radians or null; carry = right hand low at the side
function aedStand(base, phi, run, carry) {
  const f = [Math.cos(phi), Math.sin(phi), 0], l = [-Math.sin(phi), Math.cos(phi), 0];
  const at = (a, b, z) => [base[0] + f[0] * a + l[0] * b, base[1] + f[1] * a + l[1] * b, z];
  const sw = run === null ? 0 : Math.sin(run), bounce = run === null ? 0 : Math.abs(Math.cos(run)) * 3;
  const hip = at(0, 0, 92 + bounce), hp = [at(0, 8, 90 + bounce), at(0, -8, 90 + bounce)];
  const kn = [at(sw * 16 + 3, 9, 50 + bounce), at(-sw * 16 + 3, -9, 50 + bounce)];
  const an = [at(sw * 22 - Math.max(0, -sw) * 10, 9, 6 + Math.max(0, -sw) * 10), at(-sw * 22 - Math.max(0, sw) * 10, -9, 6 + Math.max(0, sw) * 10)];
  const chest = at(run === null ? 0 : 6, 0, 140 + bounce), head = at(run === null ? 0 : 9, 0, 163 + bounce);
  const sh = [at(0, 16, 137 + bounce), at(0, -16, 137 + bounce)];
  const hands = [at(-sw * 18 + 4, 20, 86 + bounce), carry ? at(4, -24, 84 + bounce) : at(sw * 18 + 4, -20, 86 + bounce)];
  const arms = [0, 1].map(j => aedIK(sh[j], hands[j], v3.add(v3.mul(f, -.6), v3.mul(l, j ? -1 : 1))));
  return { hip, chest, head, sh, el: arms.map(a => a.elbow), ha: arms.map(a => a.hand), hp, kn, an, yaw: -phi };
}
const aedBlend = (p, q, t) => Object.fromEntries(Object.keys(p).map(key =>
  [key, key === 'yaw' ? lerp(p.yaw, q.yaw, t) : Array.isArray(p[key][0]) ? p[key].map((v, i) => lerp3(v, q[key][i], t)) : lerp3(p[key], q[key], t)]));

// along a polyline, by distance
function aedAlong(pts, t) {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), total = lens.reduce((a, b) => a + b, 0);
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) { const u = lens[i] ? Math.min(1, d / lens[i]) : 1; return { p: lerp3(pts[i], pts[i + 1], u), dir: Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) }; }
    d -= lens[i];
  }
  return { p: pts[pts.length - 1], dir: 0 };
}

/* ---------- the frame ---------- */
const AED_LIFTED = [[92, 172, 62], [92, 150, 62]];          // A's hands clear of the person
const AED_B_FACE = Math.atan2(-.35, 1);
function aedPose(T, W, st, time) {
  const now = st.now, u = st.u, p = key => now > I[key] ? 1 : now < I[key] ? 0 : u, key = S[now].key;
  const t = AED.clockAt(now, u), cpr = S[now].cpr ? cprPhase(t, st.mode) : null;
  const still = AED_REDUCE.matches;
  // the chest: a visible push (about a third of the chest height) at a watchable rate; breaths lift it a little
  const pump = cpr && cpr.pushing ? (still ? .5 : Math.pow(Math.max(0, Math.sin(time * Math.PI * 2 * 1.8)), 1.4)) : 0;
  const breath = cpr && !cpr.pushing ? Math.sin(Math.PI * Math.min(1, cpr.breath * 2 % 1)) : 0;
  const scale = 1 - pump * 7 / AW.body.torso.h + breath * .06, top = AW.body.torso.h * scale;
  W.patient.chest.scale.y = scale;
  st.view = { pump, cpr, t };
  // the shirt opens at BARE CHEST; the head tilts back at HEAD + CHIN
  const open = ease(seg(p('bare'), .05, .55));
  W.patient.flaps[0].rotation.x = open * 1.66; W.patient.flaps[1].rotation.x = -open * 1.66;
  W.patient.headPivot.rotation.z = key === 'airway' ? .28 * ease(seg(u, 0, .25)) : 0;
  const jerk = key === 'shock' ? Math.sin(Math.PI * seg(u, .35, .55)) * 3 : 0;
  W.patient.root.position.y = jerk;

  // Rescuer A: kneels on the far side, level with the chest
  const aBase = AW.rescuerA.knees, chestPt = AW.chest;
  let aHands = null, aLean = 0, aYaw = 0;
  if (key === 'safe') aYaw = still ? .6 : Math.sin(u * Math.PI * 2) * 1.05;
  else if (key === 'shoulders') { const sh = still ? 0 : Math.sin(time * 18) * 2; aHands = [[86 + sh, 190, 21], [114 + sh, 186, 21]]; aLean = 'auto'; }
  else if (key === 'call') aYaw = Math.atan2(AW.phone[1] - aBase[1], AW.phone[0] - aBase[0]);
  else if (key === 'airway') { aHands = [[100, 214, 21.5], [101, 199, 17]]; aLean = 'auto'; }
  else if (key === 'helper') aYaw = -1.3;
  else if (S[now].cpr) {
    const lift = cpr && !cpr.pushing ? 10 : 0;
    aHands = [[chestPt[0], chestPt[1], top + 7.5 + lift], [chestPt[0], chestPt[1], top + 3.5 + lift]]; aLean = 'auto';
  } else if (now >= I.analyse) { aHands = AED_LIFTED; aLean = .35; }
  const aPose = aedKneel(aBase, 0, aHands, aLean, aYaw);
  if (key === 'helper') {                        // A points at B
    const sh = aPose.sh[1], dir = v3.norm(v3.sub([AW.helperB.start[0], AW.helperB.start[1], 120], sh)), arm = aedIK(sh, v3.add(sh, v3.mul(dir, 58)), [0, 0, -1]);
    aPose.el[1] = arm.elbow; aPose.ha[1] = arm.hand;
  }
  W.A.set(aPose);

  // Helper B: stands at the back corner, runs off at HELPER, comes back with the AED at LID, kneels beyond the head
  const hb = AW.helperB, toPatient = Math.atan2(chestPt[1] - hb.start[1], chestPt[0] - hb.start[0]);
  let bPose, carrying = false;
  if (now < I.helper) bPose = aedStand(hb.start, toPatient, null, false);
  else if (key === 'helper') {
    const r = seg(u, .35, 1), pos = lerp3([...hb.start, 0], [...hb.away, 0], ease(r));
    bPose = { ...aedStand(pos, r > 0 ? -Math.PI / 2 : toPatient, r > 0 ? time * 11 : null, false), visible: r < .8 };
  } else if (now < I.lid) bPose = { ...aedStand(hb.away, 0, null, false), visible: false };
  else if (key === 'lid' && u < .42) {
    const path = [[...hb.away, 0], [4, 40, 0], [4, 196, 0], [hb.kneel[0] - 4, hb.kneel[1] + 6, 0]], a = aedAlong(path, ease(u / .42));
    bPose = aedStand(a.p, a.dir, time * 11, true); carrying = true;
  } else {
    let hands = null;
    // B shuffles in toward the chest for the pads (pad 2 is on the far side of the body from B), then back for the plug
    const shift = ease(seg(p('pad1'), 0, .25)) * (1 - ease(seg(p('plug'), 0, .3)));
    const spot = [lerp(hb.kneel[0], 46, shift), lerp(hb.kneel[1], 203, shift)];
    const kneel = q => aedKneel(spot, AED_B_FACE, q, q ? 'auto' : 0);
    if (key === 'lid') {
      const ang = 1.92 * ease(seg(u, .55, .92)), edge = [42 + 32 * Math.cos(ang), 240, 14 + 32 * Math.sin(ang)];
      if (u >= .55) hands = [edge, null];
      const kneeled = kneel(hands), standing = aedStand([hb.kneel[0] - 4, hb.kneel[1] + 6], AED_B_FACE, null, true);
      bPose = aedBlend(standing, kneeled, ease(seg(u, .42, .55)));
      carrying = u < .55;
    } else {
      if (key === 'power') hands = [[68, 233, 11.5 + 4 * (1 - Math.sin(Math.PI * seg(u, .15, .75)))], null];
      else if (key === 'bare') {
        const o = ease(seg(u, .05, .55)) * 18;
        hands = u < .6 ? [[100 - 6 - o, 178, top + 2], [100 + 6 + o, 174, top + 2]] : [W.aed.packetWorld, null];
      } else if (key === 'pad1' || key === 'pad2') hands = [W.pads.pads[key === 'pad1' ? 0 : 1].position, null];
      else if (key === 'plug') hands = [W.pads.plug.position, null];
      else if (key === 'clear') {
        const sh = kneel(null).sh[0], aim = [100, lerp(214, 40, ease(seg(u, .1, .9))), 22];
        hands = [v3.add(sh, v3.mul(v3.norm(v3.sub(aim, sh)), 59)), null];
      } else if (key === 'shock') hands = [[64, 247, 12 + 4 * (1 - Math.sin(Math.PI * seg(u, .1, .5)))], null];
      if (hands) hands = hands.map((h, j) => h ? (h.isVector3 ? [h.z + AED_CX, AED_CY - h.x, h.y] : h) : null);
      if (hands && !hands[1]) hands[1] = [hb.kneel[0] + 20, hb.kneel[1] + 12, 30];
      bPose = kneel(hands);
    }
  }
  W.B.set(bPose);

  // the AED: carried in B's hand, then set down on the floor; the lid opens; ON glows; the screen talks
  const aed = W.aed;
  aed.root.visible = now >= I.lid;
  if (carrying) {                                   // in B's hand, then set down as B kneels
    const h = bPose.ha[1], inHand = aedW(T, h[0] - 6, h[1], h[2] - 4 - AW.aed.h - AW.aed.lidH);
    aed.root.position.copy(inHand).lerp(aed.root.userData.home, key === 'lid' ? ease(seg(u, .42, .55)) : 0);
  } else aed.root.position.copy(aed.root.userData.home);
  aed.lid.rotation.x = -1.92 * ease(seg(p('lid'), .55, .92));
  aed.packetFlap.visible = p('bare') < .6;
  aed.root.updateMatrixWorld(true);
  const pk = new T.Vector3(); aed.packet.getWorldPosition(pk); aed.packetWorld = pk;
  const lidQ = new T.Quaternion(); aed.lid.getWorldQuaternion(lidQ);
  const isOn = p('power') > .5;
  aed.on.material.emissive.set(isOn ? '#2a9a52' : '#000000');
  const flash = (key === 'clear' && u > .25) || (key === 'shock' && u < .3);
  aed.shock.material.emissive.set(flash && (still || Math.sin(time * 14) > 0) ? '#ff9a2a' : '#000000');
  const screenText = isOn ? (key === 'power' ? S[I.power].screen : S[now].screen) : '';
  aedDrawScreen(aed.screen, screenText, key === 'analyse' || key === 'clear' ? u : null,
    key === 'chest2' ? mmss(AED.NUM.nextAnalysis * (1 - u) + .999) : '');

  // the pads ride from the packet to the chest, cables follow, the plug goes into the socket
  const pads = W.pads, shown = p('bare') >= .6;
  const targets = [AW.padRight, AW.padLeft].map(q => aedW(T, q[0], q[1], q[2] * scale));
  const flat = new T.Quaternion(), side = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), Math.PI / 2);
  ['pad1', 'pad2'].forEach((pk2, j) => {
    const m = pads.pads[j], home = pk.clone().add(new T.Vector3(j ? 4.5 : -4.5, -1.4, 0).applyQuaternion(lidQ));
    const kk = ease(seg(p(pk2), .1, .85));
    m.visible = shown;
    m.position.copy(home).lerp(targets[j], kk); m.position.y += Math.sin(Math.PI * kk) * 22;
    m.quaternion.copy(lidQ).slerp(j ? side : flat, kk);
    m.children[0].material.emissive.set(key === 'shock' && u > .35 && u < .6 ? '#ffd22a' : '#000000');
  });
  const plugHome = aedW(T, 86, 250, 1.2), socket = aedW(T, 72, 252, AW.aed.h + 2.2), kp = ease(seg(p('plug'), .15, .8));
  pads.plug.visible = shown;
  pads.plug.position.copy(plugHome).lerp(socket, kp); pads.plug.position.y += Math.sin(Math.PI * kp) * 14;
  pads.cables.forEach((c, j) => { c.visible = shown; if (shown) pads.setCable(j, pads.pads[j].position.clone(), pads.plug.position.clone()); });

  // the phone stays on speaker once the call is made
  W.phone.draw(p('call') > .25);
  W.phone.waves.forEach(m => {
    m.visible = key === 'call' && u > .25;
    const ph = still ? .5 : (time * .9 + m.userData.phase) % 1, r = 9 + ph * 16;
    m.scale.set(r, r, 1); m.material.opacity = Math.max(0, 1 - ph);
  });

  // marks: the active ring, the scan arc, the 10 s ring, the breath puff, the current, hands-off, swap
  const fx = W.fx, at = S[now].at;
  fx.ring.position.copy(aedW(T, at[0], at[1], at[2] + 1));
  const pulse = still ? 1 : 1 + .1 * Math.sin(time * 5);
  fx.ring.scale.set(pulse, pulse, pulse);
  fx.ring.visible = st.busy || now > 0;
  fx.scan.userData.show(key === 'safe' ? u : 0);
  fx.count10.userData.show(key === 'airway' ? 1 - seg(u, .1, 1) : 0);
  fx.puff.visible = breath > .05;
  if (fx.puff.visible) { const r = 2 + breath * 5; fx.puff.scale.set(r, r, r); fx.puff.position.copy(aedW(T, 100, 214, 26 + breath * 6)); }
  const bolt = key === 'shock' && u > .35 && u < .62;
  if (bolt && !fx.bolt.userData.built) {
    const a = targets[0].clone(), b = targets[1].clone(), pts = [];
    for (let n = 0; n <= 8; n++) { const q = a.clone().lerp(b, n / 8); q.y += 6 + (n % 2 ? 4 : -1) * (n > 0 && n < 8 ? 1 : 0); q.x += n % 2 ? 2.5 : -2.5; pts.push(q); }
    fx.bolt.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, 'catmullrom', .1), 60, 1.1, 6, false);
    fx.bolt.userData.built = true;
  }
  fx.bolt.visible = bolt;
  fx.handsOff.visible = now >= I.analyse && now !== I.chest2;
  fx.handsOff.position.copy(aedW(T, 100, 152, 44));
  fx.swap.visible = key === 'next' && u > .3;
  fx.swap.position.copy(aedW(T, 34, 190, 78));

  // speech bubbles
  const bub = BUBBLES[key], hd = pose => aedW(T, pose.head[0], pose.head[1], pose.head[2] + 15);
  const where = bub && { A: hd(aPose), B: hd(bPose), AED: aedW(T, 58, 242, 30), phone: aedW(T, 150, 236, 18) }[bub.who];
  fx.bubbles[0].show(bub && u > .06 && (bub.who !== 'B' || bPose.visible !== false) ? bub.text : '', bub && bub.who, where);
  fx.bubbles[1].show(breath > .05 || (cpr && !cpr.pushing) ? BREATHS_TEXT : '', 'A', aedW(T, 100, 222, 36), .8);

  // labels: the active station's label lights up
  W.labels.forEach((l, i) => l.setLit(i === now));
}
