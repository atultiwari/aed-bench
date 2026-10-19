/* AED Bench · Sketchbook: the floor scene, drawn with the sketch engine from aedLook().
   x = depth (toward viewer-right), y = width (toward viewer-left), z = up, 1 unit = 1 cm. */

const AED_C = {
  shirt: matOf('#5b7fb5'), trousers: matOf('#4a4f5a'), skin: matOf('#c98f6a'), hair: matOf('#2d2620'),
  A: matOf('#4f9a6a'), B: matOf('#e08a3a'), legs: matOf('#3b3f4a'), shoe: matOf('#2f2b28'),
  aed: matOf('#2f9e5b'), panel: matOf('#3d3935'), pad: matOf('#f7f5ee'), mat: { l: '#b9cdb4', m: '#9fb69a', d: '#7c937a' },
  floor: { l: '#e2c59a', m: '#caa77a', d: '#a5825a' }, phone: matOf('#3a4150'),
};
const AED_FLOOR = { x0: 0, x1: 205, y0: -20, y1: 300 }, AED_MAT = { x0: 16, x1: 196, y0: -6, y1: 292, h: 2.2 };
const AED_PHONE = [184, 240];

// station tapes stuck flat on the mat, by station key: [x, y] centre. AED parts are printed on the AED instead.
const AED_TAPES = {
  start: [134, 40], safe: [160, 40], helper: [186, 40],
  chest2: [160, 104], chest1: [160, 150], shoulders: [160, 198], airway: [160, 246],
  pad2: [186, 104], bare: [186, 150], pad1: [186, 198], call: [186, 286], clear: [132, 286],
};

/* ---------- small helpers ---------- */
const aedTxZ = (x, y, z, str, size, col = INK, weight = 800) => { const o = P(x, y, z);
  return `<text transform="${txM(o, Dv(0, -1, 0), Dv(1, 0, 0))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".03em">${str}</text>`; };
const aedTxPlane = (o3, U3, V3, str, size, col = INK, weight = 800) => { const o = P(...o3);
  return `<text transform="${txM(o, Dv(...U3), Dv(...V3))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}">${str}</text>`; };
