// The page's CSS: laptop (one screen, figure left, window and notes right), phone ("follow
// the action": sticky steps, close-up, rail, inset window, 2-line note, sticky player) and
// phones turned sideways. Kept apart from build.mjs so each file stays small.
export const CSS = `
.iso{--sb-page:#f5f0e5;--sb-card:#f5f0e5;--sb-paper:#f5f0e5;--sb-text:#2b3550;--sb-strong:#1f2a44;--sb-muted:#5b6480;
 --sb-hi:#1f2a44;--sb-mid:#4a5677;--sb-lo:#7c86a2;--sb-faint:#b9b2a3;--sb-lit:#e2531f;--sb-dot:#1f2a44;--sb-weight:1.1px;--accent:#ffb02e;--accent-ink:#e2531f}
body{background:#f5f0e5;color:#1f2a44;font:14px/1.45 ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",sans-serif}
.site-bar{padding-left:20px!important;padding-right:20px!important;margin-bottom:0!important;padding-bottom:3px!important}
@media (max-width:560px){.site-bar{padding-left:10px!important;padding-right:10px!important}}
.iso-page{width:min(1440px,100% - 24px);margin:6px auto 6px}
.iso-svg .iso-line[data-tone]{vector-effect:non-scaling-stroke}
.iso-edge{stroke-width:1.1px}
.iso-crease,.iso-bevel{stroke-width:.6px}
.wm-shadow{fill:#00000018;stroke:none}
.wm-shadow-soft{fill:#0000001a;stroke:none}
.wm-plank{fill:none;stroke:#a57c52;stroke-width:.8px;opacity:.55;vector-effect:non-scaling-stroke}
.wm-skin{fill:#d9a07a;stroke:#1f2a44;stroke-width:.7px;vector-effect:non-scaling-stroke}
.wm-screen{fill:#26332c;stroke:#1f2a44;stroke-width:.8px;vector-effect:non-scaling-stroke}
.wm-screen-line{fill:#8ff0b0;font-family:ui-monospace,Menlo,monospace;font-weight:700}
.wm-socket-hole{fill:#000;stroke:none}
.wm-on-glow{fill:#b7ffcf;opacity:0;transition:opacity .3s}
[data-part="aed-on"].is-glow .wm-on-glow{opacity:.9}
.wm-shock-glow{fill:#fff2a8;opacity:0}
[data-part="aed-shock"].is-blink .wm-shock-glow{animation:wm-blink .5s steps(2,start) infinite}
@keyframes wm-blink{50%{opacity:.95}}
.wm-bolt{fill:#fff;stroke:#1f2a44;stroke-width:.5px;vector-effect:non-scaling-stroke}
.wm-mark{fill:#fff;stroke:none}.wm-mark-bolt{fill:#2f9e5b}
.wm-packet{fill:#dfe6ef;stroke:#1f2a44;stroke-width:.8px;vector-effect:non-scaling-stroke}
.wm-packet-seal{fill:#9fb1c6;stroke:none}
.wm-pad3d{fill:#fbfbf8;stroke:#1f2a44;stroke-width:1px;vector-effect:non-scaling-stroke}
.wm-pad-pic{fill:none;stroke:#9aa1ad;stroke-width:.8px;vector-effect:non-scaling-stroke}
.wm-pad-dot{fill:#e2531f}
.wm-cable-under{fill:none;stroke:#1f2a44;stroke-width:3.4px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.wm-cable{fill:none;stroke:#9aa0aa;stroke-width:1.8px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.wm-phone-screen{fill:#2a3240;stroke:none;transition:fill .3s}
.is-phone-on .wm-phone-screen{fill:#bfe8ff}
.wm-phone-text{fill:#1f2a44;font:800 2.6px ui-rounded,system-ui,sans-serif;opacity:0}
.is-phone-on .wm-phone-text{opacity:1}
.wm-waves{fill:none;stroke:#1f7fd1;stroke-width:1.2px;opacity:0;vector-effect:non-scaling-stroke}
.is-phone-on .wm-waves{opacity:1;animation:wm-wave 1.2s ease-in-out infinite}
@keyframes wm-wave{50%{opacity:.3}}
/* tapes: labels printed on parts, each with its number badge */
.wm-tape{cursor:pointer}
.wm-tape-bg{fill:#fffaf0;stroke:#1f2a44;stroke-width:.8px;vector-effect:non-scaling-stroke;transition:fill .3s}
.wm-badge{fill:#1f2a44;transition:fill .3s}
.wm-tape-num{fill:#fffaf0;font-weight:800;font-family:ui-rounded,system-ui,sans-serif}
.wm-tape-text{fill:#1f2a44;font-weight:800;letter-spacing:.02em;font-family:ui-rounded,system-ui,sans-serif}
.wm-tape.is-past .wm-tape-bg{fill:#ece5d6}
.wm-tape.is-past{opacity:.75}
.wm-tape.is-active .wm-tape-bg{fill:var(--accent)}
.wm-tape.is-active .wm-badge{fill:var(--accent-ink)}
/* exactly one lit part: the active one */
.is-lit .iso-edge{stroke:var(--accent-ink)!important;stroke-width:2px}
.is-lit .wm-pad3d{stroke:var(--accent-ink);stroke-width:2px}
.wm-part,[data-slot]{cursor:pointer}
/* overlays */
.wm-carrier{fill:none;stroke:var(--accent-ink);stroke-width:2.2px;stroke-dasharray:5 4;vector-effect:non-scaling-stroke;animation:wm-spin 6s linear infinite;transform-box:fill-box;transform-origin:center}
@keyframes wm-spin{to{transform:rotate(360deg)}}
.wm-bubble rect,.wm-bubble path{fill:#fffdf6;stroke:#1f2a44;stroke-width:1.2px;vector-effect:non-scaling-stroke}
.wm-bubble path{stroke-linejoin:round}
.wm-bubble text{font:700 12.5px ui-rounded,system-ui,sans-serif;fill:#1f2a44}
.wm-word{font-family:"Chalkboard SE","Comic Sans MS","Marker Felt",cursive;font-size:17px;font-weight:700;fill:#c2412d;paint-order:stroke;stroke:#f5f0e5;stroke-width:3px;text-anchor:middle}
.wm-scan{fill:none;stroke:var(--accent-ink);stroke-width:2.4px;stroke-dasharray:6 5;vector-effect:non-scaling-stroke}
.wm-scan-ring{stroke-width:1px;opacity:.45}
.wm-ring-track{fill:#fffdf6;fill-opacity:.85;stroke:#c9bba4;stroke-width:3px;vector-effect:non-scaling-stroke}
.wm-ring-arc{fill:none;stroke:var(--accent-ink);stroke-width:3.5px;stroke-linecap:round;vector-effect:non-scaling-stroke}
.wm-ring-num{font:800 12px ui-monospace,Menlo,monospace;fill:#1f2a44}
.wm-flash{fill:none;stroke:#fffbe0;stroke-width:2.5px;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.wm-flash-glow{fill:none;stroke:#ffd23f;stroke-width:9px;stroke-linejoin:round;opacity:.8;vector-effect:non-scaling-stroke}
.wm-mark-bg{fill:#e2531f}.wm-mark-text{font:800 12px ui-rounded,system-ui,sans-serif;fill:#fff;letter-spacing:.06em}
.wm-swap{fill:none;stroke:#e2531f;stroke-width:2.5px;stroke-dasharray:6 4;vector-effect:non-scaling-stroke}
.wm-count-bg{fill:#1f2a44}.wm-count{font:800 13px ui-monospace,Menlo,monospace;fill:#ffd23f}

.wm-head{margin:2px 0 6px}
.wm-head h1{font-size:18px;line-height:1.2;margin:0;color:#1f2a44}
.wm-q{margin:1px 0 0;font-size:14px;font-weight:700;color:#2b3550}
.wm-q span{font-weight:400;color:#5b6480}
.wm-card{display:grid;grid-template-columns:186px minmax(0,1fr);background:#f5f0e5;border:1.5px solid #1f2a44;border-radius:16px;box-shadow:4px 4px 0 #ddd4c3;overflow:hidden}
.wm-steps{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-right:1.5px solid #1f2a44;background:#efe8d8}
.wm-title{font-size:16px;font-weight:800}
.wm-switch{display:flex;align-items:center;background:#e4dbc7;border:1.5px solid #1f2a44;border-radius:999px;padding:2px;gap:2px}
.wm-switch button{flex:1;border:0;background:none;border-radius:999px;padding:5px 4px;font:inherit;font-size:13px;font-weight:700;color:#4a5677;cursor:pointer;line-height:1.1}
.wm-switch button[aria-pressed="true"]{background:#1f2a44;color:#f5f0e5}
.wm-breaths{flex-wrap:wrap;border-radius:12px;margin-top:4px}
.wm-breaths span{flex:1 1 100%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#5b6480;padding:2px 8px 0}
.wm-pill{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:1.5px solid #1f2a44;border-radius:999px;padding:3px 10px 3px 4px;background:#fffaf0;font:inherit;font-size:13.5px;font-weight:700;color:#1f2a44;box-shadow:2px 2px 0 #ddd4c3;cursor:pointer;transition:opacity .3s,background .3s;line-height:1.15}
.wm-pill .n{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#1f2a44;color:#f5f0e5;font-size:12.5px}
.wm-pill[data-state="locked"]{opacity:.5;box-shadow:none}
.wm-pill[data-state="done"]{opacity:.55;box-shadow:none;background:#efe8d8}
.wm-pill[data-state="done"] .n{background:#7fa596}
.wm-pill[data-state="running"]{background:var(--accent)}
.wm-pill[data-state="running"] .n{background:var(--accent-ink)}
.wm-pill.is-cue{animation:wm-pulse 1.3s ease-in-out infinite;background:#fff3c4}
@keyframes wm-pulse{50%{box-shadow:2px 2px 0 #ddd4c3,0 0 0 6px #ffb02e88}}
.wm-restart{margin-top:auto;color:#4a5677;font-weight:700;font-size:13px}
.wm-stage{min-width:0;padding:8px 12px;display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-areas:"active side" "bar side" "fig side" "rail side" "chips side";grid-template-rows:auto auto auto auto 1fr;gap:6px 14px;align-items:start}
.wm-active{grid-area:active;display:flex;align-items:center;gap:10px;background:#fffaf0;border:1.5px solid #1f2a44;border-radius:12px;padding:5px 10px 5px 5px;box-shadow:3px 3px 0 #ddd4c3;min-height:48px}
.wm-active-no{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:var(--accent-ink);color:#fff;font-size:18px;font-weight:800}
.wm-active-body{flex:1;min-width:0}
.wm-active-name{display:block;font-size:15px;font-weight:800;line-height:1.2}
.wm-active-sub{display:block;font-size:12.5px;color:#4a5677;font-variant-numeric:tabular-nums}
.wm-speed{flex:none;background:#1f2a44;color:#ffd23f;font-weight:800;border-radius:999px;padding:3px 10px;font-variant-numeric:tabular-nums;font-size:13px}
.wm-figbar{grid-area:bar;display:flex;align-items:center;gap:8px;font:12px/1 ui-monospace,Menlo,monospace;color:#5b6480;font-variant-numeric:tabular-nums}
.wm-readout{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wm-view{border:1.2px solid #1f2a44;background:#fffaf0;border-radius:999px;padding:4px 10px;font:600 12px/1.2 ui-rounded,system-ui,sans-serif;color:#1f2a44;cursor:pointer;white-space:nowrap}
.wm-player{display:flex;gap:4px}
.wm-player button{display:inline-flex;align-items:center;gap:4px;border:1.2px solid #1f2a44;background:#fffaf0;border-radius:999px;padding:4px 9px;font:700 12px/1.1 ui-rounded,system-ui,sans-serif;color:#1f2a44;cursor:pointer}
.wm-player button:disabled{opacity:.4;cursor:default}
.wm-player button.is-playing{opacity:1;background:var(--accent)}
.wm-player button[aria-pressed="true"]{background:#1f2a44;color:#f5f0e5}
.wm-player .wm-pview{display:none}
.wm-fig{grid-area:fig;position:relative;min-width:0}
.wm-fig .iso-svg{display:block;width:100%;height:auto;max-height:calc(100vh - 412px);border-radius:10px;background:#efe6d4;overflow:hidden}
.wm-rail{grid-area:rail;display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:3px}
.wm-cell{position:relative;border:1.2px solid #1f2a44;border-radius:6px;background:var(--tint);height:34px;padding:2px 1px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:800 12px/1 ui-rounded,system-ui,sans-serif;color:#1f2a44;cursor:pointer;transition:transform .3s,box-shadow .3s;overflow:hidden}
.wm-cell small{font:700 7.5px/1.05 ui-rounded,system-ui,sans-serif;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:clip;margin-top:2px;color:#3b4560}
.wm-cell.is-past{opacity:.5}
.wm-cell.is-here{box-shadow:0 0 0 3px var(--accent);transform:translateY(-2px);background:var(--accent)}
.wm-chips{grid-area:chips;display:flex;flex-wrap:wrap;gap:4px 5px}
.wm-chip{display:inline-flex;gap:5px;align-items:center;background:#fffaf0;border:1.2px solid #1f2a44;border-radius:8px;padding:2px 8px;font:12px/1.4 ui-monospace,Menlo,monospace}
.wm-chip>span:first-child{color:#5b6480;text-transform:uppercase;letter-spacing:.03em;font-size:10px}
.wm-chip b{font-variant-numeric:tabular-nums}
.wm-depth{position:relative;display:inline-block;width:8px;height:18px;border:1px solid #1f2a44;border-radius:2px;background:#fff}
.wm-depth em{position:absolute;left:0;right:0;background:#9fd3b0}
.wm-depth i{position:absolute;left:-3px;right:-3px;height:2px;background:#e2531f;bottom:0}
.wm-opts{display:none}
.wm-side{grid-area:side;display:flex;flex-direction:column;gap:6px;min-width:0}
.wm-note{background:#fffaf0;border:1.5px solid #1f2a44;border-radius:12px;padding:7px 10px;box-shadow:3px 3px 0 #ddd4c3}
.wm-note-head{display:flex;align-items:center;gap:8px;margin-bottom:2px}
.wm-note-no{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#1f2a44;color:#fff;font-weight:800;font-size:12.5px}
.wm-note-label{font-size:14.5px}
.wm-note p{margin:3px 0 0}
.wm-note-text{font-size:13px;line-height:1.38}
.wm-note-clinwrap{font-size:11.8px;line-height:1.35;color:#3b4560}
.wm-clin-tag{font-weight:800;color:#1f2a44;text-transform:uppercase;font-size:10px;letter-spacing:.05em;background:#e4dbc7;border-radius:4px;padding:1px 5px}
.wm-more-detail{font-size:12px;margin-top:3px}
.wm-more-detail summary{cursor:pointer;font-weight:700;color:#4a5677}
.wm-note-done{font-size:12.5px;font-weight:700;color:#2f7a4f}
.wm-note-done:empty{display:none}
.wm-more-btn,.wm-mrow,.wm-credit-link{display:none}
.wm-idea{font-size:14.5px;margin:6px 0 2px;color:#1f2a44;background:#fffaf0;border:1.5px solid #1f2a44;border-radius:12px;padding:5px 12px}
.wm-safety{margin:2px 0 0;font-size:12px;color:#5b6480}
.wm-safety span{color:#7c86a2}
.wm-foot{display:flex;gap:14px;align-items:baseline;font-size:12px;color:#5b6480;margin-top:2px}
.wm-sources summary{cursor:pointer;font-weight:700;color:#4a5677}
.wm-sources ul{margin:4px 0;padding-left:18px;max-width:110ch}
.wm-keys{color:#7c86a2}
.wm-credit{position:relative;margin:4px 0 0;text-align:center;font-size:12.5px;color:#7c86a2}
.wm-heart{color:#d33a3a}
.wm-qr-link{position:absolute;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;gap:2px;color:#5b6480;text-decoration:none;font-size:10px;letter-spacing:.06em}
.wm-qr-link svg{width:76px;height:76px;background:#fbf8f0;border:1.5px solid #1f2a44;border-radius:8px;padding:4px}
@media (min-width:561px){.wm-idea,.wm-safety,.wm-foot{margin-right:96px}}
.wm-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);max-width:min(560px,calc(100% - 24px));background:#1f2a44;color:#fffaf0;border-radius:12px;padding:9px 14px;font-weight:700;font-size:14px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:30}
.wm-toast.is-on{opacity:1;transform:translate(-50%,0)}
@media (max-height:860px) and (min-width:561px){.wm-q{display:none}.wm-steps{gap:5px}}
@media (max-height:820px) and (min-width:561px){.wm-heart-cap{min-height:0}.wm-note-text{font-size:12.5px}.wm-fig .iso-svg{max-height:calc(100vh - 372px)}}
@media (max-width:1099px) and (min-width:561px){
 .wm-stage{grid-template-columns:1fr;grid-template-areas:"active" "bar" "fig" "rail" "chips" "side"}
 .wm-side{display:grid;grid-template-columns:1fr 1fr;align-items:start}
 .wm-fig .iso-svg{max-height:none}
}
@media (max-width:820px) and (min-width:561px){
 .wm-card{grid-template-columns:1fr}
 .wm-steps{display:grid;grid-template-columns:1fr 1fr;border-right:0;border-bottom:1.5px solid #1f2a44}
 .wm-title,.wm-switch,.wm-restart{grid-column:1/-1}
 .wm-side{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.wm-pill,.wm-carrier,.wm-waves,[data-part="aed-shock"] .wm-shock-glow{animation:none!important}.wm-toast{transition:none}}

/* phone: follow the action */
@media (max-width:560px){
 .iso-page{width:calc(100% - 16px);margin:6px auto 0;padding-bottom:80px}
 .wm-head h1{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .wm-q{display:none}
 .wm-card{overflow:visible;border-radius:14px;box-shadow:none;grid-template-columns:minmax(0,1fr)}
 .wm-steps{position:sticky;top:0;z-index:6;flex-direction:row;overflow-x:auto;gap:6px;padding:7px;background:#f5f0e5;border-right:0;border-bottom:1.5px solid #1f2a44;border-radius:14px 14px 0 0;scrollbar-width:none}
 .wm-steps::-webkit-scrollbar,.wm-rail::-webkit-scrollbar{display:none}
 .wm-steps .wm-title,.wm-steps .wm-switch,.wm-steps .wm-restart{display:none}
 .wm-pill{flex:none;width:auto;min-height:40px;white-space:nowrap;padding:4px 12px 4px 5px;font-size:13.5px;box-shadow:none}
 .wm-stage{grid-template-columns:minmax(0,1fr);grid-template-areas:"mrow" "fig" "rail" "active" "note" "chips" "opts";grid-template-rows:none;gap:7px;padding:7px}
 .wm-side{display:contents}
 .wm-note{grid-area:note;position:relative}
 .wm-mrow{grid-area:mrow;display:flex;gap:10px;align-items:center;font:600 12.5px/1.2 ui-monospace,Menlo,monospace;color:#4a5677;font-variant-numeric:tabular-nums}
 .wm-mrow-step{color:#1f2a44}
 .wm-mrow-badge{margin-left:auto;background:#1f2a44;color:#ffd23f;border-radius:999px;padding:3px 8px;font-weight:800}
 .wm-mrow-badge:empty{display:none}
 .wm-figbar{display:none}
 .wm-speed{display:none}
 .wm-fig .iso-svg{height:44vh;max-height:none;border:1.2px solid #1f2a44;border-radius:12px}
 .wm-fig .wm-window{position:absolute;top:6px;right:6px;width:58px;height:58px;border-radius:50%;overflow:hidden;z-index:3;cursor:zoom-in;border:1.5px solid #1f2a44;background:#fbf7ee;gap:0;transition:width .25s ease}
 .wm-fig .wm-window .wm-heartbox{border:0;border-radius:0}
 .wm-fig .wm-window .wm-heartbox svg{width:180%;margin:-38% 0 0 -52%}
 .wm-fig .wm-window .wm-strip,.wm-fig .wm-window .wm-heart-cap,.wm-fig .wm-window .wm-win-title{display:none}
 .wm-fig .wm-window.is-big{width:calc(100% - 12px);height:auto;border-radius:14px;cursor:zoom-out;gap:4px;background:#f5f0e5;padding:4px}
 .wm-fig .wm-window.is-big .wm-heartbox{border:1.5px solid #1f2a44;border-radius:12px}
 .wm-fig .wm-window.is-big .wm-heartbox svg{width:100%;margin:0}
 .wm-fig .wm-window.is-big .wm-strip,.wm-fig .wm-window.is-big .wm-heart-cap{display:block}
 .wm-rail{display:flex;overflow-x:auto;gap:4px;padding:3px 2px;scrollbar-width:none}
 .wm-cell{flex:none;width:52px;height:38px}
 .wm-cell small{font-size:7.5px}
 .wm-active{box-shadow:none}
 .wm-note{box-shadow:none;padding:7px 10px}
 .wm-note-text{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:14px}
 .wm-note-clinwrap,.wm-more-detail,.wm-note-done{display:none}
 .wm-stage.is-more .wm-note-text{display:block}
 .wm-stage.is-more .wm-note-clinwrap,.wm-stage.is-more .wm-more-detail{display:block}
 .wm-stage.is-more .wm-note-done:not(:empty){display:block}
 .wm-more-btn{display:inline-block;border:0;background:none;padding:2px 0;font:700 13px/1.4 ui-rounded,system-ui,sans-serif;color:#4a5677;text-decoration:underline;cursor:pointer;min-height:32px}
 .wm-chips{display:none}
 .wm-stage.is-more .wm-chips{display:flex}
 .wm-opts{grid-area:opts;display:flex;flex-direction:column;gap:6px}
 .wm-opts .wm-switch button{min-height:36px}
 .wm-player{position:fixed;left:0;right:0;bottom:0;z-index:10;gap:6px;padding:7px 8px calc(7px + env(safe-area-inset-bottom));background:#f5f0e5;border-top:1.5px solid #1f2a44;display:flex}
 .wm-player button{flex:1;justify-content:center;min-height:46px;border-radius:12px;font-size:14px;border-width:1.5px}
 .wm-player .wm-loop{display:none}
 .wm-player .wm-pview{display:inline-flex}
 .wm-idea{font-size:14px}
 .wm-keys,.wm-qr-link{display:none}
 .wm-credit-link{display:block;margin-top:4px;color:#4a5677;font-weight:700}
 .wm-toast{bottom:76px}
}
@media (orientation:landscape) and (max-height:500px){
 .iso-page{width:calc(100% - 16px);margin:4px auto;padding-bottom:64px}
 .wm-q{display:none}
 .wm-head h1{font-size:15px}
 .wm-card{grid-template-columns:150px minmax(0,1fr)}
 .wm-steps{display:flex;flex-direction:column;gap:3px;padding:6px;border-right:1.5px solid #1f2a44;border-bottom:0}
 .wm-title{display:none}
 .wm-steps .wm-switch button{padding:3px 2px;font-size:11.5px}
 .wm-pill{padding:1px 6px 1px 2px;font-size:11px;border-radius:10px;min-height:0}
 .wm-pill .n{width:20px;height:20px;font-size:10.5px}
 .wm-breaths{display:none}
 .wm-stage{grid-template-columns:minmax(0,1fr) 220px;grid-template-areas:"active side" "fig side" "rail side" "chips side";padding:5px 7px;gap:5px 8px}
 .wm-figbar{display:none}
 .wm-fig .iso-svg{max-height:none;height:62vh}
 .wm-side{display:flex;flex-direction:column}
 .wm-heart-cap{display:none}
 .wm-active{min-height:0;padding:3px 8px 3px 3px}.wm-active-no{width:28px;height:28px;font-size:14px}.wm-active-name{font-size:13px}
 .wm-note-text{font-size:12px}
 .wm-cell small{display:none}
 .wm-cell{height:24px}
 .wm-player{position:fixed;left:0;right:0;bottom:0;z-index:10;gap:6px;padding:5px 8px;background:#f5f0e5;border-top:1.5px solid #1f2a44}
 .wm-player button{flex:1;justify-content:center;min-height:40px}
 .wm-player .wm-loop{display:none}
 .wm-player .wm-pview{display:inline-flex}
 .wm-qr-link{display:none}
 .wm-credit-link{display:block}
}
`;
