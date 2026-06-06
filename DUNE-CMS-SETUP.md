# Dune — Owner-Editable Website: Setup & Workflow

**Goal:** let the Dune owner make his own revisions to the site, then send them to
us (Islandmark) to review and publish — without giving him code access, Git
knowledge, or the ability to push anything live himself.

**Solution:** [Decap CMS](https://decapcms.org) with an **editorial workflow**,
layered on the existing static site and the `Jacksons05/dunemv-site` repo, deployed
on Netlify. The owner edits content in a simple web form at `dunemv.com/admin`. Each
change he saves becomes a **draft** (a pull request on the repo). Nothing goes live
until *we* click **Publish**.

---

## How it works once it's live

```
Owner opens dunemv.com/admin and logs in
      │
      ▼
Edits text / brands / journal / photos in friendly forms
      │
      ▼
Clicks "Save"  →  status: Draft
Clicks "Set status: In review"  →  a Pull Request is opened on the repo
      │
      ▼
WE get notified. We review the change (and a preview).
      │                         │
   looks good                needs work
      │                         │
   click Publish            leave a note / fix it
      │
      ▼
Netlify auto-builds & deploys → change is live on dunemv.com
```

The owner only ever sees the editing forms and a "Save / In review" button. He has
**no Publish button** and **no access to code, files, or the server.**

---

## What the owner CAN edit himself

- **Site text & contact** — tagline, phone, email, address, shop & Instagram links.
- **Home page text** — the ethos paragraphs, the "Pack one bag" essentials list,
  the location blurb.
- **Brands** — the full 35-brand list. Add, remove, reorder (drag), edit each
  brand's origin and one-line note. *(This is his highest-churn content — brands
  change seasonally — so it's the biggest win.)*
- **Journal** — write new field-note posts, edit existing ones, attach a photo.
- **Photos** — swap the storefront slideshow, the "A Look Inside" collage, and the
  Instagram grid (upload a new image + write a description for each).
- **Store policies** — the Returns / Shipping / Privacy footer copy.

## What stays with us (by design)

- **Layout & structure** — adding/removing/reordering whole sections, changing the
  design. Handing freeform layout to a non-technical owner is how a carefully built
  site gets broken. For these, the owner emails us a request (see below).
- **Code, motion, performance, SEO.**

> We can add a **"Request a bigger change"** note field or a simple mailto link in
> the editor so the owner has a clear channel for layout/structural requests.

---

## What's already built (in this repo)

- `admin/index.html` + `admin/config.yml` — the Decap editor and its configuration,
  with **editorial workflow enabled** and collections matching all the content above.
- `content/` — the editable content has been **extracted from the live pages** into
  data files the CMS manages:
  - `content/settings/general.json` — contact & business info
  - `content/settings/home.json` — home page text + packing list
  - `content/settings/policies.json` — footer policies
  - `content/brands.json` — all 35 brands
  - `content/photos.json` — home slideshow / collage / Instagram grid
  - `content/journal/*.md` — the 3 journal entries

The config and content are validated and ready. **Two things remain** to make it
fully live — one is ours, one is a quick dashboard setup (below).

---

## Testing the editor locally (and the "Failed to load config.yml" fix)

If you open `admin/index.html` by double-clicking it (a `file://` path), Decap
**can't fetch `config.yml`** and you'll see *"Failed to load config.yml (Failed to
fetch)."* The editor must be served over HTTP. To preview locally:

```bash
cd dunemv-site
npx decap-server          # in one terminal — the local backend
npx http-server -p 8080   # in another (or: python3 -m http.server 8080)
# then open http://localhost:8080/admin/
```

`local_backend: true` is set in `config.yml`, so the local editor reads/writes the
real files in `content/` — you can try the whole flow before any Netlify/login
setup. In production the error doesn't occur: `dunemv.com/admin/` serves
`config.yml` from the same folder over HTTPS.

## The brands page is now wired (proof of the loop)

`brands.html` now renders its list from `content/brands.json` via `build.js`
(run on every Netlify deploy — see `netlify.toml`). Verified: regenerating the
page from the data is byte-identical to the current page, and editing a brand note
in the data updates the page. So the loop is live for brands:

> owner edits **Brands** in the CMS → saves → "In review" → we publish →
> Netlify runs `build.js` → the new brands list is live.

