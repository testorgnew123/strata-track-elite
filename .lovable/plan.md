
# Finish remaining portal phases

## What's still incomplete (audit summary)

| Area | Status |
|---|---|
| 3 routes from plan: `/portal/reports`, `/admin/projects/$projectId`, `/admin/notifications` | ❌ missing |
| PDF report generation (`pdf-lib`) | ❌ missing |
| Email notifications (was HostGator, now Resend) | ❌ missing |
| Reminder cron (stale milestones / visits) | ❌ missing |
| Handover rating + referral UI | ❌ missing (tables exist, no UI) |
| Engineer photo watermarking | ❌ missing |
| Admin project CRUD + user invite flow | ❌ missing |
| Phase 8 polish + linter sweep | ❌ missing |

---

## 1. Missing routes (3 new files)

- **`src/routes/_authenticated.portal.reports.tsx`** — Lists generated reports for the client's project, with a "Download progress report" button that calls an edge function and streams a branded PDF.
- **`src/routes/_authenticated.admin.projects.$projectId.tsx`** — Project detail drill-in: edit name/code/status/dates/cover, manage team members (add/remove engineer & client), milestone timeline summary, recent progress, danger-zone archive.
- **`src/routes/_authenticated.admin.notifications.tsx`** — Notification templates (subject + HTML body, per event), test-send button, recent send log.

## 2. Admin: project & user CRUD

- Upgrade `_authenticated.admin.projects.tsx` with a **Create project** dialog and per-row Edit/Open actions.
- Upgrade `_authenticated.admin.users.tsx` with an **Invite user** dialog (email, full name, mobile, role, optional project).
- New edge function `admin-invite-user` (service role): creates auth user with temp password, inserts profile + role + optional project_member, emails the invitee via Resend.

## 3. PDF report generation

- New edge function **`generate-project-report`** using `pdf-lib`:
  - Brandmark + project name/code header
  - Project meta block (status, % complete, expected handover, address)
  - Milestone timeline table
  - Last 6 progress photos as a 2×3 thumbnail grid (signed URLs from Storage)
  - Footer with timestamp + "Generated for {client}"
- Streams as download. Wired to `/portal/reports` and to `/admin/projects/$projectId`.

## 4. Email notifications via Resend

- Connect Resend through `standard_connectors--connect` (no manual API key).
- New edge function **`send-notification-email`**: looks up recipient email from `auth.users`, renders a branded HTML template (navy/ivory/gold), POSTs to Resend through the Lovable gateway, logs to a new `email_log` table.
- New Postgres trigger functions (SECURITY DEFINER, fixed search_path) to fan out notifications + emails:
  - milestone marked `completed` → notify project clients
  - new `query_replies` row → notify query author
  - new `site_visits` request → notify admins
  - project status → `handover` → notify client + insert handover-flow notification
- Edge function **`send-reminders`** (cron-callable):
  - Unacknowledged milestones >48h → reminder email
  - `requested` visits >24h with no `confirmed_date` → reminder to admins

## 5. Handover flow UI

- On `/portal/readiness` and `/portal/index`, when project status is `handover` or all readiness items are done:
  - **Share your experience** card → 5-star rating + feedback (writes to `project_ratings`, one per client/project).
  - After rating: **Refer a friend** card → name + contact + note (writes to `referrals`).

## 6. Engineer photo watermarking

In `_authenticated.field.upload.tsx`, before upload:
- Draw photo to `<canvas>`, overlay bottom-left "SS · {project_code}" and bottom-right `{taken_at}` in a semi-opaque navy bar with a gold rule
- Re-encode JPEG (q=0.85), upload the watermarked blob
- EXIF orientation respected via `createImageBitmap({ imageOrientation: 'from-image' })`

## 7. Polish & verification (Phase 8)

- Run `supabase--linter` and resolve any warnings introduced by new tables/triggers.
- Empty states for portal reports, admin notifications, admin users.
- Verify role-based redirect from `/` for each demo account.
- Verify `noindex` still set in `__root.tsx`.
- Smoke-test `bun run build` — must pass with zero TS errors.

---

## Database changes

New tables (with RLS):
- **`notification_templates`** — `kind`, `subject`, `html_body`, `text_body`, `updated_at`. Admin only.
- **`email_log`** — `recipient_email`, `kind`, `subject`, `status` (queued/sent/failed), `provider_id`, `error`, `created_at`. Admin read; service role inserts.

New trigger functions: `notify_on_milestone_completed`, `notify_on_query_reply`, `notify_on_site_visit_request`, `notify_on_handover_status` (each inserts into `notifications` and invokes the email edge function via `pg_net`).

## New edge functions

| Function | Auth | Purpose |
|---|---|---|
| `generate-project-report` | JWT verified | Returns PDF for caller's accessible project |
| `admin-invite-user` | JWT + admin check | Creates auth user, profile, role, sends invite email |
| `send-notification-email` | Internal (service role) | Sends one branded transactional email via Resend |
| `send-reminders` | Cron / service role | Scans stale milestones & visits, emails reminders |

All use Resend through the Lovable Cloud connector gateway.

---

## What this plan does NOT do

- No payments / billing, no marketing surface, no public signup re-enable.
- No SMS / WhatsApp (email only — WhatsApp was always pluggable-later).

## Required from you

1. Approve this plan.
2. Approve the **Resend connection** when the connector picker appears.

Nothing else — no manual secrets, no DNS, no SMTP credentials. After approval I'll execute everything in a single pass, verify the build, and surface the demo logins so you can walk through each flow end-to-end.
