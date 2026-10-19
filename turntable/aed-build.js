/* ============================================================
   AED Bench, Turntable: builds the floor scene. aedBuild(T, L) returns the objects aed-pose.js moves.
   World: X = right (= -y of AED.WORLD), Y = up (= z), Z = toward the viewer (= x). See aedW() in aed-data.js.
   ============================================================ */
function aedBuild(T, L) {
  const k = aedKit(T, L), scene = new T.Scene();
  scene.background = new T.Color('#f2efe7');
  aedLights(T, scene);
  scene.add(aedFloor(T, k));
  const patient = aedPatient(T, k), A = aedFigure(T, k, COL.rescuerA, COL.jeans), B = aedFigure(T, k, COL.helperB, '#55505a');
  patient.root.traverse(o => { o.userData.body = true; });
  A.root.traverse(o => { o.userData.rescuer = true; });
  B.root.traverse(o => { o.userData.station = I.helper; });
  const aed = aedMachine(T, k), phone = aedPhone(T, k), pads = aedPads(T, k), fx = aedEffects(T, k);
  scene.add(patient.root, A.root, B.root, aed.root, phone.root, pads.root, fx.root);
  const labels = aedLabels(T, k);
  labels.forEach(l => scene.add(l.root));
  return { scene, k, patient, A, B, aed, phone, pads, fx, labels, lineMats: k.lineMats };
}

function aedLights(T, scene) {
  scene.add(new T.HemisphereLight('#ffffff', '#cdbfa6', 1.9));
  const sun = new T.DirectionalLight('#ffffff', 1.5);
  sun.position.set(-120, 420, 220);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -230, right: 230, top: 230, bottom: -230, near: 50, far: 1000 });
  sun.shadow.bias = -.0008;
  scene.add(sun);
}

// a warm wooden floor patch (a little larger than AED.WORLD.floor) and a grey-green exercise mat under the person
function aedFloor(T, k) {
  const g = new T.Group(), F = AW.floor, m = 14;
  const wood = k.edges(k.boxAt(F.x0 - m, F.y0 - m, -4, F.x1 + m, F.y1 + m, -.6, k.toon(COL.floor)));
  wood.castShadow = false;
  g.add(wood);
  for (let x = F.x0 - m + 22; x < F.x1 + m; x += 22) {
    const seam = k.boxAt(x - .25, F.y0 - m, -.62, x + .25, F.y1 + m, -.55, k.toon(COL.floorDark));
    seam.castShadow = false; g.add(seam);
  }
  const mat = k.edges(k.boxAt(68, 4, -.6, 182, 238, 0, k.toon(COL.mat)), k.INK_THIN);
  mat.castShadow = false;
  g.add(mat);
  g.traverse(o => { o.raycast = () => {}; });
  return g;
}

