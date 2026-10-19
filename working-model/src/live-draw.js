// Live drawing of the floor: called every frame with one scene (poses.mjs sceneAt) and the
// window state (model windowAt). Inlined after the kit, model, world, figures, poses and P.

const svg = document.querySelector(".wm-fig svg");
const slot = (name) => svg.querySelector(`[data-slot="${name}"]`);
const partEl = (name) => svg.querySelector(`[data-part="${name}"]`);
const SL = Object.fromEntries(["shadows", "b-low", "a-low", "placed", "a-up", "lid-back", "lid-front", "plug", "b-up", "moving", "b-arms", "overlay"].map((n) => [n, slot(n)]));
const PART = Object.fromEntries(["patient", "p-torso", "p-head", "aed", "aed-screen", "aed-on", "aed-shock", "phone", "p-arm-far", "p-arm-near"].map((n) => [n, partEl(n)]));
const SCREEN_TEXT = svg.querySelector('[data-live="screen"]');
const TAPES = [...svg.querySelectorAll(".wm-tape")];
const COL = { shirt: "#5b7fb5", skin: "#c98f6a", hair: "#3a2f2a", aed: "#2f9e5b", lidIn: "#e9efe9", pad: "#fbfbf8", cable: "#8a909a" };
const LOOKS = {
  A: { top: "#4f9a6a", legs: "#3b4a63", hair: "#2e2a26", shoes: "#2e3138" },
  B: { top: "#e08a3a", legs: "#56607a", hair: "#4a3324", shoes: "#2e3138" },
};
const put = (el, html) => { if (el && el.__html !== html) { el.innerHTML = html; el.__html = html; } };
const f2 = (v) => v.toFixed(1);

// which drawn part lights up for each station (exactly one at a time)
const LIT = {
  start: ["patient"], safe: ["a-low", "a-up"], shoulders: ["p-arm-far", "p-arm-near"], call: ["phone"], airway: ["p-head"],
  helper: ["b-low", "b-up", "b-arms"], chest1: ["p-torso"], lid: ["lid-back", "lid-front"], power: ["aed-on"], bare: ["p-torso"],
  pad1: ["pad1"], pad2: ["pad2"], plug: ["plug"], analyse: ["aed-screen"], clear: ["b-low", "b-up", "b-arms"], shock: ["aed-shock"],
  chest2: ["p-torso"], next: ["aed-screen"],
};
let litNow = "";
function setLit(key) {
  if (key === litNow) return;
  litNow = key;
  svg.querySelectorAll(".is-lit").forEach((el) => el.classList.remove("is-lit"));
  for (const name of LIT[key] || []) {
    const el = PART[name] || SL[name];
    if (el) el.classList.add("is-lit");
  }
}

// ---- the person: chest (dips under the hands, shirt opens) and head (tilts) ----------------
function torsoSvg(sc) {
  const T = TORSO, top = sc.top;
  let out = paintOf(slabOf(T, 0, top, P, 6, 0.5), COL.shirt);
  // collar and buttons
  out += lineSvg(onTop([[BX - 8, T.y + T.d - 1], [BX, T.y + T.d - 7], [BX + 8, T.y + T.d - 1]], top, P), { tone: "mid" });
  if (sc.shirt > 0) {
    const half = 15 * sc.shirt, y0 = T.y + 18, y1 = T.y + T.d - 5;
    const skin = [[BX - half, y0 + 4], [BX + half, y0 + 4], [BX + half, y1], [BX - half, y1]];
    out += `<path class="wm-skin" d="${onTop(skin, top + 0.05, P, true)}"/>`;
    out += lineSvg(onTop([[BX - half, y0], [BX - half, y1]], top + 0.1, P) + onTop([[BX + half, y0], [BX + half, y1]], top + 0.1, P), { tone: "hi" });
  } else {
    out += dotsSvg([150, 162, 174].map((y) => iso([BX, y, top + 0.1], P)), { size: 0.9, tone: "hi" });
  }
  return out;
}
function headSvg(sc) {
  const t = sc.headTilt, [, hy] = [0, BODY.head.y], hz = BODY.head.z, r = BODY.head.r;
  return [
    rodSvg([BX, TORSO.y + TORSO.d - 2, 9], [BX, hy - r + 2, 10 + t], 5.6, COL.skin, P),
    ballSvg([BX, hy + 3 + t * 1.5, hz - 2], r * 0.98, COL.hair, P),
    ballSvg([BX, hy, hz], r, COL.skin, P),
    ballSvg([BX, hy - 7 + t * 2.5, hz + 6.5 + t * 2.4], 3.4, COL.skin, P), // chin, lifts as the head tilts back
    ballSvg([BX, hy + 1 + t * 2, hz + r - 0.6], 2.2, mix(COL.skin, "#1f2a44", 0.12), P), // nose
  ].join("");
}

