// World layout of the AED floor. Units are cm in the shared frame (shared/aed-spec.js WORLD):
// x = depth toward viewer-right, y = width toward viewer-left, z = up, floor at z = 0.
// Positions of the person, rescuers, AED, pads and phone are read from AED.WORLD; the
// sizes below are only the drawing's own detail (limbs, mat, labels).
// Shared by the build (static art) and the page (live parts), so they always agree.
import { AED } from "./model.mjs";

export const WD = AED.WORLD;
export const WIDTH = 900;
export const HEIGHT = 540;
export const VIEW_AZIMUTH = 34;
export const VIEW_ELEVATION = 36;

export const BODY = WD.body;
export const BX = BODY.x;
export const TORSO = { x: BX - BODY.torso.halfW, y: BODY.torso.y0, w: BODY.torso.halfW * 2, d: BODY.torso.y1 - BODY.torso.y0, r: 7 };
export const TORSO_H = BODY.torso.h;
export const HIPS = { x: BX - BODY.torso.halfW + 1, y: BODY.hips.y0, w: BODY.torso.halfW * 2 - 2, d: BODY.hips.y1 - BODY.hips.y0, r: 6 };
export const HIPS_H = 17;
export const DEPTH_SCALE = 1; // the chest dips the real 5.5 cm (a quarter of its height): drawn true to size

export const MAT = { x: 58, y: 4, w: 124, d: 230, r: 6 };
export const MAT_H = 1.4;
export const FLOOR = { x: WD.floor.x0, y: WD.floor.y0, w: WD.floor.x1 - WD.floor.x0, d: WD.floor.y1 - WD.floor.y0, r: 0 };

const A = WD.aed;
export const AED_BOX = { x: A.x0, y: A.y0, w: A.x1 - A.x0, d: A.y1 - A.y0, r: 3.5 };
export const AED_H = A.h;          // the base, top panel at z = h
export const LID_H = A.lidH;       // the lid sits on the panel, hinged along its far edge (x = x0)
export const SCREEN = { x: A.x0 + 4, y: A.y0 + 5, w: 13, d: 20, r: 1 };
export const ON_AT = AED.STATIONS[AED.IDX.power].at;
export const SHOCK_AT = AED.STATIONS[AED.IDX.shock].at;
export const SOCKET_AT = AED.STATIONS[AED.IDX.plug].at;
export const PACKET = { s: [6, 26], t: [5, 24] };   // the pad packet on the inside of the lid (lid-local cm)

export const PAD = { w: 12, d: 9 };
export const PAD_RIGHT = WD.padRight;
export const PAD_LEFT = WD.padLeft;

export const PHONE = { x: WD.phone[0] - 4, y: WD.phone[1] - 8, w: 8, d: 16, r: 1.5 };
export const PHONE_H = WD.phone[2];

export const A_KNEES = WD.rescuerA.knees;
export const B_START = WD.helperB.start;
export const B_AWAY = WD.helperB.away;
export const B_KNEEL = WD.helperB.kneel;
// While B places the pads B shuffles a little closer to the chest, still on the far side beyond the head.
export const B_REACH = [44, 204];

// Floor and mat tags: label positions (centre, cm) for stations not printed on the AED.
export const TAGS = {
  start: { at: [150, 34], along: "y", w: 30 },
  safe: { at: [20, 120], along: "y", w: 30 },
  helper: { at: [52, 34], along: "y", w: 36 },
  call: { at: [168, 232], along: "y", w: 36 },
  next: { at: [16, 252], along: "y", w: 36 },
  // on the mat, near side of the body, each beside its part
  airway: { at: [142, 210], along: "x", w: 30 },
  shoulders: { at: [142, 197], along: "x", w: 30 },
  pad1: { at: [142, 185], along: "x", w: 30 },
  bare: { at: [142, 173], along: "x", w: 30 },
  pad2: { at: [142, 161], along: "x", w: 30 },
  chest1: { at: [142, 149], along: "x", w: 30 },
  chest2: { at: [142, 137], along: "x", w: 30 },
  clear: { at: [142, 125], along: "x", w: 30 },
};
export const TAG_D = 10.5; // tape width (across the text)
// AED parts: tapes on the floor hugging the case, each beside its part (the case faces are too
// small for readable type): ON, SHOCK, PLUG along the near-right face; LID, ANALYSING in front.
export const AED_TAGS = {
  power: { at: [82, A.y0 + 16], along: "y", w: 32 },
  shock: { at: [94, A.y0 + 16], along: "y", w: 32 },
  plug: { at: [106, A.y0 + 16], along: "y", w: 32 },
  lid: { at: [(A.x0 + A.x1) / 2, A.y1 + 7], along: "x", w: 32 },
  analyse: { at: [(A.x0 + A.x1) / 2, A.y1 + 19], along: "x", w: 32 },
};