Journal, home text, and photos follow the same pattern (markers + a `build.js`
function each) when you're ready.

## Setup steps (us / agency — one time)

### A. Choose how the owner logs in

The classic "Netlify Identity + Git Gateway" path is **deprecated for new sites**
(as of early 2026 Netlify no longer recommends configuring Git Gateway fresh).
Pick one:

| Option | Owner needs a GitHub account? | Notes |
|---|---|---|
| **GitHub backend** (current default in `config.yml`) | Yes (free, we invite him to the repo) | Fully first-party, most durable. Needs an OAuth provider (step B). |
| **DecapBridge** | **No** | Free service built for exactly this. Best owner experience. Swap the backend block in `config.yml` (instructions are commented in the file) and invite him from the DecapBridge dashboard. |
| **Netlify Git Gateway** | No | Still works if enabled, but deprecated for new setups — avoid unless you already use it. |

**Recommendation:** **DecapBridge** for the smoothest owner experience (no GitHub
account), or the **GitHub backend** if you'd rather avoid a third-party dependency.

### B. If using the GitHub backend — set up the OAuth login

Decap's GitHub backend needs an OAuth provider so the owner can log in. Easiest:
deploy the small [`decap-oauth`/`netlify-cms-oauth` provider]
(a one-click Netlify/Cloudflare function), create a GitHub OAuth App, and set its
client ID/secret. Then add `base_url:` (and `auth_endpoint:`) to the `backend`
block in `config.yml`. (DecapBridge skips this entirely.)

### C. Deploy & connect

1. Confirm the Netlify site is building from `Jacksons05/dunemv-site` (branch
   `main`). Since the site is static, **no build command is needed yet** for normal
   operation — but see step E.
2. Verify `dunemv.com/admin` loads the editor after the auth provider is set.
3. Invite the owner (GitHub repo invite, or DecapBridge invite).

### D. Hand-off to the owner

Send him: the `dunemv.com/admin` link, his login, and the one-page "How to edit your
site" guide (we can generate it from this doc). Walk him through one real edit —
changing a brand note — end to end.

### E. Wire the pages to render from the CMS content *(the remaining build task — ours)*

Right now the 5 pages still have their text **hard-coded in the HTML**, and the new
`content/*.json` files are the CMS's copy of that same content. The CMS will save
the owner's edits to those files correctly — but the pages won't *show* the edits
until they read from the content files instead of from hard-coded HTML.

To close that gap we add a **tiny build step on Netlify** (e.g. Eleventy/11ty, or a
~100-line Node script) that merges `content/*` into the page templates and outputs
the same static HTML on each deploy. This is a deliberate, documented exception to
the workspace "no build step" default — justified by "client wants self-service
editing" — and it's invisible to both the owner and to us during normal hand-edits.

**Recommended rollout (lowest risk first):**

1. **Brands** — pure repeating list, highest churn. Wire `brands.html` to render
   from `content/brands.json` first. Prove the whole loop (owner edits → review →
   publish → live) on this one page.
2. **Journal** — render cards from `content/journal/*.md`; gives the owner a real
   blog he can grow.
3. **Home & footer text + photos** — render `index.html` text, the packing list,
   policies, and the photo sets from `content/`.
4. Repeat for `about.html` and `visit.html` text as needed.

After each page is wired, run the house QA gate (`node scripts/qa.mjs dunemv-site`)
and a Lighthouse check so we stay on the A11y/BP/SEO targets. The rendered HTML
should be byte-for-byte equivalent to today's.

---

## Cost

Decap CMS is free and open-source. DecapBridge has a free tier. Netlify's free tier
covers this site. No new paid services required.

## Risks / honest notes

- **Owner login churn:** Netlify Identity/Git Gateway are in flux; the GitHub
  backend or DecapBridge are the durable choices. Decide in step A before inviting
  the owner so he isn't migrated later.
- **Photo discipline:** the editor requires a description (alt text) for every
  uploaded photo, to keep the accessibility score intact. Worth flagging in his
  hand-off so he doesn't skip it.
- **Image weight:** the owner can upload large originals. We should either add an
  image-optimization step to the Netlify build or give him a "resize before upload"
  reminder, to protect load speed.
