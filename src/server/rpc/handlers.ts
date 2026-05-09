import { z } from "zod";
import { and, desc, eq, ne, sql, asc, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLog,
  documents,
  emailLog,
  milestones,
  notificationTemplates,
  notifications,
  profiles,
  progressUpdates,
  projectMembers,
  projectRatings,
  projects,
  queries,
  queryReplies,
  readinessItems,
  referrals,
  siteVisits,
  userRoles,
  users,
} from "@/db/schema";
import {
  AuthError,
  ForbiddenError,
  assertAdmin,
  assertProjectEngineer,
  assertProjectMember,
  hasRole,
  isAdmin,
} from "@/server/authz";
import { hashPassword } from "@/server/auth/password";
import { sendEmail } from "@/server/email";
import type { RpcContext } from "./context";
import type { RpcHandler } from "./router";

const uuid = z.string().uuid();
const projectIdInput = z.object({ projectId: uuid });

function def<I, O>(
  input: z.ZodType<I>,
  handler: (input: I, ctx: RpcContext) => Promise<O>,
): RpcHandler<I, O> {
  return { input, handler };
}

async function recipientEmail(userId: string): Promise<string | null> {
  const [u] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.email ?? null;
}

async function notifyMilestoneCompleted(projectId: string, milestoneTitle: string) {
  const proj = (
    await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
  )[0];
  const clients = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, "client")));
  if (!clients.length) return;
  const projName = proj?.name ?? "your project";
  await db.insert(notifications).values(
    clients.map((c) => ({
      recipientId: c.userId,
      projectId,
      kind: "milestone_pending_ack" as const,
      title: `Milestone completed: ${milestoneTitle}`,
      body: `The "${milestoneTitle}" milestone for ${projName} has been completed. Please acknowledge it.`,
      linkTo: "/portal/milestones",
    })),
  );
  for (const c of clients) {
    const email = await recipientEmail(c.userId);
    if (email) {
      await sendEmail({
        to: email,
        subject: `Milestone completed: ${milestoneTitle}`,
        userId: c.userId,
        kind: "milestone_pending_ack",
        html: `<p>The "<strong>${milestoneTitle}</strong>" milestone for <strong>${projName}</strong> has been completed. Please <a href="${process.env.APP_URL ?? ""}/portal/milestones">log in to acknowledge it</a>.</p>`,
      }).catch(() => null);
    }
  }
}

async function notifyQueryReply(queryId: string, replyAuthorId: string) {
  const [q] = await db
    .select({ projectId: queries.projectId, authorId: queries.authorId, subject: queries.subject })
    .from(queries)
    .where(eq(queries.id, queryId))
    .limit(1);
  if (!q || q.authorId === replyAuthorId) return;
  const [proj] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, q.projectId))
    .limit(1);
  const projName = proj?.name ?? "your project";
  await db.insert(notifications).values({
    recipientId: q.authorId,
    projectId: q.projectId,
    kind: "query_reply",
    title: `New reply: ${q.subject}`,
    body: `You have a new reply on your query for ${projName}.`,
    linkTo: "/portal/queries",
  });
  const email = await recipientEmail(q.authorId);
  if (email) {
    await sendEmail({
      to: email,
      subject: `New reply on your query: ${q.subject}`,
      userId: q.authorId,
      kind: "query_reply",
      html: `<p>You have a new reply on "<strong>${q.subject}</strong>" for <strong>${projName}</strong>. <a href="${process.env.APP_URL ?? ""}/portal/queries">View it in the portal</a>.</p>`,
    }).catch(() => null);
  }
}