/* ---------- the person: supine along y, head at +y ---------- */
function aedPatient(T, k) {
  const root = new T.Group(), B0 = AW.body, cx = B0.x, t = B0.torso;
  const shirt = k.toon(COL.shirt), skin = k.toon(COL.skin), trousers = k.toon(COL.trousers), shoe = k.toon('#2d2a28');
  const add = m => { root.add(m); return m; };
  // legs, feet, hips
  [-8.5, 8.5].forEach(dx => {
    add(k.edges(k.boxAt(cx + dx - 6.5, B0.feetY + 4, 0, cx + dx + 6.5, B0.hips.y0 + 4, 13, trousers)));
    add(k.edges(k.boxAt(cx + dx - 5, B0.feetY - 4, 0, cx + dx + 5, B0.feetY + 4, 16, shoe)));
  });
  add(k.edges(k.boxAt(cx - 18, B0.hips.y0, 0, cx + 18, B0.hips.y1, 19, trousers)));
  add(k.edges(k.boxAt(cx - t.halfW, t.y0, 0, cx + t.halfW, 150, t.h, shirt)));
  // the chest: a box that dips with each push (scaled about the floor); shirt flaps open at BARE CHEST
  const chest = new T.Group();
  chest.position.copy(aedW(T, cx, (150 + t.y1) / 2, 0));
  const len = t.y1 - 150, wd = 2 * t.halfW;
  const box = k.edges(new T.Mesh(new T.BoxGeometry(len, t.h, wd), [shirt, shirt, skin, shirt, skin, skin]));
  box.position.y = t.h / 2; box.castShadow = box.receiveShadow = true;
  chest.add(box);
  const flap = side => {         // side +1 = near (patient's left), -1 = far (patient's right)
    const p = new T.Group(); p.position.set(0, 0, side * (wd / 2 + .5));
    const top = k.edges(new T.Mesh(new T.BoxGeometry(len + .6, .8, wd / 2 + .5), shirt), k.INK_THIN);
    top.position.set(0, t.h + .4, -side * (wd / 4 + .25));
    const wall = k.edges(new T.Mesh(new T.BoxGeometry(len + .6, t.h + .8, .8), shirt), k.INK_THIN);
    wall.position.set(0, (t.h + .8) / 2, 0);
    // buttons on the near flap's front edge
    if (side > 0) [-12, 0, 12].forEach(dy => { const b = new T.Mesh(new T.CylinderGeometry(.9, .9, .4, 10), k.toon('#e8ecf3')); b.position.set(dy, t.h + .9, -wd / 2 + 1.6); top.add(b); });
    p.add(top, wall);
    chest.add(p);
    return p;
  };
  const flaps = [flap(1), flap(-1)];
  root.add(chest);
  // neck, head (on a pivot at the neck so it can tilt back), hair at the back and top
  add(k.rod([cx, t.y1 - 2, 9], [cx, B0.head.y - 6, 9], 6, skin));
  const headPivot = new T.Group(); headPivot.position.copy(aedW(T, cx, t.y1 + 6, 8));
  const head = k.ball(B0.head.r, skin, 18);
  head.position.copy(aedWv(T, 0, B0.head.y - t.y1 - 6, B0.head.z - 8));
  const hair = new T.Mesh(new T.SphereGeometry(B0.head.r + .9, 18, 10, 0, Math.PI * 2, 0, Math.PI * .55), k.toon(COL.hair));
  hair.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), aedWv(T, 0, .75, -.66).normalize());
  head.add(hair);
  const nose = k.ball(2, skin, 8); nose.position.copy(aedWv(T, 0, -3, B0.head.r - .5)); head.add(nose);
  headPivot.add(head);
  root.add(headPivot);
  // arms along the sides: short sleeves, then skin
  [-1, 1].forEach(sd => {
    const x = cx + sd * B0.armHalfSpread;
    add(k.rod([cx + sd * 21, t.y1 - 4, 9], [x, 152, 6], 5.6, shirt));
    add(k.rod([x, 152, 6], [x, B0.hips.y0 + 14, 5], 4.6, skin));
    const hand = k.ball(5, skin); hand.position.copy(aedW(T, x, B0.hips.y0 + 9, 5)); add(hand);
  });
  return { root, chest, flaps, headPivot };
}

/* ---------- a rescuer: rounded, friendly, no face; posed every frame by aed-pose.js ---------- */
function aedFigure(T, k, top, legs) {
  const root = new T.Group(), skin = k.toon('#d9a27c'), topM = k.toon(top), legM = k.toon(legs), shoe = k.toon('#2d2a28');
  const P = {
    pelvis: k.ball(10, legM), torso: k.limb(11.5, topM), chest: k.ball(12.5, topM), neck: k.limb(4.5, skin),
    head: k.ball(10.5, skin, 18),
    upper: [k.limb(4.4, topM), k.limb(4.4, topM)], fore: [k.limb(3.9, topM), k.limb(3.9, topM)],
    shoulder: [k.ball(5, topM), k.ball(5, topM)], elbow: [k.ball(4.1, topM), k.ball(4.1, topM)], hand: [k.ball(4.4, skin), k.ball(4.4, skin)],
    thigh: [k.limb(6.6, legM), k.limb(6.6, legM)], shin: [k.limb(5.6, legM), k.limb(5.6, legM)],
    knee: [k.ball(6.4, legM), k.ball(6.4, legM)], foot: [k.ball(5.2, shoe), k.ball(5.2, shoe)],
  };
  const hair = new T.Mesh(new T.SphereGeometry(11.3, 18, 10, 0, Math.PI * 2, 0, Math.PI * .5), k.toon(COL.hair));
  hair.rotation.x = -.5; P.head.add(hair);
  Object.values(P).flat().forEach(m => root.add(m));
  const v = (a, out = new T.Vector3()) => out.copy(aedW(T, ...a));
  const set = pose => {
    root.visible = pose.visible !== false;
    if (!root.visible) return;
    const s = pose;
    P.pelvis.position.copy(v(s.hip)); P.chest.position.copy(v(s.chest)); P.head.position.copy(v(s.head));
    k.setLimb(P.torso, v(s.hip), v(s.chest)); k.setLimb(P.neck, v(s.chest), v(s.head));
    P.head.rotation.set(0, s.yaw || 0, 0);
    [0, 1].forEach(j => {
      P.shoulder[j].position.copy(v(s.sh[j])); P.elbow[j].position.copy(v(s.el[j])); P.hand[j].position.copy(v(s.ha[j]));
      k.setLimb(P.upper[j], v(s.sh[j]), v(s.el[j])); k.setLimb(P.fore[j], v(s.el[j]), v(s.ha[j]));
      P.knee[j].position.copy(v(s.kn[j])); P.foot[j].position.copy(v(s.an[j]));
      k.setLimb(P.thigh[j], v(s.hp[j]), v(s.kn[j])); k.setLimb(P.shin[j], v(s.kn[j]), v(s.an[j]));
    });
  };
  return { root, set };
}

