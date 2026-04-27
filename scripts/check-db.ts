import { db } from "../src/db/client";
import { users, notificationTemplates } from "../src/db/schema";

async function main() {
  const u = await db.select().from(users);
  const t = await db.select().from(notificationTemplates);
  console.log("users:", u.length, u.map((x) => x.email));
  console.log("templates:", t.length, t.map((x) => x.kind));
}

main().catch(console.error).finally(() => process.exit(0));
