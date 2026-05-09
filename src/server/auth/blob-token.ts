import { SignJWT, jwtVerify } from "jose";

const ISSUER = "strata-track";
const AUDIENCE = "strata-track-blob";

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 chars");
  }
  return new TextEncoder().encode(s);
}

export interface BlobTokenClaims {
  store: string;
  key: string;
  userId: string;
}

export async function signBlobToken(
  claims: BlobTokenClaims,
  ttlSeconds: number,
): Promise<string> {
  return new SignJWT({ store: claims.store, key: claims.key })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getSecret());
}

export async function verifyBlobToken(token: string): Promise<BlobTokenClaims> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return {
    store: payload.store as string,
    key: payload.key as string,
    userId: payload.sub as string,
  };
}