/* ---------- the AED: green case, lid hinged at the far edge, dark top panel, screen, ON, SHOCK, socket ---------- */
function aedMachine(T, k) {
  const a = AW.aed, root = new T.Group(), body = new T.Group();
  const cx = (a.x0 + a.x1) / 2, cy = (a.y0 + a.y1) / 2, dx = a.x1 - a.x0, dy = a.y1 - a.y0;
  const lw = (x, y, z) => aedWv(T, x, y - 0, z);          // local: dx toward viewer, dy toward left, dz up
  root.position.copy(aedW(T, cx, cy, 0));
  root.userData.home = root.position.clone();
  const green = k.toon(COL.aed), panel = k.toon(COL.panel);
  const caseM = k.edges(new T.Mesh(new T.BoxGeometry(dy, a.h, dx), green));
  caseM.position.y = a.h / 2; caseM.castShadow = caseM.receiveShadow = true;
  caseM.userData.station = I.lid;
  const top = new T.Mesh(new T.BoxGeometry(dy - 3, .5, dx - 3), panel);
  top.position.y = a.h + .1; top.userData.station = I.lid;
  body.add(caseM, top);
  // the screen, flat in the panel (CanvasTexture redrawn when the AED's words change)
  const scv = document.createElement('canvas'); scv.width = 440; scv.height = 260;
  const stex = k.canvasTex(scv);
  const screen = new T.Mesh(new T.PlaneGeometry(22, 13), new T.MeshBasicMaterial({ map: stex }));
  screen.rotation.x = -Math.PI / 2; screen.position.copy(lw(52 - cx, 0, a.h + .45)); screen.userData.station = I.analyse;
  const frame = k.edges(new T.Mesh(new T.BoxGeometry(23.4, .5, 14.4), k.toon('#1c1d1f')), k.INK_THIN);
  frame.position.copy(lw(52 - cx, 0, a.h + .2)); frame.userData.station = I.analyse;
  const btn = (x, y, r, col, station) => {
    const m = k.edges(new T.Mesh(new T.CylinderGeometry(r, r, 1.4, 20), k.toonNew(col, { emissive: '#000000' })), k.INK_THIN, 50);
    m.position.copy(lw(x - cx, y - cy, a.h + .8)); m.userData.station = station; m.castShadow = true;
    return m;
  };
  const on = btn(68, 233, 2.6, COL.on, I.power), shock = btn(64, 247, 3.3, COL.shock, I.shock);
  const bolt = document.createElement('canvas'); bolt.width = bolt.height = 64;
  const bg = bolt.getContext('2d'); bg.fillStyle = '#ffffff';
  bg.beginPath(); [[36, 6], [18, 36], [31, 36], [26, 58], [46, 26], [33, 26]].forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); bg.fill();
  const boltM = new T.Mesh(new T.CircleGeometry(2.6, 20), new T.MeshBasicMaterial({ map: k.canvasTex(bolt), transparent: true }));
  boltM.rotation.x = -Math.PI / 2; boltM.position.y = .72; boltM.rotation.z = Math.PI / 2; shock.add(boltM);
  const socket = k.edges(new T.Mesh(new T.BoxGeometry(6, 1.4, 3.4), k.toon('#202224')), k.INK_THIN);
  socket.position.copy(lw(72 - cx, 252 - cy, a.h + .7)); socket.userData.station = I.plug;
  body.add(screen, frame, on, shock, socket);
  // the lid, hinged on the far top edge; a white heart-and-lightning mark on top; the pad packet inside
  const lid = new T.Group(); lid.position.copy(lw(-dx / 2, 0, a.h));
  const lidBox = k.edges(new T.Mesh(new T.BoxGeometry(dy, a.lidH, dx), green));
  lidBox.position.set(0, a.lidH / 2, dx / 2); lidBox.castShadow = true; lidBox.userData.station = I.lid;
  const mcv = document.createElement('canvas'); mcv.width = mcv.height = 256;
  const mg = mcv.getContext('2d');
  mg.fillStyle = '#ffffff'; mg.beginPath(); mg.moveTo(128, 214);
  mg.bezierCurveTo(20, 140, 30, 50, 96, 50); mg.bezierCurveTo(116, 50, 128, 66, 128, 80);
  mg.bezierCurveTo(128, 66, 140, 50, 160, 50); mg.bezierCurveTo(226, 50, 236, 140, 128, 214); mg.fill();
  mg.fillStyle = COL.aed; mg.beginPath(); [[140, 70], [104, 136], [128, 136], [114, 190], [156, 116], [132, 116]].forEach(([x, y], i) => i ? mg.lineTo(x, y) : mg.moveTo(x, y)); mg.fill();
  const mark = new T.Mesh(new T.PlaneGeometry(dy * .62, dx * .62), new T.MeshBasicMaterial({ map: k.canvasTex(mcv), transparent: true }));
  mark.rotation.x = -Math.PI / 2; mark.position.set(0, a.lidH + .05, dx / 2 + 1); mark.userData.station = I.lid;
  const handle = k.rodW(new T.Vector3(-7, a.lidH, 4), new T.Vector3(7, a.lidH, 4), 1.1, k.toon('#1f6e3f'));
  const packet = k.edges(new T.Mesh(new T.BoxGeometry(20, 1.4, 15), k.toon('#d9dde2')), k.INK_THIN);
  packet.position.set(0, -.7, dx / 2 + 1);
  const packetFlap = new T.Mesh(new T.BoxGeometry(20, .3, 15), k.toon('#b8bfc8'));
  packetFlap.position.set(0, -1.5, dx / 2 + 1);
  lid.add(lidBox, mark, handle, packet, packetFlap);
  body.add(lid);
  root.add(body);
  return { root, body, lid, packet, packetFlap, screen: { cv: scv, tex: stex, last: '' }, on, shock, socket };
}

