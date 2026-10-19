// Build: node build.mjs -> ../index.html (one standalone page).
// The model is checked first and its self-check printed, then the art is drawn with the
// engine, then the page inlines the shared spec + engine + model + world + live code.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit.mjs";
import * as W from "./world.mjs";
import * as M from "./model.mjs";
import { P, figureBody } from "./art.mjs";
import { heartSvg, HEART_VIEW, WINDOW_CSS } from "./heartwin.mjs";
import { CSS } from "./page-css.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHARED = join(HERE, "..", "..", "shared");
const QR_SVG = readFileSync(join(SHARED, "qr.svg"), "utf8").trim();
if (!QR_SVG.startsWith("<svg")) throw new Error("shared/qr.svg is missing or not an SVG");

const check = M.selfCheck();
console.log("model self-check:", check);
if (M.AED.CHECK.length) throw new Error(`spec self-check failed: ${M.AED.CHECK.join("; ")}`);
if (M.TOTAL !== 277 || check.checkAndCall !== 25 || check.aedAndPads !== 27 || check.handsOffShock !== 15) throw new Error("totals do not match the spec");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const src = (file) => readFileSync(join(HERE, file), "utf8");
const strip = (text) => text.replace(/^export \* from .*$/gm, "").replace(/^export /gm, "").replace(/^import [\s\S]*?;$/gm, "");
const ns = (name, mod) => `const ${name} = Object.freeze({ ${Object.keys(mod).join(", ")} });`;

const svg = k.figureSvg({
  width: W.WIDTH,
  height: W.HEIGHT,
  label: "An adult lies on a mat on a wooden floor. Rescuer A kneels at the far side doing chest compressions; helper B brings a green AED, kneels beyond the head, opens the lid, switches it on, sticks one pad below the right collarbone and one on the left side, plugs in, stands everyone clear and presses the shock button. A phone on the floor shows 108 / 112.",
  body: figureBody() + `<defs><marker id="wm-swap-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#e2531f"/></marker></defs>`,
});

const WHO_TINT = { A: "#d7ecdd", B: "#fbe2c8", AED: "#cfe7d9", "-": "#efe8d8" };
const pill = (s, i) => `<button class="wm-pill" data-state="locked" type="button"><span class="n">${i + 1}</span><span class="t">${esc(s.label)}</span></button>`;
const chip = (key, label, extra = "") => `<span class="wm-chip"><span>${label}</span><b data-chip="${key}">–</b>${extra}</span>`;
const cell = (s) => `<button type="button" class="wm-cell" style="--tint:${WHO_TINT[s.who]}" title="${esc(s.num + " " + s.label + ": " + s.name)}"><b>${s.num}</b><small>${esc(s.label)}</small></button>`;
const modeSwitch = `<div class="wm-switch" role="group" aria-label="Mode"><button type="button" data-mode="auto" aria-pressed="true">Auto</button><button type="button" data-mode="manual" aria-pressed="false">Manual</button></div>`;
const breathSwitch = `<div class="wm-switch wm-breaths" role="group" aria-label="Breaths"><span>Breaths</span><button type="button" data-breaths="30:2" aria-pressed="true">30:2</button><button type="button" data-breaths="continuous" aria-pressed="false">Compressions only</button></div>`;
const player = `<div class="wm-player" role="toolbar" aria-label="Player">
<button type="button" data-player="play"><span aria-hidden="true">▶</span><span>Play</span></button>
<button type="button" data-player="pause"><span aria-hidden="true">❚❚</span><span>Pause</span></button>
<button type="button" data-player="stop"><span aria-hidden="true">■</span><span>Stop</span></button>
<button type="button" data-player="loop" aria-pressed="false" class="wm-loop"><span aria-hidden="true">↻</span><span>Loop</span></button>
<button type="button" data-player="view" aria-pressed="false" class="wm-pview"><span aria-hidden="true">⤢</span><span>Floor</span></button></div>`;

const windowHtml = `<div class="wm-window" aria-label="Window: inside the chest, and what the AED is reading">
  <div class="wm-heartbox"><span class="wm-win-title">The heart</span><svg viewBox="0 0 ${HEART_VIEW.w} ${HEART_VIEW.h}" role="img" aria-label="The heart, cut away, inside a faint chest outline">${heartSvg()}</svg><div class="wm-heart-cap"></div></div>
  <div class="wm-strip"><div class="wm-strip-head"><span>What the AED is reading</span><b class="wm-strip-count"></b></div>
    <svg viewBox="0 0 300 64" role="img" aria-label="The AED strip"><path class="wm-grid" d="M0 16H300M0 34H300M0 52H300M60 0V64M120 0V64M180 0V64M240 0V64"/><path class="wm-trace" d=""/><text class="wm-strip-none" x="150" y="38" text-anchor="middle">${esc(M.STRIP.none.caption)}</text></svg>
    <div class="wm-bar"><i></i></div><div class="wm-strip-screen"></div><div class="wm-strip-cap"></div></div>
</div>`;