const aedBall = (c, r, m, w = 1.1) => { const [X, Y] = P(...c);
  return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="${m.l}" stroke="${INK}" stroke-width="${w}"/>`
    + `<path d="M${f(X - r * .55)} ${f(Y + r * .5)}A${f(r)} ${f(r)} 0 0 0 ${f(X + r * .75)} ${f(Y - r * .35)}" fill="none" stroke="${m.d}" stroke-width="${f(r * .32)}" opacity=".35"/>`; };
const aedBoxPts = (x0, y0, z0, x1, y1, z1) => [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];

// a convex slab from 8 corners (box order): faces turned toward the viewer, shaded by their real normals
function aedSlab(c, m, w = .9) {
  const mid = avg(c), F = [[3, 2, 6, 7], [1, 2, 6, 5], [0, 1, 5, 4], [0, 3, 7, 4], [4, 5, 6, 7], [0, 1, 2, 3]];
  return F.map(q => q.map(i => c[i])).map(q => {
    let n = norm(cross(sub(q[1], q[0]), sub(q[3], q[0])));
    if (dot(n, sub(avg(q), mid)) < 0) n = n.map(v => -v);
    return vis(n) ? shape(q, toneI(n, m), w) : '';
  }).join('');
}

/* ---------- a rescuer: kneeling (or standing, running), arms reaching to their hands ---------- */
function aedArm(S, H, side) {
  let d = sub(H, S), dist = Math.hypot(...d);
  if (dist > 55) { H = S.map((v, i) => v + d[i] * 55 / dist); d = sub(H, S); dist = 55; }
  const dn = norm(d), b0 = [0, side, -.7], pr = dot(b0, dn), b = norm(b0.map((v, i) => v - pr * dn[i]));
  const h = Math.sqrt(Math.max(0, 28 * 28 - (dist / 2) ** 2));
  return { E: S.map((v, i) => (v + H[i]) / 2 + b[i] * h), H };
}
function aedLegs(o, kx, ky) {
  const parts = [];
  if (o.stand) {
    const ph = o.run ? Math.sin(o.phase * 9) : 0;
    [-1, 1].forEach(s => { const sw = ph * s * 16;
      parts.push(rod([kx, ky + s * 7, 82], [kx - 2, ky + s * 7 + sw * .5, 44 + Math.abs(sw) * .3], 6.5, AED_C.legs));
      parts.push(rod([kx - 2, ky + s * 7 + sw * .5, 44], [kx, ky + s * 7 + sw, 3 + Math.max(0, sw * s) * .2], 5.5, AED_C.legs));
      parts.push(box(kx - 4, ky + s * 7 + sw - 4, 0, kx + 9, ky + s * 7 + sw + 4, 6, AED_C.shoe)); });
  } else {
    [-1, 1].forEach(s => {
      parts.push(rod([kx + 1, ky + s * 9, 5.5], [kx - 30, ky + s * 9, 4.5], 5.5, AED_C.legs));
      parts.push(rod([kx + 1, ky + s * 9, 6], [kx - 7, ky + s * 8, 44], 7, AED_C.legs)); });
  }
  return parts.join('');
}
function aedRescuer(o) {
  const [kx, ky] = o.pos, top = o.col, R = { arms: '', hand: [] };
  const hips = o.stand ? [kx, ky, 84] : [kx - 7, ky, 46], TL = o.stand ? 50 : 47;
  const upright = norm(o.stand ? [o.run ? .05 : 0, o.run ? -.12 : 0, 1] : [.14, 0, 1]);
  let body = aedLegs(o, kx, ky) + rod([hips[0], ky - 9, hips[2]], [hips[0], ky + 9, hips[2]], 8.5, AED_C.legs);
  // lean toward the hands until both are within reach
  const hands = o.hands ? [...o.hands].sort((a, b) => a[1] - b[1]) : null;
  let dir = upright;
  if (hands) {
    const want = norm(sub(avg(hands), hips));
    for (let k = 0; k <= 12; k++) {
      dir = norm(aedLerp(upright, want, Math.min(.9, k / 12)));
      const S0 = hips.map((v, i) => v + dir[i] * TL);
      if (hands.every((h, j) => Math.hypot(...sub(h, [S0[0], S0[1] + (j ? 12 : -12), S0[2]])) <= 55)) break;
    }
  }
  const S = hips.map((v, i) => v + dir[i] * TL), head = S.map((v, i) => v + dir[i] * 15), look = o.look || 0;
  body += rod(hips, S, 11, top, toneI, 1.1, 13) + rod([S[0], S[1] - 12, S[2]], [S[0], S[1] + 12, S[2]], 6.5, top);
  R.body = body;
  R.head = aedBall([head[0] - 2.5, head[1] - look * 1.5, head[2] + 1.5], 10, AED_C.hair)
         + aedBall([head[0] + 1.2, head[1] + look * 2.5, head[2] - .8], 8.8, AED_C.skin);
  R.headAt = head;
  // arms: to the hands, or hanging (swinging when running), or resting on the thighs
  const rest = o.stand ? [[S[0] + 3, S[1] - 15, S[2] - 50], [S[0] + 3, S[1] + 15, S[2] - 50]]
                       : [[kx - 1, ky - 9, 26], [kx - 1, ky + 9, 26]];
  if (o.stand && o.run) { const sw = Math.sin(o.phase * 9) * 14; rest[0][1] += sw; rest[1][1] -= sw; rest[0][0] += 8; rest[1][0] += 8; }
  const targ = hands || rest;
  [-1, 1].forEach((side, j) => {
    const Sh = [S[0], S[1] + side * 12, S[2]], { E, H } = aedArm(Sh, targ[j], side);
    R.arms += rod(Sh, E, 4.8, top) + rod(E, H, 4.2, AED_C.skin) + aedBall(H, 4.6, AED_C.skin, .9);
    R.hand.push(H);
  });
  if (o.carry) { const h = R.hand[0];
    R.arms += aedSlab(aedBoxPts(h[0] - 7, h[1] - 26, h[2] - 30, h[0] + 7, h[1] + 8, h[2] - 2), AED_C.aed); }
  return R;
}

/* ---------- the person on the floor ---------- */
function aedPatient(L) {
  const j = L.jerk * 3, top = 22 - 6 * L.dip, x = 100;
  let s = '';
  [-1, 1].forEach(sd => { s += rod([x + sd * 9, 112, 8 + j], [x + sd * 10, 30, 6.5 + j * .4], 7.5, AED_C.trousers)
    + box(x + sd * 10 - 5.5, 14, 0, x + sd * 10 + 5.5, 30, 13, AED_C.shoe); });
  s += box(83, 98, j * .5, 117, 126, 15 + j, AED_C.trousers);
  // the far arm (behind the torso), the torso, the near arm
  s += rod([81, 184, 11 + j], [75, 152, 6], 5.5, AED_C.shirt) + rod([75, 152, 6], [71, 124, 5], 4.6, AED_C.skin) + aedBall([71, 120, 5], 4.6, AED_C.skin, .8);
  // the torso: a rounded body swept along y, with its shoulder end facing the viewer
  const prof = rrUV(81, j * .5, 119, top + j, 7), ringA = on(PY(122), prof), ringB = on(PY(190), prof);
  s += loft(ringA, ringB, n => toneI(n, AED_C.shirt)) + shape(ringB, toneI([0, 1, 0], AED_C.shirt), 1) + hullInk([...ringA, ...ringB], 1.6);
  if (L.shirt > 0) {                        // the shirt opens over the chest: skin between the two halves
    const w = 12 * L.shirt, zt = top + j;
    s += shape(on(PZ(zt + .05), rectUV(x - w, 130, x + w, 189)), AED_C.skin.l, .8);
    s += line([[x - w, 130, zt + .1], [x - w, 189, zt + .1]], 1.6) + line([[x + w, 130, zt + .1], [x + w, 189, zt + .1]], 1.6);
  }
  s += rod([119, 184, 11 + j], [134, 152, 6], 5.5, AED_C.shirt) + rod([134, 152, 6], [141, 126, 5], 4.6, AED_C.skin) + aedBall([142, 122, 5], 4.6, AED_C.skin, .8);
  s += rod([x, 189, 10 + j], [x, 199, 10 + j], 5.2, AED_C.skin);
  // the head: hair toward the crown, the face up; tilted back for the airway
  const t = L.headTilt;
  s += aedBall([x, 210.5, 10 + j], 11.4, AED_C.hair) + aedBall([x, 206 + 1.5 * t, 12.5 + j], 10.4, AED_C.skin);
  const [nX, nY] = P(x, 203 + 3 * t, 22.5 + j);
  s += `<ellipse cx="${f(nX)}" cy="${f(nY)}" rx="2.4" ry="1.8" fill="${AED_C.skin.m}" stroke="${INK}" stroke-width=".7"/>`;
  return s;
}

/* ---------- pads, cables, plug ---------- */
function aedPadFlat(c) {
  const [x, y, z] = c;
  return shape(on(PZ(z + .3), rrUV(x - 6, y - 8, x + 6, y + 8, 2)), AED_C.pad.l, 1) + fill(pd(on(PZ(z + .4), ellUV(x, y, 3.6, 5, 16))), '#d9d4c6');
}
const aedPadSide = () => shape(on(PX(119.6), rrUV(158, 4.5, 174, 18.5, 2)), AED_C.pad.l, 1) + fill(pd(on(PX(119.7), ellUV(166, 11.5, 5, 4, 16))), '#d9d4c6');
function aedCable(pts) {
  const d = pd(pts, false);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#e98a3c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function aedPadsAndCables(L) {
  const top = 22 - 6 * L.dip + L.jerk * 3, plug = aedPlugPos(L.plug), hub = [108, 238, 1.6];
  const cable = (from, via) => aedCable([from, ...via, hub, [plug[0] + 4, plug[1] - 1, 2.5], [plug[0] + 8, plug[1], plug[2]]]);
  let s = '';
  if (L.pad1 > 0) { const p = L.pad1 >= 1 ? [89, 180, top] : aedPadPos(1, L.pad1);
    s += cable([p[0], p[1] + 7, p[2]], L.pad1 >= 1 ? [[88, 194, top * .6], [90, 216, 2.5]] : []) + aedPadFlat(p); }
  if (L.pad2 > 0) { const p = L.pad2 >= 1 ? [119.5, 166, 13] : aedPadPos(2, L.pad2);
    s += cable(L.pad2 >= 1 ? [120, 173, 8] : [p[0], p[1] + 7, p[2]], L.pad2 >= 1 ? [[124, 196, 2.5], [120, 224, 2]] : []);
    s += L.pad2 >= 1 ? aedPadSide() : aedPadFlat(p); }
  if (L.pad1 > 0 || L.pad2 > 0) s += aedSlab(aedBoxPts(plug[0], plug[1] - 2.5, plug[2] - 2.5, plug[0] + 9, plug[1] + 2.5, plug[2] + 2.5), AED_C.panel);
  return s;
}

// pads and cables, when the picture does not already show them
function aedPadsCode(L, lay) {
  if (AED_SPR_PADS[lay.people]) return '';
  const show = lay.people === 'A8' || L.key === 'shock' || L.key === 'next';
  if (!show) return '';
  let s = aedPadFlat([89, 180, 22]) + aedPadSide();
  return s;
}

// pads in pictures that do not show them (A8), and the cables from the pads to the AED's socket
function aedPadsSprite(L, lay) {
  const pads = AED_PADS[lay.people];
  const showPads = pads && (L.key === 'analyse' || L.key === 'clear' || L.key === 'shock' || L.key === 'next' || L.key === 'plug' || L.key === 'chest2' || (L.key === 'pad2' && L.u > .5));
  if (!pads) return '';
  let s = '';
  if (L.aedHere && showPads) {
    const sock = aedAt(aedAedPoint('socket', lay.helper)), plugIn = L.key !== 'plug' || L.u > .6;
    pads.forEach(p => { const a = aedAt(p), mid = [(a[0] + sock[0]) / 2, Math.max(a[1], sock[1]) + 14];
      const end = plugIn ? sock : [sock[0] + 14, sock[1] + 6];
      s += `<path d="M${f(a[0])} ${f(a[1])}Q${f(mid[0])} ${f(mid[1])} ${f(end[0])} ${f(end[1])}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
        + `<path d="M${f(a[0])} ${f(a[1])}Q${f(mid[0])} ${f(mid[1])} ${f(end[0])} ${f(end[1])}" fill="none" stroke="#e98a3c" stroke-width=".8" stroke-linecap="round"/>`; });
    if (!plugIn) { const e = [sock[0] + 14, sock[1] + 6]; s += `<rect x="${f(e[0] - 2.5)}" y="${f(e[1] - 1.8)}" width="5" height="3.6" rx=".8" fill="#3d3935" stroke="${INK}" stroke-width=".5"/>`; }
  }
  if (lay.people === 'A8') {         // A8 shows the bare chest without pads: draw them where C17/B7 show them
    const pad = ([x, y], rot) => { const [X, Y] = aedAt([x, y]); return `<rect x="${f(X - 4.6)}" y="${f(Y - 3.4)}" width="9.2" height="6.8" rx="1.2" fill="#f7f5ee" stroke="${INK}" stroke-width=".6" transform="rotate(${rot} ${f(X)} ${f(Y)})"/>`; };
    s += pad(pads[0], -28) + pad(pads[1], 20);
  }
  return s;
}
function aedShockBolt2(a, b, now) {
  const n = 7, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, jit = i % n ? Math.sin(now * 60 + i * 2.1) * 2.5 : 0; pts.push([a[0] + (b[0] - a[0]) * t + jit, a[1] + (b[1] - a[1]) * t - jit * .6]); }
  const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  return `<path d="${d}" fill="none" stroke="#ffe066" stroke-width="4" opacity=".6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fffbe0" stroke-width="1.4" stroke-linecap="round"/>`;
}
function aedTimer2([X0, Y0], t) {
  const k = INK_K, X = X0 - 46 * k, Y = Y0 + 16 * k, r = 9 * k, c = 2 * Math.PI * r, left = Math.ceil(AED.NUM.breathCheckMax * (1 - t));
  return `<g><circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="#fffdf6" stroke="${INK}" stroke-width="1.1"/>`
    + `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="none" stroke="var(--accent,#f4b829)" stroke-width="${f(2.6 * k)}" stroke-dasharray="${f(c * (1 - t))} ${f(c)}" transform="rotate(-90 ${f(X)} ${f(Y)})"/>`
    + `<text x="${f(X)}" y="${f(Y + 3 * k)}" font-size="${f(8 * k)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" fill="${INK}">${left} s</text></g>`;
}

