import type { Context } from "@netlify/functions";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../src/db/client";
import { passwordResetTokens, users } from "../../src/db/schema";
import { hashPassword } from "../../src/server/auth/password";
import { revokeAllSessions } from "../../src/server/auth/session";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let body: { id?: string; token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id, token, password } = body;
  if (!id || !token || !password || password.length < 8) {
    return Response.json({ error: "Bad payload" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.id, id),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);
  if (!row) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }
  const ok = await bcrypt.compare(token, row.tokenHash);
  if (!ok) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const newHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, row.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));
  await revokeAllSessions(row.userId);

  return Response.json({ ok: true });
};

export const config = { path: "/api/auth/reset-password" };