// ---- the AED lid, the packet, the pads, the cables, the plug -----------------------------
const lidPt = (p, angle) => hingeRot(p, AED_BOX.x, AED_H, angle);
function lidSvg(sc) {
  const b = AED_BOX, a = sc.lid;
  const o = lidPt([b.x, b.y, AED_H], a), ex = hingeVec([b.w, 0, 0], a), ey = [0, b.d, 0], ez = hingeVec([0, 0, LID_H], a);
  let out = boxSvg(o, ex, ey, ez, mix(COL.aed, "#ffffff", 0.06), P);
  // outer face: the white heart-and-lightning mark
  const ou = unit3(ex), ov = [0, -1, 0], centre = lidPt([b.x + b.w / 2, b.y + b.d / 2, AED_H + LID_H + 0.05], a);
  const mark = heartMarkPath(centre, ou, ov, 7, P);
  if (dot3(unit3(ez), viewOf(P)) > 0) out += `<path class="wm-mark" d="${mark.heart}"/><path class="wm-mark-bolt" d="${mark.bolt}"/>`;
  // inner face (seen once the lid is up): the pad packet and any pad still inside it
  if (a > 40) {
    const pk = [[7, 4], [23, 4], [23, 28], [7, 28]].map((q) => packetCorner(a, 0, q));
    out += `<path class="wm-packet" d="${quadPath(pk, P)}"/>`;
    if (sc.packet < 1) out += `<path class="wm-packet-seal" d="${quadPath([[8, 5], [22, 5], [22, 27], [8, 27]].map((q) => packetCorner(a, 0.5, q)), P)}" style="opacity:${f2(1 - sc.packet)}"/>`;
    if (sc.packet > 0) {
      if (sc.pad1.p === 0) out += padSvg(sc.pad1.pts, "pad1");
      if (sc.pad2.p === 0) out += padSvg(sc.pad2.pts, "pad2");
    }
  }
  return out;
}
function padSvg(pts, name) {
  const c = centreOf(pts);
  const inner = pts.map((p) => lerp3(c, p, 0.55));
  const lit = litNow === name ? " is-lit" : "";
  return `<g class="wm-padg${lit}" data-part="${name}"><path class="wm-pad3d" d="${quadPath(pts, P)}"/><path class="wm-pad-pic" d="${quadPath(inner, P)}"/><circle class="wm-pad-dot" cx="${f2(iso(c, P)[0])}" cy="${f2(iso(c, P)[1])}" r="1.6"/></g>`;
}
function cableSvg(from, to, via) {
  const pts = [from, ...via, to];
  const dense = [];
  for (let s = 0; s < pts.length - 1; s++) for (let n = 0; n < 8; n++) {
    const p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(pts.length - 1, s + 2)], t = n / 8;
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    dense.push([0, 1, 2].map((j) => cr(p0[j], p1[j], p2[j], p3[j])));
  }
  dense.push(to);
  const d = pathOf(dense.map((p) => iso(p, P)));
  return `<path class="wm-cable-under" d="${d}"/><path class="wm-cable" d="${d}"/>`;
}
const CABLE_VIA = {
  pad1: (top) => [[86, 192, top - 2], [84, 226, 3]],
  pad2: (top) => [[122, 174, 17], [110, 188, top + 0.6], [88, 200, 13], [84, 232, 3]],
};
function plugSvg(p) {
  return `<g data-part="plug" class="wm-part${litNow === "plug" ? " is-lit" : ""}">${boxSvg([p[0] - 2.4, p[1] - 2, p[2]], [4.8, 0, 0], [0, 4, 0], [0, 0, 2.6], "#5a616c", P)}</g>`;
}

