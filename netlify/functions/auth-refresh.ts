import type { Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { users, userRoles } from "../../src/db/schema";
import { signAccessToken, ACCESS_TOKEN_TTL_SECONDS } from "../../src/server/auth/jwt";
import { rotateSession } from "../../src/server/auth/session";
import {
  buildClearedRefreshCookie,
  buildRefreshCookie,
  parseCookies,
} from "../../src/server/auth/cookies";
import { REFRESH_COOKIE_NAME } from "../../src/server/auth/session";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[REFRESH_COOKIE_NAME];
  if (!token) {
    return Response.json({ error: "No session" }, { status: 401 });
  }

  const rotated = await rotateSession(token);
  if (!rotated) {
    return new Response(JSON.stringify({ error: "Session invalid" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildClearedRefreshCookie(),
      },
    });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, rotated.userId))
    .limit(1);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildClearedRefreshCookie(),
      },
    });
  }
  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));
  const roles = roleRows.map((r) => r.role);

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    roles,
  });

  return new Response(
    JSON.stringify({
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: { id: user.id, email: user.email, roles },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildRefreshCookie(rotated.refreshToken),
      },
    },
  );
};

export const config = { path: "/api/auth/refresh" };
