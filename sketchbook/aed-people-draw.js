/* AED Bench · Sketchbook: the people's skin. Draws a pose solved by shared/aed-people.js with the sketch engine:
   tapered tubes for limbs and torso (flat colour, a shadow band, one ink outline), clothes, a head with hair and a
   minimal face, and drawn hands. Style target: the figures in ERC Guidelines 2025 Adult BLS (docs/characters-plan.md).
   Every function returns parts { at, svg } so a scene can depth-sort people together with everything else. */

const PPL_ISO = Math.sqrt(1.5);                    // a sphere of radius r projects to a circle of radius r * 1.2247
const PPL_LIGHT = [-.55, -.83];                    // light comes from the upper left of the screen
const PV = AEDPeople.V;
const pplF = v => v.toFixed(2);
const pplTones = hex => ({ l: hex, m: mix(hex, '#1b2a4a', .2), d: mix(hex, '#000000', .38) });
const pplSkin = hex => ({ l: mix(hex, '#ffffff', .06), m: mix(hex, '#4a1e10', .22), d: mix(hex, '#000000', .4) });

/* ---------- tubes: a sweep of elliptical sections, outlined by its silhouette ---------- */
function pplRing(c, u, v, a, b, n = 18) {
  return Array.from({ length: n }, (_, k) => { const t = k / n * 2 * Math.PI, ca = Math.cos(t) * a, sb = Math.sin(t) * b;
    return [c[0] + u[0] * ca + v[0] * sb, c[1] + u[1] * ca + v[1] * sb, c[2] + u[2] * ca + v[2] * sb]; });
}
const pplPath = pts => 'M' + pts.map(q => pplF(q[0]) + ' ' + pplF(q[1])).join('L') + 'Z';
// sections: [{ c, u, v, a, b }] in order along the tube; mat: { l, m, d }
function pplTube(secs, mat, w = 1.15) {
  const C = secs.map(s => P(...s.c)), R = secs.map(s => pplRing(s.c, s.u, s.v, s.a, s.b).map(q => P(...q)));
  const span = Math.hypot(C[C.length - 1][0] - C[0][0], C[C.length - 1][1] - C[0][1]);
  const maxR = Math.max(...secs.map(s => Math.max(s.a, s.b))) * PPL_ISO;
  if (span < maxR * .35) {                         // seen end-on: just the outline of all the rings
    const h = hull(R.flat());
    return fill(sp(h), mat.l) + ink(sp(h), w);
  }
  const left = [], right = [], inner = [];
  let shadowIsLeft = null;
  for (let i = 0; i < secs.length; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(secs.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const n = [-dy, dx], score = q => (q[0] - C[i][0]) * n[0] + (q[1] - C[i][1]) * n[1];
    let lo = R[i][0], hi = R[i][0];
    for (const q of R[i]) { if (score(q) > score(hi)) hi = q; if (score(q) < score(lo)) lo = q; }
    left.push(hi); right.push(lo);
    if (shadowIsLeft === null) shadowIsLeft = n[0] * PPL_LIGHT[0] + n[1] * PPL_LIGHT[1] < 0;
  }
  // the end caps: the half of each end ring that lies beyond the tube
  const cap = (i, dir) => {
    const ring = R[i], c = C[i], j = Math.min(secs.length - 1, Math.max(0, i + dir)), ax = [c[0] - C[j][0], c[1] - C[j][1]];
    return ring.filter(q => (q[0] - c[0]) * ax[0] + (q[1] - c[1]) * ax[1] > 0)
      .sort((p, q) => Math.atan2(p[1] - c[1], p[0] - c[0]) - Math.atan2(q[1] - c[1], q[0] - c[0]));
  };
  const orderCap = (pts, from, c) => {           // walk the cap from the `from` side
    if (pts.length < 2) return pts;
    const d0 = Math.hypot(pts[0][0] - from[0], pts[0][1] - from[1]), d1 = Math.hypot(pts[pts.length - 1][0] - from[0], pts[pts.length - 1][1] - from[1]);
    return d0 <= d1 ? pts : pts.slice().reverse();
  };
  const last = secs.length - 1;
  const outline = [...left, ...orderCap(cap(last, -1), left[last], C[last]), ...right.slice().reverse(), ...orderCap(cap(0, 1), right[0], C[0])];
  const shade = shadowIsLeft ? left : right, other = shadowIsLeft ? right : left;
  for (let i = 0; i < secs.length; i++) inner.push([shade[i][0] + (other[i][0] - shade[i][0]) * .3, shade[i][1] + (other[i][1] - shade[i][1]) * .3]);
  const band = [...shade, ...inner.slice().reverse()];
  return fill(pplPath(outline), mat.l) + fill(pplPath(band), mat.m, 'opacity=".9"')
    + `<path d="${pplPath(outline)}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
}
// a limb from a to b, radius ra to rb, ends rounded
function pplLimb(a, b, ra, rb, mat, w = 1.1, round = [true, true]) {
  const t = PV.norm(PV.sub(b, a)), u = PV.norm(PV.perp(Math.abs(t[2]) < .9 ? [0, 0, 1] : [1, 0, 0], t)), v = PV.cross(t, u);
  const S = (c, r) => ({ c, u, v, a: r, b: r }), at = (p, k) => PV.add(p, PV.mul(t, k));
  const secs = [];
  if (round[0]) secs.push(S(at(a, -ra * .82), ra * .45), S(at(a, -ra * .45), ra * .86));
  secs.push(S(a, ra), S(PV.lerp(a, b, .5), (ra + rb) / 2), S(b, rb));
  if (round[1]) secs.push(S(at(b, rb * .45), rb * .86), S(at(b, rb * .82), rb * .45));
  return pplTube(secs, mat, w);
}
const pplBall = (c, r, mat, w = 1.1) => { const [X, Y] = P(...c), R = r * PPL_ISO;
  return `<circle cx="${pplF(X)}" cy="${pplF(Y)}" r="${pplF(R)}" fill="${mat.l}" stroke="${INK}" stroke-width="${w}"/>`; };
// a stroke along 3D points (fold lines, seams, faces)
const pplLine = (pts, w = .8, col = INK, extra = '') => `<path d="${pd(pts, false)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

/* ---------- the torso: hips, waist, chest, shoulders; trousers below the waist, the top above ---------- */
function pplTorso(p, opt) {
  const { J, D, body, cast } = p, s = body.s, u = body.r, v = body.f, T = D.torso;
  const S = (c, [a, b], k = 1) => ({ c, u, v, a: a * k, b: b * k });
  const at = t => PV.add(J.pelvis, PV.mul(s, D.spine * t));
  const low = [S(at(-.16), T.hip, .84), S(at(-.07), T.hip, .97), S(at(0), T.hip), S(at(.2), [(T.hip[0] + T.waist[0]) / 2, (T.hip[1] + T.waist[1]) / 2]), S(at(.38), T.waist)];
  const high = [S(at(.38), T.waist, 1.04), S(at(.56), [(T.waist[0] + T.chest[0]) / 2, (T.waist[1] + T.chest[1]) / 2], 1.03), S(at(.74), T.chest, 1.02),
    S(at(.92), T.shoulder, 1.02), S(at(1.0), T.shoulder, .94), S(at(1.06), T.shoulder, .62)];
  const parts = [{ at: at(.18), svg: pplTube(low, pplTones(cast.bottom), 1.3) }];
  let top = pplTube(high, pplTones(cast.top), 1.35);
  const front = t => { const c = at(t), k = t < .5 ? T.waist[1] : t < .85 ? T.chest[1] : T.shoulder[1]; return PV.add(c, PV.mul(v, k * 1.04)); };
  if (cast.topStyle === 'shirt') {
    const o = opt.shirtOpen || 0;
    if (o > 0) top += pplOpenShirt(p, o, at, front);
    else {
      top += pplLine([front(.42), front(.6), front(.78), front(.95)], .9);                       // the button placket
      [.5, .66, .82].forEach(t => { const [X, Y] = P(...PV.add(front(t), PV.mul(u, 1.6))); top += `<circle cx="${pplF(X)}" cy="${pplF(Y)}" r=".9" fill="${INK}"/>`; });
    }
    top += pplCollar(p, at, 'shirt');
  } else top += pplCollar(p, at, cast.topStyle);
  parts.push({ at: at(.7), svg: top });
  return parts;
}
function pplCollar(p, at, style) {
  const { D, body } = p, c = at(1.04), u = body.r, v = body.f, a = style === 'shirt' ? 6.5 : 6, b = 5;
  const ring = pplRing(c, u, v, a, b, 24).filter((q, k) => true);
  const front = ring.filter(q => PV.dot(PV.sub(q, c), v) > -1);
  let s = `<path d="${pd(front, false)}" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>`;
  if (style === 'shirt') {                         // collar points
    const tip = sd => PV.add(PV.add(at(.93), PV.mul(u, sd * 3.5)), PV.mul(v, D.torso.shoulder[1] * 1.1));
    s += pplLine([PV.add(c, PV.mul(u, -6)), tip(-1), PV.add(c, PV.mul(v, 5))], 1) + pplLine([PV.add(c, PV.mul(u, 6)), tip(1), PV.add(c, PV.mul(v, 5))], 1);
  }
  return s;
}
// the shirt opened over the chest: bare skin between the two halves, the sternum line and nipples (pad landmarks)
function pplOpenShirt(p, o, at, front) {
  const { body, D, cast } = p, u = body.r, half = D.torso.chest[0] * .78 * o, skin = pplSkin(cast.skin);
  const edge = (sd, k) => [.4, .55, .7, .85, .99].map(t => PV.add(front(t), PV.mul(u, sd * half * (t > .9 ? .7 : 1) * k)));
  const L = edge(-1, 1), R = edge(1, 1);
  let s = shape([...L, ...R.slice().reverse()], skin.l, 1.1);
  s += pplLine([front(.62), front(.95)], .8, skin.d, 'opacity=".55"');
  [-1, 1].forEach(sd => { const [X, Y] = P(...PV.add(front(.8), PV.mul(u, sd * 7.5))); s += `<circle cx="${pplF(X)}" cy="${pplF(Y)}" r="1.1" fill="${skin.d}"/>`; });
  s += pplLine(edge(-1, 1.08), 1.6) + pplLine(edge(1, 1.08), 1.6);
  return s;
}

/* ---------- the head: skull, ear, hair, face ---------- */
function pplHead(p) {
  const { J, D, body, cast } = p, R = D.headR, c = J.head, face = body.face, up = body.headUp, rr = PV.norm(PV.cross(face, up));
  const skin = pplSkin(cast.skin), hair = pplTones(cast.hair);
  const surf = (n, k = 1) => PV.add(c, PV.mul(n, R * k));
  const dir = (f, r, u2) => PV.norm(PV.add(PV.add(PV.mul(face, f), PV.mul(rr, r)), PV.mul(up, u2)));
  let s = '';
  // the bun sits behind the head when the back of the head faces away
  const bunAt = PV.add(c, PV.add(PV.mul(face, -R * .78), PV.mul(up, R * .62)));
  const bun = cast.hairStyle === 'bun' ? pplBall(bunAt, R * .4, hair, 1.1) : '';
  const bunBehind = bun && depthOf(bunAt) < depthOf(c);
  if (bunBehind) s += bun;
  s += pplLimb(PV.add(c, PV.mul(up, -R * .1)), PV.add(c, PV.add(PV.mul(up, -R * .78), PV.mul(face, R * .32))), R * .9, R * .5, skin, 1.2, [false, true]);  // jaw and chin
  // the skull in the hair colour, then the face cut back in skin: the visible part of a cap around the face
  const hl = { bun: [.12, .42], crop: [.2, .38], side: [.16, .4] }[cast.hairStyle] || [.15, .4];
  const fc = PV.norm(PV.add(face, PV.mul(up, -hl[1]))), facePts = [];
  for (let i = 0; i < 16; i++) for (let j = 0; j < 32; j++) {
    const th = i / 15 * Math.PI, ph = j / 32 * 2 * Math.PI, n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
    if (n[0] * fc[0] + n[1] * fc[1] + n[2] * fc[2] > hl[0] && vis(n)) facePts.push(P(...surf(n, 1)));
  }
  s += pplBall(c, R * 1.05, hair, 1.25);
  if (facePts.length > 2) { const h = hull(facePts); s += fill(sp(h), skin.l) + `<path d="${sp(h)}" fill="none" stroke="${hair.d}" stroke-width=".6" opacity=".6"/>`; }
  [-1, 1].forEach(sd => { const n = PV.mul(rr, sd); if (vis(n)) s += pplBall(PV.add(c, PV.add(PV.mul(n, R * .98), PV.mul(up, -R * .12))), R * .2, skin, .9); });
  if (cast.hairStyle === 'side') s += pplLine([surf(dir(.55, -.5, .7), 1.06), surf(dir(.25, .1, .97), 1.07), surf(dir(.3, .6, .75), 1.06)], .8, hair.d);
  if (bun && !bunBehind) s += bun;
  // the face: eyes, brows, nose, mouth, only where they face the viewer
  const feat = [];
  [-1, 1].forEach(sd => {
    const e = dir(.9, sd * .36, .12);
    if (!vis(e)) return;
    const eye = surf(e, 1.0), across = PV.mul(rr, 1.6);
    feat.push(cast.eyes === 'closed'
      ? pplLine([PV.sub(eye, across), PV.add(PV.add(eye, PV.mul(up, -.7)), [0, 0, 0]), PV.add(eye, across)], .9)
      : (() => { const [X, Y] = P(...eye); return `<ellipse cx="${pplF(X)}" cy="${pplF(Y)}" rx="1" ry="1.25" fill="${INK}"/>`; })());
    const b = surf(dir(.86, sd * .38, .36), 1.01), tilt = cast.brows === 'focus' ? -sd * .6 : cast.brows === 'up' ? .5 : 0;
    feat.push(pplLine([PV.add(PV.sub(b, PV.mul(rr, 2)), PV.mul(up, tilt)), PV.add(PV.add(b, PV.mul(rr, 2)), PV.mul(up, -tilt))], .95, hair.d));
  });
  const nose = dir(1, 0, -.12);
  if (vis(nose)) feat.push(pplLine([surf(dir(.95, 0, .1), 1.02), surf(nose, 1.1), surf(dir(.97, .08, -.22), 1.02)], .85, skin.d));
  const mouth = dir(.92, 0, -.45);
  if (vis(mouth)) feat.push(pplLine([surf(dir(.9, -.17, -.43)), surf(mouth, 1.01), surf(dir(.9, .17, -.43))], .85, skin.d));
  return s + feat.join('');
}

/* ---------- hands ---------- */
function pplHand(hd, mat, lift = 0) {
  const { h, p, l, side, shape } = hd, W = PV.add(hd.W, [0, 0, lift]), ts = side, S = (c, a, b) => ({ c, u: l, v: p, a, b });
  const at = k => PV.add(W, PV.mul(h, k));
  const len = shape === 'open' ? 17 : shape === 'grip' ? 12 : 16;
  let s = pplTube([S(at(-1.5), 2.6, 1.6), S(at(1.5), 3.8, 1.8), S(at(7), 4.6, 2), S(at(10.5), 4.4, 1.8), S(at(len - 2), 3.6, 1.5), S(at(len), 2.4, 1.1)], mat, 1);
  const thumb = PV.add(at(2.5), PV.mul(l, ts * 3.2));
  s += pplLimb(thumb, PV.add(PV.add(at(shape === 'open' ? 8 : 7.5), PV.mul(l, ts * (shape === 'open' ? 7.5 : 5))), PV.mul(p, -1.2)), 1.7, 1.25, mat, .9);
  if (shape === 'open' || shape === 'upper') [-1.6, 0, 1.6].forEach(o => {      // finger gaps (open hand) or interlaced fingers
    s += pplLine([PV.add(at(shape === 'upper' ? 11 : 12), PV.mul(l, o)), PV.add(at(len - .5), PV.mul(l, o))], .6, mat.d);
  });
  return s;
}

/* ---------- one person, as depth-sortable parts ---------- */
function pplPerson(p, opt = {}) {
  const { J, D, cast, hands } = p, skin = pplSkin(cast.skin), top = pplTones(cast.top), bottom = pplTones(cast.bottom), shoe = pplTones(cast.shoes);
  const L = D.limb, parts = [], sleeveCol = cast.topStyle === 'shirt' || cast.topStyle === 'tee' || cast.topStyle === 'top' ? top : skin;
  ['L', 'R'].forEach(k => {
    const hip = J['hip' + k], knee = J['knee' + k], ankle = J['ankle' + k], toe = J['toe' + k];
    parts.push({ at: PV.lerp(hip, knee, .5), svg: pplLimb(hip, knee, L.thigh[0], L.thigh[1] * 1.04, bottom, 1.2) });
    parts.push({ at: PV.lerp(knee, ankle, .5), svg: pplLimb(knee, ankle, L.shin[0] * 1.06, L.shin[1] * 1.15, bottom, 1.15) });
    parts.push({ at: PV.lerp(ankle, toe, .6), svg: pplLimb(PV.add(ankle, [0, 0, -1]), toe, 4, 3.3, shoe, 1.1) });
    const S = J['shoulder' + k], E = J['elbow' + k], Wr = J['wrist' + k], sl = cast.sleeve;
    const upper = pplLimb(S, E, L.upperArm[0], L.upperArm[1], skin, 1.1) + pplLimb(S, PV.lerp(S, E, sl), L.upperArm[0] * 1.22, L.upperArm[0] * 1.1, sleeveCol, 1.15, [true, false]);
    parts.push({ at: PV.lerp(S, E, .5), svg: upper });
    const hd = hands[k], lift = hd.shape === 'upper' ? 2.4 : 0;
    parts.push({ at: PV.lerp(E, Wr, .5), svg: pplLimb(E, Wr, L.forearm[0], L.forearm[1], skin, 1.05) });
    parts.push({ at: PV.add(Wr, [0, 0, lift + (hd.shape === 'upper' ? 1 : 0)]), svg: pplHand(hd, skin, lift) });
  });
  pplTorso(p, opt).forEach(q => parts.push(q));
  parts.push({ at: PV.lerp(J.chest, J.neck, .6), svg: pplLimb(J.chest, PV.add(J.neck, PV.mul(p.body.headUp, 2)), 5, 4.6, skin, 1.1) });
  parts.push({ at: J.head, svg: pplHead(p) });
  return parts;
}
const pplDraw = (p, opt) => byDepth(pplPerson(p, opt));
