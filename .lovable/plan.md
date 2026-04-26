# SingleStop Building Solutions — Premium Construction Progress Portal

A luxury enterprise portal focused exclusively on **project transparency and client trust**. No payments, invoices, quotations, receipts, or billing of any kind — anywhere in the UI, database, or PDFs.

---

## Scope Lock — What's IN and What's OUT

**IN scope (the only modules that exist):**
- Authentication & session/device management
- User & project administration
- Site progress updates with photos
- Milestones
- Documents (floor plans, contracts, permits, approvals)
- Notifications (email today, WhatsApp-ready architecture)
- Branded PDF progress reports
- Audit logs
- **Trust features**: milestone approval acknowledgement, client queries/support, site-visit scheduling, completion readiness tracker

**OUT of scope (will not be built, no DB tables, no UI, no routes):**
- Payments, invoices, quotations, estimates, receipts, billing, ledgers, GST, tax, pricing, cost breakdowns, payment schedules, dues, refunds — *none of these exist anywhere in the product.*

---

## Tech & Infrastructure

- **Frontend**: React 19 + TypeScript + TanStack Start + Tailwind v4 + shadcn/ui
- **Database**: **Neon Postgres** via `@neondatabase/serverless` + raw SQL in `src/server/db.ts` (you'll provide `NEON_DATABASE_URL`)
- **Auth**: Custom User ID / Mobile + password (scrypt hashing), httpOnly secure cookies, refresh token rotation, CSRF, **strict 5-fail / 15-min lockout**
- **Storage**: pluggable wrapper, Cloudinary-ready, signed URLs with role checks
- **Email**: HostGator SMTP via a small HTTPS→SMTP relay script (provided for you to deploy)
- **Notifications**: provider registry (`email` today, `whatsapp` pluggable later)
- **PDF**: `pdf-lib` with your uploaded SingleStop logo
- **Deploy**: Netlify-ready

---

## Database Schema (Neon)

Core tables: `users`, `sessions`, `login_attempts`, `password_resets`, `projects`, `project_assignments`, `milestones`, `progress_updates`, `progress_images`, `documents`, `activity_logs`, `notifications`.

**Trust-feature tables:**
- `milestone_acknowledgements` — client signs off a completed milestone (acknowledged_at, note, IP)
- `client_queries` — query/support thread per project (status: open/in-progress/resolved, replies)
- `site_visit_requests` — preferred date/time slots, status (requested/confirmed/completed/cancelled), engineer assigned
- `completion_readiness` — checklist per project (handover items: snag list, cleaning, utilities, documents handed over, final walkthrough) with item-level status

**Explicitly absent**: no `invoices`, `payments`, `quotations`, `receipts`, `transactions`, `pricing`, `cost`, `amount_due`, `tax` columns — anywhere.

---

## Roles & Access

- **Admin** — full access to everything except billing (which doesn't exist)
- **Engineer** — only assigned projects; uploads updates/photos/documents; responds to queries; confirms site visits
- **Client** — only own project; views progress, gallery, documents, milestones; **acknowledges milestones**, **raises queries**, **requests site visits**, **views readiness tracker**, **downloads PDF report**

Strict server-side authorization on every route and signed-URL request.

---

## Public Pages

- **Home** — Hero ("Track Your Dream Project In Real Time"), Why SingleStop, Gallery preview, Testimonials, Contact. CTAs: *Client Login*, *Book Consultation*. **No pricing section.**
- **Login** — premium split layout: building visual + login card (User ID or Mobile + password, forgot password)
- **Forgot / Reset password** — email OTP

---

## Authenticated Experiences

### Admin
Dashboard KPIs (Projects, Active Clients, Engineers, Recent Updates, Pending Milestones, **Open Queries**, **Pending Site Visits**), users management, projects management, assignments, update feed, audit log viewer, notification settings, security settings, **active sessions / devices** page with revoke + log-out-everywhere.

### Engineer (mobile-first)
Bottom-nav app-like layout. Assigned projects, large *Upload Update* CTA, multi-photo upload with optional watermark, progress % slider, today/next work notes, milestone completion, **respond to client queries**, **confirm site-visit slots**, **update readiness checklist items**.

### Client (luxury experience)
- Welcome card with project hero
- Animated radial completion ring + estimated handover date
- Progress timeline (elegant vertical stepper)
- Milestone tracker with **"Acknowledge milestone"** action
- Latest update cards + rich gallery (filters: date, milestone, update type)
- **Documents** library (signed URLs, role-checked)
- **Raise a Query** (threaded support per project)
- **Request a Site Visit** (preferred slots, status badge)
- **Completion Readiness Tracker** (checklist with progress bar)
- **Download branded PDF Progress Report**

---

## Trust Features — UX Detail

1. **Milestone Acknowledgement** — when engineer marks milestone complete, client gets a notification. Client opens the milestone, reviews photos, taps *Acknowledge*. Stored with timestamp + optional note. Visible to admin/engineer.
2. **Client Queries** — premium chat-style thread per project. Client posts question, engineer/admin reply. Status pill (Open / In Progress / Resolved). Email notification on reply.
3. **Site Visit Scheduler** — client picks 2–3 preferred slots, optional note. Engineer/admin confirms a slot or proposes alternates. Calendar-style confirmation card. Status lifecycle: Requested → Confirmed → Completed / Cancelled.
4. **Completion Readiness Tracker** — pre-handover checklist (snag list cleared, deep cleaning, utilities active, documents handed over, final walkthrough done, keys ready). Each item: Pending / In Progress / Done. Animated progress bar shows handover readiness %.

---

## Media, Documents, Security

- **Signed URLs** for all images/documents, short TTL, role-checked at issue time
- **Optional watermark** on progress photos (client-side toggle for engineers)
- **Documents module**: PDFs, floor plans, permits, approvals, handover docs — versioned, role-scoped
- **Audit logs**: login success/failure, user/project create/edit, progress delete, milestone complete, milestone acknowledge, query open/reply, site-visit status changes, document upload/delete

---

## Notifications

Provider registry. Email events today (via HostGator SMTP relay):
- New progress update, milestone completed, milestone acknowledged
- Project reaches 25% / 50% / 75% / 100%
- New query / query reply
- Site visit requested / confirmed / reminder
- Readiness item completed
- Password reset OTP, new device login

WhatsApp/SMS providers pluggable later with no app changes.

---

## PDF Progress Report

Branded with your uploaded SingleStop logo. Includes: cover, project summary, completion %, milestone summary, timeline, image thumbnails, readiness snapshot, acknowledgements list. **No financial information of any kind.**

---

## Mobile, Performance, Polish

- Mobile-first throughout, app-like engineer experience
- Fast premium animations (≤200ms, GPU-friendly), reduced-motion respected
- Skeleton loaders, lazy images, toasts, error states, 404 + global error boundary
- Navy / Ivory / Gold palette, Fraunces display + Inter body, glassmorphism accents, soft shadows, 2xl rounded cards

---

## Demo Seed Data

1 admin, 2 engineers, 3 clients, 3 projects with milestones, progress updates, photos, documents, sample queries, one scheduled site visit, partially-filled readiness checklist.

---

## What I'll Need From You After Approval

1. **SingleStop logo** (PNG/SVG, transparent preferred)
2. **`NEON_DATABASE_URL`** (pooled connection string)
3. **HostGator SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (I'll generate the small relay script for you to deploy on HostGator)
4. *(Optional, easy later)* Cloudinary keys; WhatsApp provider credentials

I'll request these as secrets at the right step — no need to paste anything now.
