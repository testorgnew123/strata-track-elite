import type { Context } from "@netlify/functions";
import { and, eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import {
  documents,
  notifications,
  projectMembers,
  projects,
  users,
} from "../../src/db/schema";
import { sendEmail } from "../../src/server/email";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const expected = process.env.INTERNAL_NOTIFY_TOKEN;
  if (!expected) {
    return Response.json({ error: "INTERNAL_NOTIFY_TOKEN not configured" }, { status: 500 });
  }
  if (req.headers.get("x-internal-token") !== expected) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { documentId?: string; projectId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { documentId, projectId } = body;
  if (!documentId || !projectId) {
    return Response.json({ error: "documentId and projectId required" }, { status: 400 });
  }

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

  const [proj] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!proj) return Response.json({ error: "Project not found" }, { status: 404 });

  const clients = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, "client")));

  if (!clients.length) {
    return Response.json({ data: { notified: 0 } });
  }

  await db.insert(notifications).values(
    clients.map((c) => ({
      recipientId: c.userId,
      projectId,
      kind: "document_added" as const,
      title: `New document: ${doc.title}`,
      body: `A new document was added to ${proj.name}.`,
      linkTo: "/portal/documents",
    })),
  );

  for (const c of clients) {
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, c.userId))
      .limit(1);
    if (u?.email) {
      await sendEmail({
        to: u.email,
        subject: `New document on ${proj.name}: ${doc.title}`,
        userId: c.userId,
        kind: "document_added",
        html: `<p>A new document — <strong>${doc.title}</strong> — was added to your project <strong>${proj.name}</strong>. <a href="${process.env.APP_URL ?? ""}/portal/documents">View it in the portal</a>.</p>`,
      }).catch(() => null);
    }
  }

  return Response.json({ data: { notified: clients.length } });
};

export const config = { path: "/api/notify-document-added" };
