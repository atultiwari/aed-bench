/* AED Bench · Sketchbook: the illustrated people. Each station shows a few registered sprites (assets/sprites/,
   placed in scene units by tools/register_sprite.py and tools/extract_layer.py; see assets/generated/README.md).
   A "people" sprite shows the patient (and anyone touching him); a "helper" sprite shows Helper B alone, sometimes
   with the AED. The code still draws the floor, tapes, phone, the AED when nobody is kneeling at it, the pads that
   are not in a picture, the shock, bubbles and rings. */

// placements (scene units, Sketchbook projection with OX = OY = 0) from assets/sprites/sprites.json
const AED_SPR = {
  P1: [-84.823, 24.66, 172.266, 116.211], P3: [-83.65, 25.98, 171.314, 114.618],
  A0: [-128.301, -69.104, 52.518, 180.896], A1: [-128.667, -15.711, 74.967, 128.317], A2: [-140.864, 13.335, 232.033, 123.068], A3: [-131.029, 22.247, 217.178, 111.896],
  A4: [-124.163, -16.907, 215.055, 152.788], A5: [-133.67, 15.824, 226.283, 120.796], A6: [-133.67, 15.824, 226.283, 120.796],
  A7: [-128.264, 22.74, 214.868, 110.706], A8: [-108.971, -14.593, 195.609, 147.891],
  B1: [93.608, -97.454, 40.36, 196.956], B2: [105.989, -105.909, 92.735, 175.217], B3: [102.001, -106.915, 94.813, 185.317],
  B4: [-278.69, -25.934, 88.972, 170.881], B5: [-251.287, 60.589, 128.948, 135.411], B6: [-183.791, 5.112, 270.591, 132.626],
  B6d: [-183.791, 5.112, 270.591, 132.626], B7: [-110.047, 25.189, 198.035, 147.106], B7d: [-110.047, 25.189, 198.035, 147.106],
  B5on: [-251.287, 60.589, 128.948, 135.411], B5idle: [-248.226, 52.968, 125.764, 143.142],
  C17: [-118.233, 15.137, 209.097, 111.6], C17d: [-118.233, 15.137, 209.097, 111.6], C17b: [-135.56, 22.763, 221.799, 114.277],
  B8: [-262.471, 21.354, 140.184, 174.646], AED: [-246.152, 122.979, 123.865, 73.021],
};
// the AED sprite's shock button (centre x, y and radii, scene units): covered unless a shock is advised
const AED_SPR_SHOCK = [-162.922, 150.721, 5.875, 3.162];
// where the helper sprites were posed (world cm, on the floor), so a moving helper can be shifted along his path
const AED_SPR_AT = { B2: [158, -10, 0], B3: [158, -10, 0], B4: [10, 290, 0] };
// which sprites already show the AED, and which already show pads
const AED_SPR_HAS_AED = new Set(['B5', 'B5on', 'B5idle', 'B8']);
// the B8 sprite shows the shock button lit: true only from 'shock advised' until the shock
const AED_SPR_LIT_OK = new Set(['clear']);
const AED_SPR_PADS = { B6: [1], B6d: [1], B7: [1, 2], B7d: [1, 2], C17: [1], C17d: [1], C17b: [1] };   // pad 2 is drawn by code in C17/C17b (the pictures had it too low)

