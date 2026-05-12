import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildContext } from "../../src/server/rpc/context";
import { AuthError } from "../../src/server/authz";
import { verifyBlobToken } from "../../src/server/auth/blob-token";

const ALLOWED = new Set(["progress-photos", "project-documents", "avatars"]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
  ogg: "video/ogg",
  pdf: "application/pdf",
};

function mimeFromKey(key: string): string | null {
  const ext = key.match(/\.([a-z0-9]+)(?:$|[?#])/i)?.[1]?.toLowerCase();
  return ext ? (EXT_TO_MIME[ext] ?? null) : null;
}

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

  const store = getStore({ name: storeName, consistency: "strong" });
  const blob = await store.get(key, { type: "arrayBuffer" });
  if (!blob) {
    console.warn("blob 404", { storeName, key });
    return new Response("Not found", { status: 404 });
  }
  const meta = (await store.getMetadata(key)) ?? {};
  const metaContentType = meta.metadata?.contentType as string | undefined;
  const inferred = mimeFromKey(key);
  const contentType =
    metaContentType && metaContentType !== "application/octet-stream"
      ? metaContentType
      : (inferred ?? metaContentType ?? "application/octet-stream");
  const byteLength = (blob as ArrayBuffer).byteLength;
  const firstBytes = new Uint8Array(blob as ArrayBuffer, 0, Math.min(8, byteLength));
  const hex = Array.from(firstBytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  console.log("blob serve", {
    storeName,
    key,
    byteLength,
    metaContentType,
    inferred,
    contentType,
    head: hex,
  });

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
