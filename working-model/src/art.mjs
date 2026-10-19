// Static art of the AED floor, built once with the isometric engine (engine/).
// Live parts (rescuers, chest, head, lid, pads, cables, plug, screen text) are left as empty
// groups for the page to fill; their slots are in painter's order (far first).
import * as k from "./kit.mjs";
import * as W from "./world.mjs";
import { STATIONS, IDX } from "./model.mjs";
import { paintOf, boxSvg, rodSvg, ballSvg, mix, heartMarkPath, discOnTop, INK } from "./figures.mjs";

export const DRAW_FLOOR = { x: -16, y: -22, w: 212, d: 312, r: 0 };
export const P = k.fitProjection(
  [...k.boxCorners(DRAW_FLOOR, -3, 0), [W.B_START[0], W.B_START[1], 168], [W.A_KNEES[0], W.A_KNEES[1], 118]],
  W.WIDTH, W.HEIGHT, { pad: 6, azimuth: W.VIEW_AZIMUTH, elevation: W.VIEW_ELEVATION },
);
export const C = {
  wood: "#c9a074", woodLine: "#a57c52", mat: "#9fb5a2", shirt: "#5b7fb5", trousers: "#4a4f5a", skin: "#c98f6a", hair: "#3a2f2a",
  aed: "#2f9e5b", panel: "#3c4148", screen: "#26332c", on: "#3fbf6a", shock: "#f08a2c", socket: "#1d2126",
  phone: "#3b4352", tape: "#fffaf0", shoe: "#2e3138",
};
export const LOOK_A = { top: "#4f9a6a", legs: "#3b4a63", hair: "#2e2a26", shoes: C.shoe };
export const LOOK_B = { top: "#e08a3a", legs: "#56607a", hair: "#4a3324", shoes: C.shoe };

const at = (p) => k.iso(p, P);
const L = (d, o) => k.lineSvg(d, o);
const f1 = (v) => (Math.round(v * 100) / 100).toString();
// a text/tape plane from an origin o and unit axes u (text direction) and v (glyph down)
export const planeMatrix = (o, u, v) => {
  const p0 = at(o), pu = at([o[0] + u[0], o[1] + u[1], o[2] + u[2]]), pv = at([o[0] + v[0], o[1] + v[1], o[2] + v[2]]);
  return `matrix(${f1(pu[0] - p0[0])} ${f1(pu[1] - p0[1])} ${f1(pv[0] - p0[0])} ${f1(pv[1] - p0[1])} ${f1(p0[0])} ${f1(p0[1])})`;
};
const onPlane = (o, u, v, a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b];

// A tape label with its number badge, printed on a plane. data-station marks it for the page.
export function tapeSvg(station, o, u, v, w, h) {
  const s = STATIONS[IDX[station]];
  const quad = [[0, 0], [w, 0], [w, h], [0, h]].map(([a, b]) => at(onPlane(o, u, v, a, b)));
  const r = h * 0.36, bc = [h * 0.52, h / 2];
  const ring = Array.from({ length: 24 }, (_, n) => { const t = (n / 24) * Math.PI * 2; return at(onPlane(o, u, v, bc[0] + Math.cos(t) * r, bc[1] + Math.sin(t) * r)); });
  const lines = s.lines;
  const size = lines.length > 1 ? Math.min(h * 0.36, 4.4) : Math.min(h * 0.5, 5.4);
  const longest = Math.max(...lines.map((t) => t.length));
  const fit = Math.min(size, ((w - h * 1.05 - 1) / (longest * 0.66)));
  const cx = h * 1.05 + (w - h * 1.05) / 2;
  const text = lines.map((t, n) => {
    const y = lines.length > 1 ? h / 2 + (n ? fit * 0.98 : -fit * 0.12) : h / 2 + fit * 0.36;
    return `<text class="wm-tape-text" transform="${planeMatrix(onPlane(o, u, v, cx, y), u, v)}" font-size="${f1(fit)}" text-anchor="middle">${t}</text>`;
  }).join("");
  const num = `<text class="wm-tape-num" transform="${planeMatrix(onPlane(o, u, v, bc[0], bc[1] + r * 0.5), u, v)}" font-size="${f1(r * 1.35)}" text-anchor="middle">${s.num}</text>`;
  return `<g class="wm-tape" data-station="${IDX[station]}" role="button" tabindex="-1" aria-label="${s.num} ${s.label}"><path class="wm-tape-bg" d="${k.pathOf(quad, true)}"/><path class="wm-badge" d="${k.pathOf(ring, true)}"/>${num}${text}</g>`;
}

