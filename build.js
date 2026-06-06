#!/usr/bin/env node
/*
 * Dune — content build (Islandmark CMS)
 * --------------------------------------------------------------------------
 * Regenerates the editable regions of the static pages from the CMS content
 * files in /content. Runs on every Netlify deploy (build command: `node build.js`).
 * Zero dependencies — just Node's fs.
 *
 * Currently wired: the Brands list on brands.html  ←  content/brands.json
 * Add more pages below as they're migrated (journal, home text, photos…).
 *
 * The owner edits content/brands.json in the CMS; this rebuilds brands.html;
 * Netlify publishes. Don't hand-edit the region between the BRANDS markers —
 * it's overwritten on each build.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Replace the content between `<!-- MARK:START ... -->` and `<!-- MARK:END -->`. */
function replaceRegion(html, mark, inner) {
  const re = new RegExp(
    `(<!--\\s*${mark}:START[^>]*-->)([\\s\\S]*?)(<!--\\s*${mark}:END\\s*-->)`
  );
  if (!re.test(html)) {
    throw new Error(`Markers for "${mark}" not found.`);
  }
  return html.replace(re, `$1\n${inner}\n        $3`);
}

function buildBrands() {
  const dataPath = path.join(ROOT, "content/brands.json");
  const pagePath = path.join(ROOT, "brands.html");
  const { brands } = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const items = brands
    .map(
      (b) =>
        `        <li class="brand-entry"><h3>${esc(b.name)}</h3>` +
        `<p class="brand-origin">${esc(b.origin)}</p>` +
        `<p class="brand-note">${esc(b.note)}</p></li>`
    )
    .join("\n");

  let html = fs.readFileSync(pagePath, "utf8");
  html = replaceRegion(html, "BRANDS", items);
  fs.writeFileSync(pagePath, html);
  console.log(`✓ brands.html — rendered ${brands.length} brands from content/brands.json`);
}

/**
 * Keep staging / preview deploys out of Google.
 * Netlify sets CONTEXT to 'production', 'branch-deploy', or 'deploy-preview'.
 * For anything that isn't production, emit a site-wide noindex header so the
 * preview can't outrank or duplicate dunemv.com. (Local builds have no CONTEXT.)
 */
function writeContextHeaders() {
  const ctx = process.env.CONTEXT;
  const headersPath = path.join(ROOT, "_headers");
  if (ctx && ctx !== "production") {
    fs.writeFileSync(headersPath, "/*\n  X-Robots-Tag: noindex\n");
    console.log(`✓ _headers — noindex (context: ${ctx})`);
  } else {
    // Production (or local): make sure no stray noindex header ships.
    if (fs.existsSync(headersPath)) {
      const cur = fs.readFileSync(headersPath, "utf8");
      if (cur.includes("X-Robots-Tag: noindex") && cur.trim().split("\n").length <= 2) {
        try { fs.unlinkSync(headersPath); } catch (e) { /* ignore */ }
      }
    }
    console.log(`✓ production context — site is indexable`);
  }
}

buildBrands();
writeContextHeaders();
console.log("Build complete.");
