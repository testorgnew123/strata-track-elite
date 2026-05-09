import "dotenv/config";
import nodemailer from "nodemailer";

const to = process.argv[2];
if (!to) {
  console.error("usage: node scripts/test-reset-email.mjs <email>");
  process.exit(1);
}

const host = process.env.SMTP_HOST ?? "mail.hostgator.com";
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromName = process.env.SMTP_FROM_NAME ?? "Singlestop";
const fromAddr = process.env.SMTP_FROM ?? user;
const appUrl = process.env.APP_URL ?? "http://localhost:8888";

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  logger: true,
  debug: false,
});

const fakeId = crypto.randomUUID();
const fakeToken = crypto.randomUUID().replace(/-/g, "");
const link = `${appUrl}/reset-password?id=${fakeId}&token=${fakeToken}`;

console.log(`[test] sending mock reset to ${to}`);
console.log(`[test] link in body: ${link}`);

try {
  const info = await transport.sendMail({
    from: `${fromName} <${fromAddr}>`,
    to,
    subject: "Reset your Strata password",
    html: `
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the link below — it expires in 30 minutes.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `,
    text: `Reset your password: ${link}\nExpires in 30 minutes.`,
  });
  console.log("[test] messageId:", info.messageId);
  console.log("[test] response:", info.response);
  console.log("[test] accepted:", info.accepted);
  console.log("[test] rejected:", info.rejected);
} catch (err) {
  console.error("[test] FAILED");
  console.error(err);
  process.exit(2);
}