/* ---------- the AED ---------- */
function aedLidCorners(open) {
  const a = AEDB, ang = open * 110 * Math.PI / 180, W = a.x1 - a.x0, H = a.lidH;
  const R = (dx, y, dz) => [a.x0 + dx * Math.cos(ang) - dz * Math.sin(ang), y, a.h + dx * Math.sin(ang) + dz * Math.cos(ang)];
  return [R(0, a.y0, 0), R(W, a.y0, 0), R(W, a.y1, 0), R(0, a.y1, 0), R(0, a.y0, H), R(W, a.y0, H), R(W, a.y1, H), R(0, a.y1, H)];
}
function aedHeartMark(cx, cy, r, plane) {
  const pts = Array.from({ length: 28 }, (_, k) => { const t = k / 28 * 2 * Math.PI;
    return [cx - r * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16, cy - r * Math.pow(Math.sin(t), 3)]; });
  const bolt = [[cx + r * .55, cy + r * .05], [cx - r * .05, cy + r * .35], [cx - r * .05, cy - r * .05], [cx - r * .6, cy + r * .1], [cx + r * .1, cy - r * .35], [cx + r * .1, cy + .05 * r]];
  return fill(pd(on(plane, pts)), '#ffffff') + fill(pd(on(plane, bolt)), '#2f9e5b');
}
const aedBadgeZ = (x, y, z, num, on1) => fill(pd(on(PZ(z), ellUV(x, y, 3.6, 3.6, 18))), on1 ? 'var(--accent,#f4b829)' : INK)
  + aedTxZ(x + 1.4, y, z + .05, String(num), 4, on1 ? INK : '#fbf7ea');
