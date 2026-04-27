import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { profiles, userRoles, users } from "../src/db/schema";
import { hashPassword } from "../src/server/auth/password";

const DEMO_USERS = [
  { email: "admin@demo.singlestop.com", password: "Demo@Admin2026", fullName: "Demo Admin", role: "admin" as const },
  { email: "engineer@demo.singlestop.com", password: "Demo@Engg2026", fullName: "Demo Engineer", role: "engineer" as const },
  { email: "client@demo.singlestop.com", password: "Demo@Client2026", fullName: "Demo Client", role: "client" as const },
];

async function main() {
  for (const u of DEMO_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length) {
      console.log(`[skip] ${u.email} already exists`);
      continue;
    }
    const passwordHash = await hashPassword(u.password);
    const [user] = await db.insert(users).values({ email: u.email, passwordHash }).returning();
    await db.insert(profiles).values({ id: user.id, fullName: u.fullName });
    await db.insert(userRoles).values({ userId: user.id, role: u.role });
    console.log(`[created] ${u.email} (${u.role})`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
