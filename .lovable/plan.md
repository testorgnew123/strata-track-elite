# Pivot: Portal-Only Tracking Application

SingleStop's marketing site already exists elsewhere. This product becomes a **dedicated secure client portal** — think `track.singlestop.com`. No public marketing surface, no SEO, no testimonials. Just login → portal.

---

## 1. Remove all marketing surface

**Delete routes:**
- `src/routes/about.tsx`
- `src/routes/services.tsx`
- `src/routes/projects.tsx` (the public marketing one — real `/projects` lives inside the portal)
- `src/routes/contact.tsx`

**Delete marketing components & assets:**
- `src/components/marketing/MarketingHeader.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/components/marketing/MarketingLayout.tsx`
- `src/assets/hero-construction.jpg`, `gallery-1/2/3.jpg` (keep `login-visual.jpg`)

**Strip SEO from `__root.tsx`:**
- Remove og:title, og:description, twitter cards, sitemap-style metadata.
- Add `<meta name="robots" content="noindex, nofollow">` globally.
- Title: `SingleStop Client Portal`.

**Replace `src/routes/index.tsx`:**
- No landing page. `beforeLoad` redirects:
  - If authenticated → `/portal` (role-aware: client → `/portal`, engineer → `/field`, admin → `/admin`).
  - If not → `/login`.

---

## 2. Login experience (refined, not marketing)

Keep `/login` and `/forgot-password` as the only **public** routes. Tighten copy so it reads as enterprise portal access, not lead capture:

- Remove "Don't have an account? Request access" link to `/contact` (contact route is gone). Replace with: *"Account issues? Contact your project manager."* — plain text, no link.
- Visual panel keeps the luxury imagery + brandmark, but copy shifts to:
  > "Secure access to your SingleStop project. Daily progress, milestones, and documents — in one place."
- Footer line: `Authorized users only · End-to-end encrypted`.

---

## 3. Portal architecture (authenticated only)

All app routes live under a pathless `_authenticated` layout that enforces session via `beforeLoad`. Role-based child layouts split the experience.

```
src/routes/
  __root.tsx                          (minimal shell, noindex)
  index.tsx                           (redirect-only)
  login.tsx                           (public)
  forgot-password.tsx                 (public)
  _authenticated.tsx                  (session guard + PortalShell)
  _authenticated/index.tsx            (role router → /portal | /field | /admin)

  # Client portal
  _authenticated/portal.tsx                        (client layout)
  _authenticated/portal/index.tsx                  (project overview / dashboard)
  _authenticated/portal/progress.tsx               (photo gallery + filters)
  _authenticated/portal/milestones.tsx             (timeline + acknowledge)
  _authenticated/portal/documents.tsx              (PDFs, floor plans, contracts)
  _authenticated/portal/queries.tsx                (support / questions thread)
  _authenticated/portal/visits.tsx                 (site visit scheduler)
  _authenticated/portal/readiness.tsx              (handover checklist)
  _authenticated/portal/reports.tsx                (download branded PDFs)
  _authenticated/portal/settings.tsx               (profile, sessions, language)

  # Engineer field app (mobile-first)
  _authenticated/field.tsx                         (bottom-nav layout)
  _authenticated/field/index.tsx                   (today's project)
  _authenticated/field/upload.tsx                  (camera/gallery upload + watermark)
  _authenticated/field/milestones.tsx              (mark complete)
  _authenticated/field/queries.tsx                 (respond to client)

  # Admin console
  _authenticated/admin.tsx                         (sidebar layout)
  _authenticated/admin/index.tsx                   (org dashboard)
  _authenticated/admin/projects.tsx                (CRUD)
  _authenticated/admin/projects.$projectId.tsx    (project detail / team / timeline)
  _authenticated/admin/users.tsx                   (clients, engineers, admins)
  _authenticated/admin/audit.tsx                   (audit log viewer)
  _authenticated/admin/notifications.tsx           (templates + provider config)
```

