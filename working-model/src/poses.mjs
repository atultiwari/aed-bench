// Where everything is at one moment: the rescuers' joints, the chest dip, the lid, the pads,
// the plug, the shirt, bubbles and marks. Pure: (station, seconds, real seconds, dip) -> scene.
// Read by the page every frame; the names and screen text still come from the model.
import { STATIONS, IDX, DEPTH_CM } from "./model.mjs";
import { lerp3, add3, mul3 } from "./lathe.mjs";
import { hingeRot } from "./figures.mjs";
import * as W from "./world.mjs";

const K = (k) => IDX[k];
export const easeIO = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const lerp2 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const BLEND = 0.6; // real seconds to ease from one station's pose into the next
export const OPEN_LID = 108;

// ---- rescuer A ----------------------------------------------------------------
const [AX, AY] = W.A_KNEES;
const chestTop = (dip) => W.TORSO_H - dip * DEPTH_CM * W.DEPTH_SCALE;
const A_REST = { chest: [AX + 2, AY, 96], hands: [[AX + 7, AY - 12, 40], [AX + 7, AY + 12, 40]], look: 0 };
const A_UP = { chest: [AX + 16, AY, 92], hands: [[AX + 30, AY - 16, 64], [AX + 30, AY + 16, 64]], look: 0 };
function aCpr(dip) {
  const top = chestTop(dip);
  const [hx, hy] = W.WD.chest;
  return { chest: [hx - 4, hy, top + 56], hands: [[hx, hy, top + 3.2], [hx, hy, top + 8]], look: 0 };
}
function aTarget(k, secs, s, dip) {
  switch (k) {
    case "safe": return { ...A_REST, look: Math.sin((secs / s.secs) * Math.PI * 2) * 1.1 };
    case "shoulders": {
      const shake = Math.sin(secs * Math.PI * 2 * 2.2) * 2.4;
      return { chest: [AX + 26, AY + 14, 84], hands: [[84 + shake, 184, 21], [116 + shake, 184, 21]], look: 0.3 };
    }
    case "call": return { chest: [AX + 4, AY + 6, 95], hands: [[AX + 7, AY - 12, 40], [AX + 34, AY + 34, 62]], look: 0.9 };
    case "airway": return { chest: [AX + 26, 186, 76], hands: [[100, 213, 22.5], [100, 198, 18.5]], look: 0.6 };
    case "helper": return { ...A_REST, look: -1.4 };
    case "analyse": case "clear": case "shock": case "next": return A_UP;
    default: return STATIONS[K(k)].cpr ? aCpr(dip) : A_REST;
  }
}

// ---- helper B -------------------------------------------------------------------
const FACE_IN = (() => { const d = [W.BX - W.B_START[0], 150 - W.B_START[1]]; const l = Math.hypot(...d); return [d[0] / l, d[1] / l]; })();
const B_PATH = [W.B_AWAY, [6, 60], [6, 170], W.B_KNEEL];
function along(path, p) {
  const lens = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = p * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const q = clamp01(d / lens[i]);
      const dir = [(path[i + 1][0] - path[i][0]) / lens[i], (path[i + 1][1] - path[i][1]) / lens[i]];
      return { at: lerp2(path[i], path[i + 1], q), face: dir, dist: p * total };
    }
    d -= lens[i];
  }
  return { at: path.at(-1), face: [1, 0], dist: total };
}
const bRest = (at) => ({ mode: "kneel", at, chest: [at[0] + 3, at[1], 94], hands: [[at[0] + 8, at[1] - 12, 40], [at[0] + 8, at[1] + 12, 40]], look: 0 });

// the lid's free edge (where B's hand lifts it) at a given angle
export const lidEdge = (angle) => hingeRot([W.AED_BOX.x + W.AED_BOX.w, W.AED_BOX.y + W.AED_BOX.d / 2, W.AED_H + W.LID_H], W.AED_BOX.x, W.AED_H, angle);

