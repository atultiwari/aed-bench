/* ============================================================
   AED Bench, Turntable: materials, ink outlines, shape helpers and the printed labels.
   aedKit(T, L) returns the helpers aed-build.js uses. All positions are AED.WORLD cm, mapped by aedW().
   ============================================================ */
function aedKit(T, L) {
  const grad = new T.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, T.RedFormat);
  grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
  const toonCache = new Map(), lineMats = [];
  const toon = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!toonCache.has(key)) toonCache.set(key, new T.MeshToonMaterial({ color, gradientMap: grad, ...extra }));
    return toonCache.get(key);
  };
  const toonNew = (color, extra = {}) => new T.MeshToonMaterial({ color, gradientMap: grad, ...extra });
  const lineMat = (color, width, opacity = 1) => {
    const m = new L.LineMaterial({ color, linewidth: width, transparent: opacity < 1, opacity });
    lineMats.push(m); return m;
  };
  const INK_LINE = lineMat(INK, 1.6), INK_THIN = lineMat(INK, 1);
  const hullMat = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
  const noPick = o => { o.raycast = () => {}; return o; };
  const edges = (mesh, mat = INK_LINE, angle = 30) => {
    const g = new L.LineSegmentsGeometry().fromEdgesGeometry(new T.EdgesGeometry(mesh.geometry, angle));
    mesh.add(noPick(new L.LineSegments2(g, mat)));
    return mesh;
  };
  // a box between two corners in WORLD cm
  const boxAt = (x0, y0, z0, x1, y1, z1, mat) => {
    const m = new T.Mesh(new T.BoxGeometry(Math.abs(y1 - y0), Math.abs(z1 - z0), Math.abs(x1 - x0)), mat);
    m.position.copy(aedW(T, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  // a ball with an ink hull
  const ball = (r, mat, seg = 14) => {
    const m = new T.Mesh(new T.SphereGeometry(r, seg, Math.round(seg * .75)), mat);
    m.castShadow = true;
    m.add(noPick(new T.Mesh(new T.SphereGeometry(r + .7, seg, Math.round(seg * .75)), hullMat)));
    return m;
  };
  // a limb: a unit-length rod (along local Y) with an ink hull, stretched between two points each frame by setLimb()
  const limb = (r, mat) => {
    const m = new T.Mesh(new T.CylinderGeometry(r, r, 1, 12), mat);
    m.castShadow = true;
    m.add(noPick(new T.Mesh(new T.CylinderGeometry(r + .7, r + .7, 1, 12), hullMat)));
    return m;
  };
  const UP = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
  const setLimb = (m, a, b) => {          // a, b: Three vectors
    tmp.subVectors(b, a);
    const len = Math.max(.01, tmp.length());
    m.position.copy(a).addScaledVector(tmp, .5);
    m.quaternion.setFromUnitVectors(UP, tmp.multiplyScalar(1 / len));
    m.scale.set(1, len, 1);
  };
  const rodW = (a, b, r, mat) => { const m = limb(r, mat); setLimb(m, a, b); return m; };
  const rod = (a, b, r, mat) => rodW(aedW(T, ...a), aedW(T, ...b), r, mat);
  const canvasTex = cv => { const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { toon, toonNew, lineMat, INK_LINE, INK_THIN, edges, boxAt, ball, limb, setLimb, rod, rodW, noPick, hullMat, canvasTex, lineMats };
}

/* ---------- a printed label: the station's lines and its number badge; lit = accent ---------- */
const AED_TAG = { w: 24, h1: 8, h2: 11.5, px: 14 };
function aedTagCanvas(s0, lit) {
  const two = s0.lines.length > 1, Wd = AED_TAG.w, H = two ? AED_TAG.h2 : AED_TAG.h1, px = AED_TAG.px;
  const cv = document.createElement('canvas'); cv.width = Wd * px; cv.height = H * px;
  const g = cv.getContext('2d'); g.scale(px, px);
  g.beginPath(); g.roundRect(.25, .25, Wd - .5, H - .5, 1.6);
  g.fillStyle = lit ? ACCENT : '#fbf7ea'; g.fill(); g.lineWidth = .45; g.strokeStyle = INK; g.stroke();
  const r = 2.9, bx = 1.1 + r, by = H / 2;
  g.beginPath(); g.arc(bx, by, r, 0, 2 * Math.PI); g.fillStyle = INK; g.fill();
  g.fillStyle = '#fbf7ea'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${s0.num > 9 ? 3 : 3.5}px ui-monospace, Menlo, monospace`; g.fillText(String(s0.num), bx, by + .2);
  g.fillStyle = INK;
  const x0 = bx + r + .9, tw = Wd - x0 - .9;
  s0.lines.forEach((t, i) => {
    g.font = '800 4px ui-monospace, Menlo, monospace';
    const fs = Math.min(4, 4 * tw / g.measureText(t).width);
    g.font = `800 ${fs.toFixed(2)}px ui-monospace, Menlo, monospace`;
    g.fillText(t, x0 + tw / 2, two ? H / 2 + (i - .5) * 4.6 + .2 : H / 2 + .3);
  });
  return { cv, Wd, H };
}
// one material whose texture swaps between plain and lit
function aedTagMat(T, k, s0) {
  const first = aedTagCanvas(s0, false), texs = { false: k.canvasTex(first.cv) };
  const mat = new T.MeshBasicMaterial({ map: texs.false, side: T.FrontSide });
  let cur = false;
  const setLit = lit => {
    if (lit === cur) return;
    cur = lit;
    if (!texs[lit]) texs[lit] = k.canvasTex(aedTagCanvas(s0, lit).cv);
    mat.map = texs[lit]; mat.needsUpdate = true;
  };
  return { mat, w: first.Wd, h: first.H, setLit };
}
// a tent card standing on the floor or mat, leaning back, facing the viewer; a strut holds it up
function aedTent(T, k, s0, x, y, lean = 32) {
  const tm = aedTagMat(T, k, s0), g = new T.Group(), a = lean * Math.PI / 180;
  const plate = new T.Mesh(new T.PlaneGeometry(tm.w, tm.h), tm.mat);
  const back = k.edges(new T.Mesh(new T.BoxGeometry(tm.w, tm.h, .5), k.toon('#e9e2cf')), k.INK_THIN);
  const card = new T.Group();
  plate.position.set(0, tm.h / 2, .27); back.position.set(0, tm.h / 2, 0);
  card.add(back, plate);
  card.rotation.x = -a;
  const strut = k.edges(new T.Mesh(new T.BoxGeometry(tm.w * .6, .5, tm.h * Math.sin(a) + 1), k.toon('#d8cfb8')), k.INK_THIN);
  strut.position.set(0, .25, -tm.h * Math.sin(a) / 2);
  g.add(card, strut);
  g.position.copy(aedW(T, x, y, 0));
  return { root: g, setLit: tm.setLit };
}
// a flag on a pole with a weighted foot; the plate is printed on both faces
function aedFlag(T, k, s0, x, y, pole = 44) {
  const tm = aedTagMat(T, k, s0), g = new T.Group();
  const foot = k.edges(new T.Mesh(new T.CylinderGeometry(5, 6, 2, 16), k.toon('#6d6658')), k.INK_THIN, 50);
  foot.position.set(0, 1, 0);
  const stick = k.rodW(new T.Vector3(0, 2, 0), new T.Vector3(0, pole + 2, 0), .8, k.toon('#8a7f6c'));
  const front = new T.Mesh(new T.PlaneGeometry(tm.w, tm.h), tm.mat), back = new T.Mesh(new T.PlaneGeometry(tm.w, tm.h), tm.mat);
  const board = k.edges(new T.Mesh(new T.BoxGeometry(tm.w, tm.h, .4), k.toon('#e9e2cf')), k.INK_THIN);
  const yTop = pole + 2 - tm.h / 2;
  [board, front, back].forEach(m => m.position.set(tm.w / 2 + .8, yTop, 0));
  front.position.z = .22; back.position.z = -.22; back.rotation.y = Math.PI;
  g.add(foot, stick, board, front, back);
  g.position.copy(aedW(T, x, y, 0));
  return { root: g, setLit: tm.setLit };
}

/* ---------- speech bubbles: camera-facing sprites (words people say, not station labels) ---------- */
function aedBubbleCanvas(text, tone) {
  const fs = 30, pad = 22, maxW = 470, cv = document.createElement('canvas'), g = cv.getContext('2d');
  g.font = `700 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const words = text.split(' '), lines = [];
  words.forEach(w => {
    const last = lines[lines.length - 1];
    if (last && g.measureText(last + ' ' + w).width < maxW) lines[lines.length - 1] = last + ' ' + w;
    else lines.push(w);
  });
  const w = Math.ceil(Math.max(...lines.map(l => g.measureText(l).width)) + pad * 2), h = lines.length * fs * 1.22 + pad * 1.4, tail = 26;
  cv.width = w + 8; cv.height = Math.ceil(h + tail + 8);
  g.font = `700 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  g.beginPath(); g.roundRect(4, 4, w, h, 18);
  g.moveTo(w / 2 - 14 + 4, h + 4); g.lineTo(w / 2 + 4, h + tail + 2); g.lineTo(w / 2 + 16 + 4, h + 4);
  g.fillStyle = tone === 'AED' ? '#e4f4ea' : '#ffffff'; g.fill();
  g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, cv.width / 2, 4 + pad * .7 + fs * 1.22 * (i + .5)));
  return cv;
}
function aedBubble(T, k) {
  const mat = new T.SpriteMaterial({ transparent: true, depthTest: false });
  const sprite = new T.Sprite(mat); sprite.renderOrder = 20; sprite.visible = false; sprite.center.set(.5, 0);
  k.noPick(sprite);
  const cache = new Map();
  let cur = '';
  const show = (text, tone, at, size = 1) => {
    if (!text) { sprite.visible = false; return; }
    const key = tone + '|' + text;
    if (key !== cur) {
      if (!cache.has(key)) { const cv = aedBubbleCanvas(text, tone); cache.set(key, { t: k.canvasTex(cv), w: cv.width, h: cv.height }); }
      const e = cache.get(key); mat.map = e.t; mat.needsUpdate = true; cur = key;
      sprite.userData.wh = [e.w, e.h];
    }
    const cm = .14 * size, [w, h] = sprite.userData.wh;
    sprite.scale.set(w * cm, h * cm, 1);
    sprite.position.copy(at);
    sprite.visible = true;
  };
  return { sprite, show };
}
