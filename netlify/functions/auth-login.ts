import type { Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { users, userRoles } from "../../src/db/schema";
import { verifyPassword } from "../../src/server/auth/password";
import { signAccessToken, ACCESS_TOKEN_TTL_SECONDS } from "../../src/server/auth/jwt";
import { createSession } from "../../src/server/auth/session";
import { buildRefreshCookie } from "../../src/server/auth/cookies";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
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
  const session = await createSession(user.id, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
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
        "Set-Cookie": buildRefreshCookie(session.refreshToken),
      },
    },
  );
};

export const config = { path: "/api/auth/login" };
