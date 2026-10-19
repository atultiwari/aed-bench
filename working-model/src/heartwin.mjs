// The window: A. the heart (cut-away front view inside a faint chest outline, with the pads
// once they are on) and B. the AED strip ("what the AED is reading"). Drawn once at build
// time; the page moves the ripples, the squeeze, the arrows, the current and the trace,
// and sets every colour from the model (HEART, BLOOD) through CSS variables.

export const HEART_VIEW = { w: 320, h: 190 };
export const HEART_C = [176, 104];
// front view: the patient's right is the viewer's left
export const PAD_R = { x: 116, y: 50, w: 30, h: 22, rot: 0 };
export const PAD_L = { x: 236, y: 112, w: 22, h: 30, rot: -12 };
export const padCentre = (p) => [p.x + p.w / 2, p.y + p.h / 2];

// the cut-away heart: outer wall, four chambers, septum, the great vessels (no valves, no beat)
const OUTER = "M150 46C134 40 118 50 118 70C118 84 124 96 132 110C144 130 160 146 182 160C196 150 212 132 222 112C232 92 236 76 228 62C220 48 204 44 192 52C184 46 166 42 150 46Z";
export function heartSvg() {
  const [cx, cy] = HEART_C;
  return `
<defs>
  <clipPath id="wm-heart-clip"><path d="${OUTER}"/></clipPath>
  <filter id="wm-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
  <marker id="wm-arrow-r" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="wm-arrow-red-head"/></marker>
  <marker id="wm-arrow-b" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="wm-arrow-blue-head"/></marker>
</defs>
<path class="wm-chest-outline" d="M96 10C84 30 80 60 82 96C84 130 88 160 92 186M256 10C268 30 272 60 270 96C268 130 264 160 260 186M96 10C130 22 150 24 176 24C202 24 222 22 256 10"/>
<path class="wm-sternum" d="M176 26V118"/>
<g class="wm-brain" transform="translate(38 60)">
  <path class="wm-brain-shape" d="M-22 4C-26 -8 -18 -20 -6 -20C-2 -26 10 -26 14 -18C24 -18 28 -6 24 2C28 10 20 20 10 18C4 24 -8 24 -12 16C-22 18 -28 12 -22 4Z"/>
  <path class="wm-brain-fold" d="M-12 -10C-6 -6 -6 2 -12 6M2 -16C6 -8 2 -2 8 4M14 -6C10 0 14 8 10 12"/>
  <text class="wm-brain-text" y="38" text-anchor="middle">no blood flow</text>
  <text class="wm-brain-timer" y="54" text-anchor="middle" data-live="noflow">0:00</text>
</g>
<g class="wm-pads">
  <rect class="wm-pad" data-pad="right" x="${PAD_R.x}" y="${PAD_R.y}" width="${PAD_R.w}" height="${PAD_R.h}" rx="4"/>
  <rect class="wm-pad" data-pad="left" x="${PAD_L.x}" y="${PAD_L.y}" width="${PAD_L.w}" height="${PAD_L.h}" rx="4" transform="rotate(${PAD_L.rot} ${PAD_L.x + PAD_L.w / 2} ${PAD_L.y + PAD_L.h / 2})"/>
  <line class="wm-padline" x1="${padCentre(PAD_R)[0]}" y1="${padCentre(PAD_R)[1]}" x2="${padCentre(PAD_L)[0]}" y2="${padCentre(PAD_L)[1]}"/>
</g>
<g class="wm-heart" data-live="heart" transform="translate(0 0)">
  <path class="wm-vessel" d="M184 52C186 34 196 22 212 18M200 54C204 40 214 34 226 34"/>
  <path class="wm-vessel wm-vessel-blue" d="M140 52C138 34 140 22 146 12M132 96C122 98 112 100 104 102"/>
  <path class="wm-wall" d="${OUTER}"/>
  <g clip-path="url(#wm-heart-clip)">
    <path class="wm-chamber" d="M134 64C134 56 142 52 150 54C160 56 166 62 166 70C164 80 154 84 144 82C136 80 134 72 134 64Z"/>
    <path class="wm-chamber" d="M190 60C196 54 208 54 216 60C222 66 222 76 214 82C206 86 194 84 188 78C184 72 186 64 190 60Z"/>
    <path class="wm-chamber" d="M138 98C142 92 156 92 166 98C172 110 172 128 178 146C164 138 150 124 142 114C138 108 136 102 138 98Z"/>
    <path class="wm-chamber wm-lv" d="M188 96C196 90 212 92 218 100C222 112 214 128 196 146C186 150 184 140 184 128C184 116 184 104 188 96Z"/>
    <path class="wm-septum" d="M176 58C178 80 180 110 182 158"/>
    <g class="wm-ripples" data-live="ripples"></g>
  </g>
  <g class="wm-arrows">
    <path class="wm-arrow-red" d="M198 70C202 54 206 44 212 30" marker-end="url(#wm-arrow-r)"/>
    <path class="wm-arrow-red" d="M196 120C200 100 200 90 198 76" marker-end="url(#wm-arrow-r)"/>
    <path class="wm-arrow-blue" d="M108 100C120 98 130 94 140 90" marker-end="url(#wm-arrow-b)"/>
    <path class="wm-arrow-blue" d="M146 18C144 30 146 42 148 56" marker-end="url(#wm-arrow-b)"/>
  </g>
</g>
<g class="wm-current">
  <line class="wm-current-glow" x1="${padCentre(PAD_R)[0]}" y1="${padCentre(PAD_R)[1]}" x2="${padCentre(PAD_L)[0]}" y2="${padCentre(PAD_L)[1]}" filter="url(#wm-glow)"/>
  <line class="wm-current-core" x1="${padCentre(PAD_R)[0]}" y1="${padCentre(PAD_R)[1]}" x2="${padCentre(PAD_L)[0]}" y2="${padCentre(PAD_L)[1]}"/>
</g>`;
}