async function notifyVisitDecision(
  projectId: string,
  clientId: string,
  requestedDate: string,
  decision: "confirmed" | "cancelled",
) {
  const [proj] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  const projName = proj?.name ?? "your project";
  const label = decision === "confirmed" ? "confirmed" : "declined";
  await db.insert(notifications).values({
    recipientId: clientId,
    projectId,
    kind: "visit_reminder" as const,
    title: `Site visit ${label}`,
    body: `Your site visit request for ${requestedDate} on ${projName} has been ${label}.`,
    linkTo: "/portal/visits",
  });
  const email = await recipientEmail(clientId);
  if (email) {
    await sendEmail({
      to: email,
      subject: `Site visit ${label} — ${projName}`,
      userId: clientId,
      kind: "visit_reminder",
      html: `<p>Your site visit request for <strong>${projName}</strong> on <strong>${requestedDate}</strong> has been <strong>${label}</strong>.</p>`,
    }).catch(() => null);
  }
}

async function notifySiteVisitRequested(
  projectId: string,
  requestedDate: string,
  slot?: string | null,
) {
  const [proj] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  const admins = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(eq(userRoles.role, "admin"));
  if (!admins.length) return;
  const projName = proj?.name ?? "a project";
  const slotStr = slot ? ` (${slot})` : "";
  await db.insert(notifications).values(
    admins.map((a) => ({
      recipientId: a.userId,
      projectId,
      kind: "visit_reminder" as const,
      title: `Site visit requested for ${projName}`,
      body: `A client has requested a site visit on ${requestedDate}${slotStr}. Please confirm.`,
      linkTo: "/admin/projects",
    })),
  );
  for (const a of admins) {
    const email = await recipientEmail(a.userId);
    if (email) {
      await sendEmail({
        to: email,
        subject: `Site visit requested — ${projName}`,
        userId: a.userId,
        kind: "visit_reminder",
        html: `<p>A client has requested a site visit for <strong>${projName}</strong> on <strong>${requestedDate}${slotStr}</strong>. <a href="${process.env.APP_URL ?? ""}/admin/projects">Review in admin portal</a>.</p>`,
      }).catch(() => null);
    }
  }
}

async function notifyHandoverIfChanged(projectId: string, prevStatus: string, nextStatus: string) {
  if (prevStatus === "handover" || nextStatus !== "handover") return;
  const [proj] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!proj) return;
  const clients = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, "client")));
  if (!clients.length) return;
  await db.insert(notifications).values(
    clients.map((c) => ({
      recipientId: c.userId,
      projectId,
      kind: "handover_ready" as const,
      title: `${proj.name} is ready for handover`,
      body: "Your project is ready for the handover walkthrough.",
      linkTo: "/portal/readiness",
    })),
  );
  for (const c of clients) {
    const email = await recipientEmail(c.userId);
    if (email) {
      await sendEmail({
        to: email,
        subject: `${proj.name} is ready for handover`,
        userId: c.userId,
        kind: "handover_ready",
        html: `<p><strong>${proj.name}</strong> is ready for handover. Please <a href="${process.env.APP_URL ?? ""}/portal/readiness">book a final walkthrough in your portal</a>.</p>`,
      }).catch(() => null);
    }
  }
}

async function audit(
  actorId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: unknown,
) {
  await db.insert(auditLog).values({
    actorId,
    action,
    entityType,
    entityId,
    metadata: metadata as object | undefined,
  });
}