/* which sprites a moment shows: { people: id, helper: id|null, helperAt: [x,y,z]|null, aedCode: bool } */
function aedSpriteLayers(L, now) {
  const k = L.key, u = L.u, push = L.dip > .5;
  const comp = L.breath && k === 'chest1' ? 'A7' : push ? 'A6' : 'A5';
  const run = Math.floor(now * 6) % 2 ? 'B2' : 'B3';
  const lay = { people: 'P1', helper: 'B1', helperAt: null, front: true };
  switch (k) {
    // standing while she checks the scene is safe (ERC Fig. 7 "Safety"), kneeling once she is beside him
    case 'start': case 'safe': lay.people = 'P1'; lay.solo = 'A0'; break;
    case 'call': lay.people = 'P1'; lay.solo = 'A1'; break;
    case 'shoulders': lay.people = 'A2'; break;
    case 'airway': lay.people = 'A3'; break;
    case 'helper':
      lay.people = 'A4';
      if (u >= .35) { const t = ease(Math.min(1, (u - .35) / .65)); lay.helper = run; lay.helperAt = [158, -10 - 90 * t, 0]; lay.fade = t > .8 ? (1 - t) / .2 : 1; }
      break;
    case 'chest1': lay.people = comp; lay.helper = null; break;
    case 'lid':
      lay.people = comp;
      if (u < .4) { const t = ease(u / .4); lay.helper = 'B4'; lay.helperAt = [-40 + 50 * t, 340 - 50 * t, 0]; lay.front = false; }
      else { lay.helper = 'B5idle'; lay.front = false; }
      break;
    case 'power': lay.people = comp; lay.helper = u < .3 ? 'B5idle' : 'B5on'; lay.front = false; break;
    case 'bare': lay.people = u < .6 ? comp : push ? 'B6d' : 'B6'; lay.helper = u < .6 ? 'B5idle' : null; lay.front = false; break;
    case 'pad1': lay.people = push ? 'B6d' : 'B6'; lay.helper = null; break;
    case 'pad2': case 'plug': lay.people = push ? 'B7d' : 'B7'; lay.helper = null; break;
    case 'analyse': case 'clear': case 'next': lay.people = 'A8'; lay.helper = 'B8'; lay.front = false; break;
    case 'shock': lay.people = 'A8'; lay.helper = 'B5'; lay.front = false; break;
    // CPR straight after the shock: bare chest, both pads on; the helper waits at the AED, hands off its buttons
    case 'chest2': lay.people = L.breath ? 'C17b' : push ? 'C17d' : 'C17'; lay.helper = 'B5idle'; lay.front = false; break;
  }
  lay.aedCode = L.aedHere && !(lay.helper && AED_SPR_HAS_AED.has(lay.helper));
  lay.padsInImage = AED_SPR_PADS[lay.people] || [];
  return lay;
}

/* an <image> for a sprite, shifted (in world cm) from where it was posed */
// the AED/B8 picture shows the shock button lit, with a glow. Until "shock advised" it is covered: the grey panel
// over the glow, then a plain orange button (scene units, measured on tools/sprite_grid.py AED)
function aedShockUnlit() {
  const o = P(0, 0, 0), [x, y, rx, ry] = AED_SPR_SHOCK, X = x + o[0], Y = y + o[1];
  return `<ellipse cx="${f(X)}" cy="${f(Y + .4)}" rx="${f(rx * 1.45)}" ry="${f(ry * 1.75)}" fill="#545150"/>`
    + `<ellipse cx="${f(X)}" cy="${f(Y + .9)}" rx="${f(rx)}" ry="${f(ry)}" fill="#a8520c" stroke="#5a2c06" stroke-width=".5"/>`
    + `<ellipse cx="${f(X)}" cy="${f(Y)}" rx="${f(rx)}" ry="${f(ry)}" fill="#e2780c" stroke="#5a2c06" stroke-width=".5"/>`;
}
// the AED/B8 picture's screen (dark in the picture): lit green once the AED is switched on
const AED_SPR_SCREEN = [[-196, 142.5], [-165.5, 128.3], [-151.3, 135.8], [-180.3, 150.3]];
function aedScreenLit(d = [0, 0]) {
  const o = P(0, 0, 0);
  return `<path d="M${AED_SPR_SCREEN.map(([x, y]) => f(x + o[0] + d[0]) + ' ' + f(y + o[1] + d[1])).join('L')}Z" fill="#9be8b4" stroke="#1d3a2a" stroke-width=".5" opacity=".95"/>`;
}
// the open AED on its own (when nobody kneels at it): screen lit once on, shock button unlit unless a shock is advised
function aedSpriteAED(lit, on) {
  return aedSpriteImg('AED') + (on ? aedScreenLit() : '') + (lit ? '' : aedShockUnlit());
}
// B8 and B5 drew the AED's screen dark: light it whenever the AED is on (B5's AED sits AED_B5_SHIFT from B8's)
function aedHelperScreen(id, on) {
  if (!on) return '';
  return id === 'B8' ? aedScreenLit() : id === 'B5' ? aedScreenLit(AED_B5_SHIFT) : '';
}
// the B8 sprite at moments when its shock button must not be lit
function aedB8Cover(id, key) {
  if (id !== 'B8' || AED_SPR_LIT_OK.has(key)) return '';
  return aedShockUnlit();
}
// B5idle's screen outline (scene units): darkened while the AED is still off (the LID station, before ON)
const AED_SPR_IDLE_SCREEN = [[-178.6, 147.6], [-161.3, 138.4], [-153.1, 143.2], [-170.6, 152.5]];
function aedScreenOff() {
  const o = P(0, 0, 0);
  return `<path d="M${AED_SPR_IDLE_SCREEN.map(([x, y]) => f(x + o[0]) + ' ' + f(y + o[1])).join('L')}Z" fill="#1f3a2c" stroke="#16261d" stroke-width=".4"/>`;
}
function aedSpriteShift(id, opt) {
  const o = P(0, 0, 0);                                     // the scene's own offset (OX, OY)
  if (!opt.at || !AED_SPR_AT[id]) return o;
  const a = P(...opt.at), b = P(...AED_SPR_AT[id]);
  return [o[0] + a[0] - b[0], o[1] + a[1] - b[1]];
}
function aedSpriteImg(id, opt = {}) {
  const [x, y, w, h] = AED_SPR[id], [dx, dy] = aedSpriteShift(id, opt), jy = opt.jerk ? -opt.jerk * 3 : 0;
  return `<image href="../assets/sprites/${id}.webp" x="${f(x + dx)}" y="${f(y + dy + jy)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none"${opt.opacity != null ? ` opacity="${f(opt.opacity)}"` : ''}/>`;
}
// the top centre of a sprite on screen (for bubbles and rings)
function aedSpriteTop(id, opt = {}) {
  const [x, y, w] = AED_SPR[id], [dx, dy] = aedSpriteShift(id, opt);
  return [x + dx + w / 2, y + dy];
}