function aedBadgeAt(c, num, on1) { const [X, Y] = P(...c);
  return `<circle cx="${f(X)}" cy="${f(Y)}" r="5.4" fill="${on1 ? 'var(--accent,#f4b829)' : INK}" stroke="${INK}" stroke-width="1"/><text x="${f(X)}" y="${f(Y + 2.3)}" font-size="6.4" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" fill="${on1 ? INK : '#fbf7ea'}">${num}</text>`; }
// printed on the top panel beside a button, like a real AED
function aedPanelPrint(x, y, text, num, lit) {
  const on1 = AED.STATIONS[num - 1].key === lit, z = AEDB.h + .1;
  return aedTxZ(x, y, z, text, 3.8, on1 ? '#ffd36a' : '#ffffff') + aedBadgeZ(x, y + text.length * 1.4 + 4.5, z, num, on1);
}
// tape on the AED's near face (x = x1) or left side face (y = y1)
function aedFaceTape(yc, text, num, on1) {
  const x1 = AEDB.x1, w = text.length * 2.7 + 4;
  return shape(on(PX(x1 + .2), rrUV(yc - w / 2, 2, yc + w / 2, 9, 1.2)), on1 ? 'var(--accent,#f4b829)' : '#fbf7ea', .8)
    + tx(x1 + .3, yc, 3.6, text, 4.6, INK, 800)
    + shape(on(PX(x1 + .25), ellUV(yc + w / 2 + 3.6, 5.5, 3.3, 3.3, 16)), INK, 0) + tx(x1 + .35, yc + w / 2 + 3.6, 4, String(num), 4, '#fbf7ea', 800);
}
function aedSideTape(text, num, on1) {
  const a = AEDB, xc = 56, w = text.length * 2.7 + 4;
  return shape(on(PY(a.y1 + .2), rrUV(xc - w / 2, 2, xc + w / 2, 9, 1.2)), on1 ? 'var(--accent,#f4b829)' : '#fbf7ea', .8)
    + txY(xc, a.y1 + .3, 3.6, text, 4.4, INK, 800)
    + shape(on(PY(a.y1 + .25), ellUV(xc + w / 2 + 4, 5.5, 3.3, 3.3, 16)), INK, 0) + txY(xc + w / 2 + 4, a.y1 + .35, 4, String(num), 4, '#fbf7ea', 800);
}
function aedScreenText(L, z) {
  const words = L.screen.replace(/\.$/, '').split(' '), lines = [''];
  words.forEach(w => { const t = (lines[lines.length - 1] + ' ' + w).trim(); if (t.length > 13) lines.push(w); else lines[lines.length - 1] = t; });
  let s = lines.slice(0, 4).map((t, k) => aedTxPlane([43 + k * 3.6, 245.5, z + .1], [0, -1, 0], [1, 0, 0], t, 3, '#9ff0b8', 700)).join('');
  if (L.analyseBar > 0 && L.analyseBar < 1) s += fill(pd(on(PZ(z + .1), rectUV(55, 230, 56.2, 230 + 31 * L.analyseBar))), '#9ff0b8');
  if (L.chargeBar > 0 && L.chargeBar < 1) s += fill(pd(on(PZ(z + .1), rectUV(55, 230, 56.2, 230 + 31 * L.chargeBar))), '#ffd36a');
  if (L.countdown != null) s += aedTxPlane([56.5, 245.5, z + .1], [0, -1, 0], [1, 0, 0], AED.mmss(L.countdown), 3.2, '#ffd36a', 800);
  return s;
}
function aedDevice(L, lit, now) {
  const a = AEDB, z = a.h + .05;
  let s = box(a.x0, a.y0, 0, a.x1, a.y1, a.h, AED_C.aed, toneI, 1.1);
  // the top panel (seen once the lid is up): screen, ON, SHOCK
  s += shape(on(PZ(z), rrUV(a.x0 + 3, a.y0 + 3, a.x1 - 3, a.y1 - 3, 3)), AED_C.panel.l, .8);
  s += shape(on(PZ(z + .05), rrUV(40, 229, 57, 262, 2)), L.on ? '#203a2c' : '#2a2725', .8);
  if (L.on) s += aedScreenText(L, z);
  const btn = (c, r, col, glow) => cyl(c[0], c[1], z, z + 1.4, r, matOf(col), toneI, .9, 20)
    + (glow ? `<circle cx="${f(P(c[0], c[1], z + 1.4)[0])}" cy="${f(P(c[0], c[1], z + 1.4)[1])}" r="${f(r * 1.9)}" fill="none" stroke="${glow}" stroke-width="2" opacity=".85"/>` : '');
  const blink = L.shockReady && Math.sin(now * 14) > 0;
  s += btn(a.on, 3.6, L.on ? '#5fe08a' : '#3f9a5c', L.on && lit === 'power' ? '#ffd36a' : '');
  s += btn(a.shock, 4.4, blink ? '#ffd36a' : '#f08c00', blink ? '#ffd36a' : '');
  s += aedPanelPrint(a.on[0] + 7.5, a.on[1], 'ON', 9, lit) + aedPanelPrint(a.shock[0] + 8, a.shock[1], 'SHOCK', 16, lit);
  // the socket on the near face, the screen's two names on tapes
  s += fill(pd(on(PX(a.x1 + .1), ellUV(a.socket[1], a.socket[2], 3, 3, 16))), '#1d1b19');
  s += aedFaceTape(232, 'PLUG', 13, lit === 'plug') + aedFaceTape(257, 'ANALYSING', 14, lit === 'analyse');
  s += aedSideTape('NEXT CHECK', 18, lit === 'next');
  // the lid
  s += aedSlab(aedLidCorners(L.lid), AED_C.aed, 1.1);
  if (L.lid < .2) {
    const plane = ([u, v]) => [u, v, a.h + a.lidH + .05];
    s += aedHeartMark(56, 244, 9, plane) + aedTxZ(72, 246, a.h + a.lidH + .1, 'LID', 5.4, '#ffffff') + aedBadgeZ(72, 235, a.h + a.lidH + .1, 8, lit === 'lid');
  } else if (L.lid > .55) {
    // the inside of the lid: the pad packet (opened at BARE CHEST) and the LID number
    const P3 = (d, y) => aedLidPoint(L.lid, d, y - a.y0), q = [P3(8, 228), P3(36, 228), P3(36, 260), P3(8, 260)];
    s += shape(q, L.packet > .5 ? '#d8e6ea' : '#eef3f4', .9);
    if (L.packet < 1) s += aedTxPlane(P3(24, 244), [0, -1, 0], norm(sub(P3(30, 244), P3(24, 244))), 'PADS', 4.6, INK, 800);
    s += aedBadgeAt(P3(40, 262), 8, lit === 'lid');
  }
  return s;
}

