import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  smallint,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { appRoleEnum, projectStatusEnum } from "./enums";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    clientDisplayName: text("client_display_name"),
    address: text("address"),
    status: projectStatusEnum("status").notNull().default("planning"),
    progressPercent: smallint("progress_percent").notNull().default(0),
    startDate: date("start_date"),
    expectedHandoverDate: date("expected_handover_date"),
    coverImageUrl: text("cover_image_url"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("progress_percent_range", sql`${t.progressPercent} between 0 and 100`)],
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("project_members_unique").on(t.projectId, t.userId),
    index("idx_project_members_user").on(t.userId),
    index("idx_project_members_project").on(t.projectId),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
