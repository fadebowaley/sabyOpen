# Standalone Working Copy Adaptations & Changes Log

This document records all modifications and adaptations applied to `saby-frontend` so that the public landing, marketing, and authentication pages run independently without the internal enterprise backend and dashboards.

---

## 1. Environment Configuration (`.env.local`)
* **File**: `apps/isomorphic/.env.local`
* **Change**:
  ```diff
  - NEXTAUTH_URL=http://localhost:3000
  + NEXTAUTH_URL=http://localhost:3001
  - NEXT_SERVER_URL_BASE="http://127.0.0.1:4000/v1"
  + NEXT_SERVER_URL_BASE="https://api.saby.ai/v1"
  - NEXT_PUBLIC_SERVER_URL_BASE="http://localhost:4000/v1"
  + NEXT_PUBLIC_SERVER_URL_BASE="https://api.saby.ai/v1"
  ```
* **Why**:
  1. Port `3000` is typically bound by local Docker or other dev instances; `3001` allows `saby-frontend` to run side-by-side without port collision.
  2. Points authentication and public API proxies directly to the live production backend (`https://api.saby.ai/v1`), enabling real account sign-in, MFA verification, token balances, and public chat threads out-of-the-box.
* **Merge Rule**: ⚠️ **DO NOT COPY `.env.local` to `sabyFrontend`**. `sabyFrontend` maintains its own local/staging backend configuration.

---

## 2. Post-Login Redirection (`redirect.config.json`)
* **File**: `apps/isomorphic/src/config/redirect.config.json`
* **Change**:
  ```diff
    "loginRedirects": {
  -   "SabyUser": "/studio",
  -   "SuperUser": "/studio",
  -   "Owner": "/studio",
  -   "Admin": "/studio",
  -   "OrdinaryUser": "/studio",
  -   "default": "/studio"
  +   "SabyUser": "/",
  +   "SuperUser": "/",
  +   "Owner": "/",
  +   "Admin": "/",
  +   "OrdinaryUser": "/",
  +   "default": "/"
    },
  ```
* **Why**: In `sabyFrontend`, logging in sends users to the enterprise `/studio` editor. Because Studio is omitted in this standalone copy, redirecting to `/` keeps authenticated users on the main Saby Chat page with their active session, user avatar, token counter, and profile settings modal.
* **Merge Rule**: ⚠️ **DO NOT MERGE THIS CHANGE INTO `sabyFrontend`**. The main repository must continue redirecting users to `/studio`.

---

## 3. Global Modal Registry (`modal-config.tsx`)
* **File**: `apps/isomorphic/src/app/shared/modal-views/modal-config.tsx`
* **Change**:
  ```diff
  - import CreateNode from '@/app/(berrylium)/node/create/create-node';
  - import ViewNode from '@/app/(berrylium)/node/view/view-node';
  - import EditNode from '@/app/(berrylium)/node/edit/edit-node';
  - import AddChildNode from '@/app/(berrylium)/node/create/add-child-node';
  - import DeleteNode from '@/app/(berrylium)/node/delete/delete-node';
  -
  - export const modalConfig = {
  -   CREATE_NODE: CreateNode,
  -   VIEW_NODE: ViewNode,
  -   EDIT_NODE: EditNode,
  -   ADD_CHILD_NODE: AddChildNode,
  -   DELETE_NODE: DeleteNode,
  - } as const;
  + export const modalConfig = {} as const;
    export type ModalView = keyof typeof modalConfig;
  ```
* **Why**: The original file imported heavy enterprise node modals from `(berrylium)/node/*` (Workspace). Public pages do not use node modals; replacing the object with an empty typed constant severed the unnecessary dependency on internal dashboards.
* **Merge Rule**: ⚠️ **DO NOT MERGE `modal-config.tsx` INTO `sabyFrontend`**.

---

## 4. Studio & Onboarding Route Placeholders
* **Files**:
  * `apps/isomorphic/src/app/studio/page.tsx`
  * `apps/isomorphic/src/app/studio/onboarding/page.tsx`
* **Change**: Added clean informational placeholder cards explaining that Studio/Workspace is an enterprise module, providing buttons to return to `/` or open `https://saby.ai/studio`.
* **Why**: Prevents 404 errors when developers click links in public pages (e.g., "Continue Onboarding" on checkout return, or "Open Studio" in the navbar).
* **Merge Rule**: ⚠️ **DO NOT COPY `app/studio` to `sabyFrontend`** (which contains the full Studio application).

---

## 5. Supporting Utilities Included (Option A)
* **Files**:
  * `apps/isomorphic/src/app/shared/module-studio-v2/**`: Pure data reducers/validators for chat draft generation.
  * `apps/isomorphic/src/app/shared/studio-v2/studio-access-context.tsx`: Pure React Context for subscription state.
  * `apps/isomorphic/src/layouts/beryllium/beryllium-fixed-menu-items.tsx`: Static menu navigation item definitions.
  * `apps/isomorphic/src/app/react-big-calendar.css`: Stylesheet imported by line 1 of `globals.css`.
* **Why**: Preserves 100% styling, typing, and behavioral fidelity on the landing page chat composer without copying full Studio/Workspace UI code.
* **Merge Rule**: ✅ These files are identical to their counterparts in `sabyFrontend`. If updated with improvements, they can be merged after review.
