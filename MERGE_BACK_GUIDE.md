# Merge-Back Guide: Syncing Changes from `saby-frontend` to `sabyFrontend`

This guide explains how to safely review and merge approved frontend changes made in `saby-frontend` back into the source of truth, `sabyFrontend`.

---

## 1. Safety Principles

1. **`sabyFrontend` is the Source of Truth**:
   Never run bulk folder overwrites (e.g. `cp -r saby-frontend/* sabyFrontend/`). Always merge file-by-file or directory-by-directory for the specific public pages worked on.
2. **Review Diffs First**:
   Always run `git diff` inside `sabyFrontend` before committing any merged change.

---

## 2. Safe-to-Merge Areas (Target Workspaces)

The junior frontend developer's changes will typically fall into these areas. These can be merged back into `sabyFrontend`:

| Component / Page | Source in `saby-frontend` | Target in `sabyFrontend` |
| :--- | :--- | :--- |
| **Public Site Components** | `apps/isomorphic/src/app/shared/public-site/**` | `apps/isomorphic/src/app/shared/public-site/**` |
| **Auth Layout & Modals** | `apps/isomorphic/src/app/shared/auth-layout/**` | `apps/isomorphic/src/app/shared/auth-layout/**` |
| **Public Chat Landing Page** | `apps/isomorphic/src/app/page.tsx` | `apps/isomorphic/src/app/page.tsx` |
| **Auth Pages & Routes** | `apps/isomorphic/src/app/auth/**` | `apps/isomorphic/src/app/auth/**` |
| **Marketing Pages** | `apps/isomorphic/src/app/pricing/**`<br>`apps/isomorphic/src/app/billing/**`<br>`apps/isomorphic/src/app/checkout/**`<br>`apps/isomorphic/src/app/blog/**`<br>`apps/isomorphic/src/app/documentation/**`<br>`apps/isomorphic/src/app/faqs/**`<br>`apps/isomorphic/src/app/help/**`<br>`apps/isomorphic/src/app/partners/**`<br>`apps/isomorphic/src/app/privacy-policy/**`<br>`apps/isomorphic/src/app/product-updates/**`<br>`apps/isomorphic/src/app/terms-of-service/**` | Matching directories in `sabyFrontend/apps/isomorphic/src/app/` |
| **Public Assets** | `apps/isomorphic/public/**` | `apps/isomorphic/public/**` |

---

## 3. DO NOT MERGE Checklist (Protect These Files)

Do **NOT** copy these files back into `sabyFrontend`:

* ❌ **`apps/isomorphic/.env.local`**: Contains `3001` port and direct production backend URL specific to the standalone working copy.
* ❌ **`apps/isomorphic/src/config/redirect.config.json`**: In `sabyFrontend`, login redirects must point to `/studio`, whereas in `saby-frontend` they point to `/`.
* ❌ **`apps/isomorphic/src/app/shared/modal-views/modal-config.tsx`**: Must keep full workspace node modals in `sabyFrontend`.
* ❌ **`apps/isomorphic/src/app/studio/**`**: Placeholder cards; `sabyFrontend` contains the actual Studio application.
* ❌ **`STANDALONE_CHANGES.md`** & **`MERGE_BACK_GUIDE.md`**: Kept only in `saby-frontend` as working copy documentation.

---

## 4. Step-by-Step Merge Procedure

When the developer completes a feature (e.g. updating the Pricing page and Auth Modal):

### Step 1: Compare the Modified Files
```bash
# Compare a specific component:
diff -u \
  sabyFrontend/apps/isomorphic/src/app/shared/public-site/saby-pricing-page.tsx \
  saby-frontend/apps/isomorphic/src/app/shared/public-site/saby-pricing-page.tsx
```

### Step 2: Copy the Approved File(s)
```bash
cp saby-frontend/apps/isomorphic/src/app/shared/public-site/saby-pricing-page.tsx \
   sabyFrontend/apps/isomorphic/src/app/shared/public-site/saby-pricing-page.tsx
```

### Step 3: Verify Type Integrity in `sabyFrontend`
```bash
cd sabyFrontend
pnpm --filter iso type:check
```

### Step 4: Commit to `sabyFrontend`
```bash
git -C sabyFrontend status
git -C sabyFrontend diff
git -C sabyFrontend add <specific-files>
git -C sabyFrontend commit -m "feat(public-site): sync pricing updates from public frontend repo"
```
