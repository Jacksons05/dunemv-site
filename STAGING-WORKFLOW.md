# Dune — Staging Workflow

Edits never go straight to dunemv.com. They land on a **preview** first, get
reviewed, then we **promote** them to production.

## Branch model

| Branch | Deploys to | Indexed by Google? | Purpose |
|---|---|---|---|
| `main` | **dunemv.com** (production) | Yes | Live site. Only updated by promotion. |
| `staging` | **staging.dunemv.com** | No (noindex) | The "next release." CMS edits land here. |
| `cms/*` (per edit) | a unique **Deploy Preview** URL | No (noindex) | Auto-built preview of one pending edit. |

`build.js` adds a site-wide `noindex` header on every non-production deploy, so
staging and previews can't show up in search or duplicate the live site.

## The flow

```
Owner edits in the CMS ─ Save ─ "In review"
        │
        ▼
A Deploy Preview builds automatically  →  unique preview URL
        │   (we — and optionally the owner — eyeball the change here)
        ▼
We click Publish in the CMS  →  change merges into `staging`
        │
        ▼
staging.dunemv.com updates  →  we review the change in context, with everything
        │                       else queued for the next release
        ▼
We run promote-to-production.sh  →  `staging` merges into `main`
        │
        ▼
dunemv.com goes live
```

So there are two review points: the **per-edit preview** (quick check of one
change) and **staging** (the whole pending release in context). Production only
moves when we promote.

## One-time setup (Netlify dashboard + git)

1. **Create the branches** (from the repo, if not already):
   ```bash
   git checkout -b staging        # branch off main
   git push -u origin staging
   ```
2. **Netlify → Site config → Build & deploy → Branches:**
   - Set **Production branch = `main`**.
   - Under **Branch deploys**, add `staging` (or "Deploy all branches").
   - Enable **Deploy Previews** for pull requests.
3. **Staging subdomain (optional but nice):** Netlify → Domain management → add
   `staging.dunemv.com` and point it at the `staging` branch deploy. (Otherwise the
   staging URL is `staging--<site>.netlify.app`.)
4. **Confirm** the CMS targets staging — `admin/config.yml` has
   `backend: … branch: staging`. Owner edits now open PRs into `staging`.

## Promoting to production

After the staging review looks good:

```bash
# from the dunemv-site repo
../islandmark-cms/scripts/promote-to-production.sh
```

It fast-forwards `staging`, merges it into `main`, and pushes — Netlify deploys
`main` to dunemv.com. (Or do it by hand: merge `staging` → `main` and push.)

## Rolling back

If something looks wrong in production, revert the promotion merge on `main` and
push — Netlify redeploys the previous good state:

```bash
git checkout main
git revert -m 1 HEAD     # undo the last "Promote staging to production" merge
git push origin main
```
