/* ============================================================
   AED Bench, Turntable: the window (plain SVG beside the canvas).
   A. the heart, cut away, front view, with the pads on a faint chest outline;
   B. the AED strip, "what the AED is reading". Both follow the active station's `heart` and `strip`.
   Never a normal beat, never a pulse coming back.
   ============================================================ */
const WIN = { w: 340, h: 250, heart: '0 0 176 176' };
const winSm = { q: 1, arrows: 0, perf: 0, cur: 0, last: 0, lastDraw: 0 };
const HEART_PATH = 'M88 44C66 30 34 44 38 86C42 122 72 148 96 162C120 146 146 118 142 84C138 52 112 34 88 44Z';

// eases the window's numbers toward the state's targets so a step's change reads as a blend
function winTargets(st) {
  const s0 = S[st.now], h = s0.heart, u = st.u, pump = st.view ? st.view.pump : 0, cpr = st.view && st.view.cpr;
  const quiver = h === 'vf' || h === 'vf+cpr' || h === 'paused-vf' ? 1 : h === 'current' ? (u < .4 ? 1 : 0) : 0;
  const cur = h === 'current' && u > .35 && u < .65 ? 1 : 0;
  const arrows = (h === 'vf+cpr' || h === 'stunned+cpr') && cpr && cpr.pushing ? 1 : 0;
  return { quiver, cur, arrows, pump, perf: arrows ? .75 : 0 };
}

function winHeart(st, time, o) {
  const pads = [st.now >= I.pad1 && !(st.now === I.pad1 && st.u < .85), st.now >= I.pad2 && !(st.now === I.pad2 && st.u < .85)];
  const sq = 1 - .1 * o.pump, sqy = 1 - .05 * o.pump;
  let g = `<rect x="10" y="8" width="156" height="162" rx="46" fill="none" stroke="#c9c0ae" stroke-width="2" stroke-dasharray="5 4"/>`;
  g += `<g transform="translate(88 98) scale(${f(sq)} ${f(sqy)}) translate(-88 -98)">`;
  g += `<path d="M58 46V18M70 46V16" stroke="#6f6aa8" stroke-width="9" stroke-linecap="round"/>`
     + `<path d="M98 46C98 26 120 20 128 34" fill="none" stroke="#c4475b" stroke-width="10" stroke-linecap="round"/>`;
  g += `<path d="${HEART_PATH}" fill="#b5485a" stroke="${INK}" stroke-width="2"/>`;
  g += [[62, 78, 15, 16], [112, 70, 15, 13], [74, 118, 17, 24], [110, 118, 17, 27]]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#7e2438" stroke="${INK}" stroke-width="1"/>`).join('');
  if (o.q > .02) {                     // chaotic ripples: fine, uncoordinated, everywhere
    let r = Math.floor(time * 24) * 7919;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 16; n++) {
      const x = 46 + rnd() * 88, y = 54 + rnd() * 94, d = [];
      for (let k = 0; k < 6; k++) d.push(`${f(x + k * 4)} ${f(y + (rnd() - .5) * 10 * o.q)}`);
      g += `<path d="M${d.join('L')}" fill="none" stroke="#e7a3d6" stroke-width="1.6" opacity="${f(.85 * o.q)}" stroke-linecap="round"/>`;
    }
  }
  g += `</g>`;
  if (o.arrows > .02) {                // each push squeezes blood out: red out of the left side, blue into the right
    const a = f(o.arrows * (.35 + .65 * o.pump));
    g += `<g opacity="${a}"><path d="M128 30L146 14" stroke="#d0342c" stroke-width="5" stroke-linecap="round"/><path d="M150 8l-1 13-11-6z" fill="#d0342c"/>`
       + `<path d="M30 20L50 40" stroke="#3a64c8" stroke-width="5" stroke-linecap="round"/><path d="M55 45l-13-1 5-11z" fill="#3a64c8"/></g>`;
  }
  const pR = [36, 40], pL = [150, 112];
  if (pads[0] && pads[1]) g += `<path d="M${pR.join(' ')}L${pL.join(' ')}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="4 4" opacity=".6"/>`;
  if (o.cur > .02) g += `<path d="M${pR.join(' ')}L${pL.join(' ')}" stroke="${COL.current}" stroke-width="16" stroke-linecap="round" opacity="${f(o.cur * .85)}"/>`
    + `<path d="M${pR.join(' ')}L92 70L84 88L${pL.join(' ')}" fill="none" stroke="#fff6b8" stroke-width="3" opacity="${f(o.cur)}"/>`;
  if (pads[0]) g += `<rect x="24" y="30" width="24" height="18" rx="3" fill="#fbfbf7" stroke="${INK}" stroke-width="1.5" transform="rotate(-14 36 40)"/>`;
  if (pads[1]) g += `<rect x="141" y="98" width="18" height="28" rx="3" fill="#fbfbf7" stroke="${INK}" stroke-width="1.5" transform="rotate(10 150 112)"/>`;
  return g;
}

function winWrap(text, maxCh) {
  return text.split(' ').reduce((ls, w) => {
    const last = ls[ls.length - 1];
    if (last !== undefined && (last + ' ' + w).length <= maxCh) return [...ls.slice(0, -1), last + ' ' + w];
    return [...ls, w];
  }, []);
}
const winText = (x, y, lines, size, col = INK, weight = 700, lh = 1.25) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${col}" font-family="system-ui,-apple-system,sans-serif">`
  + lines.map((l, i) => `<tspan x="${x}" dy="${i ? f(size * lh) : 0}">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</tspan>`).join('') + `</text>`;