/* ---------- anchors measured on the illustrations (scene units, the same frame as AED_SPR) ----------
   Read off tools/sprite_grid.py renders. Everything that points at the picture (rings, bubbles, pads, the shock,
   cables) uses these, never the old code skeleton. */
// where the active-station ring goes, by station key (helper/safe use the moving sprites' tops instead)
const AED_RING = {
  start: [-43, 95], shoulders: [-80, 94], airway: [-86, 100], chest1: [-62, 93], lid: [-193, 172], power: [-143, 144],
  bare: [-62, 93], pad1: [-75, 97], pad2: [-19, 115], plug: [-150, 163], analyse: [-177, 134], shock: [-159, 153],
  chest2: [-46, 87], next: [-177, 134],
};
// the top of each person's head, per sprite (for speech bubbles); A = Rescuer A, B = Helper B
const AED_HEAD = {
  A0: { A: [-108, -68] }, A1: { A: [-71, -12] },
  A2: { A: [-83, 22] }, A3: { A: [-72, 46] }, A4: { A: [-80, -16] }, A5: { A: [-57, 12] }, A6: { A: [-57, 18] },
  A7: { A: [-79, 42] }, A8: { A: [-65, -14] }, B6: { A: [-54, 6], B: [-104, 28] }, B6d: { A: [-54, 11], B: [-104, 28] },
  B7: { A: [-38, 28], B: [-20, 56] }, B7d: { A: [-38, 32], B: [-20, 56] }, C17: { A: [-38, 14] }, C17d: { A: [-38, 18] }, C17b: { A: [-79, 42] },
  B5: { B: [-179, 64] }, B5on: { B: [-179, 64] }, B5idle: { B: [-196, 52] }, B8: { B: [-190, 22] },
};
// the patient's mouth, per people sprite (for the '2 breaths' bubble)
const AED_MOUTH = { A3: [-78, 93], A7: [-84, 90], A5: [-92, 113], A6: [-92, 113], C17: [-88, 106], C17d: [-88, 106], C17b: [-81, 84] };
// the pads on the patient, per people sprite: [x, y] centres. Sprites that show pads list them; A8 needs them drawn
const AED_PADS = { B6: [[-75, 97]], B6d: [[-75, 97]], B7: [[-70, 107], [-27, 119]], B7d: [[-70, 107], [-27, 119]],
  C17: [[-62, 92], [-32, 104.5]], C17d: [[-62, 92], [-32, 104.5]], C17b: [[-59, 96], [-32, 108]],
  // pad 2 on the left mid-axillary line at nipple level (the left nipple is at about (-32, 103) in A8)
  A8: [[-50, 94], [-28, 108]] };
// the AED's screen and its near-face socket, in the AED/B8 picture; the B5 family's AED sits 7 right, 4 down
const AED_AED = { screen: [-177, 134], socket: [-150, 163] }, AED_B5_SHIFT = [7, 4];
const aedAt = ([x, y]) => { const o = P(0, 0, 0); return [x + o[0], y + o[1]]; };
function aedAedPoint(which, helper) {
  const p = AED_AED[which], d = helper && helper.startsWith('B5') ? AED_B5_SHIFT : [0, 0];
  return [p[0] + d[0], p[1] + d[1]];
}