/* ---------- the phone ---------- */
function aedPhone(L, now) {
  const [x, y] = AED_PHONE;
  let s = box(x - 8, y - 15, 0, x + 8, y + 15, 1.6, AED_C.phone, toneI, 1);
  s += shape(on(PZ(1.65), rrUV(x - 6.5, y - 13, x + 6.5, y + 13, 1.5)), L.phoneOn ? '#2b6e4a' : '#1d2129', .6);
  if (L.phoneOn) {
    s += aedTxZ(x - 1, y, 1.7, '108 / 112', 4.4, '#d8ffe4') + aedTxZ(x + 4, y, 1.7, 'SPEAKER ON', 2.6, '#9fe0b8', 700);
    const k = (now * 1.5) % 1;
    [0, .5].forEach(o => { const r = 6 + ((k + o) % 1) * 12;
      s += `<path d="${pd(on(PZ(2), arcUV(x, y + 15, r, 200, 340, 10)), false)}" fill="none" stroke="#2b6e4a" stroke-width="1.4" opacity="${f(1 - (k + o) % 1)}"/>`; });
  }
  return s;
}

/* ---------- station tapes on the mat ---------- */
function aedTape(key, lit) {
  const s0 = AED.STATIONS[AED.IDX[key]], [x, y] = AED_TAPES[key], z = AED_MAT.h + .05, fs = 8.4;
  const lines = s0.lines, two = lines.length > 1, w = Math.max(...lines.map(t => t.length)) * fs * .63 + 12, h = two ? 25 : 15;
  let s = shape(on(PZ(z), rrUV(x - h / 2, y - w / 2, x + h / 2, y + w / 2, 2)), lit ? 'var(--accent,#f4b829)' : '#fbf7ea', 1.1);
  lines.forEach((t, k) => { s += aedTxZ(x + (two ? (k ? 8.2 : -2.2) : 3), y + 4, z + .05, t, fs); });
  s += fill(pd(on(PZ(z + .05), ellUV(x - h / 2 + 1, y + w / 2 - 1, 6, 6, 18))), INK) + aedTxZ(x - h / 2 + 3.2, y + w / 2 - 1, z + .1, String(s0.num), 6.2, '#fbf7ea');
  return act('station', s, `data-i="${s0.num - 1}"`);
}