Role guard pattern:
```tsx
// _authenticated.tsx
beforeLoad: ({ context, location }) => {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }
}
```
Sub-layouts (`portal.tsx`, `field.tsx`, `admin.tsx`) further check `context.auth.hasRole(...)` and redirect to the user's correct home.

---

## 4. Premium portal shell (replaces MarketingLayout)

**`src/components/portal/PortalShell.tsx`** — the universal authenticated chrome:
- Top bar: BrandMark (compact), current project switcher (clients with multiple), notification bell, user menu (profile, sessions, language, sign out).
- Glass surface, subtle gold hairline divider, navy ink on ivory.
- Desktop: left rail navigation (icons + labels) for client/admin.
- Mobile: bottom tab bar for engineer; collapsible drawer for client.

**Visual language carried over from the existing design system** (already in `styles.css`): Navy/Ivory/Gold OKLCH palette, Fraunces display, Inter body, glass panels, gold-divider rule, `animate-rise-in`.

---

## 5. Footer / branding

- Remove `MarketingFooter` entirely.
- Inside the portal shell, a slim footer line: `© {year} SingleStop · Authorized portal · v{appVersion}`.

---

## 6. Backend & data (unchanged from prior approval)

Reaffirming the stack already approved — no scope change here, just confirming it powers the portal:

- **Neon Postgres** via `@neondatabase/serverless` in `src/server/db.ts`.
- **Custom auth**: User ID / Mobile + password (scrypt), httpOnly refresh-token rotation, CSRF, 5 fails / 15-min lockout, session list + revoke + "log out everywhere".
- **Roles**: `client`, `engineer`, `admin` in a separate `user_roles` table with a `has_role()` SECURITY DEFINER function pattern.
- **Audit log**: every login, project edit, progress delete, milestone completion, document upload.
- **Storage**: pluggable `src/server/storage.ts`; signed short-lived URLs for all media; optional client-side watermarking for engineer uploads.
- **Notifications**: provider registry (HostGator SMTP relay first; WhatsApp pluggable later).
- **PDF reports**: `pdf-lib` with logo, timeline, milestone summary, image thumbnails.
- **Trust modules**: milestone acknowledgements, queries, site visits, readiness tracker, satisfaction rating + referral CTA at handover.

No payments, invoices, quotations, or billing — anywhere.

---

## 7. SEO / discoverability

- `robots: noindex, nofollow` at root.
- No sitemap. No og:image. No social preview. This is a private application URL.
- Title pattern: `{Page} · SingleStop Portal`.

---

## 8. What this plan does NOT do (clarifications)

- Does not touch the existing public website at singlestop.com — that's separate.
- Does not keep any of the marketing routes "just in case." They're deleted.
- `/login` and `/forgot-password` remain public because they have to.

---

## Phase order on approval

1. **Cleanup** — delete marketing routes/components/assets, strip SEO, rewrite `/` as redirect, refine login copy.
2. **Auth + Neon** — schema, scrypt, cookies, sessions, lockout, audit table. (Needs `NEON_DATABASE_URL`.)
3. **Portal shell + role routing** — `_authenticated`, `portal`, `field`, `admin` layouts.
4. **Client portal modules** — overview, progress gallery (with filters), milestones, documents, queries, visits, readiness, reports, settings.
5. **Engineer field app** — mobile upload flow with watermark, milestone completion, query replies.
6. **Admin console** — projects/users CRUD, audit viewer, notification config.
7. **Notifications + PDF reports + handover flow** (rating + referral + reminders).
8. **Polish & Netlify deploy verification.**

---

## Required from you to start Phase 2

1. **`NEON_DATABASE_URL`** (I'll request as a secret).
2. **HostGator SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (+ I'll generate the relay script for HostGator).
3. **SingleStop logo** (PNG/SVG, transparent if possible) for the portal header and PDF reports.

Phase 1 (cleanup + portal-only pivot) needs nothing from you and can begin immediately on approval.