import { getRequest } from "@tanstack/react-start/server";
import { AuthError } from "../authz";
import { verifyAccessToken, type AccessClaims } from "./jwt";

export async function requireAuth(): Promise<AccessClaims> {
  const req = getRequest();
  if (!req) throw new AuthError("No request context");
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new AuthError("Missing Authorization header");
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AuthError("Bad Authorization header");
  }
  try {
    return await verifyAccessToken(token);
  } catch {
    throw new AuthError("Invalid or expired token");
  }
}