function floorTags() {
  const out = [];
  for (const [key, t] of [...Object.entries(W.TAGS), ...Object.entries(W.AED_TAGS)]) {
    const z = key in { airway: 1, shoulders: 1, pad1: 1, bare: 1, pad2: 1, chest1: 1, chest2: 1, clear: 1 } ? W.MAT_H + 0.05 : 0.05;
    if (t.along === "x") out.push(tapeSvg(key, [t.at[0] - t.w / 2, t.at[1] - W.TAG_D / 2, z], [1, 0, 0], [0, 1, 0], t.w, W.TAG_D));
    else out.push(tapeSvg(key, [t.at[0] - W.TAG_D / 2, t.at[1] + t.w / 2, z], [0, -1, 0], [1, 0, 0], t.w, W.TAG_D));
  }
  return out.join("");
}

function floor() {
  const F = DRAW_FLOOR, out = [];
  out.push(paintOf(k.slabOf(F, -3, 3, P, 1), C.wood, { crease: "none" }));
  const planks = [];
  for (let x = F.x + 14; x < F.x + F.w; x += 14) planks.push(k.lineOnTop([x, F.y], [x, F.y + F.d], 0, P));
  for (let n = 0; n < 18; n++) { const x = F.x + 14 * ((n * 5) % 17), y = F.y + ((n * 73) % 300) + 20; planks.push(k.lineOnTop([x, y], [x + 14, y], 0, P)); }
  out.push(`<path class="wm-plank" d="${planks.join("")}"/>`);
  out.push(`<path class="wm-shadow" d="${k.onTop(k.ringOf({ ...W.MAT, x: W.MAT.x + 3, y: W.MAT.y - 3 }, 6), 0, P, true)}"/>`);
  out.push(paintOf(k.slabOf(W.MAT, 0, W.MAT_H, P, 6), C.mat, { crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(W.MAT, 3), W.MAT_H, P, 6), { tone: "mid", dashed: true }));
  // shadows of the person, the AED and the phone
  out.push(`<path class="wm-shadow" d="${k.onTop(k.ringOf({ x: W.BX - 24, y: 14, w: 52, d: 206, r: 18 }, 8), W.MAT_H + 0.02, P, true)}"/>`);
  return out.join("");
}

// ---- the person (static parts; the chest, neck and head are live) -----------------------
const B0 = W.BODY;
export function personArm(side) {
  const x = W.BX + side * B0.armHalfSpread, z = 5.2;
  return `<g data-part="${side < 0 ? "p-arm-far" : "p-arm-near"}" class="wm-part">${rodSvg([x, 188, z + 1], [x, 150, z], 5.6, C.shirt, P)}${ballSvg([x, 188, z + 1.4], 6, C.shirt, P)}${rodSvg([x, 150, z], [x, 114, z - 0.6], 4.6, C.skin, P)}${ballSvg([x, 110, z - 0.8], 4.8, C.skin, P)}</g>`;
}
export function personLegs() {
  const out = [];
  for (const side of [-1, 1]) {
    const x = W.BX + side * 9.5;
    out.push(rodSvg([x, 108, 8], [x, 26, 6.4], 7.6, C.trousers, P));
    out.push(boxSvg([x - 4.2, B0.feetY - 2, 0], [8.4, 0, 0], [0, 6.5, 0], [0, 0, 17], C.shoe, P));
  }
  out.push(paintOf(k.slabOf(W.HIPS, 0, W.HIPS_H, P, 6, 0.5), C.trousers));
  out.push(paintOf(k.slabOf({ ...W.HIPS, y: W.HIPS.y + W.HIPS.d - 4, d: 3.5, r: 1 }, W.HIPS_H - 2.4, 2.6, P, 2), "#2f333b", { crease: "none" }));
  return out.join("");
}

