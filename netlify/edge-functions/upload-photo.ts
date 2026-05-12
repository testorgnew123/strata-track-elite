import type { Context } from "@netlify/edge-functions";
import { getStore } from "@netlify/blobs";
import { neon } from "@neondatabase/serverless";
import { jwtVerify } from "jose";

const ALLOWED_CATEGORIES = new Set([
  "structure",
  "plumbing",
  "electrical",
  "finishing",
  "exterior",
  "other",
]);

const MAX_BYTES = 50 * 1024 * 1024;
const JWT_ISSUER = "strata-track";
const JWT_AUDIENCE = "strata-track-app";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/x-m4v": "m4v",
};

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
};

function extensionFor(contentType: string, filename: string): string {
  const mimeExt = MIME_EXTENSIONS[contentType.toLowerCase()];
  if (mimeExt) return mimeExt;
  const nameExt = filename.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return nameExt ?? "bin";
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

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

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

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength && declaredLength > MAX_BYTES) {
    return jsonError(`File exceeds ${Math.floor(MAX_BYTES / (1024 * 1024))} MB limit`, 413);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError(`Expected multipart/form-data, got "${contentType || "(none)"}"`, 400);
  }

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
  const category = form.get("category");
  const captionField = form.get("caption");
  const file = form.get("file");

  if (
    typeof projectId !== "string" ||
    typeof category !== "string" ||
    !ALLOWED_CATEGORIES.has(category) ||
    !(file instanceof File)
  ) {
    return jsonError("projectId, valid category and file are required", 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonError(`File exceeds ${Math.floor(MAX_BYTES / (1024 * 1024))} MB limit`, 413);
  }
  if (file.size === 0) {
    return jsonError("Empty file", 400);
  }

  const fileType = (file.type || "").toLowerCase();
  const ext = extensionFor(fileType, file.name);
  const isMedia =
    fileType.startsWith("image/") ||
    fileType.startsWith("video/") ||
    EXT_TO_MIME[ext] !== undefined;
  if (!isMedia) {
    return jsonError("Only image and video uploads are supported", 400);
  }

  const caption = typeof captionField === "string" && captionField.trim() ? captionField : null;

  const dbUrl = Netlify.env.get("DATABASE_URL");
  if (!dbUrl) return jsonError("DATABASE_URL not configured", 500);
  const sql = neon(dbUrl);

  const adminRoleRows = (await sql`
    SELECT 1 FROM user_roles WHERE user_id = ${auth.userId} AND role = 'admin' LIMIT 1
  `) as Array<unknown>;
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

  const projectRows = (await sql`
    SELECT id FROM projects WHERE id = ${projectId} LIMIT 1
  `) as Array<{ id: string }>;
  if (projectRows.length === 0) {
    return jsonError("Project not found", 404);
  }

  const isGenericCt =
    !fileType || fileType === "application/octet-stream" || fileType === "binary/octet-stream";
  const storedContentType = isGenericCt ? (EXT_TO_MIME[ext] ?? "application/octet-stream") : fileType;

  const key = `${projectId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buf = new Uint8Array(await file.arrayBuffer());
  const store = getStore({ name: "progress-photos", consistency: "strong" });
  await store.set(key, buf, {
    metadata: {
      contentType: storedContentType,
      projectId,
      uploadedBy: auth.userId,
      originalName: file.name,
    },
  });

  const blobUrl = `/api/blob?store=progress-photos&key=${encodeURIComponent(key)}`;

  const inserted = (await sql`
    INSERT INTO progress_updates
      (project_id, author_id, category, caption, photo_key, photo_url)
    VALUES
      (${projectId}, ${auth.userId}, ${category}, ${caption}, ${key}, ${blobUrl})
    RETURNING *
  `) as Array<Record<string, unknown>>;
  const row = inserted[0];

  return Response.json({ data: row });
};

export const config = { path: "/api/upload-photo" };