/* ---------- speech bubbles, the active ring, the timer, the shock, swap ---------- */
function aedBubble(p3, text, accent) {
  const k = INK_K, [X, Y] = p3.length === 2 ? p3 : P(...p3), fs = 9 * k, w = text.length * fs * .56 + fs * 1.6, h = fs * 2, bx = X - w * .3, by = Y - h - 12 * k;
  return `<g class="bubble"><path d="M${f(X)} ${f(Y - 2 * k)}L${f(bx + w * .22)} ${f(by + h - 1)}L${f(bx + w * .4)} ${f(by + h - 1)}Z" fill="#fffdf6" stroke="${INK}" stroke-width="1.1"/>`
    + `<rect x="${f(bx)}" y="${f(by)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="${accent ? '#fff2c6' : '#fffdf6'}" stroke="${INK}" stroke-width="1.2"/>`
    + `<text x="${f(bx + w / 2)}" y="${f(by + h / 2 + fs * .36)}" font-size="${f(fs)}" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="700" fill="${INK}">${text}</text></g>`;
}
function aedRing(p3) { const [X, Y] = p3.length === 2 ? p3 : P(...p3);
  const R = Math.max(15 * INK_K, 9); return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(R)}" fill="none" stroke="var(--accent,#f4b829)" stroke-width="${f(Math.max(2.6 * INK_K, 1.3))}" stroke-dasharray="${f(R * .27)} ${f(R * .2)}"/>`; }
function aedShockBolt(now) {
  const a = P(89, 180, 23), b = P(119.6, 166, 12), n = 7, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, jit = i % n ? Math.sin(now * 60 + i * 2.1) * 6 : 0;
    pts.push([a[0] + (b[0] - a[0]) * t + jit, a[1] + (b[1] - a[1]) * t - jit * .6]); }
  const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  return `<path d="${d}" fill="none" stroke="#ffe066" stroke-width="7" opacity=".55" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fffbe0" stroke-width="2.4" stroke-linecap="round"/>`;
}
function aedTimer(p3, t) {
  const [X0, Y0] = P(...p3), k = INK_K, X = X0 + 26 * k, Y = Y0 - 14 * k, r = 11 * k, c = 2 * Math.PI * r, left = Math.ceil(AED.NUM.breathCheckMax * (1 - t));
  return `<g><circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="#fffdf6" stroke="${INK}" stroke-width="1.1"/>`
    + `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="none" stroke="var(--accent,#f4b829)" stroke-width="${f(3 * k)}" stroke-dasharray="${f(c * (1 - t))} ${f(c)}" transform="rotate(-90 ${f(X)} ${f(Y)})"/>`
    + `<text x="${f(X)}" y="${f(Y + 3.4 * k)}" font-size="${f(9 * k)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" fill="${INK}">${left} s</text></g>`;
}
function aedSwap(a3, b3) {
  const [ax, ay] = P(a3[0], a3[1], a3[2] + 26), [bx, by] = P(b3[0], b3[1], b3[2] + 26), k = INK_K, mx = (ax + bx) / 2, my = Math.min(ay, by) - 26 * k;
  const head = (x, y, dx, dy) => { const l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, s = 6 * k;
    return `<path d="M${f(x - ux * s - uy * s * .6)} ${f(y - uy * s + ux * s * .6)}L${f(x)} ${f(y)}L${f(x - ux * s + uy * s * .6)} ${f(y - uy * s - ux * s * .6)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`; };
  return `<path d="M${f(ax)} ${f(ay)}Q${f(mx)} ${f(my)} ${f(bx)} ${f(by)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`
    + head(bx, by, bx - mx, by - my) + head(ax, ay, ax - mx, ay - my)
    + `<text x="${f(mx)}" y="${f(my + 2 * k)}" font-size="${f(9 * k)}" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" fill="${INK}">swap</text>`;
}

