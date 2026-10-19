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

function aedChest(L, now) {
  const W = AED_WIN, squeeze = W.arrows * L.dip * .1, cx = 216, cy = 112;
  let s = `<path d="${AED_CHEST_PATH}" fill="#f3e2d3" stroke="${INK}" stroke-width="2"/>`
    + `<path d="M110 36Q150 46 190 40M290 36Q250 46 210 40" fill="none" stroke="#c9a88c" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M200 40L200 150" stroke="#d9bfa8" stroke-width="6" stroke-linecap="round"/>`
    + `<text x="200" y="186" font-size="9" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" fill="#9a8270" letter-spacing=".08em">FRONT OF THE CHEST</text>`;
  // vessels, then the heart (squeezed by each push)
  s += `<g transform="translate(${cx} ${cy}) scale(${aedF(.74 * (1 - squeeze))} ${aedF(.74 * (1 - squeeze * .6))})">`
    + `<path d="M-14-50C-16-74-2-86 18-84C34-82 40-70 38-58" fill="none" stroke="#c0392b" stroke-width="13" stroke-linecap="round"/>`
    + `<path d="M-34-46C-40-70-30-82-22-86" fill="none" stroke="#3d6fb6" stroke-width="11" stroke-linecap="round"/>`
    + `<path d="${AED_HEART_PATH}" fill="${W.ripple > .5 ? '#b8476a' : '#c4566f'}" stroke="${INK}" stroke-width="2.2"/>`
    + `<clipPath id="aedHeartClip"><path d="${AED_HEART_PATH}"/></clipPath><g clip-path="url(#aedHeartClip)">${aedRipples(now, W.ripple)}</g>`
    + `<path d="M-30-30Q-6-8 2 40" fill="none" stroke="${INK}" stroke-width="1.1" opacity=".5"/>`;
  // blood pushed on with each compression: red out of the aorta, blue in from the veins
  if (W.arrows > .02) s += `<g opacity="${aedF(W.arrows * (.3 + .7 * L.dip))}"><path d="M40-60L64-60" stroke="#c0392b" stroke-width="6"/><path d="M62-72L82-60L62-48Z" fill="#c0392b"/>`
    + `<path d="M-60-86L-38-86" stroke="#3d6fb6" stroke-width="6"/><path d="M-40-98L-20-86L-40-74Z" fill="#3d6fb6"/></g>`;
  s += '</g>';
  // the pads (patient's right is the viewer's left) and the line between them
  const pr = [140, 70], pl = [326, 140];
  if (L.padsOn[0] && L.padsOn[1]) s += `<path d="M${pr[0]} ${pr[1]}L${pl[0]} ${pl[1]}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="5 4" opacity=".55"/>`;
  if (W.current > .02) {
    const o = aedF(W.current);
    s += `<path d="M${pr[0]} ${pr[1]}L${pl[0]} ${pl[1]}" stroke="#ffe066" stroke-width="34" stroke-linecap="round" opacity="${aedF(W.current * .55)}"/>`
      + `<path d="M${pr[0]} ${pr[1]}L${pl[0]} ${pl[1]}" stroke="#fff6c2" stroke-width="8" stroke-linecap="round" opacity="${o}"/>`;
  }
  if (L.padsOn[0]) s += `<rect x="${pr[0] - 15}" y="${pr[1] - 19}" width="30" height="38" rx="5" fill="#f7f5ee" stroke="${INK}" stroke-width="1.8" transform="rotate(-12 ${pr[0]} ${pr[1]})"/>`;
  if (L.padsOn[1]) s += `<rect x="${pl[0] - 15}" y="${pl[1] - 19}" width="30" height="38" rx="5" fill="#f7f5ee" stroke="${INK}" stroke-width="1.8" transform="rotate(14 ${pl[0]} ${pl[1]})"/>`;
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