// ---- the AED (base and panel; the lid is live) ---------------------------------------------
function aedBase() {
  const b = W.AED_BOX, h = W.AED_H, out = [];
  out.push(`<path class="wm-shadow" d="${k.onTop(k.ringOf({ ...b, x: b.x + 3, y: b.y - 3 }, 6), 0.02, P, true)}"/>`);
  out.push(paintOf(k.slabOf(b, 0, h, P, 6, 0.6), C.aed, { inner: L(k.sideSeam(b, 2.2, P, 6), { tone: "mid" }) }));
  const panel = k.insetPlan(b, 1.8);
  out.push(paintOf(k.slabOf(panel, h - 0.4, 0.5, P, 4), C.panel, { crease: "none" }));
  // screen: dark glass; its text is filled by the page from the station's `screen`
  out.push(`<g data-part="aed-screen" class="wm-part"><path class="wm-screen" d="${k.planOutline(W.SCREEN, h + 0.15, P, 3)}"/><g class="wm-screen-text" data-live="screen"></g></g>`);
  // ON button, SHOCK button with its bolt, the socket for the pad cable
  const [ox, oy] = W.ON_AT, [sx, sy] = W.SHOCK_AT, [kx, ky] = W.SOCKET_AT;
  out.push(`<g data-part="aed-on" class="wm-part">${paintOf(k.cylinder(ox, oy, 3.2, h, 1.4, P, 24, 0.3), C.on)}<path class="wm-on-glow" d="${discOnTop(ox, oy, 2.4, h + 1.45, P)}"/>${k.faceTextSvg(k.topMatrix([ox - 1.6, oy + 0.9], h + 1.45, P, "y"), "ON", { size: 1.9, tone: "hi" })}</g>`);
  const bolt = heartMarkPath([sx, sy, h + 1.75], [0, -1, 0], [1, 0, 0], 2.6, P).bolt;
  out.push(`<g data-part="aed-shock" class="wm-part">${paintOf(k.cylinder(sx, sy, 4, h, 1.7, P, 28, 0.3), C.shock)}<path class="wm-shock-glow" d="${discOnTop(sx, sy, 3.2, h + 1.75, P)}"/><path class="wm-bolt" d="${bolt}"/></g>`);
  out.push(paintOf(k.slabOf({ x: kx - 3, y: ky - 3, w: 6, d: 5, r: 1 }, h, 0.9, P, 2), C.socket, { crease: "none" }));
  out.push(`<path class="wm-socket-hole" d="${k.planOutline({ x: kx - 1.6, y: ky - 1.6, w: 3.2, d: 2.4, r: 0.5 }, h + 0.95, P, 2)}"/>`);
  return out.join("");
}

function phone() {
  const p = W.PHONE, h = W.PHONE_H, out = [];
  out.push(`<path class="wm-shadow" d="${k.onTop(k.ringOf({ ...p, x: p.x + 1.5, y: p.y - 1.5 }, 3), 0.02, P, true)}"/>`);
  out.push(paintOf(k.slabOf(p, 0, h, P, 3, 0.2), C.phone));
  const scr = k.insetPlan(p, 0.9);
  out.push(`<path class="wm-phone-screen" d="${k.planOutline(scr, h + 0.05, P, 2)}"/>`);
  out.push(`<text class="wm-phone-text" transform="${planeMatrix([p.x + p.w / 2 + 1.3, p.y + p.d / 2, h + 0.1], [0, -1, 0], [1, 0, 0])}" font-size="2.6" text-anchor="middle">108 / 112</text>`);
  // speaker waves, shown while the call is on
  const waves = [4, 6.5, 9].map((rr) => k.onTop(Array.from({ length: 9 }, (_, n) => { const t = -0.9 + (n / 8) * 1.8; return [p.x + p.w / 2 + Math.sin(t) * rr * 0.6, p.y - 1 - Math.cos(t) * rr * 0.4 - rr * 0.3]; }), h, P)).join("");
  out.push(`<path class="wm-waves" d="${waves}"/>`);
  return `<g data-part="phone" class="wm-part">${out.join("")}</g>`;
}

export function figureBody() {
  return [
    floor(),
    `<g data-slot="shadows"></g>`,
    floorTags(),
    `<g data-slot="b-low"></g>`,
    `<g data-slot="a-low"></g>`,
    `<g data-part="patient">`,
    personArm(-1),
    `<g data-part="p-legs">${personLegs()}</g>`,
    `<g data-part="p-torso" class="wm-part"></g>`,
    `<g data-part="p-head" class="wm-part"></g>`,
    personArm(1),
    `<g data-slot="placed"></g>`,
    `</g>`,
    `<g data-slot="a-up"></g>`,
    `<g data-part="aed"><g data-slot="lid-back"></g>${aedBase()}<g data-slot="lid-front"></g><g data-slot="plug"></g></g>`,
    `<g data-slot="b-up"></g>`,
    `<g data-slot="moving"></g>`,
    `<g data-slot="b-arms"></g>`,
    phone(),
    `<g data-slot="overlay"></g>`,
  ].join("");
}
export { INK, mix };
