import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotificationsAdmin,
});

const KINDS = [
  "milestone_pending_ack",
  "visit_reminder",
  "query_reply",
  "document_added",
  "progress_added",
  "handover_ready",
] as const;

function NotificationsAdmin() {
  const [templates, setTemplates] = useState<Output<"admin.notif.templates">>([]);
  const [emails, setEmails] = useState<Output<"admin.notif.emailLog">>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>(KINDS[0]);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [t, e] = await Promise.all([rpc("admin.notif.templates"), rpc("admin.notif.emailLog")]);
      setTemplates(t);
      setEmails(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const current = useMemo(() => templates.find((t) => t.kind === active), [templates, active]);

  useEffect(() => {
    setSubject(current?.subject ?? "");
    setBodyText(current?.bodyTemplate ?? "");
  }, [current]);

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await rpc("admin.notif.updateTemplate", {
        kind: current.kind,
        subject,
        bodyTemplate: bodyText,
      });
      toast.success("Template saved");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Notifications</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">
          Templates & send log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the messages used for in-app notifications. Email delivery activates once a provider
          is connected.
        </p>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <Card className="p-5">
            <Label htmlFor="kind">Event</Label>
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger id="kind" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-5 space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="body">Body template</Label>
              <Textarea
                id="body"
                rows={6}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Use placeholders like <code className="font-mono">{"{{project}}"}</code>,{" "}
                <code className="font-mono">{"{{milestone}}"}</code>.
              </p>
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="mt-4 w-full bg-navy-deep text-ivory hover:bg-navy"
            >
              {saving ? <Loader2 className="animate-spin" /> : "Save template"}
            </Button>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent email log
            </h2>
            {emails.length === 0 ? (
              <Card className="grid h-full place-items-center p-10 text-center">
                <div>
                  <Send size={20} className="mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-navy-deep">No emails sent yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Connect an email provider (Resend) to enable transactional sending. In-app
                    notifications continue to work without it.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {emails.map((e) => (
                  <Card key={e.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy-deep">{e.subject}</p>
                      <p className="truncate text-muted-foreground">{e.recipientEmail}</p>
                    </div>
                    <Badge
                      variant={
                        e.status === "sent"
                          ? "default"
                          : e.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {e.status}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
