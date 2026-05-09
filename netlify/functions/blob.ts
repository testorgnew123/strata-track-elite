import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildContext } from "../../src/server/rpc/context";
import { AuthError } from "../../src/server/authz";
import { verifyBlobToken } from "../../src/server/auth/blob-token";

const ALLOWED = new Set(["progress-photos", "project-documents", "avatars"]);

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value)
    .replace(/['()]/g, escape)
    .replace(/\*/g, "%2A");
}

export default async (req: Request, _ctx: Context) => {
  const url = new URL(req.url);
  const storeName = url.searchParams.get("store");
  const key = url.searchParams.get("key");
  const token = url.searchParams.get("token");
  const dl = url.searchParams.get("dl") === "1";
  const filename = url.searchParams.get("filename");

  if (!storeName || !key || !ALLOWED.has(storeName)) {
    return Response.json({ error: "store and key required" }, { status: 400 });
  }

  // Auth path 1: short-lived signed token in URL (works in new tab / direct link).
  // Auth path 2: Authorization: Bearer <accessToken> (existing fetch flow).
  if (token) {
    try {
      const claims = await verifyBlobToken(token);
      if (claims.store !== storeName || claims.key !== key) {
        return Response.json({ error: "Token does not match store/key" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }
  } else {
    try {
      await buildContext(req);
    } catch (err) {
      const status = err instanceof AuthError ? err.status : 401;
      return Response.json(
        { error: err instanceof Error ? err.message : "Unauthorized" },
        { status },
      );
    }
  }

  const store = getStore(storeName);
  const blob = await store.get(key, { type: "arrayBuffer" });
  if (!blob) return new Response("Not found", { status: 404 });
  const meta = (await store.getMetadata(key)) ?? {};
  const contentType = (meta.metadata?.contentType as string) ?? "application/octet-stream";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=300",
  };

  if (filename) {
    const disp = dl ? "attachment" : "inline";
    headers["Content-Disposition"] = `${disp}; filename*=UTF-8''${encodeRfc5987(filename)}`;
  } else if (dl) {
    headers["Content-Disposition"] = "attachment";
  }

  return new Response(blob as ArrayBuffer, {
    status: 200,
    headers,
  });
};

export const config = { path: "/api/blob" };