const sources = M.AED.SITE.sources.map((s) => `<li>${esc(s)}</li>`).join("");
const body = `
<header class="wm-head"><h1>Using an AED · Working Model</h1>
<p class="wm-q">What do you do when an adult collapses, and how does an AED help? <span>Every number on this page comes from one model of the 18 stations (scenario clock ${M.mmss(M.TOTAL)}).</span></p></header>
<div class="wm-card">
  <nav class="wm-steps" aria-label="Steps">
    <span class="wm-title">The 7 steps</span>
    ${modeSwitch}
    ${M.STEPS.map(pill).join("")}
    ${breathSwitch}
    <a href="#" class="wm-restart">↺ Start over</a>
  </nav>
  <section class="wm-stage">
    <div class="wm-mrow" aria-hidden="true"><span class="wm-mrow-step">Step 1 of 7</span><span class="wm-mrow-clock"></span><span class="wm-mrow-badge"></span></div>
    <div class="wm-active" aria-live="polite"><span class="wm-active-no">1</span><span class="wm-active-body"><span class="wm-active-name"></span><span class="wm-active-sub"></span></span><span class="wm-speed" hidden></span></div>
    <div class="wm-figbar"><span class="wm-readout"></span>${player}<button type="button" class="wm-view" aria-pressed="false">Whole floor</button></div>
    <div class="wm-fig iso" data-theme="light">${svg}</div>
    <div class="wm-rail" aria-label="The 18 stations, in order">${M.STATIONS.map(cell).join("")}</div>
    <div class="wm-chips">${chip("clock", "Clock")}${chip("station", "In station")}${chip("comp", "Compressions")}${chip("rate", "Rate")}${chip("depth", "Depth", `<span class="wm-depth" aria-hidden="true"><em style="bottom:${(M.NUM.depthCm[0] / 7) * 100}%;height:${((M.NUM.depthCm[1] - M.NUM.depthCm[0]) / 7) * 100}%"></em><i></i></span>`)}${chip("handsoff", "Hands-off")}${chip("ccf", "Compression fraction")}${chip("speed", "Speed")}</div>
    <div class="wm-opts">${modeSwitch}${breathSwitch}</div>
    <div class="wm-side">
      ${windowHtml}
      <div class="wm-note"><div class="wm-note-head"><span class="wm-note-no">1</span><b class="wm-note-label"></b></div>
        <p class="wm-note-text"></p>
        <p class="wm-note-clinwrap"><span class="wm-clin-tag">For clinicians</span> <span class="wm-note-clin"></span></p>
        <details class="wm-more-detail"><summary>More</summary><p class="wm-note-more"></p></details>
        <p class="wm-note-done"></p>
        <button type="button" class="wm-more-btn" aria-expanded="false">More</button>
      </div>
    </div>
  </section>
</div>
<p class="wm-idea"><b>The big idea:</b> ${esc(M.AED.SITE.bigIdea)}</p>
<p class="wm-safety">${esc(M.AED.SITE.safety)} <span>${esc(M.AED.SITE.phoneNote)}</span></p>
<div class="wm-foot"><details class="wm-sources"><summary>Sources</summary><ul>${sources}<li>Shock energy: ${esc(M.NUM.shockEnergy)}. Rate ${M.NUM.rate}/min (100–120), depth ${M.NUM.depthCm[0]}–${M.NUM.depthCm[1]} cm, ${M.NUM.ratio[0]}:${M.NUM.ratio[1]} with a ${M.NUM.breathPause} s pause for two breaths. Long CPR stations are shown 3 s at real speed, then fast-forwarded (×${M.FAST}); the speed chip always says how fast. Compression fraction = time pushing ÷ time since the first push (breath pauses count as no pushing); hands-off = the AED's pauses only.</li></ul></details><span class="wm-keys">Space or Enter runs the next step. Tap a part or its label to run its step.</span></div>
<div class="wm-toast" role="status" aria-live="polite"></div>
<footer class="wm-credit">Made with <span class="wm-heart">♥</span> and a passion for teaching medicine · Dr. Atul Tiwari<a class="wm-qr-link" href="${M.AED.SITE.url}" target="_blank" rel="noopener" aria-label="atultiwari.com">${QR_SVG}<span>atultiwari.com</span></a><a class="wm-credit-link" href="${M.AED.SITE.url}" target="_blank" rel="noopener">atultiwari.com</a></footer>`;

const errorHook = `window.addEventListener("error",e=>{document.documentElement.dataset.errors=(document.documentElement.dataset.errors||"")+" "+e.message});window.addEventListener("unhandledrejection",e=>{document.documentElement.dataset.errors=(document.documentElement.dataset.errors||"")+" "+e.reason});`;
const script = [
  readFileSync(join(SHARED, "aed-spec.js"), "utf8"),
  strip(src("engine/iso-engine.mjs")),
  strip(src("engine/lathe.mjs")).replace(/\b(oriented|runsOf|signedArea)\b/g, "lathe_$1"), // same private names as the engine
  strip(src("model.mjs")),
  strip(src("world.mjs")),
  ns("W", W),
  strip(src("figures.mjs")),
  strip(src("poses.mjs")),
  strip(src("heartwin.mjs")),
  `const P = ${JSON.stringify(P)};`,
  src("live-draw.js"),
  src("live.js"),
].join("\n");

const html = k
  .pageHtml({ title: "Using an AED · Working Model", theme: "light", body, script, width: 1400 })
  .replace("<title>", `<meta name="description" content="${esc(M.AED.SITE.tagline)}: a model-driven isometric figure of using an AED on a collapsed adult."><title>`)
  .replace("</head>", `<script>${errorHook}</script><style>${CSS}${WINDOW_CSS}</style><script src="../shared/switcher.js" defer></script></head>`);
writeFileSync(join(HERE, "..", "index.html"), html);
console.log("wrote working-model/index.html", (html.length / 1024).toFixed(0), "KB; run", M.RUN_SECONDS.toFixed(1), "s");
