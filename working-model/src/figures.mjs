// Drawing helpers shared by the build (static art) and the page (live parts):
// four-tone painted solids, boxes in any orientation, limbs and heads, and the people.
// Everything takes the projection P; nothing here keeps state.
import { iso, depthOf, pathOf, solidSvg, onTop, circleRing } from "./kit.mjs";
import { frameAlong, disc, sphereOf, hullOf, dot3, sub3, add3, mul3, len3, unit3, cross3, lerp3, viewOf, toneOf } from "./lathe.mjs";

// ---- colour ---------------------------------------------------------------
const hexOf = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const hexOut = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, t) => {
  const [x, y] = [hexOf(a), hexOf(b)];
  const q = Math.max(0, Math.min(1, t));
  return hexOut(x.map((v, i) => v + (y[i] - v) * q));
};
export const INK = "#1f2a44";
export function tonesOf(base) {
  const side = mix(base, INK, 0.16), dark = mix(base, INK, 0.3), top = mix(base, "#ffffff", 0.3);
  return `--sb-paper:${base};--sb-top:${top};--sb-shade-0:${dark};--sb-shade-1:${dark};--sb-shade-2:${side};--sb-shade-3:${mix(base, INK, 0.06)}`;
}
export const paintOf = (paths, base, opts = {}) => `<g style="${tonesOf(base)}">${solidSvg(paths, { tone: "hi", crease: "mid", ...opts })}</g>`;

// ---- a box from an origin and three edge vectors (any orientation) --------------
export function boxOf(o, ex, ey, ez, P) {
  const c = (i, j, k) => add3(add3(add3(o, mul3(ex, i)), mul3(ey, j)), mul3(ez, k));
  const pts = [c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0), c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)];
  const faces = [
    [[0, 3, 2, 1], mul3(ez, -1)], [[4, 5, 6, 7], ez],
    [[0, 1, 5, 4], mul3(ey, -1)], [[3, 7, 6, 2], ey],
    [[0, 4, 7, 3], mul3(ex, -1)], [[1, 2, 6, 5], ex],
  ];
  const V = viewOf(P);
  const flat = pts.map((p) => iso(p, P));
  const buckets = [[], [], [], [], []];
  const seen = [];
  for (const [idx, n] of faces) {
    if (dot3(unit3(n), V) <= 1e-6) continue;
    seen.push(idx);
    buckets[toneOf(n, P)].push(pathOf(idx.map((i) => flat[i]), true));
  }
  // creases: edges shared by two visible faces
  const edges = new Map();
  for (const idx of seen) idx.forEach((a, k) => { const b = idx[(k + 1) % 4]; const key = a < b ? `${a}-${b}` : `${b}-${a}`; edges.set(key, (edges.get(key) || 0) + 1); });
  const crease = [...edges].filter(([, n]) => n === 2).map(([key]) => { const [a, b] = key.split("-").map(Number); return pathOf([flat[a], flat[b]]); }).join("");
  const hull = pathOf(hullOf(flat), true);
  return { fill: hull, outline: hull, crease, top: buckets[4].join(""), shades: buckets.slice(0, 4).map((l) => l.join("")) };
}
export const boxSvg = (o, ex, ey, ez, base, P, opts) => paintOf(boxOf(o, ex, ey, ez, P), base, opts);

// ---- limbs and heads ---------------------------------------------------------
export function rodSvg(a, b, r, base, P) {
  const d = sub3(b, a), L = len3(d);
  if (L < 0.01) return "";
  return paintOf(disc(0, L, r, frameAlong(a, d), P), base, { crease: "none" });
}
export const ballSvg = (c, r, base, P) => paintOf(sphereOf(c, r, P, { steps: 32 }), base, { crease: "none" });

// a flat quad on any plane, as one path (pads, tapes, screens)
export const quadPath = (pts, P) => pathOf(pts.map((p) => iso(p, P)), true);