// the AED's screen: the station's words, an optional progress bar and an optional countdown
function aedDrawScreen(scr, text, bar, count) {
  const key = `${text}|${bar === null ? '' : Math.round(bar * 40)}|${count || ''}`;
  if (key === scr.last) return;
  scr.last = key;
  const g = scr.cv.getContext('2d'), W = scr.cv.width, H = scr.cv.height;
  g.fillStyle = text ? '#173326' : '#2a2d30'; g.fillRect(0, 0, W, H);
  if (text) {
    g.fillStyle = '#b9f5cf'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 40px system-ui, sans-serif';
    const words = text.split(' '), lines = [];
    words.forEach(w => { const l = lines[lines.length - 1]; if (l && g.measureText(l + ' ' + w).width < W - 40) lines[lines.length - 1] = l + ' ' + w; else lines.push(w); });
    const top = H / 2 - (lines.length - 1) * 23 - (bar !== null || count ? 26 : 0);
    lines.forEach((l, i) => g.fillText(l, W / 2, top + i * 46));
    if (bar !== null) {
      g.strokeStyle = '#b9f5cf'; g.lineWidth = 4; g.strokeRect(40, H - 54, W - 80, 26);
      g.fillStyle = '#ffd34d'; g.fillRect(44, H - 50, (W - 88) * bar, 18);
    }
    if (count) { g.font = '800 46px ui-monospace, Menlo, monospace'; g.fillStyle = '#ffd34d'; g.fillText(count, W / 2, H - 38); }
  }
  scr.tex.needsUpdate = true;
}

