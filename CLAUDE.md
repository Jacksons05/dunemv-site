# Dune — `dunemv-site/` (static, v2 house spine · fancygroceries.com homage)

Static rebuild of the Dune men's shop site (Edgartown, Martha's Vineyard),
ported from the Next.js app in `../Dune Folder/`. Vanilla HTML + CSS + small
`<script>` + the copied `MOTION-STARTER` kit (`motion.js` / `motion.css`). No
build step. The Next.js app is left **intact** — this is a sibling track, not a
replacement.

**Stack:** Google Fonts (Newsreader · Schibsted Grotesk · Space Mono) + GSAP
3.13 / ScrollTrigger / SplitText / Lenis (jsDelivr CDN) are the only runtime
deps. Native `@view-transition { navigation: auto }` for cross-document page
morphs. 5 pages: `index` · `shop` · `journal` · `about` · `visit`, shared
`styles.css` + `script.js`.

## Design DNA

Built on the **fancygroceries.com** house spine (RESEARCH-FINDINGS.md, Site B).
The *structure* is fancygroceries'; the *colors and type stay Dune's own* (pinned
to match the `dune-app-site` row — see registry note below).

| Axis | Choice |
|---|---|
| 1 · Genre | Heritage retail editorial (warm, photo-led, marquee + collage) — fancygroceries homage |
| 2 · Palette | **Owner palette (2026-06-01):** Gentleman's Gray (Benjamin Moore 2062-20) `#283A40` dark ground + Cloud Cream (Pantone 11-0606 TCX) `#EAE0CC` light ground + **Pheasant (Pantone 16-1332 TCX) `#C49A6B`** accent. 2 grounds + 1 accent; `brass-ink #6A5230` (darkened Pheasant) for AA small text on cream. (Replaces the earlier Night/Oat/Brass; token names `--night/--oat/--brass` kept, values swapped.) |
| 3 · Type | **Playfair Display** (bold high-contrast bracketed serif — matched to the DUNE logo wordmark, which is a Scotch/Didone display serif: thin stems, thick diagonals, fine bracketed serifs. Confirmed by inspecting the logo at 4×. Used site-wide, normal case) + **Space Mono** (packing-list numerals only). Logo PNG (`dune-logo.png`) is the brand mark in nav + footer (rendered light on the dark chrome via CSS filter). Per user, 2026-05-31: type pulled from the logo. |
| 4 · Grid | Section bands swapping Night↔Oat; overlapping offset photo collages (S8) |
| 5 · Anchor | Full-bleed storefront **slideshow**, photo-only (`Storefront.jpeg` daytime shot first, then floor/wall/entrance — JS crossfade). No overlay text per user ("only want people to look at the photos"); page `<h1>` kept SR-only for SEO/a11y. |
| 6 · Motion (≥4) | `data-split` line-mask · `data-reveal` slide-in (left/right/up + staggered grids) · scroll-reveal images · `.ms-marquee` brand wall + footer wordmark ticker · **pull-quote carousel** · cross-document View Transitions. House ease `cubic-bezier(.2,.7,.2,1)`, Lenis lerp 0.1. All gated to `prefers-reduced-motion`. |
| 7 · Wildcard | "Lose your suitcase" packing-list — editorial wardrobe checklist on the night ground (Space Mono numerals), rooted in the founder's mantra |

**Button language:** filled pill (`border-radius: 1.875rem`, filled ground +
contrast text, `letter-spacing: .1em`, `0.75rem` uppercase). `btn--night` on oat,
`btn--brass` on night (brass/night = 6.0:1, AA), `btn--ghost-oat` for secondary.
**Track:** static (Shopify-ready later — collection cards deep-link to the live
`dunemv.com` storefront; no fabricated SKUs/prices).

### Registry note — explicit homage (≥4-differ waived for this row)
Palette + type are intentionally pinned identical to the existing **App-track
`dune-app-site`** row (same brand). Adopting fancygroceries' *structure*
(slideshow anchor, collage bands, marquee) means this row shares ≥4 axes with the
fancygroceries reference row, so the ≥4-differ rule is **waived by explicit
homage call** (user decision, 2026-05-31), the same way `dune-app-site` was
declared a sibling to the static `dunemv-site` v2. Distinct from `dune-app-site`
on genre, grid, anchor, motion signature, wildcard, button language, and stack
(static vs Next.js). Note: this build **supersedes** the older v2
Bodoni/terracotta `dunemv-site` registry row — that palette/type is not used here.

## Asset audit

Images copied verbatim from `../Dune Folder/public/images/` — **same photos,
same alt text, same credits, same `[TO CONFIRM]` flags. No new, swapped, or
stock imagery.**

