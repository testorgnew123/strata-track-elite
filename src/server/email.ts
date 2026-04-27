import nodemailer from "nodemailer";
import { db } from "@/db/client";
import { emailLog } from "@/db/schema";
import type { NotificationKind } from "@/db/schema/enums";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "mail.hostgator.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_PORT ?? "465") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  userId,
  kind,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  kind?: NotificationKind;
}) {
  const from = `${process.env.SMTP_FROM_NAME ?? "Strata"} <${process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@localhost"}>`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[email] SMTP not configured — would send:", { to, subject });
    if (kind) {
      await logEmail({ userId, to, subject, kind, status: "queued", error: "SMTP not configured" });
    }
    return;
  }

  try {
    const transport = createTransport();
    await transport.sendMail({ from, to, subject, html, text: text ?? html.replace(/<[^>]+>/g, "") });
    if (kind) await logEmail({ userId, to, subject, kind, status: "sent" });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed:", error);
    if (kind) await logEmail({ userId, to, subject, kind, status: "failed", error });
    throw err;
  }
}

async function logEmail({
  userId,
  to,
  subject,
  kind,
  status,
  error,
}: {
  userId?: string;
  to: string;
  subject: string;
  kind: NotificationKind;
  status: string;
  error?: string;
}) {
  try {
    await db.insert(emailLog).values({
      recipientId: userId ?? null,
      recipientEmail: to,
      subject,
      kind,
      status,
      error: error ?? null,
    });
  } catch {
    // don't let log failure surface
  }
}
