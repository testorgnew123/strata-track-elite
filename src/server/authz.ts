import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers, userRoles, type AppRole } from "@/db/schema";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return rows.map((r) => r.role);
}

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin");
}

export async function isProjectMember(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.userId, userId),
        eq(projectMembers.projectId, projectId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function assertRole(userId: string, ...roles: AppRole[]) {
  const userRolesList = await getUserRoles(userId);
  if (!userRolesList.some((r) => roles.includes(r))) {
    throw new ForbiddenError(`Requires role: ${roles.join("|")}`);
  }
}

export async function assertAdmin(userId: string) {
  if (!(await isAdmin(userId))) {
    throw new ForbiddenError("Admin only");
  }
}

export async function assertProjectMember(userId: string, projectId: string) {
  if (await isAdmin(userId)) return;
  if (!(await isProjectMember(userId, projectId))) {
    throw new ForbiddenError("Not a project member");
  }
}

export async function assertProjectEngineer(userId: string, projectId: string) {
  if (await isAdmin(userId)) return;
  const [member, eng] = await Promise.all([
    isProjectMember(userId, projectId),
    hasRole(userId, "engineer"),
  ]);
  if (!member || !eng) {
    throw new ForbiddenError("Engineer access required");
  }
}