// ---- overlays: the carrier ring, bubbles, sound words, marks ------------------------------
const BUBBLES = { // docs/scene.md "What moves, station by station"
  shoulders: { text: '"Are you all right?"', who: "A" },
  call: { text: '"Ambulance please: collapsed, not breathing normally"', who: "A" },
  airway: { text: "Gasping is not normal breathing", who: "A" },
  helper: { text: '"Get the AED!"', who: "A" },
  power: { text: (s) => `"${s.screen}"`, who: "AED" },
  analyse: { text: (s) => `"${s.screen}"`, who: "AED" },
  clear: { text: '"Everyone clear!"', who: "B" },
  next: { text: '"Stop CPR. Analysing."', who: "AED" },
};
function wrap(text, n) {
  const out = [];
  let line = "";
  for (const w of text.split(" ")) { if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + " " + w).trim(); }
  if (line) out.push(line);
  return out;
}
const escText = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function bubbleSvg([x, y], text, scale, side) {
  // a bubble beside the speaker's head (left or right), so it stays inside a close-up
  const lines = wrap(text, 24), w = Math.max(...lines.map((l) => l.length)) * 7.1 + 18, h = lines.length * 15 + 10;
  const bx = side < 0 ? -w - 14 : 14, by = -h / 2 - 6;
  const tx = side < 0 ? -14 : 14;
  const tail = `M${tx} ${by + h / 2 - 5}L${tx} ${by + h / 2 + 5}L${side < 0 ? -2 : 2} ${by + h / 2 + 8}Z`;
  return `<g class="wm-bubble" transform="translate(${f2(x)} ${f2(y)}) scale(${scale.toFixed(3)})"><rect x="${f2(bx)}" y="${f2(by)}" width="${f2(w)}" height="${h}" rx="9"/><path d="${tail}"/>${lines.map((l, n) => `<text x="${f2(bx + w / 2)}" y="${f2(by + 18 + n * 15)}" text-anchor="middle">${escText(l)}</text>`).join("")}</g>`;
}
function wordSvg([x, y], text, age, scale) {
  const a = age / 1.1, o = a < 0.15 ? a / 0.15 : 1 - Math.max(0, (a - 0.55) / 0.45);
  return `<text class="wm-word" transform="translate(${f2(x)} ${f2(y - a * 10 * scale)}) scale(${scale.toFixed(3)})" opacity="${o.toFixed(2)}">${text}</text>`;
}

// ---- one frame of the floor ----------------------------------------------------------
const rot2 = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
function drawPeople(sc) {
  const A = kneelerJoints({ knees: A_KNEES, chest: sc.A.chest, hands: sc.A.hands });
  A.headFace = rot2([1, 0], sc.A.look);
  put(SL["a-low"], personSvg(A, LOOKS.A, P, ["legs"]));
  put(SL["a-up"], personSvg(A, LOOKS.A, P, ["torso", "arms"]));
  const B = sc.B;
  if (B.mode === "gone") { put(SL["b-low"], ""); put(SL["b-up"], ""); put(SL["b-arms"], ""); return; }
  if (B.mode === "stand" || B.mode === "run") {
    put(SL["b-low"], personSvg(standerJoints({ at: B.at, face: B.face, stride: B.stride, run: B.run }), LOOKS.B, P));
    put(SL["b-up"], ""); put(SL["b-arms"], "");
    return;
  }
  const J = kneelerJoints({ knees: B.at, chest: B.chest, hands: B.hands });
  put(SL["b-low"], personSvg(J, LOOKS.B, P, ["legs"]));
  put(SL["b-up"], personSvg(J, LOOKS.B, P, ["torso"]));
  put(SL["b-arms"], personSvg(J, LOOKS.B, P, ["arms"]));
}
const shadowAt = (x, y, rx, ry) => `<path class="wm-shadow-soft" d="${onTop(Array.from({ length: 20 }, (_, n) => { const t = (n / 20) * Math.PI * 2; return [x + Math.cos(t) * rx, y + Math.sin(t) * ry]; }), 0.05, P, true)}"/>`;