/* ---------- the phone on the floor: 108 / 112 on speaker ---------- */
function aedPhone(T, k) {
  const root = new T.Group(), [x, y, z] = AW.phone;
  const body = k.edges(k.boxAt(x - 4.2, y - 8.5, 0, x + 4.2, y + 8.5, z + .4, k.toon(COL.phone)));
  body.userData.station = I.call;
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 150;
  const tex = k.canvasTex(cv);
  const screen = new T.Mesh(new T.PlaneGeometry(15, 7.2), new T.MeshBasicMaterial({ map: tex }));
  screen.rotation.x = -Math.PI / 2; screen.position.copy(aedW(T, x, y, z + .45)); screen.userData.station = I.call;
  const waves = [0, 1, 2].map(i => {
    const m = new T.Mesh(new T.RingGeometry(.92, 1, 40, 1, -.9, 1.8), new T.MeshBasicMaterial({ color: INK, transparent: true, side: T.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.copy(aedW(T, x, y - 7, z + .6)); m.userData.phase = i / 3; m.visible = false;
    k.noPick(m); root.add(m); return m;
  });
  root.add(body, screen);
  let state = null;
  const draw = live => {
    if (live === state) return; state = live;
    const g = cv.getContext('2d');
    g.fillStyle = live ? '#e9f3ff' : '#20242c'; g.fillRect(0, 0, 320, 150);
    if (live) {
      g.fillStyle = INK; g.font = '800 62px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(PHONE_TEXT, 150, 78);
      g.fillStyle = '#2f9e5b'; g.beginPath(); g.moveTo(286, 60); g.lineTo(300, 48); g.lineTo(300, 104); g.lineTo(286, 92); g.closePath(); g.fill();
      g.fillRect(276, 62, 10, 28);
    }
    tex.needsUpdate = true;
  };
  draw(false);
  return { root, draw, waves };
}

/* ---------- the pads (with a small body pictogram), their cables and the plug ---------- */
function aedPads(T, k) {
  const root = new T.Group();
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = 240;
  const g = cv.getContext('2d');
  g.fillStyle = COL.pad; g.fillRect(0, 0, 160, 240);
  g.strokeStyle = '#8b9096'; g.lineWidth = 7; g.beginPath(); g.arc(80, 46, 22, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(42, 214); g.lineTo(42, 100); g.quadraticCurveTo(80, 76, 118, 100); g.lineTo(118, 214); g.stroke();
  g.fillStyle = '#e08a3a'; g.fillRect(52, 108, 20, 26); g.fillRect(100, 140, 14, 26);
  const tex = k.canvasTex(cv);
  const pad = station => {
    const m = new T.Group();
    const slab = k.edges(new T.Mesh(new T.BoxGeometry(8.5, .6, 12.5), k.toonNew(COL.pad, { emissive: '#000000' })), k.INK_THIN);
    slab.position.y = .3; slab.userData.station = station;
    const face = new T.Mesh(new T.PlaneGeometry(7.6, 11.6), new T.MeshBasicMaterial({ map: tex }));
    face.rotation.x = -Math.PI / 2; face.position.y = .62; face.userData.station = station;
    m.add(slab, face); m.visible = false; root.add(m);
    return m;
  };
  const p1 = pad(I.pad1), p2 = pad(I.pad2);
  const plug = k.edges(new T.Mesh(new T.BoxGeometry(5, 2.4, 3), k.toon(COL.plug)), k.INK_THIN);
  plug.userData.station = I.plug; plug.visible = false; root.add(plug);
  const cableMat = k.toon(COL.cable);
  const cables = [0, 1].map(() => { const m = new T.Mesh(new T.BufferGeometry(), cableMat); m.castShadow = true; m.visible = false; k.noPick(m); root.add(m); return m; });
  const lastKey = ['', ''];
  // a cable from a pad to the plug, sagging onto the floor between them
  const setCable = (j, a, b) => {
    const key = [a, b].map(v => v.toArray().map(n => n.toFixed(1)).join()).join('|');
    if (key === lastKey[j]) return;
    lastKey[j] = key;
    const mid = a.clone().lerp(b, .5); mid.y = Math.min(a.y, b.y, 1.2);
    const lift = a.clone(); lift.y += 2.5;
    const curve = new T.CatmullRomCurve3([a, lift, mid, b.clone().setY(b.y + 1.5), b]);
    cables[j].geometry.dispose();
    cables[j].geometry = new T.TubeGeometry(curve, 40, .55, 6, false);
  };
  return { root, pads: [p1, p2], plug, cables, setCable };
}

/* ---------- moving marks: the active ring, scan arc, 10 s ring, puff, current, hands-off, swap ---------- */
function aedEffects(T, k) {
  const root = new T.Group();
  const ring = new T.Mesh(new T.TorusGeometry(10, 1, 8, 40), new T.MeshBasicMaterial({ color: ACCENT }));
  ring.rotation.x = Math.PI / 2; ring.renderOrder = 5;
  const ringInk = new T.Mesh(new T.TorusGeometry(10, 1.6, 8, 40), new T.MeshBasicMaterial({ color: INK }));
  ringInk.position.y = -.4; ring.add(ringInk);
  // a ring of dashes; show(fraction) lights the first part
  const dashes = (n, cx, cy, rx, ry, z, col, len = 4) => {
    const g = new T.Group(), mat = new T.MeshBasicMaterial({ color: col });
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, d = new T.Mesh(new T.BoxGeometry(len, .6, 1.4), mat);
      d.position.copy(aedW(T, cx + rx * Math.cos(a), cy + ry * Math.sin(a), z));
      d.rotation.y = Math.atan2(rx * Math.cos(a), ry * Math.sin(a)) ;
      g.add(d);
    }
    g.visible = false;
    g.userData.show = frac => { g.visible = frac > 0; g.children.forEach((d, i) => { d.visible = i < frac * n; }); };
    return g;
  };
  const scan = dashes(64, 100, 128, 88, 150, .8, INK, 7);
  const count10 = dashes(30, AW.body.x, AW.body.head.y, 18, 18, 27, ACCENT, 3.2);
  const puff = new T.Mesh(new T.SphereGeometry(1, 14, 10), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .7, depthWrite: false }));
  puff.visible = false;
  const bolt = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ color: COL.current, transparent: true, opacity: .95, depthTest: false }));
  bolt.renderOrder = 15; bolt.visible = false;
  const signCanvas = draw => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; draw(cv.getContext('2d')); return cv; };
  const sprite = (cv, size) => {
    const s = new T.Sprite(new T.SpriteMaterial({ map: k.canvasTex(cv), depthTest: false })); s.scale.set(size, size, 1); s.renderOrder = 18; s.visible = false; return s;
  };
  const handsOff = sprite(signCanvas(g => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fill();
    g.strokeStyle = '#d0342c'; g.lineWidth = 12; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.roundRect(46, 44, 36, 44, 10); g.fill(); [40, 52, 64, 76].forEach(x => { g.beginPath(); g.roundRect(x - 4 + 6, 26, 9, 30, 5); g.fill(); });
    g.strokeStyle = '#d0342c'; g.beginPath(); g.moveTo(28, 28); g.lineTo(100, 100); g.stroke();
  }), 18);
  const swap = sprite(signCanvas(g => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    g.lineWidth = 9; g.strokeStyle = INK; g.fillStyle = INK;
    g.beginPath(); g.arc(64, 70, 34, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.moveTo(98, 46); g.lineTo(100, 72); g.lineTo(78, 60); g.fill();
    g.beginPath(); g.arc(64, 58, 34, Math.PI * .1, Math.PI * .9); g.stroke();
    g.beginPath(); g.moveTo(30, 82); g.lineTo(28, 56); g.lineTo(50, 68); g.fill();
  }), 20);
  const bubbles = [aedBubble(T, k), aedBubble(T, k)];
  root.add(ring, scan, count10, puff, bolt, handsOff, swap, ...bubbles.map(b => b.sprite));
  [ring, puff, bolt].forEach(k.noPick);
  return { root, ring, scan, count10, puff, bolt, handsOff, swap, bubbles };
}