// ---- pads: from the packet on the lid to their places ---------------------------------
export function packetCorner(angle, n, [u, v]) {
  // lid-local point (u along x from the hinge, v along y), just in front of the inner face
  const p = [W.AED_BOX.x + u, W.AED_BOX.y + v, W.AED_H - 0.3 - n * 0.4];
  return hingeRot(p, W.AED_BOX.x, W.AED_H, angle);
}
export function padHome(which, dip) {
  if (which === 1) {
    const [x, y] = W.PAD_RIGHT, z = chestTop(dip) + 0.4, a = W.PAD.d / 2, b = W.PAD.w / 2;
    return [[x - a, y - b, z], [x + a, y - b, z], [x + a, y + b, z], [x - a, y + b, z]];
  }
  const [, y, z] = W.PAD_LEFT, x = W.TORSO.x + W.TORSO.w + 0.5, a = W.PAD.d / 2, b = W.PAD.w / 2;
  return [[x, y - b, z + a], [x, y + b, z + a], [x, y + b, z - a], [x, y - b, z - a]];
}
export function padInPacket(which, angle) {
  const u0 = 9, u1 = 21, v0 = which === 1 ? 6 : 17, v1 = v0 + 10;
  return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map((q) => packetCorner(angle, which, q));
}
const padAt = (which, p, dip, angle) => {
  const a = padInPacket(which, angle), b = padHome(which, dip), q = easeIO(p), lift = Math.sin(Math.PI * q) * 22;
  return a.map((c, i) => add3(lerp3(c, b[i], q), [0, 0, lift]));
};
export const PLUG_REST = [80, W.AED_BOX.y + W.AED_BOX.d + 5, 1.6];
export const plugHome = () => [W.SOCKET_AT[0], W.SOCKET_AT[1], W.AED_H + 0.2];