function aedSwap2(a, b) {
  const k = INK_K, mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 22 * k;
  return `<path d="M${f(a[0])} ${f(a[1])}Q${f(mx)} ${f(my)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="4 3"/>`
    + `<text x="${f(mx)}" y="${f(my + 2 * k)}" font-size="${f(9 * k)}" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" fill="${INK}">swap</text>`;
}

/* ---------- where things are ---------- */
function aedHandsA(L) {
  const top = 22 - 6 * L.dip + L.jerk * 3;
  switch (L.A.mode) {
    case 'shoulders': return [[84 + L.A.shake * 2, 186, 22], [116 + L.A.shake * 2, 186, 22]];
    case 'airway': return [[100, 199, 19], [100, 214, 21]];
    case 'point': return [[60, 120, 70], [55, 171, 26]];
    case 'compress': return [[100, 158.5, top + 2.5], [100, 161.5, top + 4.5]];
    case 'breath': return [[100, 158.5, top + 9], [100, 161.5, top + 11]];
    case 'handsup': return [[68, 146, 112], [68, 178, 112]];
    default: return null;
  }
}
function aedAnchor(key, L, A, B, lay) {
  const a = AEDB;
  switch (key) {
    case 'lid': { const o = P(0, 0, 0); return L.aedHere ? [-205.4 + o[0], 172.3 + o[1]] : (B && B.headAt2) || B.headAt; }   // the illustrated lid, lying open
    case 'power': return [...a.on, a.h + 2];
    case 'shock': return [...a.shock, a.h + 2];
    case 'plug': return a.socket;
    case 'analyse': case 'next': return [...a.screen, a.h + 1];
    case 'safe': return A.headAt2 || A.headAt;
    case 'call': return [...AED_PHONE, 2];
    case 'helper': return B && B.headAt2 ? B.headAt2 : AED.STATIONS[AED.IDX.helper].at;
    case 'clear': return B && B.headAt2 ? B.headAt2 : [26, 214, 70];
    default: return AED.STATIONS[AED.IDX[key]].at;
  }
}
function aedBubbleAt(who, A, B, lay) {
  if (who === 'A') return A.headAt2 || [A.headAt[0], A.headAt[1], A.headAt[2] + 10];
  if (who === 'B') return B && B.headAt2 ? B.headAt2 : [26, 214, 90];
  if (who === 'phone') return [...AED_PHONE, 4];
  if (who === 'mouth') return [100, 201, 26];
  return [AEDB.screen[0], AEDB.screen[1], AEDB.h + 18];
}

