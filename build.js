#!/usr/bin/env node
/*
 * Dune — content build (Islandmark CMS)
 * --------------------------------------------------------------------------
 * Regenerates the editable regions of the static pages from the CMS content
 * files in /content. Runs on every Netlify deploy (build command: `node build.js`).
 * Zero dependencies — just Node's fs.
 *
 * Wired regions (don't hand-edit between the <!-- MARK:START/END --> markers —
 * they're overwritten on every build):
 *   brands.json            -> brands.html        (BRANDS)
 *   settings/home.json     -> index.html         (ETHOS, ESSENTIALS, PACKING, LOCATION)
 *   settings/general.json  -> all pages          (CONTACT footer, LOCATION address)
 *   settings/policies.json -> all pages          (POLICIES footer grid)
 *   photos.json            -> index.html         (HERO, COLLAGE, INSTAGRAM)
 *   journal/*.md           -> journal.html       (JOURNAL list cards)
 *                          -> journal/<slug>.html (full generated post pages)
 *
 * The owner edits content in the CMS; this rebuilds the pages; Netlify publishes.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ALL_PAGES = ["index.html", "about.html", "brands.html", "journal.html", "visit.html"];

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

/** Replace the content between `<!-- MARK:START ... -->` and `<!-- MARK:END -->`. */
function replaceRegion(html, mark, inner) {
  const re = new RegExp(
    `(<!--\\s*${mark}:START[^>]*-->)([\\s\\S]*?)(<!--\\s*${mark}:END\\s*-->)`
  );
  if (!re.test(html)) return null; // marker not present on this page — skip
  return html.replace(re, `$1\n${inner}\n        $3`);
}

/** Apply a set of {mark: innerHTML} regions to a single page file. */
function applyRegions(pageRel, regions) {
  const pagePath = path.join(ROOT, pageRel);
  if (!fs.existsSync(pagePath)) return;
  let html = fs.readFileSync(pagePath, "utf8");
  let touched = 0;
  for (const mark of Object.keys(regions)) {
    const next = replaceRegion(html, mark, regions[mark]);
    if (next !== null) {
      html = next;
      touched++;
    }
  }
  if (touched) {
    fs.writeFileSync(pagePath, html);
    console.log(`✓ ${pageRel} — ${touched} region(s) updated`);
  }
}

// ── BRANDS ───────────────────────────────────────────────────────────────
function buildBrands() {
  const { brands } = read("content/brands.json");
  const items = brands
    .map(
      (b) =>
        `        <li class="brand-entry"><h3>${esc(b.name)}</h3>` +
        `<p class="brand-origin">${esc(b.origin)}</p>` +
        `<p class="brand-note">${esc(b.note)}</p></li>`
    )
    .join("\n");
  applyRegions("brands.html", { BRANDS: items });
}

