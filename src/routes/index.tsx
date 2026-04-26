import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Root URL is not a landing page — this is a portal.
 * Once auth is wired (Phase 2), this redirects role-aware:
 *   client → /portal, engineer → /field, admin → /admin
 * For now we route everyone to /login.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