// ---- the whole scene at a moment -------------------------------------------------------
export function sceneAt({ i, secs, r, dip = 0 }) {
  const s = STATIONS[i], k = s.key, u = s.secs ? clamp01(secs / s.secs) : clamp01(r / 2.5);
  const after = (key) => i > K(key);
  const at = (key) => i === K(key);
  const top = chestTop(dip);

  // A: ease from where the previous station left A
  const prevS = STATIONS[Math.max(0, i - 1)];
  const prevA = i ? aTarget(prevS.key, prevS.secs, prevS, prevS.cpr ? 0 : 0) : A_REST;
  const curA = aTarget(k, secs, s, dip);
  const bA = i ? easeIO(clamp01(r / BLEND)) : 1;
  const A = {
    chest: lerp3(prevA.chest, curA.chest, bA),
    hands: [lerp3(prevA.hands[0], curA.hands[0], bA), lerp3(prevA.hands[1], curA.hands[1], bA)],
    look: lerp(prevA.look, curA.look, bA),
  };

  // the lid and the AED arriving with B
  let lid = after("lid") ? OPEN_LID : at("lid") ? OPEN_LID * easeIO(seg(u, 0.5, 0.95)) : 0;
  const aedOn = i >= K("lid");
  let aedOffset = [0, 0, 0];

  // B
  let B;
  if (i < K("helper")) B = { mode: "stand", at: W.B_START, face: FACE_IN, stride: 0, run: 0, look: 0 };
  else if (at("helper")) {
    const go = seg(u, 0.35, 1);
    const p = along([W.B_START, W.B_AWAY], easeIO(go));
    B = { mode: go > 0 ? "run" : "stand", at: p.at, face: go > 0 ? p.face : FACE_IN, stride: p.dist / 70, run: Math.min(1, go * 6), look: 0 };
  } else if (at("chest1")) B = { mode: "gone" };
  else if (at("lid") && u < 0.42) {
    const p = along(B_PATH, easeIO(seg(u, 0, 0.42)));
    B = { mode: "run", at: p.at, face: p.face, stride: p.dist / 70, run: 1, look: 0 };
    aedOffset = [p.at[0] - W.B_KNEEL[0] + 18, p.at[1] - W.B_KNEEL[1] + 26, 34];
  } else {
    const where = i >= K("bare") ? lerp2(W.B_KNEEL, W.B_REACH, at("bare") ? easeIO(seg(u, 0, 0.3)) : 1) : W.B_KNEEL;
    B = bRest(where);
    if (at("lid")) {
      const down = easeIO(seg(u, 0.42, 0.52));
      aedOffset = [18 * (1 - down), 26 * (1 - down), 34 * (1 - down)];
      const e = lidEdge(lid);
      B.chest = [where[0] + 22, where[1] + 10, 80];
      B.hands = [add3(e, [1.5, 0, 2.5]), [W.AED_BOX.x + 3, W.AED_BOX.y + W.AED_BOX.d - 2, W.AED_H + 4]];
    }
    const press = (target, p) => add3(target, [0, 0, 3.5 + 6 * (1 - easeIO(seg(p, 0, 0.5))) - 2.4 * Math.sin(Math.PI * seg(p, 0.45, 0.8))]);
    if (at("power")) { B.chest = [where[0] + 28, where[1] + 10, 74]; B.hands[0] = press(W.ON_AT, u); }
    if (at("bare")) {
      const open = easeIO(seg(u, 0.25, 0.85));
      B.chest = [84, 194, 62];
      B.hands = [[W.BX - 4 - 9 * open, 176, top + 3], [W.BX + 4 + 9 * open, 176, top + 3]];
    }
    if (at("pad1")) B.chest = [78, 198, 64];
    if (at("pad2")) B.chest = [86, 188, 56];
    if (at("plug")) B.chest = [where[0] + 22, where[1] + 16, 70];
    if (at("analyse") || at("next")) { B.chest = [where[0] + 6, where[1], 92]; B.hands = [[where[0] + 14, where[1] - 16, 70], [where[0] + 14, where[1] + 16, 70]]; }
    if (at("clear")) {
      const sweep = Math.sin(Math.PI * seg(u, 0.05, 0.9));
      B.chest = [where[0] + 8, where[1] - 4, 90];
      B.hands = [[where[0] + 34, lerp(where[1] + 4, 128, sweep), 74], [where[0] + 10, where[1] + 16, 42]];
    }
    if (at("shock")) { B.chest = [where[0] + 22, where[1] + 20, 72]; B.hands[0] = press(W.SHOCK_AT, u); }
  }

  // pads, plug and shirt
  const shirt = after("bare") ? 1 : at("bare") ? easeIO(seg(u, 0.25, 0.85)) : 0;
  const packet = after("bare") ? 1 : at("bare") ? easeIO(seg(u, 0.6, 1)) : 0;
  const padP = (key) => (after(key) ? 1 : at(key) ? seg(u, 0.1, 0.85) : 0);
  const pad1 = { p: padP("pad1"), pts: padAt(1, padP("pad1"), dip, lid) };
  const pad2 = { p: padP("pad2"), pts: padAt(2, padP("pad2"), dip, lid) };
  if (at("pad1") && B.hands) B.hands[0] = add3(centreOf(pad1.pts), [0, 0, 3.5]);
  if (at("pad2") && B.hands) B.hands[0] = add3(centreOf(pad2.pts), [3.5, 0, 0]);
  const plugP = after("plug") ? 1 : at("plug") ? easeIO(seg(u, 0.1, 0.8)) : 0;
  const plug = add3(lerp3(PLUG_REST, plugHome(), plugP), [0, 0, Math.sin(Math.PI * plugP) * 10]);
  if (at("plug") && B.hands) B.hands[0] = add3(plug, [0, 0, 3.2]);

  return {
    i, key: k, u, dip, top, A, B, lid, aedOn, aedOffset, shirt, packet, pad1, pad2,
    plug, plugShown: i >= K("bare"), plugged: plugP >= 1,
    headTilt: at("airway") ? easeIO(seg(u, 0, 0.3)) : 0,
    jerk: at("shock") ? Math.max(0, Math.sin(Math.PI * seg(u, 0.35, 0.6))) * 2.5 : 0,
    flash: at("shock") ? Math.max(0, 1 - Math.abs(seg(u, 0.3, 0.75) * 2 - 1)) : 0,
    phoneOn: i >= K("call"), screenOn: i >= K("power"),
    onGlow: at("power"), shockBlink: at("clear") ? u > 0.6 : at("shock") ? u < 0.45 : false,
    scan: at("safe") ? u : null,
    handsOff: at("analyse") || at("next"),
    swap: at("next") ? easeIO(seg(u, 0.2, 0.9)) : null,
    airwayRing: at("airway") ? 1 - u : null,
  };
}
export const centreOf = (pts) => mul3(pts.reduce((a, p) => add3(a, p), [0, 0, 0]), 1 / pts.length);