// ── HOME TEXT (index.html) ─────────────────────────────────────────────────
function buildHome() {
  const h = read("content/settings/home.json");
  const g = read("content/settings/general.json");

  const paras = (h.ethos_paragraphs || [])
    .map((p) => `          <p>${esc(p.text)}</p>`)
    .join("\n");
  const ethos =
    `        <p class="kicker brass-ink" data-reveal="up">${esc(h.ethos_kicker)}</p>\n` +
    `        <h2 id="ethos-h" class="script-statement" data-split style="margin-top:1.5rem">${esc(h.ethos_statement)}</h2>\n` +
    `        <div class="text-night-70" data-reveal="up" style="margin-top:2.25rem;margin-left:auto;max-width:40rem;font-size:1.125rem;display:flex;flex-direction:column;gap:1.25rem">\n` +
    `${paras}\n` +
    `        </div>`;

  const essentials =
    `        <p class="kicker brass">${esc(h.essentials_kicker)}</p>\n` +
    `        <h2 id="ess-h" style="font-size:clamp(1.5rem,3.2vw,2.2rem);margin-top:0.5rem">${esc(h.essentials_heading)}</h2>\n` +
    `        <p class="measure text-oat-75" style="margin-top:1.5rem;font-size:1.05rem">${esc(h.essentials_intro)}</p>`;

  const packing = (h.packing_list || [])
    .map((it, i) => {
      const no = String(i + 1).padStart(2, "0");
      return (
        `        <li><span class="packing__no">${no}</span>` +
        `<div><p class="packing__item">${esc(it.item)}</p>` +
        `<p class="packing__note">${esc(it.note)}</p></div></li>`
      );
    })
    .join("\n");

  const location =
    `        <p class="kicker brass">Location</p>\n` +
    `        <h2 id="loc-h">${esc(h.location_heading)}</h2>\n` +
    `        <p class="measure text-oat-75" style="margin-top:1.5rem">${esc(h.location_text)}</p>\n` +
    `        <address style="font-style:normal;margin-top:1.5rem;color:color-mix(in srgb,var(--oat) 80%,transparent);line-height:1.7">\n` +
    `          ${esc(g.address_line1)}<br />${esc(g.address_line2)}<br />\n` +
    `          <a href="tel:${esc(g.phone_link)}">${esc(g.phone_display)}</a> · <a href="mailto:${esc(g.email)}">${esc(g.email)}</a>\n` +
    `        </address>\n` +
    `        <div class="mt-cta">\n` +
    `          <a class="btn btn--brass" href="${esc(g.maps_url)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>\n` +
    `        </div>`;

  applyRegions("index.html", {
    ETHOS: ethos,
    ESSENTIALS: essentials,
    PACKING: packing,
    LOCATION: location,
  });
}

// ── PHOTOS (index.html) ────────────────────────────────────────────────────
function buildPhotos() {
  const p = read("content/photos.json");

  const hero = (p.hero_slides || [])
    .map(
      (s, i) =>
        `      <div class="hero__slide${i === 0 ? " is-active" : ""}">\n` +
        `        <img src="${esc(s.image)}" alt="${esc(s.alt)}"${
          i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'
        } />\n` +
        `      </div>`
    )
    .join("\n");

  const collage = (p.collage || [])
    .map(
      (c, i) =>
        `        <figure class="coll-card${i % 2 ? " offset" : ""}">\n` +
        `          <div class="frame"><img src="${esc(c.image)}" alt="${esc(c.alt)}" loading="lazy" /></div>\n` +
        `          <figcaption class="kicker brass-ink" style="margin-top:0.9rem">${esc(c.caption)}</figcaption>\n` +
        `        </figure>`
    )
    .join("\n");

  const instagram = (p.instagram || [])
    .map(
      (g) =>
        `        <a class="igtile" href="${esc(g.post_url)}" target="_blank" rel="noopener noreferrer">` +
        `<img src="${esc(g.image)}" alt="${esc(g.alt)}" loading="lazy" />` +
        `<span class="cap kicker">${esc(g.caption)}</span></a>`
    )
    .join("\n");

  applyRegions("index.html", {
    HERO: hero,
    COLLAGE: collage,
    INSTAGRAM: instagram,
  });
}

// ── FOOTER: policies + contact (every list page) ───────────────────────────
function footerRegions() {
  const g = read("content/settings/general.json");
  const pol = read("content/settings/policies.json");

  const policies =
    `        <div>\n          <h3>Returns &amp; exchanges</h3>\n          <p>${esc(pol.returns)}</p>\n        </div>\n` +
    `        <div>\n          <h3>Shipping</h3>\n          <p>${esc(pol.shipping)}</p>\n        </div>\n` +
    `        <div>\n          <h3>Privacy</h3>\n          <p>${esc(pol.privacy)}</p>\n        </div>\n` +
    `        <div>\n          <h3>Contact</h3>\n          <p>${esc(g.business_name)} · ${esc(g.address_line1)}, ${esc(g.address_line2)} · ` +
    `<a href="mailto:${esc(g.email)}">${esc(g.email)}</a> · <a href="tel:${esc(g.phone_link)}">${esc(g.phone_display)}</a></p>\n        </div>`;

  const contact =
    `        <span>${esc(g.address_line1)}<br />${esc(g.address_line2)}</span>\n` +
    `        <a href="tel:${esc(g.phone_link)}">${esc(g.phone_display)}</a>\n` +
    `        <a href="mailto:${esc(g.email)}">${esc(g.email)}</a>\n` +
    `        <a href="${esc(g.instagram_url)}" target="_blank" rel="noopener noreferrer">Instagram</a>`;

  return { POLICIES: policies, CONTACT: contact };
}

