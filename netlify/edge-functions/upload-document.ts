import type { Context } from "@netlify/edge-functions";
import { getStore } from "@netlify/blobs";
import { neon } from "@neondatabase/serverless";
import { jwtVerify } from "jose";

const ALLOWED_CATEGORIES = new Set([
  "contract",
  "floor_plan",
  "permit",
  "report",
  "invoice_doc",
  "other",
]);

const MAX_BYTES = 50 * 1024 * 1024;
const JWT_ISSUER = "strata-track";
const JWT_AUDIENCE = "strata-track-app";

function safeFileSegment(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "file";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

async function verifyToken(token: string): Promise<{ userId: string; email: string; roles: string[] }> {
  const secret = Netlify.env.get("JWT_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET not configured");
  }
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  return {
    userId: payload.sub as string,
    email: payload.email as string,
    roles: (payload.roles as string[]) ?? [],
  };
}

export default async (req: Request, ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ---- AUTH ----
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return jsonError("Missing Authorization header", 401);
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return jsonError("Bad Authorization header", 401);
  }
  let auth: { userId: string; email: string; roles: string[] };
  try {
    auth = await verifyToken(token);
  } catch {
    return jsonError("Invalid or expired token", 401);
  }

  // ---- SIZE PRECHECK ----
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength && declaredLength > MAX_BYTES) {
    return jsonError(`File exceeds ${Math.floor(MAX_BYTES / (1024 * 1024))} MB limit`, 413);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError(`Expected multipart/form-data, got "${contentType || "(none)"}"`, 400);
  }

  // ---- PARSE BODY ----
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return jsonError(
      `Could not read upload body: ${err instanceof Error ? err.message : String(err)}`,
      400,
    );
  }

  const projectId = form.get("projectId");
  const title = form.get("title");
  const category = form.get("category");
  const file = form.get("file");

  if (
    typeof projectId !== "string" ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof category !== "string" ||
    !ALLOWED_CATEGORIES.has(category) ||
    !(file instanceof File)
  ) {
    return jsonError("projectId, title, valid category and file are required", 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonError(`File exceeds ${Math.floor(MAX_BYTES / (1024 * 1024))} MB limit`, 413);
  }

  // ---- DB CLIENT ----
  const dbUrl = Netlify.env.get("DATABASE_URL");
  if (!dbUrl) return jsonError("DATABASE_URL not configured", 500);
  const sql = neon(dbUrl);

  // ---- AUTHZ: admin OR (project member AND engineer role) ----
  const adminRoleRows = (await sql`
    SELECT 1 FROM user_roles WHERE user_id = ${auth.userId} AND role = 'admin' LIMIT 1
  `) as Array<{ "?column?": number }>;
  const isAdmin = adminRoleRows.length > 0;

  if (!isAdmin) {
    const memberRows = (await sql`
      SELECT 1 FROM project_members
      WHERE user_id = ${auth.userId} AND project_id = ${projectId}
      LIMIT 1
    `) as Array<unknown>;
    const engineerRows = (await sql`
      SELECT 1 FROM user_roles WHERE user_id = ${auth.userId} AND role = 'engineer' LIMIT 1
    `) as Array<unknown>;
    if (memberRows.length === 0 || engineerRows.length === 0) {
      return jsonError("Engineer access required", 403);
    }
  }

  // ---- VERIFY PROJECT EXISTS ----
  const projectRows = (await sql`
    SELECT id, name FROM projects WHERE id = ${projectId} LIMIT 1
  `) as Array<{ id: string; name: string }>;
  if (projectRows.length === 0) {
    return jsonError("Project not found", 404);
  }

  // ---- BLOB PUT ----
  const safeName = safeFileSegment(file.name || "document");
  const key = `${projectId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const buf = new Uint8Array(await file.arrayBuffer());
  const store = getStore("project-documents");
  await store.set(key, buf, {
    metadata: {
      contentType: file.type || "application/octet-stream",
      projectId,
      uploadedBy: auth.userId,
      originalName: file.name,
    },
  });

  // ---- DB INSERT ----
  const inserted = (await sql`
    INSERT INTO documents
      (project_id, uploader_id, title, file_path, category, mime_type, file_size_bytes)
    VALUES
      (${projectId}, ${auth.userId}, ${title.trim()}, ${key}, ${category},
       ${file.type || null}, ${file.size})
    RETURNING *
  `) as Array<Record<string, unknown>>;
  const row = inserted[0];

  // ---- FIRE-AND-FORGET NOTIFY ----
  const internalToken = Netlify.env.get("INTERNAL_NOTIFY_TOKEN");
  if (internalToken) {
    const clientCheck = (await sql`
      SELECT 1 FROM project_members
      WHERE project_id = ${projectId} AND role = 'client'
      LIMIT 1
    `) as Array<unknown>;
    if (clientCheck.length > 0) {
      const notifyUrl = new URL("/api/notify-document-added", req.url).toString();
      const notifyPromise = fetch(notifyUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": internalToken,
        },
        body: JSON.stringify({ documentId: row.id, projectId }),
      }).catch((err) => {
        console.error("[upload-document] notify dispatch failed:", err);
      });
      ctx.waitUntil(notifyPromise);
    }
  } else {
    console.warn("[upload-document] INTERNAL_NOTIFY_TOKEN not set — skipping notify dispatch");
  }

  return Response.json({ data: row });
};

export const config = { path: "/api/upload-document" };
