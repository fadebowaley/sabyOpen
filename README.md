# Saby Frontend (Public Landing & Auth Working Copy)

This repository is a decoupled, working copy of the public landing, marketing, and authentication pages extracted from the main `sabyFrontend` application.

## Purpose
Designed for frontend developers to build, test, and iterate on public landing pages, pricing, marketing content, and authentication flows independently without running or touching internal enterprise modules (Workspace, Studio, Admin, Dashboards).

## Included Scope
* **Public Landing Page** (`/` - `SabyChatLanding`)
* **Public Marketing Pages**: Pricing (`/pricing`), Billing (`/billing`), Checkout (`/checkout`), Blog (`/blog`), Documentation (`/documentation`), FAQs (`/faqs`), Help & Support (`/help`, `/help-support`), Partners (`/partners`), Privacy Policy (`/privacy-policy`), Product Updates (`/product-updates`), Terms of Service (`/terms-of-service`), Meet (`/saby/meet`).
* **Authentication Flows**: Sign-in, Sign-up, Forgot Password, Reset Password, OTP verification (`/auth/**` and `public-auth-modal.tsx`).
* **UI Design System & Assets**: `packages/isomorphic-core`, `packages/config-tailwind`, and public images/branding.

## Upstream Parity & Merging
* All file paths in `apps/isomorphic/src/...` strictly mirror `sabyFrontend/apps/isomorphic/src/...`.
* Approved changes can be merged file-by-file directly back into `sabyFrontend`.