function drawFloor(sc, win) {
  drawPeople(sc);
  const B = sc.B;
  put(SL.shadows, shadowAt(A_KNEES[0] - 14, A_KNEES[1], 30, 20) + (B.mode === "gone" ? "" : B.mode === "kneel" ? shadowAt(B.at[0] - 14, B.at[1], 30, 20) : shadowAt(B.at[0], B.at[1], 14, 12)));
  put(PART["p-torso"], torsoSvg(sc));
  put(PART["p-head"], headSvg(sc));
  PART.patient.setAttribute("transform", sc.jerk ? translateAlong(P, [0, 0, sc.jerk]) : "");
  // AED: hidden until B brings it; carried in B's hand, then set down
  PART.aed.style.display = sc.aedOn ? "" : "none";
  PART.aed.setAttribute("transform", translateAlong(P, sc.aedOffset));
  const lid = sc.aedOn ? lidSvg(sc) : "";
  put(SL["lid-back"], sc.lid > 70 ? lid : "");
  put(SL["lid-front"], sc.lid > 70 ? "" : lid);
  // pads and cables
  let placed = "", moving = "";
  for (const [name, pad] of [["pad1", sc.pad1], ["pad2", sc.pad2]]) {
    if (pad.p <= 0) continue;
    const c = cableSvg(centreOf(pad.pts), sc.plug, pad.p >= 1 ? CABLE_VIA[name](sc.top) : []);
    if (pad.p >= 1) placed += c + padSvg(pad.pts, name);
    else moving += c + padSvg(pad.pts, name);
  }
  put(SL.placed, placed);
  put(SL.moving, moving);
  put(SL.plug, sc.plugShown ? plugSvg(sc.plug) : "");
  svg.classList.toggle("is-phone-on", sc.phoneOn);
  PART["aed-on"].classList.toggle("is-glow", sc.onGlow || sc.screenOn);
  PART["aed-shock"].classList.toggle("is-blink", !!sc.shockBlink);
  drawScreen(sc, win);
}

// the AED's own small screen: the station's `screen` text, wrapped (the strip shows it legibly)
function drawScreen(sc, win) {
  if (!sc.screenOn || !win.screen) { put(SCREEN_TEXT, ""); return; }
  const lines = wrap(win.screen, 15).slice(0, 4);
  if (win.countdown != null) lines.push(mmss(Math.max(0, win.countdown)));
  const sx = SCREEN.x, sy = SCREEN.y + SCREEN.d - 1.2, z = AED_H + 0.25;
  put(SCREEN_TEXT, lines.map((l, n) => `<text class="wm-screen-line" transform="${topMatrix([sx + 2.4 + n * 2.6, sy], z, P, "y")}" font-size="1.9">${escText(l)}</text>`).join(""));
}

