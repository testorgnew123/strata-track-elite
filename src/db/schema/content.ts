import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  bigint,
  smallint,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { projects } from "./projects";
import {
  documentCategoryEnum,
  milestoneStatusEnum,
  progressCategoryEnum,
  queryPriorityEnum,
  queryStatusEnum,
  readinessStatusEnum,
  visitStatusEnum,
} from "./enums";

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    targetDate: date("target_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: milestoneStatusEnum("status").notNull().default("pending"),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: uuid("acknowledged_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_milestones_project").on(t.projectId)],
);

export const progressUpdates = pgTable(
  "progress_updates",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    category: progressCategoryEnum("category").notNull().default("other"),
    caption: text("caption"),
    photoUrl: text("photo_url"),
    photoKey: text("photo_key"),
    takenAt: timestamp("taken_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_progress_project").on(t.projectId, t.takenAt)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    uploaderId: uuid("uploader_id").references(() => users.id, {
      onDelete: "set null",
    }),
    category: documentCategoryEnum("category").notNull().default("other"),
    title: text("title").notNull(),
    filePath: text("file_path").notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    mimeType: text("mime_type"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_documents_project").on(t.projectId, t.createdAt)],
);

export const queries = pgTable(
  "queries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    priority: queryPriorityEnum("priority").notNull().default("normal"),
    status: queryStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_queries_project").on(t.projectId, t.createdAt)],
);

export const queryReplies = pgTable(
  "query_replies",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    queryId: uuid("query_id")
      .notNull()
      .references(() => queries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_query_replies").on(t.queryId, t.createdAt)],
);

export const siteVisits = pgTable(
  "site_visits",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedDate: date("requested_date").notNull(),
    requestedSlot: text("requested_slot"),
    status: visitStatusEnum("status").notNull().default("requested"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_site_visits_project").on(t.projectId, t.requestedDate)],
);

export const readinessItems = pgTable(
  "readiness_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: readinessStatusEnum("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_readiness_project").on(t.projectId, t.sortOrder)],
);

export const projectRatings = pgTable(
  "project_ratings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .unique()
      .references(() => projects.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stars: smallint("stars").notNull(),
    feedback: text("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("stars_range", sql`${t.stars} between 1 and 5`)],
);

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refereeName: text("referee_name").notNull(),
  refereeContact: text("referee_contact").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Milestone = typeof milestones.$inferSelect;
export type ProgressUpdate = typeof progressUpdates.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Query = typeof queries.$inferSelect;
export type QueryReply = typeof queryReplies.$inferSelect;
export type SiteVisit = typeof siteVisits.$inferSelect;
export type ReadinessItem = typeof readinessItems.$inferSelect;
export type ProjectRating = typeof projectRatings.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
