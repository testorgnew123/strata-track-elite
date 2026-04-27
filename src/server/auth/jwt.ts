import { SignJWT, jwtVerify } from "jose";

const ISSUER = "strata-track";
const AUDIENCE = "strata-track-app";
const ACCESS_TTL_SECONDS = 60 * 15; // 15 min

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 chars");
  }
  return new TextEncoder().encode(s);
}

export interface AccessClaims {
  sub: string; // userId
  email: string;
  roles: string[];
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ email: claims.email, roles: claims.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    roles: (payload.roles as string[]) ?? [],
  };
}

export const ACCESS_TOKEN_TTL_SECONDS = ACCESS_TTL_SECONDS;
