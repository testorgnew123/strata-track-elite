import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";

export const REFRESH_TTL_DAYS = 30;
export const REFRESH_COOKIE_NAME = "strata_refresh";

function generateRawToken(): string {
  return randomBytes(48).toString("base64url");
}

async function hashToken(raw: string): Promise<string> {
  return bcrypt.hash(raw, 8);
}

async function compareToken(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
  const raw = generateRawToken();
  const hash = await hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(sessions)
    .values({
      userId,
      refreshTokenHash: hash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    })
    .returning({ id: sessions.id });
  // Encode session id with the raw token so we can do O(1) lookups on refresh.
  const refreshToken = `${row.id}.${raw}`;
  return { sessionId: row.id, refreshToken, expiresAt };
}

export async function rotateSession(
  refreshToken: string,
): Promise<{ userId: string; refreshToken: string; expiresAt: Date } | null> {
  const [sessionId, raw] = refreshToken.split(".");
  if (!sessionId || !raw) return null;

  const [row] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;
  const ok = await compareToken(raw, row.refreshTokenHash);
  if (!ok) {
    // Possible token replay — revoke this session.
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
    return null;
  }

  // Rotate: generate new raw token, update hash + expiry.
  const newRaw = generateRawToken();
  const newHash = await hashToken(newRaw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(sessions)
    .set({ refreshTokenHash: newHash, expiresAt })
    .where(eq(sessions.id, sessionId));

  return {
    userId: row.userId,
    refreshToken: `${sessionId}.${newRaw}`,
    expiresAt,
  };
}

export async function revokeSessionByRefresh(refreshToken: string): Promise<void> {
  const [sessionId] = refreshToken.split(".");
  if (!sessionId) return;
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}