function buildFooter() {
  const regions = footerRegions();
  for (const page of ALL_PAGES) applyRegions(page, regions);
}

// ── JOURNAL ────────────────────────────────────────────────────────────────
function parsePost(src) {
  src = src.replace(/\r\n/g, "\n");
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const data = {};
  let body = "";
  if (m) {
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i === -1) continue;
      let v = line.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      data[line.slice(0, i).trim()] = v;
    }
    body = (m[2] || "").trim();
  }
  return { data, body };
}

/** Minimal, safe Markdown → HTML (headings, paragraphs, lists, bold/italic/links). */
function mdToHtml(md) {
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    return s;
  }
  return md
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      if (/^###\s+/.test(b)) return "<h3>" + inline(b.replace(/^###\s+/, "")) + "</h3>";
      if (/^##\s+/.test(b)) return "<h2>" + inline(b.replace(/^##\s+/, "")) + "</h2>";
      if (/^#\s+/.test(b)) return "<h2>" + inline(b.replace(/^#\s+/, "")) + "</h2>";
      if (/^[-*]\s+/.test(b)) {
        const items = b
          .split("\n")
          .map((l) => l.replace(/^[-*]\s+/, ""))
          .map((i) => "<li>" + inline(i) + "</li>")
          .join("");
        return "<ul>" + items + "</ul>";
      }
      return '<p>' + inline(b.replace(/\n/g, " ")) + "</p>";
    })
    .filter(Boolean)
    .join("\n        ");
}

function siteNav() {
  return (
    '<nav class="nav" id="nav">\n' +
    '  <a class="nav__brand" href="/index.html" aria-label="Dune — home"><img class="nav__logo" src="/images/dune-logo.png" alt="Dune" width="330" height="110" /></a>\n' +
    '  <ul class="nav__links">\n' +
    '    <li><a class="nav__link" href="https://dunemv.com" target="_blank" rel="noopener noreferrer">Shop</a></li>\n' +
    '    <li><a class="nav__link" href="/about.html">About</a></li>\n' +
    '    <li><a class="nav__link" href="/visit.html">Visit</a></li>\n' +
    '    <li><a class="nav__link" href="/brands.html">Brands</a></li>\n' +
    '    <li><a class="nav__link" href="/journal.html" aria-current="page">Journal</a></li>\n' +
    "  </ul>\n" +
    '  <button class="nav__burger" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu"><span></span><span></span><span></span></button>\n' +
    '  <div class="nav__mobile" id="mobile-nav"><ul>\n' +
    '    <li><a href="https://dunemv.com" target="_blank" rel="noopener noreferrer">Shop</a></li>\n' +
    '    <li><a href="/about.html">About</a></li>\n' +
    '    <li><a href="/visit.html">Visit</a></li>\n' +
    '    <li><a href="/brands.html">Brands</a></li>\n' +
    '    <li><a href="/journal.html" aria-current="page">Journal</a></li>\n' +
    "  </ul></div>\n" +
    "</nav>"
  );
}

