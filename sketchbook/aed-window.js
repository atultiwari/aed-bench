/* AED Bench · Sketchbook: the window. The heart inside a chest outline (with the pads once they are on) and the
   strip of what the AED is reading. Drawn from aedLook(): the heart's state eases between the named states in
   docs/scene.md; the strip scrolls, so a change of rhythm slides in from the right. */

const AED_HEART = {
  vf: { ripple: 1, arrows: 0, current: 0, cap: 'Quivering (VF): no pumping, no blood flow' },
  'vf+cpr': { ripple: 1, arrows: 1, current: 0, cap: 'Still quivering, but each push squeezes blood out' },
  'paused-vf': { ripple: 1, arrows: 0, current: 0, cap: 'Hands off: quivering, no blood moving' },
  current: { ripple: 0, arrows: 0, current: 1, cap: 'Shock: current through the whole heart at once' },
  'stunned+cpr': { ripple: 0, arrows: 1, current: 0, cap: 'Quivering stopped. Pushes keep blood moving' },
  stunned: { ripple: 0, arrows: 0, current: 0, cap: 'Quivering stopped; not pumping well yet' },
};
const AED_WIN = { ripple: 1, arrows: 0, current: 0, hist: Array(240).fill(0), last: 0, spikeAt: -9, kind: 'none' };
const AED_CHEST_PATH = 'M150 12L250 12Q256 28 290 32L340 46Q358 54 354 82L334 192L66 192L46 82Q42 54 60 46L110 32Q144 28 150 12Z';
const AED_HEART_PATH = 'M-6 -52C-34 -70-74-52-70-12C-67 22-34 48 6 70C44 46 70 12 63-22C57-54 27-64 2-48Z';
const aedF = v => v.toFixed(1);

function aedStripSample(kind, t) {
  switch (kind) {
    case 'cpr': return -.75 * Math.pow(Math.abs(Math.sin(t * Math.PI * 1.9)), 3) + .05 * Math.sin(t * 31);
    case 'vf': case 'charge': return .32 * Math.sin(t * 2 * Math.PI * 5.3) + .2 * Math.sin(t * 2 * Math.PI * 7.9 + 1) + .14 * Math.sin(t * 2 * Math.PI * 3.1 + 2);
    case 'spike': { const d = t - AED_WIN.spikeAt; return d < .05 ? -3.2 : d < .12 ? 1.2 : .02 * Math.sin(t * 13); }
    case 'blank': return .015 * Math.sin(t * 17);
    case 'reading': return .05 * Math.sin(t * 2 * Math.PI * 1.3) + .03 * Math.sin(t * 23);
    default: return 0;
  }
}

function aedDrawWindow(L, now) {
  const svg = document.getElementById('aedWin');
  if (!svg) return;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const target = AED_HEART[L.heart] || AED_HEART.vf, k = reduce ? 1 : .12;
  ['ripple', 'arrows', 'current'].forEach(p => { AED_WIN[p] += (target[p] - AED_WIN[p]) * k; });
  // the strip: push samples for the time since the last frame
  if (L.strip === 'spike' && AED_WIN.kind !== 'spike') AED_WIN.spikeAt = now;
  AED_WIN.kind = L.strip;
  const n = Math.max(1, Math.min(12, Math.round((now - AED_WIN.last) * 80)));
  AED_WIN.last = now;
  for (let i = 0; i < n; i++) { AED_WIN.hist.shift(); AED_WIN.hist.push(aedStripSample(L.strip, now - (n - 1 - i) / 80)); }
  svg.querySelector('#aedWinArt').innerHTML = aedChest(L, now) + aedStrip(L);
  const cap = document.getElementById('aedWinCap');
  if (cap) cap.textContent = target.cap;
}

/* The chest and heart are the generated illustrations (assets/sprites/chest.webp, heart.webp, from 04-chest and
   03-heart). Positions are in the window's 400 x 260 units, measured on those images: the heart sits behind the
   sternum with its apex at the left 5th intercostal space; pad 1 below the right collarbone beside the sternum,
   pad 2 on the left mid-axillary line (ERC 2025 Fig. 6a). */