// overlays, drawn in screen space at a size that stays readable whatever the zoom
function drawOverlay(sc, st, extras, zoom, now) {
  const s = 1 / Math.max(1, zoom * 0.62);
  const out = [];
  if (sc.scan != null) {
    const a0 = -2.2 + sc.scan * 4.4, pts = [];
    for (let n = 0; n <= 16; n++) { const a = a0 - 0.9 + (n / 16) * 0.9; pts.push([A_KNEES[0] + Math.cos(a) * 110, A_KNEES[1] + Math.sin(a) * 110]); }
    out.push(`<path class="wm-scan" d="${onTop(pts, 0.4, P)}"/>`);
    out.push(`<path class="wm-scan wm-scan-ring" d="${onTop(Array.from({ length: 48 }, (_, n) => { const a = (n / 48) * Math.PI * 2; return [A_KNEES[0] + Math.cos(a) * 110, A_KNEES[1] + Math.sin(a) * 110]; }), 0.3, P, true)}"/>`);
  }
  if (sc.airwayRing != null) {
    const [cx, cy] = iso([BX + 14, BODY.head.y + 22, BODY.head.z + 4], P), R = 15;
    const end = Math.PI * 2 * sc.airwayRing - Math.PI / 2;
    const big = sc.airwayRing > 0.5 ? 1 : 0;
    out.push(`<circle class="wm-ring-track" cx="${f2(cx)}" cy="${f2(cy)}" r="${R}"/>`);
    if (sc.airwayRing > 0.01) out.push(`<path class="wm-ring-arc" d="M${f2(cx)} ${f2(cy - R)}A${R} ${R} 0 ${big} 1 ${f2(cx + R * Math.cos(end))} ${f2(cy + R * Math.sin(end))}"/>`);
    out.push(`<text class="wm-ring-num" x="${f2(cx)}" y="${f2(cy + 4)}" text-anchor="middle">${Math.ceil(sc.airwayRing * st.secs)}</text>`);
  }
  if (sc.flash > 0) {
    const a = centreOf(sc.pad1.pts), b = centreOf(sc.pad2.pts), pts = [];
    for (let n = 0; n <= 10; n++) { const p = lerp3(a, b, n / 10); pts.push(iso([p[0], p[1], p[2] + (n % 2 ? 3 : -2) * (n > 0 && n < 10 ? 1 : 0)], P)); }
    const d = pathOf(pts);
    out.push(`<g opacity="${sc.flash.toFixed(2)}"><path class="wm-flash-glow" d="${d}"/><path class="wm-flash" d="${d}"/></g>`);
  }
  if (sc.handsOff) {
    const [x, y] = iso([W_CHEST[0], W_CHEST[1], 48], P);
    out.push(`<g transform="translate(${f2(x)} ${f2(y)}) scale(${s.toFixed(3)})"><rect class="wm-mark-bg" x="-44" y="-12" width="88" height="22" rx="11"/><text class="wm-mark-text" y="4" text-anchor="middle">HANDS OFF</text></g>`);
  }
  if (sc.swap != null) {
    const a = iso([A_KNEES[0] - 4, A_KNEES[1] + 14, 104], P), b = iso([sc.B.at[0], sc.B.at[1] - 8, 104], P);
    out.push(`<path class="wm-swap" d="M${f2(a[0])} ${f2(a[1])}Q${f2((a[0] + b[0]) / 2)} ${f2(Math.min(a[1], b[1]) - 30)} ${f2(b[0])} ${f2(b[1])}" marker-start="url(#wm-swap-head)" marker-end="url(#wm-swap-head)" opacity="${sc.swap.toFixed(2)}"/>`);
  }
  if (extras.counter) {
    const [x, y] = iso([W_CHEST[0] + 10, W_CHEST[1] - 18, 44], P);
    out.push(`<g transform="translate(${f2(x)} ${f2(y)}) scale(${s.toFixed(3)})"><rect class="wm-count-bg" x="-26" y="-13" width="52" height="22" rx="7"/><text class="wm-count" y="3" text-anchor="middle">${extras.counter}</text></g>`);
  }
  // the carrier: a ring on the active part
  const [rx, ry] = iso(st.at, P);
  out.push(`<circle class="wm-carrier" cx="${f2(rx)}" cy="${f2(ry)}" r="${f2(16 * Math.max(0.55, s))}"/>`);
  const bub = BUBBLES[st.key];
  if (bub && sc.u < 0.98) {
    const text = typeof bub.text === "function" ? bub.text(st) : bub.text;
    // anchored on the active part, so it stays inside the close-up
    const from = [st.at[0], st.at[1], st.at[2] + 14];
    out.push(bubbleSvg(iso(from, P), text, s * 0.85, bub.who === "AED" ? -1 : 1));
  }
  for (const w of extras.words) out.push(wordSvg(iso(w.at, P), w.text, (now - w.born) / 1000, s));
  put(SL.overlay, out.join(""));
}
const W_CHEST = AED.WORLD.chest;

