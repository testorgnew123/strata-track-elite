import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildContext } from "../../src/server/rpc/context";
import { AuthError } from "../../src/server/authz";

const ALLOWED = new Set(["progress-photos", "project-documents", "avatars"]);

export default async (req: Request, _ctx: Context) => {
  // Auth required for any blob fetch.
  try {
    await buildContext(req);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    return Response.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status },
    );
  }

  const url = new URL(req.url);
  const storeName = url.searchParams.get("store");
  const key = url.searchParams.get("key");
  if (!storeName || !key || !ALLOWED.has(storeName)) {
    return Response.json({ error: "store and key required" }, { status: 400 });
  }

  const store = getStore(storeName);
  const blob = await store.get(key, { type: "arrayBuffer" });
  if (!blob) return new Response("Not found", { status: 404 });
  const meta = (await store.getMetadata(key)) ?? {};
  const contentType = (meta.metadata?.contentType as string) ?? "application/octet-stream";

  return new Response(blob as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
};

export const config = { path: "/api/blob" };
