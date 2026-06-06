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
 *   journal/*.md           -> journal.html       (JOURNAL)
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

// ── FOOTER: policies + contact (every page) ────────────────────────────────
function buildFooter() {
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

  for (const page of ALL_PAGES) {
    applyRegions(page, { POLICIES: policies, CONTACT: contact });
  }
}

// ── JOURNAL CARDS (journal.html) ───────────────────────────────────────────
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
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
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

function buildJournal() {
  const dir = path.join(ROOT, "content/journal");
  if (!fs.existsSync(dir)) return;
  const posts = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseFrontmatter(fs.readFileSync(path.join(dir, f), "utf8")))
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const cards = posts
    .map((p) => {
      const meta = [p.category, p.season].filter(Boolean).join(" · ");
      const img = p.image
        ? `          <div class="frame"><img src="${esc(p.image)}" alt="${esc(
            p.image_alt
          )}" loading="lazy" /></div>\n`
        : "";
      return (
        `        <article class="card">\n` +
        img +
        (meta ? `          <p class="kicker brass-ink meta">${esc(meta)}</p>\n` : "") +
        `          <h3>${esc(p.title)}</h3>\n` +
        `          <p class="text-night-70">${esc(p.dek)}</p>\n` +
        `        </article>`
      );
    })
    .join("\n");

  applyRegions("journal.html", { JOURNAL: cards });
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
