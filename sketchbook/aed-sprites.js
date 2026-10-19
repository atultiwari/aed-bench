/* AED Bench · Sketchbook: the illustrated people. Each station shows a few registered sprites (assets/sprites/,
   placed in scene units by tools/register_sprite.py and tools/extract_layer.py; see assets/generated/README.md).
   A "people" sprite shows the patient (and anyone touching him); a "helper" sprite shows Helper B alone, sometimes
   with the AED. The code still draws the floor, tapes, phone, the AED when nobody is kneeling at it, the pads that
   are not in a picture, the shock, bubbles and rings. */

// placements (scene units, Sketchbook projection with OX = OY = 0) from assets/sprites/sprites.json
const AED_SPR = {
  P1: [-84.823, 24.66, 172.266, 116.211], P3: [-83.65, 25.98, 171.314, 114.618],
  A1: [-128.667, -15.711, 74.967, 128.317], A2: [-140.864, 13.335, 232.033, 123.068], A3: [-132.794, 21.755, 219.489, 113.086],
  A4: [-124.163, -16.907, 215.055, 152.788], A5: [-133.67, 15.824, 226.283, 120.796], A6: [-133.67, 15.824, 226.283, 120.796],
  A7: [-128.264, 22.74, 214.868, 110.706], A8: [-108.971, -14.593, 195.609, 147.891],
  B1: [93.608, -97.454, 40.36, 196.956], B2: [105.989, -105.909, 92.735, 175.217], B3: [102.001, -106.915, 94.813, 185.317],
  B4: [-278.69, -25.934, 88.972, 170.881], B5: [-251.287, 60.589, 128.948, 135.411], B6: [-183.791, 5.112, 270.591, 132.626],
  B6d: [-183.791, 5.112, 270.591, 132.626], B7: [-110.047, 25.189, 198.035, 147.106], B7d: [-110.047, 25.189, 198.035, 147.106],
  B8: [-262.471, 21.354, 140.184, 174.646], AED: [-246.152, 122.979, 123.865, 73.021],
};
// the AED sprite's shock button (centre x, y and radii, scene units): covered unless a shock is advised
const AED_SPR_SHOCK = [-162.922, 150.721, 5.875, 3.162];
// where the helper sprites were posed (world cm, on the floor), so a moving helper can be shifted along his path
const AED_SPR_AT = { B2: [158, -10, 0], B3: [158, -10, 0], B4: [10, 290, 0] };
// which sprites already show the AED, and which already show pads
const AED_SPR_HAS_AED = new Set(['B5', 'B8']);
// the B8 sprite shows the shock button lit: true only from 'shock advised' until the shock
const AED_SPR_LIT_OK = new Set(['clear']);
const AED_SPR_PADS = { B6: [1], B6d: [1], B7: [1, 2], B7d: [1, 2] };

/* which sprites a moment shows: { people: id, helper: id|null, helperAt: [x,y,z]|null, aedCode: bool } */
function aedSpriteLayers(L, now) {
  const k = L.key, u = L.u, push = L.dip > .5;
  const comp = L.breath && k === 'chest1' ? 'A7' : push ? 'A6' : 'A5';
  const run = Math.floor(now * 6) % 2 ? 'B2' : 'B3';
  const lay = { people: 'P1', helper: 'B1', helperAt: null, front: true };
  switch (k) {
    case 'start': case 'safe': case 'call': lay.people = 'P1'; lay.a1 = true; break;
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
      else { lay.helper = 'B5'; lay.front = false; }
      break;
    case 'power': lay.people = comp; lay.helper = 'B5'; lay.front = false; break;
    case 'bare': lay.people = u < .6 ? comp : push ? 'B6d' : 'B6'; lay.helper = u < .6 ? 'B5' : null; lay.front = false; break;
    case 'pad1': lay.people = push ? 'B6d' : 'B6'; lay.helper = null; break;
    case 'pad2': case 'plug': lay.people = push ? 'B7d' : 'B7'; lay.helper = null; break;
    case 'analyse': case 'clear': case 'next': lay.people = 'A8'; lay.helper = 'B8'; lay.front = false; break;
    case 'shock': lay.people = 'A8'; lay.helper = 'B5'; lay.front = false; break;
    // PLACEHOLDER until a "compressions on the bare chest with both pads on" image exists: shirt-closed frames
    case 'chest2': lay.people = push ? 'A6' : 'A5'; lay.helper = 'B5'; lay.front = false; lay.placeholder = true; break;
  }
  lay.aedCode = L.aedHere && !(lay.helper && AED_SPR_HAS_AED.has(lay.helper));
  lay.padsInImage = AED_SPR_PADS[lay.people] || [];
  return lay;
}

/* an <image> for a sprite, shifted (in world cm) from where it was posed */
// the open AED on its own (when nobody kneels at it), with the shock button dark unless a shock is advised
function aedSpriteAED(lit) {
  const o = P(0, 0, 0), [x, y, rx, ry] = AED_SPR_SHOCK;
  return aedSpriteImg('AED') + (lit ? '' : `<ellipse cx="${f(x + o[0])}" cy="${f(y + o[1])}" rx="${f(rx * 1.05)}" ry="${f(ry * 1.15)}" fill="#e2780c" stroke="#7a3a06" stroke-width=".5"/>`);
}
// the B8 sprite at moments when its shock button must not be lit
function aedB8Cover(id, key) {
  if (id !== 'B8' || AED_SPR_LIT_OK.has(key)) return '';
  const o = P(0, 0, 0), [x, y, rx, ry] = AED_SPR_SHOCK;
  return `<ellipse cx="${f(x + o[0])}" cy="${f(y + o[1])}" rx="${f(rx * 1.05)}" ry="${f(ry * 1.15)}" fill="#e2780c" stroke="#7a3a06" stroke-width=".5"/>`;
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
