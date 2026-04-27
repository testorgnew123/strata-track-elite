import type { Context } from "@netlify/functions";
import { revokeSessionByRefresh } from "../../src/server/auth/session";
import {
  buildClearedRefreshCookie,
  parseCookies,
} from "../../src/server/auth/cookies";
import { REFRESH_COOKIE_NAME } from "../../src/server/auth/session";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[REFRESH_COOKIE_NAME];
  if (token) {
    await revokeSessionByRefresh(token);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildClearedRefreshCookie(),
    },
  });
};

export const config = { path: "/api/auth/logout" };