// The strip trace for a state, across `width`, scrolled by `phase` (seconds).
const noise = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };
export function tracePath(kind, phase, width = 300, mid = 34, beat = 0) {
  const pts = [];
  const n = 150;
  for (let j = 0; j <= n; j++) {
    const x = (j / n) * width, t = phase + x / 60;
    let y = mid;
    if (kind === "flat") y = mid + (noise(Math.floor(t * 30)) - 0.5) * 0.8;
    else if (kind === "cpr") { const q = (t * beat) % 1; y = mid - 20 * Math.max(0, Math.sin(q * Math.PI * 2)) ** 2 + 6 * Math.max(0, Math.sin(q * Math.PI * 2 + 2.4)) ** 3; }
    else if (kind === "vf") y = mid + 7 * Math.sin(t * 31) + 5 * Math.sin(t * 47 + 1.3) + 4 * Math.sin(t * 71 + 0.4) + (noise(Math.floor(t * 40)) - 0.5) * 4;
    else if (kind === "reading") y = mid + 2.5 * Math.sin(t * 8) + (noise(Math.floor(t * 30)) - 0.5) * 1.2;
    else if (kind === "spike") { const d = x - width * 0.62; y = d > -3 && d < 0 ? mid - 30 : d >= 0 && d < 4 ? mid + 18 : d >= 4 && d < 22 ? mid + 18 * Math.exp(-(d - 4) / 5) : mid; }
    pts.push(`${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join("");
}

export const WINDOW_CSS = `
.wm-window{display:flex;flex-direction:column;gap:6px}
.wm-heartbox{position:relative;background:#fbf7ee;border:1.5px solid #1f2a44;border-radius:14px;overflow:hidden}
.wm-heartbox svg{display:block;width:100%;height:auto}
.wm-win-title{position:absolute;left:10px;top:6px;font:700 11px/1.2 ui-rounded,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#5b6480}
.wm-heart-cap{font-size:12.5px;line-height:1.3;color:#2b3550;padding:0 10px 7px;min-height:2.6em}
.wm-chest-outline{fill:none;stroke:#c9bba4;stroke-width:2;stroke-dasharray:5 4}
.wm-sternum{stroke:#ddd2bf;stroke-width:5;stroke-linecap:round}
.wm-wall{fill:var(--h-wall);stroke:#1f2a44;stroke-width:1.6}
.wm-chamber{fill:var(--h-inner);stroke:#1f2a44;stroke-opacity:.4;stroke-width:1}
.wm-septum{fill:none;stroke:var(--h-wall);stroke-width:5}
.wm-vessel{fill:none;stroke:#b6475a;stroke-width:9;stroke-linecap:round}
.wm-vessel-blue{stroke:#6f7fb8}
.wm-ripples path{fill:none;stroke:var(--h-ripple);stroke-width:2.2;stroke-linecap:round;opacity:var(--h-ripples,1)}
.wm-arrows{opacity:var(--h-arrows,0)}
.wm-arrow-red{fill:none;stroke:var(--blood-red);stroke-width:4;stroke-linecap:round}
.wm-arrow-blue{fill:none;stroke:var(--blood-blue);stroke-width:4;stroke-linecap:round}
.wm-arrow-red-head{fill:var(--blood-red)}.wm-arrow-blue-head{fill:var(--blood-blue)}
.wm-pad{fill:#ffffff;stroke:#1f2a44;stroke-width:1.4;opacity:0;transition:opacity .4s}
.wm-pad.is-on{opacity:1}
.wm-padline{stroke:#1f2a44;stroke-width:1.2;stroke-dasharray:4 4;opacity:0;transition:opacity .4s}
.wm-padline.is-on{opacity:.55}
.wm-current{opacity:var(--h-current,0)}
.wm-current-glow{stroke:var(--blood-current);stroke-width:22;stroke-linecap:round;opacity:.7}
.wm-current-core{stroke:#fff6c2;stroke-width:6;stroke-linecap:round}
.wm-brain-shape{fill:var(--brain);stroke:#1f2a44;stroke-width:1.4;transition:fill .6s}
.wm-brain-fold{fill:none;stroke:#1f2a44;stroke-opacity:.45;stroke-width:1.2}
.wm-brain-text{font:600 10.5px ui-rounded,system-ui,sans-serif;fill:#5b6480}
.wm-brain-timer{font:800 15px ui-monospace,Menlo,monospace;fill:#1f2a44}
.wm-strip{background:#1d2622;border:1.5px solid #1f2a44;border-radius:14px;padding:6px 10px 8px;color:#cfe9d8}
.wm-strip-head{display:flex;justify-content:space-between;gap:8px;font:700 11px/1.3 ui-rounded,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#8fb9a0}
.wm-strip-head b{color:#ffd23f;font-variant-numeric:tabular-nums;letter-spacing:0}
.wm-strip svg{display:block;width:100%;height:auto}
.wm-trace{fill:none;stroke:#7ff0a4;stroke-width:2;stroke-linejoin:round}
.wm-grid{stroke:#2f3d36;stroke-width:1}
.wm-strip-none{fill:#7d9187;font:600 13px ui-rounded,system-ui,sans-serif}
.wm-strip-screen{font:600 12.5px/1.3 ui-monospace,Menlo,monospace;color:#e9fff0;min-height:1.3em}
.wm-strip-cap{font-size:11.5px;color:#8fb9a0;line-height:1.3}
.wm-bar{height:6px;border-radius:3px;background:#33433b;margin:4px 0 2px;overflow:hidden;display:none}
.wm-bar i{display:block;height:100%;width:0;background:#7ff0a4}
.wm-bar.is-charge i{background:#ffb02e}
.wm-bar.is-on{display:block}
`;