const AED_WIN_GEO = {
  chest: [75, 2, 250, 196], heart: [174.9, 52.7, 57.8, 94], pad1: [164.7, 75, -10], pad2: [273, 129, 6], padWH: [32.5, 43],
  aorta: [[210, 58], [234, 46]], cava: [[181, 40], [181, 58]],
};
function aedChest(L, now) {
  const W = AED_WIN, G = AED_WIN_GEO, [hx, hy, hw, hh] = G.heart, cx = hx + hw / 2, cy = hy + hh * .58;
  const sq = 1 - .07 * W.arrows * L.dip, quiver = 7 * W.ripple;
  let s = `<defs><filter id="aedVF" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="turbulence" baseFrequency=".09 .13" numOctaves="2" seed="${Math.floor(now * 18) % 97}" result="t"/>`
    + `<feDisplacementMap in="SourceGraphic" in2="t" scale="${aedF(quiver)}" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + `<clipPath id="aedChestClip"><rect x="${G.chest[0]}" y="${G.chest[1]}" width="${G.chest[2]}" height="${G.chest[3]}"/></clipPath></defs>`;
  s += `<image href="../assets/sprites/chest.webp" x="${G.chest[0]}" y="${G.chest[1]}" width="${G.chest[2]}" height="${G.chest[3]}"/>`;
  // the heart, seen through the chest wall: quivering in VF (displacement noise), squeezed by each push
  s += `<g opacity=".93" transform="translate(${aedF(cx)} ${aedF(cy)}) scale(${aedF(sq)} ${aedF(1 - (1 - sq) * .6)}) translate(${aedF(-cx)} ${aedF(-cy)})">`
    + `<image href="../assets/sprites/heart.webp" x="${hx}" y="${hy}" width="${hw}" height="${hh}"${quiver > .3 ? ' filter="url(#aedVF)"' : ''}/></g>`;
  if (W.ripple > .05) s += `<ellipse cx="${aedF(cx)}" cy="${aedF(hy + hh * .6)}" rx="${aedF(hw * .42)}" ry="${aedF(hh * .3)}" fill="#7a2a6a" opacity="${aedF(.18 * W.ripple)}"/>`;
  // blood pushed on with each compression: red out of the aorta, blue into the right heart
  if (W.arrows > .02) {
    const o = aedF(W.arrows * (.3 + .7 * L.dip)), ar = (a, b, col) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
      return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>`
        + `<path d="M${aedF(b[0] + ux * 6)} ${aedF(b[1] + uy * 6)}L${aedF(b[0] - uy * 4)} ${aedF(b[1] + ux * 4)}L${aedF(b[0] + uy * 4)} ${aedF(b[1] - ux * 4)}Z" fill="${col}"/>`; };
    s += `<g opacity="${o}">${ar(...G.aorta, '#c0392b')}${ar(...G.cava, '#3d6fb6')}</g>`;
  }
  const pr = G.pad1, pl = G.pad2, [pw, ph] = G.padWH;
  if (L.padsOn[0] && L.padsOn[1]) s += `<path d="M${pr[0]} ${pr[1]}L${pl[0]} ${pl[1]}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 4" opacity=".5"/>`;
  if (W.current > .02) {
    s += `<path d="M${pr[0]} ${pr[1]}L${pl[0]} ${pl[1]}" stroke="#ffe066" stroke-width="30" stroke-linecap="round" opacity="${aedF(W.current * .5)}"/>`
      + `<path d="M${pr[0]} ${pr[1]}L${pl[0]} ${pl[1]}" stroke="#fff6c2" stroke-width="7" stroke-linecap="round" opacity="${aedF(W.current)}"/>`;
  }
  const pad = ([x, y, rot]) => `<rect x="${aedF(x - pw / 2)}" y="${aedF(y - ph / 2)}" width="${pw}" height="${ph}" rx="4" fill="#f7f5ee" stroke="${INK}" stroke-width="1.6" opacity=".96" transform="rotate(${rot} ${x} ${y})"/>`;
  if (L.padsOn[0]) s += pad(pr);
  if (L.padsOn[1]) s += pad(pl);
  return s;
}
function aedRipples(now, amt) {
  if (amt < .02) return '';
  let s = '';
  for (let r = 0; r < 7; r++) {
    const y0 = -58 + r * 18, pts = [];
    for (let x = -76; x <= 70; x += 6) pts.push(`${x} ${aedF(y0 + Math.sin(x * .18 + now * (9 + r * 1.7) + r) * 5 * amt + Math.sin(x * .07 - now * 5.3) * 3 * amt)}`);
    s += `<path d="M${pts.join('L')}" fill="none" stroke="#6e1f47" stroke-width="2.2" opacity="${aedF(.55 * amt)}"/>`;
  }
  return s;
}
function aedStrip(L) {
  const x0 = 14, x1 = 386, y0 = 204, y1 = 252, mid = (y0 + y1) / 2 + 4;
  let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="7" fill="#17221c" stroke="${INK}" stroke-width="2"/>`
    + `<text x="${x0 + 8}" y="${y0 + 12}" font-size="9.5" font-family="ui-monospace,Menlo,monospace" font-weight="700" fill="#7fbf96" letter-spacing=".06em">WHAT THE AED IS READING</text>`;
  if (L.strip === 'none') return s + `<text x="${(x0 + x1) / 2}" y="${mid + 5}" font-size="12" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" fill="#7fbf96">AED not here yet</text>`;
  const H = AED_WIN.hist, dx = (x1 - x0 - 16) / (H.length - 1);
  const pts = H.map((v, i) => `${aedF(x0 + 8 + i * dx)} ${aedF(mid + Math.max(-2.6, Math.min(1.6, v)) * 12)}`);
  s += `<path d="M${pts.join('L')}" fill="none" stroke="#5ff59a" stroke-width="2" stroke-linejoin="round"/>`;
  const label = { blank: 'pads not on yet', cpr: 'CPR movement', vf: 'ventricular fibrillation', charge: 'VF · charging', spike: 'shock', reading: 'analysing again' }[L.strip] || '';
  s += `<text x="${x1 - 8}" y="${y0 + 12}" font-size="9.5" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-weight="700" fill="#cfe9d8">${label}</text>`;
  if (L.strip === 'charge') s += `<rect x="${x1 - 108}" y="${y1 - 11}" width="${aedF(96 * L.chargeBar)}" height="5" fill="#ffd36a"/>`;
  return s;
}