// elbow (or knee) of a two-part limb from s to h with lengths l1, l2, bending toward `hint`
export function jointOf(s, h, l1, l2, hint) {
  const d = sub3(h, s), dist = len3(d);
  const along = unit3(d);
  if (dist >= l1 + l2 - 0.01) return lerp3(s, h, l1 / (l1 + l2));
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const k = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let perp = sub3(hint, mul3(along, dot3(hint, along)));
  if (len3(perp) < 1e-6) perp = cross3(along, [0, 0, 1]);
  return add3(add3(s, mul3(along, a)), mul3(unit3(perp), k));
}

// ---- people --------------------------------------------------------------------
// A person from joints: {pelvis, chest, head, face (unit xy), hips:[2], knees:[2], feet:[2],
// shoulders:[2], hands:[2], elbows?:[2], kneeling}. Parts are depth-sorted (far first).
export const ARM = [30, 28];
export const SKIN_A = "#d6a27c";
export function personSvg(J, look, P, only = ["legs", "torso", "arms"]) {
  const parts = [];
  let group = "legs";
  const rod = (a, b, r, col, extra = 0) => parts.push({ g: group, d: depthOf(lerp3(a, b, 0.5), P) + extra, svg: () => rodSvg(a, b, r, col, P) });
  const ball = (c, r, col, extra = 0) => parts.push({ g: group, d: depthOf(c, P) + extra, svg: () => ballSvg(c, r, col, P) });
  for (let s = 0; s < 2; s++) {
    if (J.kneeling) {
      rod(J.knees[s], J.feet[s], 6, look.legs);
      ball(J.knees[s], 6.6, look.legs, 0.1);
      rod(J.hips[s], J.knees[s], 7.4, look.legs);
      ball(add3(J.feet[s], [-J.face[0] * 2, -J.face[1] * 2, 0]), 4.6, look.shoes, -0.2);
    } else {
      rod(J.hips[s], J.knees[s], 7, look.legs);
      rod(J.knees[s], J.feet[s], 6, look.legs);
      ball(J.knees[s], 6.2, look.legs, 0.1);
      ball(add3(J.feet[s], [J.face[0] * 4, J.face[1] * 4, 2]), 4.4, look.shoes, 0.2);
    }
  }
  ball(J.pelvis, 12, look.legs);
  group = "torso";
  rod(J.pelvis, J.chest, 13, look.top);
  ball(J.chest, 13.4, look.top, -0.2);
  // head: skin ball and a hair cap on the back, so the facing reads
  const hf = J.headFace || J.face;
  const hair = add3(J.head, [-hf[0] * 2.6, -hf[1] * 2.6, 2.4]);
  ball(hair, 8.8, look.hair, -0.05);
  ball(J.head, 9.2, SKIN_A, 0.05);
  group = "arms";
  for (let s = 0; s < 2; s++) {
    const sh = J.shoulders[s], hd = J.hands[s];
    const el = (J.elbows && J.elbows[s]) || jointOf(sh, hd, ARM[0], ARM[1], [0, 0, -1]);
    rod(sh, el, 5.2, look.top, 0.5);
    rod(el, hd, 4.4, SKIN_A, 0.6);
    ball(el, 4.6, look.top, 0.55);
    ball(hd, 4.6, SKIN_A, 0.8);
  }
  return parts.filter((p) => only.includes(p.g)).sort((a, b) => a.d - b.d).map((p) => p.svg()).join("");
}

// A kneeling rescuer at knee point [kx, ky], facing +x (toward the person), torso to `chest`.
export function kneelerJoints({ knees: [kx, ky], chest, head, hands, elbows, face = [1, 0] }) {
  const side = [-face[1], face[0]];
  const pelvis = [kx - face[0] * 4, ky - face[1] * 4, 47];
  const off = (p, k) => [p[0] + side[0] * k, p[1] + side[1] * k, p[2]];
  const torso = unit3(sub3(chest, pelvis));
  const across = unit3(cross3([0, 0, 1], [face[0], face[1], 0]));
  const sh = (k) => add3(add3(chest, mul3(across, k)), mul3(torso, -3));
  return {
    kneeling: true, face, pelvis, chest,
    head: head || add3(chest, add3(mul3(torso, 15), [face[0] * 2, face[1] * 2, 2])),
    hips: [off(pelvis, -8), off(pelvis, 8)],
    knees: [[kx + side[0] * -9, ky + side[1] * -9, 6], [kx + side[0] * 9, ky + side[1] * 9, 6]],
    feet: [[kx - face[0] * 36 - side[0] * 9, ky - face[1] * 36 - side[1] * 9, 4.6], [kx - face[0] * 36 + side[0] * 9, ky - face[1] * 36 + side[1] * 9, 4.6]],
    shoulders: [sh(-16), sh(16)],
    hands, elbows,
  };
}