**Owner photographs** (`images/`): `storefront.jpg` (cedar-shingle exterior,
hero opener), `floor.jpg` (main sales floor), `wall.jpg` (brick shoe wall),
`entrance.jpg` (overhead entry), `cabinet.jpg` (glass display cabinet),
`door.jpg`, `bags.jpg` (duffel + gallery wall), `gallery.jpg` (navy stairwell),
`surfboard.jpg` (ceiling detail), `fine-knits.jpg`, `linen.jpg`, `footwear.jpg`
(category photos added 2026-05-31), `dune-logo.png`.

**Vineyard Gazette photography** (`images/gazette/`, © Vineyard Gazette Media
Group 2024, Ray Ewing) — editorial use, **visible credit on every placement**:
`d1_1.jpeg` (founders Jamie Kiersted & Annette Luna, about page), `d2_1.jpeg`
(dusk storefront, visit page + home visit teaser), `d4_0.jpeg` (display cabinet,
about page). LICENSING **[ASSET TO CONFIRM]** — confirm reuse rights with the
Gazette before go-live.

**Instagram** (`images/instagram/`) — **4 live @dune.mv posts, re-pulled
uncropped** (full-res ~1440×1788 4:5 portraits, 2026-05-31) via the owner's
logged-in Playwright session; each tile links to its source post and carries a
camera glyph + "On Instagram" labelling so the feed reads as Instagram. (4 older
2023–24 posts were dropped — deleted/archived on IG, only available as square
crops.) Some posts are vendor/product shots Dune reposted — **[ASSET TO CONFIRM]**
reuse rights before publishing.

**Unknowns flagged in-product:** seasonal hours `[TO CONFIRM]`; no contact-form
backend (static) — visit page leads with email/phone/IG instead.

**Logo & landing changes (2026-05-31, user-directed):** `dune-logo.png` (navy
serif "DUNE", 330×110, transparent) is the brand mark in nav + footer, rendered
light on the dark chrome via `filter: brightness(0) invert(1)`, and is the
favicon. `Storefront.jpeg` (daytime shingled storefront, 1600×1064) is the
landing hero's first slide — **user-supplied; it replaced the dusk Gazette shot
`d2_1.jpeg`, so provenance/licensing is [TO CONFIRM] and it carries NO Gazette
credit** (the owner `storefront.jpg` now carries the visit placements, creditless).
The home "Island" highlight plate uses `entrance.jpg` (per user request) instead
of `surfboard.jpg`; the journal "island uniform" card still uses `surfboard.jpg`.
`map.jpg` (static Google Maps screenshot, real Dune pin at 9 Winter St, ~174 KB)
fills the location section on `index.html` + `visit.html`, linked to live Google
Maps — it **replaced the hand-illustrated street-map SVG** (2026-06-02, client
request). Static image by design, **not a live Maps iframe**: an embed sets
third-party cookies and drops Lighthouse Best-Practices to ~77 (see playbook S9).
The old `.streetmap` SVG CSS is now dead but harmless.
The landing hero is **photo-only** — the "Dune" wordmark, "Edgartown · Martha's
Vineyard" kicker, and "An island wardrobe, curated" tagline were removed (user:
"I only want people to look at the photos"); the dark veil was dropped too. The
nav/footer logo image stays.

## Owner redesign (2026-06-01, Jamie's notes)
Landing rebuilt to 6 sections — **Splash** (photo slideshow) · **Ethos**
("Dressing for doing less.") · **Essentials** ("Pack one bag" — 9 categories:
Knitwear/Linens/Easy Pants/Trousers/Loafers/Sneakers/Sandals/Jewelry/Eyewear) ·
**Brands** (`#brands`, 35-label marquee — new list) · **Instagram** · **Location**
(stylized etched-map placeholder + Apple Maps button; exterior photo removed).
Everything else removed (old highlights/pull-quote/journal-preview/visit-teaser).
**Menu** (hamburger): Shop · About · Visit · Brands · Journal · Terms. New
`terms.html` (placeholder copy, `noindex`). **Shop** stripped to a cycling
product splash + buyable featured collections (header/headline/packing removed).
Footer ticker → **coordinates 41.3897° N · 70.5128° W**. Address → **9 Winter
Street, #5100**; brand styled **Dune / Man**.
**Open asset/copy gaps (need from Jamie):** new splash image (harbor/dunes/
interior), packed-suitcase photo + GRP knit closeup, clean Shop product shots,
exported logo art (the `.ai` file sent is not usable — still using
`dune-logo.png`), Terms legal copy, Apple MapKit JS token for a live embedded
map. Brand names normalized (e.g. Wax → Wax London, Orslow → orSlow, Barracuda →
Baracuta) — confirm spellings.

## QA
`node scripts/qa.mjs dunemv-site` (and per-page) — 0 console errors, 0 horizontal
overflow @ 390/768/1440 on all 5 pages. **Lighthouse (chrome-devtools MCP,
desktop) on index.html: Accessibility 100 · Best-Practices 100 · SEO 100** —
beats both reference sites (papertiger BP 100; fancygroceries A11y 100 / BP 77).
