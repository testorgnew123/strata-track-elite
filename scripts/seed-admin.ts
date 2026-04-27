/**
 * Seed an initial admin user.
 *
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=ChangeMe123! \
 *   ADMIN_FULL_NAME="Admin User" npm run seed:admin
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { profiles, userRoles, users } from "../src/db/schema";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME ?? "Administrator";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD env vars required");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    console.log(`User ${email} already exists. Skipping.`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();
  await db.insert(profiles).values({ id: user.id, fullName });
  await db.insert(userRoles).values({ userId: user.id, role: "admin" });

  console.log(`Admin created: ${email} (id=${user.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