/* ---------- every station's label, printed on (or standing beside) its part ---------- */
// [station key, kind, x, y]: tents on the mat beside the body and on the floor in front of the AED; flags elsewhere
const AED_LABEL_AT = [
  ['start', 'flag', 176, 62], ['safe', 'flag', 14, 118], ['shoulders', 'tent', 140, 190], ['call', 'flag', 180, 268],
  ['airway', 'tent', 140, 214], ['helper', 'flag', 46, 8], ['chest1', 'tent', 140, 166], ['lid', 'tent', 88, 284],
  ['power', 'tent', 88, 236], ['bare', 'tent', 166, 190], ['pad1', 'tent', 166, 166], ['pad2', 'tent', 166, 142],
  ['plug', 'tent', 88, 260], ['analyse', 'tent', 112, 236], ['clear', 'tent', 140, 118], ['shock', 'tent', 112, 260],
  ['chest2', 'tent', 140, 142], ['next', 'flag', 22, 262],
];
function aedLabels(T, k) {
  return S.map((s0, i) => {
    const [, kind, x, y] = AED_LABEL_AT.find(l => l[0] === s0.key);
    const l = kind === 'tent' ? aedTent(T, k, s0, x, y) : aedFlag(T, k, s0, x, y);
    l.root.traverse(o => { if (o.isMesh) o.userData.station = i; });
    return l;
  });
}
