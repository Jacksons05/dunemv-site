# Dune — Deploy Day Checklist

Everything to take Dune's CMS + staging workflow live, in order. ~45–60 min.
Have open: the GitHub repo (`Jacksons05/dunemv-site`), Netlify, and (if using it)
DecapBridge.

---

### A · GitHub — branches  ▢
- [ ] Confirm `main` holds the current live site.
- [ ] Create the staging branch:
      `git checkout main && git checkout -b staging && git push -u origin staging`
- [ ] Confirm the CMS files are committed on both branches: `admin/`, `content/`,
      `build.js`, `netlify.toml`.

### B · Login — pick ONE  ▢
**DecapBridge (recommended — owner needs no GitHub account):**
- [ ] Sign up at decapbridge.com, create a site, connect `Jacksons05/dunemv-site`.
- [ ] Swap the `backend:` block in `admin/config.yml` to the DecapBridge version
      (commented in the file). Commit to `staging` and `main`.
- [ ] Invite the owner by email from the DecapBridge dashboard.

**GitHub backend (alternative):**
- [ ] Create a GitHub OAuth App (Settings → Developer settings → OAuth Apps).
- [ ] Deploy the one-click Decap OAuth provider; set its Client ID/Secret.
- [ ] Add `base_url:` to the `backend:` block in `config.yml`. Commit.
- [ ] Invite the owner to the repo (write access).

### C · Netlify — site & build  ▢
- [ ] Add new site → import `Jacksons05/dunemv-site`.
- [ ] Build command **`node build.js`** · Publish directory **`.`** (already in
      `netlify.toml` — just confirm).
- [ ] Site config → Build & deploy → **Production branch = `main`**.
- [ ] **Branch deploys:** add `staging` (or "all branches").
- [ ] **Deploy Previews:** enable for pull requests.

### D · Netlify — domains  ▢
- [ ] Domain management → add **`dunemv.com`** → production (`main`).
- [ ] Add **`staging.dunemv.com`** → the `staging` branch deploy.
- [ ] Confirm HTTPS certs issue for both.

### E · Smoke test (do the loop once yourself)  ▢
- [ ] Open **dunemv.com/admin** → branded Islandmark login appears, no
      "config.yml" error.
- [ ] Log in → all collections show (Site Text, Brands, Journal, Photos, Policies).
- [ ] Edit a brand note → **Save** → set **In review**.
- [ ] A `cms/*` PR opens → a **Deploy Preview** builds → open its URL, confirm the
      edit shows and the page is `noindex`.
- [ ] Click **Publish** in the CMS → change merges to `staging` →
      **staging.dunemv.com** updates.
- [ ] Run `../islandmark-cms/scripts/promote-to-production.sh` → **dunemv.com**
      updates. Confirm production is indexable (no noindex header).

### F · Hand-off to the owner  ▢
- [ ] Fill in his login + your contact in `HOW-TO-EDIT-YOUR-SITE.md`.
- [ ] Send it + the **dunemv.com/admin** link.
- [ ] Book a 15-min walkthrough; do one real edit together.

---

**If the editor shows "Failed to load config.yml":** it was opened as a file or
isn't served over HTTPS yet — see `DUNE-CMS-SETUP.md` → "Testing the editor locally."
**Rollback:** `STAGING-WORKFLOW.md` → "Rolling back."
