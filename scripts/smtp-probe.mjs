import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST ?? "mail.hostgator.com";
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM ?? user;
const to = process.argv[2] ?? user;

if (!user || !pass) {
  console.error("[probe] SMTP_USER or SMTP_PASS missing");
  process.exit(1);
}

console.log(`[probe] connecting ${user}@${host}:${port} secure=${port === 465}`);

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  // EHLO with sender domain (default is "[127.0.0.1]" which Gmail downranks).
  name: "singlestop.co.in",
  logger: true,
  debug: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

try {
  console.log("[probe] verifying transport...");
  await transport.verify();
  console.log("[probe] verify OK\n");

  console.log(`[probe] sending test mail from=${from} to=${to}`);
  const info = await transport.sendMail({
    from: `Singlestop SMTP probe <${from}>`,
    to,
    subject: "SMTP probe — please ignore",
    text: "If you received this, SMTP works. Timestamp: " + new Date().toISOString(),
  });
  console.log("[probe] sent. messageId=", info.messageId);
  console.log("[probe] response=", info.response);
  console.log("[probe] accepted=", info.accepted);
  console.log("[probe] rejected=", info.rejected);
} catch (err) {
  console.error("[probe] FAILED");
  console.error(err);
  process.exit(2);
}
