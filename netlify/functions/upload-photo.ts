import type { Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { progressUpdates } from "../../src/db/schema";
import { buildContext } from "../../src/server/rpc/context";
import { AuthError, assertProjectEngineer } from "../../src/server/authz";
import { putBlob } from "../../src/server/storage";
import { projects } from "../../src/db/schema";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let auth;
  try {
    auth = await buildContext(req);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    return Response.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status },
    );
  }

  const form = await req.formData();
  const projectId = form.get("projectId");
  const category = form.get("category");
  const caption = form.get("caption");
  const file = form.get("file");
  if (typeof projectId !== "string" || typeof category !== "string" || !(file instanceof File)) {
    return Response.json({ error: "projectId, category, file required" }, { status: 400 });
  }

  try {
    await assertProjectEngineer(auth.userId, projectId);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 403;
    return Response.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status },
    );
  }

  const [proj] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!proj) return Response.json({ error: "Project not found" }, { status: 404 });

  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `${projectId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buf = new Uint8Array(await file.arrayBuffer());
  await putBlob("photos", key, buf, {
    contentType: file.type,
    projectId,
    uploadedBy: auth.userId,
  });

  const url = `/api/blob?store=progress-photos&key=${encodeURIComponent(key)}`;

  const [row] = await db
    .insert(progressUpdates)
    .values({
      projectId,
      authorId: auth.userId,
      category: category as never,
      caption: typeof caption === "string" ? caption : null,
      photoKey: key,
      photoUrl: url,
    })
    .returning();

  return Response.json({ data: row });
};

export const config = { path: "/api/upload-photo" };