// A standing or running person at [x, y], facing `face`; `stride` 0..1 phase, `run` 0..1.
export function standerJoints({ at: [x, y], face, stride = 0, run = 0, hands }) {
  const side = [-face[1], face[0]];
  const lean = run * 8;
  const pelvis = [x, y, 88 - run * 4];
  const chest = [x + face[0] * lean, y + face[1] * lean, 138 - run * 5];
  const sw = Math.sin(stride * Math.PI * 2) * 22 * run;
  const foot = (s, k) => {
    const lift = Math.max(0, Math.sin(stride * Math.PI * 2 * (s ? -1 : 1))) * 14 * run;
    return [x + side[0] * k + face[0] * (s ? -sw : sw), y + side[1] * k + face[1] * (s ? -sw : sw), 4 + lift];
  };
  const feet = [foot(0, -8), foot(1, 8)];
  const hips = [[x + side[0] * -8, y + side[1] * -8, pelvis[2] - 2], [x + side[0] * 8, y + side[1] * 8, pelvis[2] - 2]];
  const knees = hips.map((h, s) => {
    const f = feet[s];
    return jointOf(h, f, 44, 42, [face[0], face[1], 0]);
  });
  const across = [side[0], side[1], 0];
  const shoulders = [add3(chest, add3(mul3(across, -16), [0, 0, 2])), add3(chest, add3(mul3(across, 16), [0, 0, 2]))];
  const swing = (s) => add3(shoulders[s], [face[0] * (s ? sw : -sw) * 0.8, face[1] * (s ? sw : -sw) * 0.8, -48 + run * 12]);
  return { kneeling: false, face, pelvis, chest, head: add3(chest, [face[0] * lean * 0.4, face[1] * lean * 0.4, 25]), hips, knees, feet, shoulders, hands: hands || [swing(0), swing(1)] };
}

// ---- the lid: a box hinged along its far edge, opened by `angle` degrees -----------
export function hingeRot(p, x0, zh, angle) {
  const a = (angle * Math.PI) / 180, dx = p[0] - x0, dz = p[2] - zh;
  return [x0 + dx * Math.cos(a) - dz * Math.sin(a), p[1], zh + dx * Math.sin(a) + dz * Math.cos(a)];
}
export function hingeVec(v, angle) {
  const a = (angle * Math.PI) / 180;
  return [v[0] * Math.cos(a) - v[2] * Math.sin(a), v[1], v[0] * Math.sin(a) + v[2] * Math.cos(a)];
}

// a white heart with a lightning bolt, on a plane given by origin o and axes u, v (cm)
export function heartMarkPath(o, u, v, s, P) {
  const at = (a, b) => iso(add3(o, add3(mul3(u, a * s), mul3(v, b * s))), P);
  const heart = [];
  for (let i = 0; i <= 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    heart.push(at(x / 16, -y / 16));
  }
  const bolt = [[0.15, -0.75], [-0.3, 0.05], [0.02, 0.05], [-0.18, 0.75], [0.32, -0.12], [0.02, -0.12], [0.2, -0.75]].map(([a, b]) => at(a, b));
  return { heart: pathOf(heart, true), bolt: pathOf(bolt, true) };
}

// a flat disc on the floor or a top face, as a path
export const discOnTop = (cx, cy, r, z, P, steps = 28) => onTop(circleRing(cx, cy, r, steps), z, P, true);
