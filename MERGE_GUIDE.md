# Merge Guide & Working Copy Difference Registry

This document lists all configuration differences and adaptations made specifically for the standalone **`saby-frontend`** working copy.

When junior developers finish approved changes on public landing pages or auth components, use this guide to ensure only business UI changes are merged back into the source of truth (**`sabyFrontend`**).

---

## 1. Summary of Changes Unique to `saby-frontend`

The following files contain environment adaptations necessary for this working copy to run standalone and connect to the production online backend (`https://api.saby.ai/v1`).

| File | Changes Made in `saby-frontend` | Why It Was Changed | Action When Merging Back to `sabyFrontend` |
| :--- | :--- | :--- | :--- |
| **`apps/isomorphic/.env.local`** | `NEXTAUTH_URL=http://localhost:3001`<br>`NEXT_SERVER_URL_BASE=https://api.saby.ai/v1`<br>`NEXT_PUBLIC_SERVER_URL_BASE=https://api.saby.ai/v1` | Points to port 3001 and connects live NextAuth/APIs to the online production backend. | **DO NOT MERGE.** Keep `sabyFrontend`'s own `.env.local` (local or Docker network backend URLs). |
| **`apps/isomorphic/src/config/redirect.config.json`** | Changed `loginRedirects` from `"/studio"` to `"/"`. | Keeps authenticated users on the public landing page instead of redirecting to the excluded internal Studio module. | **DO NOT OVERWRITE** unless you intend to change where users go in the main application. Keep `"/studio"` in `sabyFrontend`. |
| **`apps/isomorphic/src/app/shared/modal-views/modal-config.tsx`** | Cleaned up references to `(berrylium)/node/*` modals. | Prevents missing module errors for internal workspace node modals that were excluded. | **DO NOT OVERWRITE** in `sabyFrontend`. |
| **`apps/isomorphic/src/app/studio/page.tsx`** | Added a clean placeholder card ("Studio is an internal module"). | Prevents 404s when clicking Studio/Workspace buttons in public preview. | **DO NOT OVERWRITE.** `sabyFrontend` already has the full Studio module. |

---

## 2. Safe Files to Merge Back to `sabyFrontend`

Any improvements, redesigns, copy updates, or bugfixes made to the following folders can be merged **file-by-file**:

* `apps/isomorphic/src/app/shared/public-site/**` (Landing page, auth modal, navbar, footer, pricing, billing, blog, legal templates)
* `apps/isomorphic/src/app/shared/auth-layout/**` (Auth card wrappers and background styling)
* `apps/isomorphic/src/app/auth/**` (Dedicated sign-in, sign-up, forgot-password, reset-password, and OTP views)
* `apps/isomorphic/src/app/(public routes)` (`pricing/`, `faqs/`, `blog/`, `documentation/`, `terms-of-service/`, `privacy-policy/`, `partners/`, etc.)
* `apps/isomorphic/public/**` (Marketing images, illustrations, SVG icons)

---

## 3. Recommended File-by-File Merge Command

To review diffs between the working copy and the source of truth:

```bash
# Compare a specific component:
diff -u sabyFrontend/apps/isomorphic/src/app/shared/public-site/saby-chat-landing.tsx \
        saby-frontend/apps/isomorphic/src/app/shared/public-site/saby-chat-landing.tsx

# Copy approved component back to source:
cp saby-frontend/apps/isomorphic/src/app/shared/public-site/saby-chat-landing.tsx \
   sabyFrontend/apps/isomorphic/src/app/shared/public-site/saby-chat-landing.tsx
```

Always verify with `git -C sabyFrontend diff` before committing to the main repository.