function siteFooter(g, pol) {
  return (
    '<footer class="foot">\n' +
    '  <div class="foot__terms"><div class="inner">\n' +
    '    <p class="kicker brass">Terms &amp; Store Policies</p>\n' +
    '    <div class="foot__terms-grid">\n' +
    `      <div><h3>Returns &amp; exchanges</h3><p>${esc(pol.returns)}</p></div>\n` +
    `      <div><h3>Shipping</h3><p>${esc(pol.shipping)}</p></div>\n` +
    `      <div><h3>Privacy</h3><p>${esc(pol.privacy)}</p></div>\n` +
    `      <div><h3>Contact</h3><p>${esc(g.business_name)} · ${esc(g.address_line1)}, ${esc(g.address_line2)} · ` +
    `<a href="mailto:${esc(g.email)}">${esc(g.email)}</a> · <a href="tel:${esc(g.phone_link)}">${esc(g.phone_display)}</a></p></div>\n` +
    "    </div>\n" +
    "  </div></div>\n" +
    '  <div class="foot__grid">\n' +
    '    <div>\n' +
    '      <p class="wordmark"><img class="foot__logo" src="/images/dune-logo.png" alt="Dune" width="330" height="110" /></p>\n' +
    `      <p class="text-oat-75 measure" style="margin-top:1rem">${esc(g.tagline)}</p>\n` +
    '      <p class="foot__coords kicker">41.3897&deg; N · 70.5128&deg; W</p>\n' +
    "    </div>\n" +
    '    <nav aria-label="Footer"><p class="kicker brass">Pages</p><ul>\n' +
    '      <li><a href="https://dunemv.com" target="_blank" rel="noopener noreferrer">Shop</a></li>\n' +
    '      <li><a href="/about.html">About</a></li>\n' +
    '      <li><a href="/visit.html">Visit</a></li>\n' +
    '      <li><a href="/brands.html">Brands</a></li>\n' +
    '      <li><a href="/journal.html" aria-current="page">Journal</a></li>\n' +
    "    </ul></nav>\n" +
    '    <div>\n' +
    `      <p class="kicker brass">${esc(g.business_name)}</p>\n` +
    "      <address>\n" +
    `        <span>${esc(g.address_line1)}<br />${esc(g.address_line2)}</span>\n` +
    `        <a href="tel:${esc(g.phone_link)}">${esc(g.phone_display)}</a>\n` +
    `        <a href="mailto:${esc(g.email)}">${esc(g.email)}</a>\n` +
    `        <a href="${esc(g.instagram_url)}" target="_blank" rel="noopener noreferrer">Instagram</a>\n` +
    "      </address>\n" +
    "    </div>\n" +
    "  </div>\n" +
    '  <div class="foot__base"><p class="kicker" style="font-size:0.6rem">© <span id="yr">2026</span> ' +
    `${esc(g.business_name)}. Edgartown, Massachusetts.</p></div>\n` +
    "</footer>"
  );
}

function postPage(d, bodyHtml, g, pol) {
  const meta = [d.category, d.season].filter(Boolean).join(" · ");
  const img = d.image
    ? `      <div class="frame" style="max-width:48rem;margin:0 auto 3rem"><img src="${esc(
        d.image
      )}" alt="${esc(d.image_alt)}" loading="lazy" /></div>\n`
    : "";
  return (
    "<!doctype html>\n" +
    '<html lang="en">\n<head>\n' +
    '<meta charset="utf-8" />\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<link rel="icon" type="image/png" href="/images/dune-logo.png" />\n' +
    `<title>${esc(d.title)} — Journal · Dune</title>\n` +
    `<meta name="description" content="${esc(d.dek)}" />\n` +
    `<meta property="og:title" content="${esc(d.title)} — Dune" />\n` +
    `<meta property="og:description" content="${esc(d.dek)}" />\n` +
    (d.image ? `<meta property="og:image" content="${esc(d.image)}" />\n` : "") +
    '<meta name="theme-color" content="#283a40" />\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com" />\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" />\n' +
    '<link rel="stylesheet" href="/motion.css" />\n' +
    '<link rel="stylesheet" href="/styles.css" />\n' +
    "</head>\n<body>\n\n" +
    siteNav() +
    "\n\n<main>\n" +
    '  <header class="band--night pagehead">\n    <div class="inner">\n' +
    (meta ? `      <p class="kicker brass" data-reveal="up">${esc(meta)}</p>\n` : "") +
    `      <h1 data-split>${esc(d.title)}</h1>\n` +
    "    </div>\n  </header>\n" +
    '  <section class="band band--oat">\n    <div class="inner">\n' +
    img +
    '      <div class="measure" style="margin:0 auto;font-size:1.125rem;line-height:1.85">\n' +
    (d.dek
      ? `        <p class="text-night-70" style="font-size:1.25rem;margin-bottom:1.5rem">${esc(
          d.dek
        )}</p>\n`
      : "") +
    "        " +
    (bodyHtml || '<p class="text-night-70">Full entry in progress.</p>') +
    "\n      </div>\n" +
    '      <p class="note" style="margin-top:3rem"><a class="brass-ink" href="/journal.html">← Back to the Journal</a></p>\n' +
    "    </div>\n  </section>\n</main>\n\n" +
    siteFooter(g, pol) +
    "\n\n" +
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>\n' +
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>\n' +
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>\n' +
    '<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>\n' +
    '<script src="/motion.js"></script>\n' +
    '<script src="/script.js"></script>\n' +
    '<script>document.getElementById("yr").textContent = new Date().getFullYear();</script>\n' +
    "</body>\n</html>\n"
  );
}

