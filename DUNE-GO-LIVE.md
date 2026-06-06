# Dune — Go Live (Plain-English Steps)

The full activation, start to finish, in the order you'd actually do it. ~30–45 min.
This is the friendly version; `DEPLOY-DAY-CHECKLIST.md` has the same steps as terse
checkboxes.

> **Important:** `dunemv.com` is the client's **Shopify store** — NOT where this
> marketing site lives, and `dunemv.com/admin` is Shopify's own back office. The
> marketing site + editor live at the **Netlify address** (for now), e.g.
> `dune-mv.netlify.app/admin`. The "Shop" links inside the site correctly point to
> the store and don't change.

---

### 1 · Make a DecapBridge account
Go to decapbridge.com → Sign up. Free tier (3 sites, 10 people each) is plenty.

### 2 · Add the Dune site in DecapBridge
"Add a site," then:
- **Git provider:** GitHub
- **Repository:** `Jacksons05/dunemv-site`
- **Decap login URL:** `https://dune-mv.netlify.app/admin/index.html`
  (the marketing site's Netlify address — NOT dunemv.com, which is the Shopify store)
- **Auth type:** Classic (email + password) — simplest for the owner.

### 3 · Create a GitHub access token (your job — it's a credential)
At github.com/settings/tokens, make a **fine-grained** token for only the
`dunemv-site` repo, with **Contents: read & write** and **Pull requests: read &
write** (the editorial/approval workflow needs Pull requests). Paste it into the
DecapBridge form.

### 4 · Click "Create site"
DecapBridge generates a small `backend:` config block with your real site ID.
Copy it.

### 5 · Paste that block into the settings file
Open `admin/config.yml`, replace the `backend:` block at the top with the one
DecapBridge gave you. Keep everything below it, and make sure it still says
`branch: staging`. (Easiest: paste the block to Islandmark and we'll drop it in.)

### 6 · Deploy on Netlify (put it online)
1. **Connect:** Netlify → Add new site → Import → `dunemv-site`. It reads
   `netlify.toml` automatically (build `node build.js`). Netlify gives the site a
   URL — rename it (Site settings) to something tidy like `dune-mv`, so the address
   is `dune-mv.netlify.app`. Use that `/admin/index.html` in DecapBridge (step 2)
   and as `site_url`/`display_url` in `admin/config.yml`.
2. **Branches:** Production branch = `main`; enable branch deploys for `staging`;
   enable Deploy Previews.
3. **Domains:** nothing to do — you're on the Netlify URL for now. (Later: point a
   subdomain of dunemv.com at Netlify, leaving the Shopify store alone.)
4. **Push & check:** `git push`, wait for "Published," then open
   `dune-mv.netlify.app/admin` — branded login, no error = success.
   (Not dunemv.com/admin — that's the Shopify store.)

### 7 · Invite the owner
DecapBridge → your site → Manage collaborators → his email → Send. He clicks,
sets a password, and he's in as a collaborator (edit yes, publish no).

### 8 · Test the loop, then hand off
Log in → edit a brand note → "In review" → see it on staging → run
`../islandmark-cms/scripts/promote-to-production.sh` → see it live. Then send him
`HOW-TO-EDIT-YOUR-SITE.md` and do one edit together on a call.

---

**Order rule:** do step 6 (deploy) before step 7 (invite) — login needs the site
live. **Stuck on "Failed to load config.yml"?** The site isn't served over https
yet (step 6). **Need to undo a live change?** See `STAGING-WORKFLOW.md` → Rolling back.