// ---- the window ---------------------------------------------------------------------------
const win = document.querySelector(".wm-window");
const ripG = win.querySelector('[data-live="ripples"]');
const heartG = win.querySelector('[data-live="heart"]');
const traceEl = win.querySelector(".wm-trace");
const winSet = (sel, text) => { const el = win.querySelector(sel); if (el && el.textContent !== text) el.textContent = text; };
function ripplePaths(phase, amp) {
  const out = [];
  for (let n = 0; n < 7; n++) {
    const y0 = 70 + n * 12, pts = [];
    for (let x = 120; x <= 232; x += 6) pts.push(`${x} ${(y0 + Math.sin(x * 0.21 + phase * (7 + n) + n * 1.7) * 3.2 * amp + Math.sin(x * 0.53 - phase * 11 + n) * 1.6 * amp).toFixed(1)}`);
    out.push(`<path d="M${pts.join("L")}"/>`);
  }
  return out.join("");
}
function paintWindow(w, sc, now, visualDip, beat) {
  const L = w.look, st = win.style;
  st.setProperty("--h-wall", L.wall); st.setProperty("--h-inner", L.inner); st.setProperty("--h-ripple", L.ripple);
  st.setProperty("--h-ripples", String(L.ripples)); st.setProperty("--h-current", String(L.current ? Math.max(0.25, sc.flash) : 0));
  st.setProperty("--blood-red", BLOOD.red); st.setProperty("--blood-blue", BLOOD.blue); st.setProperty("--blood-current", BLOOD.current);
  st.setProperty("--brain", mix(BLOOD.brainOff, BLOOD.brainOn, w.brainFlow));
  const squeeze = L.squeeze ? visualDip : 0;
  st.setProperty("--h-arrows", String(L.arrows ? 0.25 + 0.75 * squeeze : 0));
  const [cx, cy] = HEART_C;
  heartG.setAttribute("transform", `translate(${cx} ${cy}) scale(${(1 + 0.03 * squeeze).toFixed(3)} ${(1 - 0.1 * squeeze).toFixed(3)}) translate(${-cx} ${-cy})`);
  ripG.innerHTML = L.ripples ? ripplePaths(now / 1000, 1) : "";
  win.querySelectorAll('[data-pad="right"]').forEach((el) => el.classList.toggle("is-on", w.pads.right));
  win.querySelectorAll('[data-pad="left"]').forEach((el) => el.classList.toggle("is-on", w.pads.left));
  win.querySelector(".wm-padline").classList.toggle("is-on", w.pads.right && w.pads.left);
  winSet('[data-live="noflow"]', mmss(w.noFlow));
  winSet(".wm-heart-cap", L.caption);
  // strip
  const kind = w.stripLook.trace;
  win.querySelector(".wm-strip-none").style.display = kind === "none" ? "" : "none";
  traceEl.setAttribute("d", kind === "none" ? "" : tracePath(kind, kind === "spike" ? 0 : now / 1000, 300, 34, beat));
  winSet(".wm-strip-screen", w.screen ? w.screen : kind === "none" ? "" : "");
  winSet(".wm-strip-cap", w.stripLook.caption);
  winSet(".wm-strip-count", w.countdown != null ? `next analysis in ${mmss(Math.max(0, w.countdown))}` : "");
  const bar = win.querySelector(".wm-bar"), fill = bar.firstElementChild;
  const v = w.analyse != null ? w.analyse : w.charge;
  bar.classList.toggle("is-on", v != null);
  bar.classList.toggle("is-charge", w.charge != null);
  fill.style.width = `${Math.round((v || 0) * 100)}%`;
}