function buildJournal() {
  const dir = path.join(ROOT, "content/journal");
  if (!fs.existsSync(dir)) return;
  const g = read("content/settings/general.json");
  const pol = read("content/settings/policies.json");

  const posts = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const parsed = parsePost(fs.readFileSync(path.join(dir, f), "utf8"));
      return { slug: f.replace(/\.md$/, ""), data: parsed.data, body: parsed.body };
    })
    .sort((a, b) => (Number(a.data.order) || 0) - (Number(b.data.order) || 0));

  // 1) Regenerate the list cards (each links to its post page).
  const cards = posts
    .map((p) => {
      const d = p.data;
      const meta = [d.category, d.season].filter(Boolean).join(" · ");
      const img = d.image
        ? `          <div class="frame"><img src="${esc(d.image)}" alt="${esc(
            d.image_alt
          )}" loading="lazy" /></div>\n`
        : "";
      return (
        `        <a class="card-link" href="journal/${esc(p.slug)}.html" style="display:contents">\n` +
        `        <article class="card">\n` +
        img +
        (meta ? `          <p class="kicker brass-ink meta">${esc(meta)}</p>\n` : "") +
        `          <h3>${esc(d.title)}</h3>\n` +
        `          <p class="text-night-70">${esc(d.dek)}</p>\n` +
        `        </article>\n` +
        `        </a>`
      );
    })
    .join("\n");
  applyRegions("journal.html", { JOURNAL: cards });

  // 2) Regenerate the per-post pages into /journal/<slug>.html (clean stale first).
  const outDir = path.join(ROOT, "journal");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith(".html")) fs.unlinkSync(path.join(outDir, f));
  }
  for (const p of posts) {
    fs.writeFileSync(
      path.join(outDir, p.slug + ".html"),
      postPage(p.data, mdToHtml(p.body), g, pol)
    );
  }
  console.log(`✓ journal/ — ${posts.length} post page(s) generated`);
}

/**
 * Keep staging / preview deploys out of Google.
 * Netlify sets CONTEXT to 'production', 'branch-deploy', or 'deploy-preview'.
 */
function writeContextHeaders() {
  const ctx = process.env.CONTEXT;
  const headersPath = path.join(ROOT, "_headers");
  if (ctx && ctx !== "production") {
    fs.writeFileSync(headersPath, "/*\n  X-Robots-Tag: noindex\n");
    console.log(`✓ _headers — noindex (context: ${ctx})`);
  } else {
    if (fs.existsSync(headersPath)) {
      const cur = fs.readFileSync(headersPath, "utf8");
      if (cur.includes("X-Robots-Tag: noindex") && cur.trim().split("\n").length <= 2) {
        try {
          fs.unlinkSync(headersPath);
        } catch (e) {
          /* ignore */
        }
      }
    }
    console.log(`✓ production context — site is indexable`);
  }
}

buildBrands();
buildHome();
buildPhotos();
buildFooter();
buildJournal();
writeContextHeaders();
console.log("Build complete.");
