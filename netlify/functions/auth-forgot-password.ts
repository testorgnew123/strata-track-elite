import type { Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "../../src/db/client";
import { passwordResetTokens, users } from "../../src/db/schema";
import { sendEmail } from "../../src/server/email";

const RESET_TTL_MINUTES = 30;

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always return ok to avoid email enumeration.
  if (!user) {
    return Response.json({ ok: true });
  }

  const raw = randomBytes(32).toString("base64url");
  const hash = await bcrypt.hash(raw, 8);
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
  const [row] = await db
    .insert(passwordResetTokens)
    .values({ userId: user.id, tokenHash: hash, expiresAt })
    .returning({ id: passwordResetTokens.id });

  const link = `${process.env.APP_URL ?? ""}/reset-password?id=${row.id}&token=${raw}`;

  try {
    await sendEmail({
      to: email,
      subject: "Reset your Strata password",
      userId: user.id,
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the link below — it expires in ${RESET_TTL_MINUTES} minutes.</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      `,
    });
    console.log(`[forgot-password] reset email dispatched to ${email}`);
  } catch (err) {
    console.error(
      `[forgot-password] sendEmail failed for ${email}:`,
      err instanceof Error ? err.stack ?? err.message : err,
    );
    // Surface failure so the operator notices but never reveal whether the
    // address exists; keep the generic ok response shape from above.
    return Response.json({ ok: true, deliveryError: true }, { status: 200 });
  }

  return Response.json({ ok: true });
};

export const config = { path: "/api/auth/forgot-password" };
