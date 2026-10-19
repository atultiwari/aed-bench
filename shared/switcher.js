/* The bar at the top of every page: the site's name and tagline, and a switch between the styles that exist.
   new-project.mjs fills SITE in; edit it by hand if a style is added later. Loaded with `defer` on every page,
   so it runs after the page has built itself, then adds the bar as the first thing in <body>.
   Each style lives in its own folder next to this one's parent: ../<dir>/ */
(() => {
  const SITE = {
    name: "AED Bench",
    tagline: "An interactive guide to using an AED",
    versions: [
      { dir: 'sketchbook', name: 'Sketchbook', hint: 'Hand-drawn 2D' },
      { dir: 'turntable', name: 'Turntable', hint: 'Rotate in 3D' },
      { dir: 'working-model', name: 'Working Model', hint: 'Every number from one model' },
    ],
  };
  const here = SITE.versions.find(v => location.pathname.includes(`/${v.dir}/`)) || SITE.versions[0];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const css = `
    .site-bar{grid-column:1/-1;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:14px;flex-wrap:wrap;
      margin:0 0 10px;padding:4px 0 6px;border-bottom:1px solid rgba(35,30,22,.15);
      font:500 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#231e16}
    .site-bar .brand{font-size:24px;font-weight:800;letter-spacing:-.01em;white-space:nowrap}
    .site-bar .brand small{font-size:14px;font-weight:500;letter-spacing:0;color:#6f6858;margin-left:10px}
    .site-bar .tabs{display:flex;gap:4px;padding:3px;border:1.5px solid #231e16;border-radius:999px;background:#fbf8f0;margin-left:auto}
    .site-bar a{display:flex;align-items:center;justify-content:center;min-height:30px;padding:3px 14px;border-radius:999px;color:#231e16;text-decoration:none;white-space:nowrap}
    .site-bar a:hover{background:rgba(35,30,22,.07)}
    .site-bar a[aria-current=page]{background:#231e16;color:#fbf8f0}
    .site-bar a:focus-visible{outline:2px solid #231e16;outline-offset:2px}
    /* the page's own title sits under the site name, so it is one size smaller */
    @media (min-width:561px){body h1{font-size:18px!important}}
    @media (max-width:560px){
      .site-bar{gap:6px;margin-bottom:8px;padding:4px 0 8px}
      .site-bar .brand{font-size:20px}
      .site-bar .brand small{display:none}
      .site-bar .tabs{margin-left:0;width:100%}
      .site-bar a{flex:1 1 0;padding:4px 6px;min-height:40px;font-size:13px}
    }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'site-bar';
  nav.setAttribute('aria-label', 'Choose a version');
  const tabs = SITE.versions.length > 1
    ? `<div class="tabs">${SITE.versions.map(v => `<a href="../${v.dir}/" title="${esc(v.hint)}"${v === here ? ' aria-current="page"' : ''}>${esc(v.name)}</a>`).join('')}</div>`
    : '';
  nav.innerHTML = `<div class="brand">${esc(SITE.name)}<small>${esc(SITE.tagline)}</small></div>${tabs}`;
  document.body.prepend(nav);
})();