export const handlers = {
  // ===== ME =====
  "me.get": def(z.object({}).optional(), async (_input, ctx) => {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, ctx.userId)).limit(1);
    return {
      user: { id: ctx.userId, email: ctx.email },
      profile: profile ?? null,
      roles: ctx.roles,
    };
  }),

  "me.updateProfile": def(
    z.object({
      fullName: z.string().optional(),
      mobile: z.string().optional(),
      avatarUrl: z.string().optional(),
      language: z.enum(["en", "hi"]).optional(),
    }),
    async (input, ctx) => {
      await db
        .insert(profiles)
        .values({
          id: ctx.userId,
          fullName: input.fullName ?? null,
          mobile: input.mobile ?? null,
          avatarUrl: input.avatarUrl ?? null,
          language: input.language ?? "en",
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            fullName: input.fullName,
            mobile: input.mobile,
            avatarUrl: input.avatarUrl,
            language: input.language,
            updatedAt: new Date(),
          },
        });
      return { ok: true };
    },
  ),

  "me.primaryProject": def(z.object({}).optional(), async (_input, ctx) => {
    if (await isAdmin(ctx.userId)) {
      const [p] = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(1);
      return p ?? null;
    }
    const [row] = await db
      .select({ project: projects })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, ctx.userId))
      .limit(1);
    return row?.project ?? null;
  }),

  // ===== PROJECTS =====
  "projects.list": def(z.object({}).optional(), async (_input, ctx) => {
    if (await isAdmin(ctx.userId)) {
      return db.select().from(projects).orderBy(desc(projects.createdAt));
    }
    return db
      .select({ p: projects })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, ctx.userId))
      .orderBy(desc(projects.createdAt))
      .then((rows) => rows.map((r) => r.p));
  }),

  "projects.listMine": def(z.object({}).optional(), async (_input, ctx) => {
    return db
      .select({ p: projects })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, ctx.userId))
      .orderBy(desc(projects.createdAt))
      .then((rows) => rows.map((r) => r.p));
  }),

  "projects.get": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    const [p] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
    return p ?? null;
  }),

  "projects.create": def(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      clientDisplayName: z.string().optional(),
      address: z.string().optional(),
      startDate: z.string().optional(),
      expectedHandoverDate: z.string().optional(),
    }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      const [row] = await db
        .insert(projects)
        .values({
          code: input.code,
          name: input.name,
          clientDisplayName: input.clientDisplayName ?? null,
          address: input.address ?? null,
          startDate: input.startDate ?? null,
          expectedHandoverDate: input.expectedHandoverDate ?? null,
          createdBy: ctx.userId,
        })
        .returning();
      await audit(ctx.userId, "project.create", "project", row.id);
      return row;
    },
  ),

  "projects.update": def(
    z.object({
      id: uuid,
      patch: z.object({
        name: z.string().optional(),
        clientDisplayName: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["planning", "in_progress", "on_hold", "handover", "completed"]).optional(),
        progressPercent: z.number().int().min(0).max(100).optional(),
        coverImageUrl: z.string().optional(),
        startDate: z.string().optional(),
        expectedHandoverDate: z.string().optional(),
      }),
    }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      const [prev] = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
      if (!prev) throw new Error("Project not found");
      const [row] = await db
        .update(projects)
        .set({ ...input.patch, updatedAt: new Date() })
        .where(eq(projects.id, input.id))
        .returning();
      if (input.patch.status) {
        await notifyHandoverIfChanged(input.id, prev.status, input.patch.status);
      }
      await audit(ctx.userId, "project.update", "project", input.id, input.patch);
      return row;
    },
  ),

  "projects.setProgress": def(
    z.object({ id: uuid, progressPercent: z.number().int().min(0).max(100) }),
    async (input, ctx) => {
      await assertProjectEngineer(ctx.userId, input.id);
      const [row] = await db
        .update(projects)
        .set({ progressPercent: input.progressPercent, updatedAt: new Date() })
        .where(eq(projects.id, input.id))
        .returning();
      await audit(ctx.userId, "project.setProgress", "project", input.id, {
        progressPercent: input.progressPercent,
      });
      return row;
    },
  ),

  "projects.delete": def(z.object({ id: uuid }), async (input, ctx) => {
    await assertAdmin(ctx.userId);
    await db.delete(projects).where(eq(projects.id, input.id));
    await audit(ctx.userId, "project.delete", "project", input.id);
    return { ok: true };
  }),

  // ===== PROJECT MEMBERS =====
  "members.list": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db.select().from(projectMembers).where(eq(projectMembers.projectId, input.projectId));
  }),

  "members.add": def(
    z.object({
      projectId: uuid,
      userId: uuid,
      role: z.enum(["client", "engineer", "admin"]),
    }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      const [row] = await db
        .insert(projectMembers)
        .values({ projectId: input.projectId, userId: input.userId, role: input.role })
        .onConflictDoNothing()
        .returning();
      await audit(ctx.userId, "members.add", "project_member", row?.id, input);
      return row ?? null;
    },
  ),

  "members.remove": def(z.object({ id: uuid }), async (input, ctx) => {
    await assertAdmin(ctx.userId);
    await db.delete(projectMembers).where(eq(projectMembers.id, input.id));
    await audit(ctx.userId, "members.remove", "project_member", input.id);
    return { ok: true };
  }),

  "members.updateRole": def(
    z.object({ id: uuid, role: z.enum(["client", "engineer", "admin"]) }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      await db
        .update(projectMembers)
        .set({ role: input.role })
        .where(eq(projectMembers.id, input.id));
      await audit(ctx.userId, "members.updateRole", "project_member", input.id, {
        role: input.role,
      });
      return { ok: true };
    },
  ),

  // ===== MILESTONES =====
  "milestones.list": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, input.projectId))
      .orderBy(asc(milestones.sortOrder));
  }),

  "milestones.create": def(
    z.object({
      projectId: uuid,
      title: z.string().min(1),
      description: z.string().optional(),
      sortOrder: z.number().int().optional(),
      targetDate: z.string().optional(),
    }),
    async (input, ctx) => {
      await assertProjectEngineer(ctx.userId, input.projectId);
      const [row] = await db
        .insert(milestones)
        .values({
          projectId: input.projectId,
          title: input.title,
          description: input.description ?? null,
          sortOrder: input.sortOrder ?? 0,
          targetDate: input.targetDate ?? null,
        })
        .returning();
      return row;
    },
  ),

  "milestones.update": def(
    z.object({
      id: uuid,
      patch: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        targetDate: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        sortOrder: z.number().int().optional(),
      }),
    }),
    async (input, ctx) => {
      const [prev] = await db.select().from(milestones).where(eq(milestones.id, input.id)).limit(1);
      if (!prev) throw new Error("Milestone not found");
      await assertProjectEngineer(ctx.userId, prev.projectId);
      const completing = input.patch.status === "completed" && prev.status !== "completed";
      const [row] = await db
        .update(milestones)
        .set({
          ...input.patch,
          completedAt: completing ? new Date() : prev.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(milestones.id, input.id))
        .returning();
      if (completing) {
        await notifyMilestoneCompleted(prev.projectId, row.title);
      }
      return row;
    },
  ),

  "milestones.acknowledge": def(z.object({ id: uuid }), async (input, ctx) => {
    const [m] = await db.select().from(milestones).where(eq(milestones.id, input.id)).limit(1);
    if (!m) throw new Error("Milestone not found");
    await assertProjectMember(ctx.userId, m.projectId);
    const [row] = await db
      .update(milestones)
      .set({ acknowledgedAt: new Date(), acknowledgedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(milestones.id, input.id))
      .returning();
    return row;
  }),

  "milestones.delete": def(z.object({ id: uuid }), async (input, ctx) => {
    const [m] = await db.select().from(milestones).where(eq(milestones.id, input.id)).limit(1);
    if (!m) throw new Error("Milestone not found");
    await assertProjectEngineer(ctx.userId, m.projectId);
    await db.delete(milestones).where(eq(milestones.id, input.id));
    return { ok: true };
  }),

  // ===== PROGRESS =====
  "progress.list": def(
    z.object({ projectId: uuid, limit: z.number().int().min(1).max(200).optional() }),
    async (input, ctx) => {
      await assertProjectMember(ctx.userId, input.projectId);
      return db
        .select()
        .from(progressUpdates)
        .where(eq(progressUpdates.projectId, input.projectId))
        .orderBy(desc(progressUpdates.takenAt))
        .limit(input.limit ?? 100);
    },
  ),

  "progress.create": def(
    z.object({
      projectId: uuid,
      category: z.enum(["structure", "plumbing", "electrical", "finishing", "exterior", "other"]),
      caption: z.string().optional(),
      photoKey: z.string().optional(),
      photoUrl: z.string().optional(),
    }),
    async (input, ctx) => {
      await assertProjectEngineer(ctx.userId, input.projectId);
      const [row] = await db
        .insert(progressUpdates)
        .values({
          projectId: input.projectId,
          authorId: ctx.userId,
          category: input.category,
          caption: input.caption ?? null,
          photoKey: input.photoKey ?? null,
          photoUrl: input.photoUrl ?? null,
        })
        .returning();
      return row;
    },
  ),

  "progress.delete": def(z.object({ id: uuid }), async (input, ctx) => {
    const [row] = await db
      .select()
      .from(progressUpdates)
      .where(eq(progressUpdates.id, input.id))
      .limit(1);
    if (!row) throw new Error("Not found");
    if (row.authorId !== ctx.userId && !(await isAdmin(ctx.userId))) {
      throw new ForbiddenError();
    }
    await db.delete(progressUpdates).where(eq(progressUpdates.id, input.id));
    return { ok: true };
  }),

  // ===== DOCUMENTS =====
  "documents.list": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db
      .select()
      .from(documents)
      .where(eq(documents.projectId, input.projectId))
      .orderBy(desc(documents.createdAt));
  }),

  "documents.create": def(
    z.object({
      projectId: uuid,
      title: z.string().min(1),
      filePath: z.string().min(1),
      category: z.enum(["contract", "floor_plan", "permit", "report", "invoice_doc", "other"]),
      mimeType: z.string().optional(),
      fileSizeBytes: z.number().int().nonnegative().optional(),
    }),
    async (input, ctx) => {
      await assertProjectEngineer(ctx.userId, input.projectId);
      const [row] = await db
        .insert(documents)
        .values({
          projectId: input.projectId,
          uploaderId: ctx.userId,
          title: input.title,
          filePath: input.filePath,
          category: input.category,
          mimeType: input.mimeType ?? null,
          fileSizeBytes: input.fileSizeBytes ?? null,
        })
        .returning();
      return row;
    },
  ),

  "documents.signedUrl": def(
    z.object({ id: uuid, ttlSeconds: z.number().int().min(30).max(3600).optional() }),
    async (input, ctx) => {
      const [doc] = await db.select().from(documents).where(eq(documents.id, input.id)).limit(1);
      if (!doc) throw new Error("Document not found");
      await assertProjectMember(ctx.userId, doc.projectId);
      const { getSignedDownloadUrl } = await import("@/server/storage");
      const url = await getSignedDownloadUrl("documents", doc.filePath, input.ttlSeconds ?? 300);
      return { url };
    },
  ),

  "documents.delete": def(z.object({ id: uuid }), async (input, ctx) => {
    const [row] = await db.select().from(documents).where(eq(documents.id, input.id)).limit(1);
    if (!row) throw new Error("Not found");
    if (row.uploaderId !== ctx.userId && !(await isAdmin(ctx.userId))) {
      throw new ForbiddenError();
    }
    await db.delete(documents).where(eq(documents.id, input.id));
    return { ok: true };
  }),

  // ===== QUERIES =====
  "queries.list": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db
      .select()
      .from(queries)
      .where(eq(queries.projectId, input.projectId))
      .orderBy(desc(queries.createdAt));
  }),

  "queries.listOpen": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db
      .select()
      .from(queries)
      .where(and(eq(queries.projectId, input.projectId), ne(queries.status, "closed")))
      .orderBy(desc(queries.createdAt));
  }),

  "queries.create": def(
    z.object({
      projectId: uuid,
      subject: z.string().min(1),
      body: z.string().min(1),
      priority: z.enum(["low", "normal", "high"]).optional(),
    }),
    async (input, ctx) => {
      await assertProjectMember(ctx.userId, input.projectId);
      const [row] = await db
        .insert(queries)
        .values({
          projectId: input.projectId,
          authorId: ctx.userId,
          subject: input.subject,
          body: input.body,
          priority: input.priority ?? "normal",
        })
        .returning();
      return row;
    },
  ),

  "queries.update": def(
    z.object({
      id: uuid,
      patch: z.object({ status: z.enum(["open", "answered", "closed"]).optional() }),
    }),
    async (input, ctx) => {
      const [q] = await db.select().from(queries).where(eq(queries.id, input.id)).limit(1);
      if (!q) throw new Error("Not found");
      await assertProjectMember(ctx.userId, q.projectId);
      const [row] = await db
        .update(queries)
        .set({ ...input.patch, updatedAt: new Date() })
        .where(eq(queries.id, input.id))
        .returning();
      return row;
    },
  ),

  "replies.list": def(z.object({ queryId: uuid }), async (input, ctx) => {
    const [q] = await db.select().from(queries).where(eq(queries.id, input.queryId)).limit(1);
    if (!q) throw new Error("Not found");
    await assertProjectMember(ctx.userId, q.projectId);
    return db
      .select()
      .from(queryReplies)
      .where(eq(queryReplies.queryId, input.queryId))
      .orderBy(asc(queryReplies.createdAt));
  }),

  "replies.create": def(
    z.object({ queryId: uuid, body: z.string().min(1) }),
    async (input, ctx) => {
      const [q] = await db.select().from(queries).where(eq(queries.id, input.queryId)).limit(1);
      if (!q) throw new Error("Not found");
      await assertProjectMember(ctx.userId, q.projectId);
      const [row] = await db
        .insert(queryReplies)
        .values({ queryId: input.queryId, authorId: ctx.userId, body: input.body })
        .returning();
      // Client follows up → reopen; team replies → mark answered
      const newStatus = ctx.userId === q.authorId ? "open" : "answered";
      if (q.status !== "closed") {
        await db
          .update(queries)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(queries.id, input.queryId));
      }
      await notifyQueryReply(input.queryId, ctx.userId);
      return row;
    },
  ),

  // ===== SITE VISITS =====
  "visits.list": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db
      .select()
      .from(siteVisits)
      .where(eq(siteVisits.projectId, input.projectId))
      .orderBy(desc(siteVisits.requestedDate));
  }),

  "visits.create": def(
    z.object({
      projectId: uuid,
      requestedDate: z.string(),
      requestedSlot: z.string().optional(),
      notes: z.string().optional(),
    }),
    async (input, ctx) => {
      await assertProjectMember(ctx.userId, input.projectId);
      const [row] = await db
        .insert(siteVisits)
        .values({
          projectId: input.projectId,
          requestedBy: ctx.userId,
          requestedDate: input.requestedDate,
          requestedSlot: input.requestedSlot ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      await notifySiteVisitRequested(input.projectId, input.requestedDate, input.requestedSlot);
      return row;
    },
  ),

  "visits.update": def(
    z.object({
      id: uuid,
      patch: z.object({
        status: z.enum(["requested", "confirmed", "completed", "cancelled"]).optional(),
        notes: z.string().optional(),
      }),
    }),
    async (input, ctx) => {
      const [v] = await db.select().from(siteVisits).where(eq(siteVisits.id, input.id)).limit(1);
      if (!v) throw new Error("Not found");
      if (!(await isAdmin(ctx.userId))) {
        await assertProjectEngineer(ctx.userId, v.projectId);
      }
      const [row] = await db
        .update(siteVisits)
        .set({ ...input.patch, updatedAt: new Date() })
        .where(eq(siteVisits.id, input.id))
        .returning();
      if (input.patch.status === "confirmed" || input.patch.status === "cancelled") {
        await notifyVisitDecision(v.projectId, v.requestedBy, v.requestedDate, input.patch.status);
      }
      return row;
    },
  ),

  "visits.listAll": def(z.object({}), async (_input, ctx) => {
    await assertAdmin(ctx.userId);
    return db
      .select({
        id: siteVisits.id,
        projectId: siteVisits.projectId,
        projectName: projects.name,
        projectCode: projects.code,
        requestedBy: siteVisits.requestedBy,
        requestedDate: siteVisits.requestedDate,
        requestedSlot: siteVisits.requestedSlot,
        status: siteVisits.status,
        notes: siteVisits.notes,
        createdAt: siteVisits.createdAt,
        updatedAt: siteVisits.updatedAt,
      })
      .from(siteVisits)
      .innerJoin(projects, eq(siteVisits.projectId, projects.id))
      .orderBy(desc(siteVisits.createdAt));
  }),

  // ===== READINESS =====
  "readiness.list": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    return db
      .select()
      .from(readinessItems)
      .where(eq(readinessItems.projectId, input.projectId))
      .orderBy(asc(readinessItems.sortOrder));
  }),

  "readiness.update": def(
    z.object({
      id: uuid,
      patch: z.object({
        status: z.enum(["pending", "done", "na"]).optional(),
        title: z.string().optional(),
      }),
    }),
    async (input, ctx) => {
      const [item] = await db
        .select()
        .from(readinessItems)
        .where(eq(readinessItems.id, input.id))
        .limit(1);
      if (!item) throw new Error("Not found");
      await assertProjectEngineer(ctx.userId, item.projectId);
      const [row] = await db
        .update(readinessItems)
        .set({
          ...input.patch,
          completedAt: input.patch.status === "done" ? new Date() : null,
          completedBy: input.patch.status === "done" ? ctx.userId : null,
          updatedAt: new Date(),
        })
        .where(eq(readinessItems.id, input.id))
        .returning();
      return row;
    },
  ),

  // ===== RATINGS =====
  "ratings.get": def(projectIdInput, async (input, ctx) => {
    await assertProjectMember(ctx.userId, input.projectId);
    const [row] = await db
      .select()
      .from(projectRatings)
      .where(eq(projectRatings.projectId, input.projectId))
      .limit(1);
    return row ?? null;
  }),

  "ratings.create": def(
    z.object({
      projectId: uuid,
      stars: z.number().int().min(1).max(5),
      feedback: z.string().optional(),
    }),
    async (input, ctx) => {
      await assertProjectMember(ctx.userId, input.projectId);
      if (!(await hasRole(ctx.userId, "client"))) throw new ForbiddenError("Clients only");
      const [row] = await db
        .insert(projectRatings)
        .values({
          projectId: input.projectId,
          clientId: ctx.userId,
          stars: input.stars,
          feedback: input.feedback ?? null,
        })
        .onConflictDoUpdate({
          target: projectRatings.projectId,
          set: { stars: input.stars, feedback: input.feedback ?? null },
        })
        .returning();
      return row;
    },
  ),

  // ===== REFERRALS =====
  "referrals.create": def(
    z.object({
      projectId: uuid,
      refereeName: z.string().min(1),
      refereeContact: z.string().min(1),
      note: z.string().optional(),
    }),
    async (input, ctx) => {
      await assertProjectMember(ctx.userId, input.projectId);
      const [row] = await db
        .insert(referrals)
        .values({
          projectId: input.projectId,
          referrerId: ctx.userId,
          refereeName: input.refereeName,
          refereeContact: input.refereeContact,
          note: input.note ?? null,
        })
        .returning();
      return row;
    },
  ),

  "referrals.listMine": def(z.object({}).optional(), async (_input, ctx) => {
    return db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.userId))
      .orderBy(desc(referrals.createdAt));
  }),

  // ===== NOTIFICATIONS =====
  "notifications.list": def(z.object({}).optional(), async (_input, ctx) => {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, ctx.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }),

  "notifications.markRead": def(z.object({ ids: z.array(uuid) }), async (input, ctx) => {
    if (!input.ids.length) return { ok: true };
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.recipientId, ctx.userId), inArray(notifications.id, input.ids)));
    return { ok: true };
  }),

  // ===== ADMIN =====
  "admin.dashboardStats": def(z.object({}).optional(), async (_input, ctx) => {
    await assertAdmin(ctx.userId);
    const [{ projectCount }] = await db
      .select({ projectCount: sql<number>`count(*)::int` })
      .from(projects);
    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)::int` })
      .from(profiles);
    const [{ openQueries }] = await db
      .select({ openQueries: sql<number>`count(*)::int` })
      .from(queries)
      .where(eq(queries.status, "open"));
    const [{ progressCount }] = await db
      .select({ progressCount: sql<number>`count(*)::int` })
      .from(progressUpdates);
    return { projectCount, userCount, openQueries, progressCount };
  }),

  "admin.listUsers": def(z.object({}).optional(), async (_input, ctx) => {
    await assertAdmin(ctx.userId);
    const profileRows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    const userRows = await db.select({ id: users.id, email: users.email }).from(users);
    const roleRows = await db.select().from(userRoles);
    const userMap = new Map(userRows.map((u) => [u.id, u]));
    return profileRows.map((p) => ({
      ...p,
      email: userMap.get(p.id)?.email ?? null,
      roles: roleRows.filter((r) => r.userId === p.id).map((r) => r.role),
    }));
  }),

  "admin.listProfiles": def(z.object({}).optional(), async (_input, ctx) => {
    await assertAdmin(ctx.userId);
    return db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        mobile: profiles.mobile,
        email: users.email,
      })
      .from(profiles)
      .leftJoin(users, eq(users.id, profiles.id))
      .orderBy(asc(profiles.fullName));
  }),

  "admin.inviteUser": def(
    z.object({
      email: z.string().email(),
      fullName: z.string().min(1),
      mobile: z.string().optional(),
      role: z.enum(["client", "engineer", "admin"]),
      tempPassword: z.string().min(8),
      projectId: uuid.optional(),
    }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      const email = input.email.toLowerCase();
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length) throw new Error("User with that email already exists");

      const passwordHash = await hashPassword(input.tempPassword);
      const [user] = await db.insert(users).values({ email, passwordHash }).returning();
      await db.insert(profiles).values({
        id: user.id,
        fullName: input.fullName,
        mobile: input.mobile ?? null,
      });
      await db.insert(userRoles).values({ userId: user.id, role: input.role });
      if (input.projectId) {
        await db
          .insert(projectMembers)
          .values({ projectId: input.projectId, userId: user.id, role: input.role })
          .onConflictDoNothing();
      }
      await audit(ctx.userId, "user.invite", "user", user.id, { email, role: input.role });
      return { id: user.id, email };
    },
  ),

  "admin.audit.list": def(
    z.object({ limit: z.number().int().min(1).max(500).optional() }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      return db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit ?? 100);
    },
  ),

  "admin.notif.templates": def(z.object({}).optional(), async (_input, ctx) => {
    await assertAdmin(ctx.userId);
    return db.select().from(notificationTemplates).orderBy(asc(notificationTemplates.kind));
  }),

  "admin.notif.updateTemplate": def(
    z.object({
      kind: z.enum([
        "milestone_pending_ack",
        "visit_reminder",
        "query_reply",
        "document_added",
        "progress_added",
        "handover_ready",
      ]),
      subject: z.string().optional(),
      bodyTemplate: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
    async (input, ctx) => {
      await assertAdmin(ctx.userId);
      const [row] = await db
        .update(notificationTemplates)
        .set({
          subject: input.subject,
          bodyTemplate: input.bodyTemplate,
          enabled: input.enabled,
          updatedAt: new Date(),
        })
        .where(eq(notificationTemplates.kind, input.kind))
        .returning();
      return row;
    },
  ),

  "admin.notif.emailLog": def(z.object({}).optional(), async (_input, ctx) => {
    await assertAdmin(ctx.userId);
    return db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(50);
  }),
} as const;

// Reference imports to satisfy TS even if not directly used yet:
void AuthError;
