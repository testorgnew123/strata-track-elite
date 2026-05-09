import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, userRoles, users, type AppRole } from "@/db/schema";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AuthError } from "@/server/authz";

export interface RpcContext {
  userId: string;
  email: string;
  roles: AppRole[];
}

export async function buildContext(req: Request): Promise<RpcContext> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new AuthError("Missing Authorization header");
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AuthError("Bad Authorization header");
  }
  let claims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw new AuthError("Invalid or expired token");
  }
  return {
    userId: claims.sub,
    email: claims.email,
    roles: (claims.roles ?? []) as AppRole[],
  };
}

export async function loadUserScope(userId: string) {
  const [[user], [profile], roleRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
    db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId)),
  ]);
  return {
    user: user ?? null,
    profile: profile ?? null,
    roles: roleRows.map((r) => r.role),
  };
}
