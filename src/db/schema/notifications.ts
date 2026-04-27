import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { projects } from "./projects";
import { notificationKindEnum } from "./enums";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    kind: notificationKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    linkTo: text("link_to"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_notifications_recipient").on(t.recipientId, t.createdAt)],
);

export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: notificationKindEnum("kind").notNull().unique(),
  subject: text("subject").notNull(),
  bodyTemplate: text("body_template").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    recipientId: uuid("recipient_id").references(() => users.id, {
      onDelete: "set null",
    }),
    recipientEmail: text("recipient_email").notNull(),
    kind: notificationKindEnum("kind").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("queued"),
    providerId: text("provider_id"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_email_log_created").on(t.createdAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_audit_actor").on(t.actorId),
    index("idx_audit_created").on(t.createdAt),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type EmailLog = typeof emailLog.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
