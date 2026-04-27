import { db } from "../src/db/client";
import { notificationTemplates } from "../src/db/schema";

const TEMPLATES = [
  {
    kind: "milestone_pending_ack" as const,
    subject: "A milestone has been completed",
    bodyTemplate:
      'The "{{milestone}}" milestone for your project {{project}} has been marked complete. Please review and acknowledge it in your portal.',
  },
  {
    kind: "visit_reminder" as const,
    subject: "Your site visit is coming up",
    bodyTemplate:
      "Your requested site visit for {{project}} on {{date}} is approaching. Please confirm if anything has changed.",
  },
  {
    kind: "query_reply" as const,
    subject: "New reply on your query",
    bodyTemplate:
      'You have a new reply on "{{subject}}" for {{project}}. Open the portal to read it.',
  },
  {
    kind: "document_added" as const,
    subject: "A new document is available",
    bodyTemplate:
      'A new document "{{title}}" was added to {{project}}. Sign in to view it.',
  },
  {
    kind: "progress_added" as const,
    subject: "New progress update",
    bodyTemplate: "A new progress update was posted on {{project}}: {{caption}}",
  },
  {
    kind: "handover_ready" as const,
    subject: "Your project is ready for handover",
    bodyTemplate:
      "{{project}} is ready for handover. Please book a final walkthrough through your portal.",
  },
];

async function main() {
  for (const t of TEMPLATES) {
    await db
      .insert(notificationTemplates)
      .values(t)
      .onConflictDoNothing({ target: notificationTemplates.kind });
  }
  console.log(`Seeded ${TEMPLATES.length} notification templates`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