/* ---------- the whole scene, back to front ---------- */
function aedScene(st, now) {
  const L = aedLook(st, now), lit = st.busy || st.u > 0 ? L.key : '', F = AED_FLOOR, M = AED_MAT;
  let s = `<defs><filter id="aedShadow" x="-10%" y="-10%" width="130%" height="130%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .26  0 0 0 0 .4  0 0 0 1 0"/><feOffset dx="5" dy="3"/><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
  s += board(F.x0, F.y0, F.x1, F.y1, 1.2, 6, AED_C.floor);
  for (let x = F.x0 + 24; x < F.x1; x += 24) s += line([[x, F.y0 + 1, 1.25], [x, F.y1 - 1, 1.25]], .45);
  s += box(M.x0, M.y0, 1.2, M.x1, M.y1, M.h, AED_C.mat, toneI, 1);

  // tapes lie under everything that stands
  Object.keys(AED_TAPES).forEach(k => { s += aedTape(k, lit === k); });
  if (L.scan >= 0) s += `<path d="${pd(on(PZ(M.h + .2), arcUV(90, 150, 75, -40, -40 + 360 * L.scan, 40)), false)}" fill="none" stroke="var(--accent,#f4b829)" stroke-width="2.4" stroke-dasharray="6 5"/>`;
  // the people are illustrations (aed-sprites.js); the code skeletons below are kept only as anchors
  const A = aedRescuer({ pos: AED.WORLD.rescuerA.knees, col: AED_C.A, hands: aedHandsA(L), look: L.A.look });
  const B = L.B.show ? aedRescuer({ pos: L.B.pos, col: AED_C.B, stand: L.B.stand, run: L.B.run, phase: now, hands: L.Bhands, carry: L.B.carry }) : null;
  const lay = aedSpriteLayers(L, now), helper = lay.helper ? act('station', aedSpriteImg(lay.helper, { at: lay.helperAt, opacity: lay.fade }), `data-k="${AED_SPR_HAS_AED.has(lay.helper) ? 'aed' : 'helper'}"`) : '';
  // soft shadows that follow each figure: the picture itself, darkened, blurred and nudged down-right on the floor
  s += `<g opacity=".3" filter="url(#aedShadow)">${aedSpriteImg(lay.people)}${lay.a1 ? aedSpriteImg('A1') : ''}${lay.helper ? aedSpriteImg(lay.helper, { at: lay.helperAt }) : ''}</g>`;
  if (lay.aedCode) s += act('station', aedSpriteAED(false), 'data-k="aed"');
  if (!lay.front) s += helper + (lay.helper ? aedB8Cover(lay.helper, L.key) : '') + (lay.helper === 'B5idle' && !L.on ? aedScreenOff() : '');
  if (lay.a1) s += act('station', aedSpriteImg('A1'), 'data-k="rescuerA"');
  s += act('station', aedSpriteImg(lay.people, { jerk: L.jerk }), 'data-k="body"');
  s += aedPadsSprite(L, lay);
  if (lay.front) s += helper;
  s += act('station', aedPhone(L, now), 'data-k="phone"');
  const pads = AED_PADS[lay.people] || [];
  if (L.flash > 0 && pads.length === 2) s += aedShockBolt2(aedAt(pads[0]), aedAt(pads[1]), now);
  const hd = AED_HEAD[lay.people] || {}, hb = lay.helper && AED_HEAD[lay.helper] ? AED_HEAD[lay.helper].B : null;
  const headA = lay.a1 ? aedAt(AED_HEAD.A1.A) : hd.A ? aedAt(hd.A) : aedSpriteTop(lay.people);
  const headB = hd.B ? aedAt(hd.B) : hb ? aedAt(hb) : lay.helper ? aedSpriteTop(lay.helper, { at: lay.helperAt }) : null;
  A.headAt2 = headA; if (B) B.headAt2 = headB;
  if (L.A.mode === 'handsup') s += aedBubble(headA, 'Hands off', true);
  if (L.airwayRing >= 0) s += aedTimer2(aedAt(AED_RING.airway), L.airwayRing);
  if (L.swap && headB) s += aedSwap2(headA, headB);
  if (lit) {
    const onHead = h => h && [h[0], h[1] + 7 * INK_K];
    const k = L.key, r = k === 'safe' ? onHead(headA) : (k === 'helper' || k === 'clear') ? onHead(headB) : k === 'call' ? P(...AED_PHONE, 2)
      : k === 'plug' ? aedAt(aedAedPoint('socket', lay.helper)) : (k === 'analyse' || k === 'next') ? aedAt(aedAedPoint('screen', lay.helper))
      : AED_RING[k] ? aedAt(AED_RING[k]) : null;
    if (r) s += aedRing(r);
    var focus = r;
  }
  if (L.bubble) {
    const w = L.bubble.who, at = w === 'A' ? headA : w === 'B' ? headB : w === 'phone' ? P(...AED_PHONE, 4) : w === 'mouth' ? aedAt(AED_MOUTH[lay.people] || [-92, 113]) : aedAt(aedAedPoint('screen', lay.helper));
    if (at) s += aedBubble(at, L.bubble.text, w === 'AED');
  }
  // ?grid=1: a grid in sprite units (the AED_SPR coordinates), for measuring anchors on the illustrations
  if (new URLSearchParams(location.search).get('grid') === '1') {
    const o = P(0, 0, 0); let g = '';
    for (let x = -300; x <= 200; x += 10) g += `<path d="M${f(x + o[0])} ${f(-130 + o[1])}V${f(260 + o[1])}" stroke="${x % 50 ? '#ff9a9a' : '#d00'}" stroke-width="${x % 50 ? .15 : .35}"/>` + (x % 50 ? '' : `<text x="${f(x + o[0] + .5)}" y="${f(-126 + o[1])}" font-size="4" fill="#d00">${x}</text>`);
    for (let y = -130; y <= 260; y += 10) g += `<path d="M${f(-300 + o[0])} ${f(y + o[1])}H${f(200 + o[0])}" stroke="${y % 50 ? '#9a9aff' : '#00d'}" stroke-width="${y % 50 ? .15 : .35}"/>` + (y % 50 ? '' : `<text x="${f(-298 + o[0])}" y="${f(y + o[1] - .5)}" font-size="4" fill="#00d">${y}</text>`);
    s += `<g pointer-events="none">${g}</g>`;
  }
  // the phone camera's focus: the active ring, or the middle of the people picture
  const pp = AED_SPR[lay.people], o0 = P(0, 0, 0);
  const camAt = (typeof focus !== 'undefined' && focus) || [pp[0] + pp[2] / 2 + o0[0], pp[1] + pp[3] / 2 + o0[1]];
  return { svg: s, L, A, B, camAt };
}
