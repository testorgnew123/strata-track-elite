import { pgEnum } from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", ["client", "engineer", "admin"]);
export const appLanguageEnum = pgEnum("app_language", ["en", "hi"]);
export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "in_progress",
  "on_hold",
  "handover",
  "completed",
]);
export const milestoneStatusEnum = pgEnum("milestone_status", [
  "pending",
  "in_progress",
  "completed",
]);
export const progressCategoryEnum = pgEnum("progress_category", [
  "structure",
  "plumbing",
  "electrical",
  "finishing",
  "exterior",
  "other",
]);
export const documentCategoryEnum = pgEnum("document_category", [
  "contract",
  "floor_plan",
  "permit",
  "report",
  "invoice_doc",
  "other",
]);
export const queryStatusEnum = pgEnum("query_status", ["open", "answered", "closed"]);
export const queryPriorityEnum = pgEnum("query_priority", ["low", "normal", "high"]);
export const visitStatusEnum = pgEnum("visit_status", [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
]);
export const readinessStatusEnum = pgEnum("readiness_status", ["pending", "done", "na"]);
export const notificationKindEnum = pgEnum("notification_kind", [
  "milestone_pending_ack",
  "visit_reminder",
  "query_reply",
  "document_added",
  "progress_added",
  "handover_ready",
]);

export type AppRole = (typeof appRoleEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type MilestoneStatus = (typeof milestoneStatusEnum.enumValues)[number];
export type ProgressCategory = (typeof progressCategoryEnum.enumValues)[number];
export type DocumentCategory = (typeof documentCategoryEnum.enumValues)[number];
export type QueryStatus = (typeof queryStatusEnum.enumValues)[number];
export type QueryPriority = (typeof queryPriorityEnum.enumValues)[number];
export type VisitStatus = (typeof visitStatusEnum.enumValues)[number];
export type ReadinessStatus = (typeof readinessStatusEnum.enumValues)[number];
export type NotificationKind = (typeof notificationKindEnum.enumValues)[number];