// right of the heart: the brain (grey without flow), the heart's state in words
function winSide(st, o) {
  const s0 = S[st.now], t = AED.clockAt(st.now, st.u), started = t > AED.START_AT[I.chest1] || st.now > I.chest1;
  const brain = mix('#b8b2a8', '#e58ea8', o.perf);
  let g = `<g transform="translate(206 18)"><path d="M10 34C0 30 0 14 12 12C14 2 30 0 36 8C44 0 60 4 60 16C72 18 72 34 62 38C60 48 46 50 40 44C32 50 16 48 10 34Z" fill="${brain}" stroke="${INK}" stroke-width="1.6"/>`
    + `<path d="M24 14C28 22 22 28 30 34M44 12C40 22 48 26 44 38" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".5"/></g>`;
  const flowLine = o.perf > .3 ? WIN_TEXT.flow : started ? `hands off: ${mmss(AED.handsOffUntil(t))}` : `${WIN_TEXT.noFlow}: ${mmss(t)}`;
  g += winText(184, 84, [flowLine], 11.5, o.perf > .3 ? '#2f7d4c' : '#8a5a4a', 800);
  g += winText(184, 106, winWrap(WIN_TEXT.heart[s0.heart], 24), 11.5, INK, 700);
  if (s0.heart.startsWith('stunned')) g += winText(184, 140, winWrap(WIN_TEXT.stunned, 30), 9, '#6f6858', 600);
  return g;
}

function winStrip(st, time) {
  const s0 = S[st.now], k = s0.strip, u = st.u, y0 = 184, base = 226, x0 = 10, x1 = 330;
  let g = `<rect x="4" y="${y0}" width="332" height="62" rx="8" fill="#16231d" stroke="${INK}" stroke-width="2"/>`;
  g += winText(12, y0 + 14, [WIN_TEXT.strip.toUpperCase()], 8.5, '#9cc9ae', 800);
  if (k === 'none') return g + winText(120, base + 4, [WIN_TEXT.noAed], 12, '#6f8a7b', 700);
  const pts = [], tt = AED_REDUCE.matches ? 0 : time;
  for (let x = x0; x <= x1; x += 2) {
    const a = x * .045 - tt * 3.2;
    let yv = 0;
    if (k === 'cpr') yv = -14 * Math.pow(Math.max(0, Math.sin(a * 1.15)), 3);
    else if (k === 'vf' || k === 'charge') yv = 4 * Math.sin(a * 3.1) + 3 * Math.sin(a * 5.3 + 1.3) + 2.2 * Math.sin(a * 8.7 + .4);
    else if (k === 'reading') yv = .8 * Math.sin(a * 2.3) + .5 * Math.sin(a * 6.1 + .7);
    else if (k === 'spike') { const sx = x0 + (x1 - x0) * .45; yv = Math.abs(x - sx) < 3 ? -30 : Math.abs(x - sx) < 6 ? 6 : 0; }
    pts.push(`${x} ${f(base + yv)}`);
  }
  g += `<path d="M${pts.join('L')}" fill="none" stroke="${k === 'reading' ? '#5f9e74' : '#7dff9f'}" stroke-width="${k === 'reading' ? 1.2 : 1.8}" stroke-linejoin="round"/>`;
  const bar = (label, frac, col) => `<rect x="210" y="${y0 + 18}" width="118" height="10" rx="3" fill="none" stroke="#9cc9ae"/>`
    + `<rect x="212" y="${y0 + 20}" width="${f(114 * frac)}" height="6" rx="2" fill="${col}"/>`
    + `<text x="204" y="${y0 + 27}" text-anchor="end" font-size="9" font-weight="700" fill="#d8f3e2" font-family="system-ui,sans-serif">${label}</text>`;
  if (k === 'vf' && s0.key === 'analyse') g += bar(WIN_TEXT.analysing, u, '#ffd34d');
  if (k === 'reading') g += bar(WIN_TEXT.again, u, '#ffd34d');
  if (k === 'charge') g += bar(S[I.clear].screen.split('. ')[1], u, '#ff9a2a');
  if (k === 'spike') g += winText(200, y0 + 15, [WIN_TEXT.delivered], 10, COL.current, 800);
  if (s0.key === 'chest2') g += winText(196, y0 + 15, [`${WIN_TEXT.next} ${mmss(AED.NUM.nextAnalysis * (1 - u) + .999)}`], 10, '#ffd34d', 800);
  return g;
}

// draws the laptop panel and the phone inset (heart only while small)
function aedDrawWindow(st, time) {
  const dt = Math.min(.1, Math.max(0, time - winSm.last)); winSm.last = time;
  const tg = winTargets(st), kk = 1 - Math.exp(-dt * 6);
  winSm.q += (tg.quiver - winSm.q) * (tg.quiver < winSm.q ? 1 - Math.exp(-dt * 30) : kk);
  winSm.arrows += (tg.arrows - winSm.arrows) * kk; winSm.perf += (tg.perf - winSm.perf) * (1 - Math.exp(-dt * 2));
  winSm.cur += (tg.cur - winSm.cur) * (1 - Math.exp(-dt * 20));
  if (time - winSm.lastDraw < 1 / 30) return;
  winSm.lastDraw = time;
  const o = { q: winSm.q, arrows: winSm.arrows, perf: winSm.perf, cur: winSm.cur, pump: tg.pump };
  const heart = winHeart(st, time, o), full = heart + winSide(st, o) + winStrip(st, time);
  const panel = document.getElementById('winArt');
  if (panel && panel.getClientRects().length) panel.innerHTML = full;
  const mini = document.getElementById('winMini'), art = document.getElementById('winMiniArt');
  if (mini && art && mini.getClientRects().length) {
    const big = mini.classList.contains('big');
    document.getElementById('winMiniSvg').setAttribute('viewBox', big ? `0 0 ${WIN.w} ${WIN.h}` : WIN.heart);
    art.innerHTML = big ? full : heart;
  }
}
