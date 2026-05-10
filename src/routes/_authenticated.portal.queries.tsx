import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { usePortalProject } from "@/lib/portal-project-context";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/queries")({
  component: QueriesPage,
});

function QueriesPage() {
  const { user } = useAuth();
  const { selectedProject: project, loading: projectLoading } = usePortalProject();
  const [queries, setQueries] = useState<Output<"queries.list">>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState<Output<"queries.list">[number] | null>(null);
  const [replies, setReplies] = useState<Output<"replies.list">>([]);
  const [replyBody, setReplyBody] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    if (!project) {
      setQueries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await rpc("queries.list", { projectId: project.id });
      setQueries(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (projectLoading) return;
    // Switching projects invalidates any open thread.
    setActive(null);
    setReplies([]);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, projectLoading]);

  const openThread = async (q: Output<"queries.list">[number]) => {
    setActive(q);
    const data = await rpc("replies.list", { queryId: q.id });
    setReplies(data);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const [threadData, listData] = await Promise.all([
          rpc("replies.list", { queryId: q.id }),
          rpc("queries.list", { projectId: q.projectId }),
        ]);
        setReplies(threadData);
        setQueries(listData);
        setActive((prev) => {
          const updated = listData.find((x) => x.id === q.id);
          return updated ?? prev;
        });
      } catch {
        // ignore poll errors
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const submit = async () => {
    if (!user || !project) return;
    setSubmitting(true);
    try {
      await rpc("queries.create", { projectId: project.id, subject, body });
      toast.success("Query submitted");
      setSubject("");
      setBody("");
      setOpen(false);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const reply = async () => {
    if (!user || !active || !replyBody.trim()) return;
    try {
      await rpc("replies.create", { queryId: active.id, body: replyBody });
      setReplyBody("");
      const [threadData, listData] = await Promise.all([
        rpc("replies.list", { queryId: active.id }),
        rpc("queries.list", { projectId: project!.id }),
      ]);
      setReplies(threadData);
      setQueries(listData);
      const updated = listData.find((q) => q.id === active.id);
      if (updated) setActive(updated);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Queries</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">
            Questions & support
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-deep text-ivory hover:bg-navy">
              <Plus size={14} /> New query
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New query</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <Button
                onClick={submit}
                disabled={submitting || !subject || !body}
                className="w-full bg-navy-deep text-ivory hover:bg-navy"
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Submit query"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : queries.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No queries yet. Tap "New query" to ask the team.
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-2">
            {queries.map((q) => (
              <button
                key={q.id}
                onClick={() => openThread(q)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  active?.id === q.id
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-medium text-navy-deep">{q.subject}</h3>
                  <Badge
                    variant={q.status === "open" ? "default" : "secondary"}
                    className="text-[10px] capitalize"
                  >
                    {q.status}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.body}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
          <div>
            {active ? (
              <Card className="flex h-full flex-col p-5">
                <h2 className="font-display text-xl text-navy-deep">{active.subject}</h2>
                <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
                  <Bubble author="You" body={active.body} mine />
                  {replies.map((r) => (
                    <Bubble
                      key={r.id}
                      author={r.authorId === user?.id ? "You" : "Team"}
                      body={r.body}
                      mine={r.authorId === user?.id}
                    />
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Input
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type a reply…"
                    onKeyDown={(e) => e.key === "Enter" && reply()}
                  />
                  <Button
                    onClick={reply}
                    disabled={!replyBody.trim()}
                    className="bg-navy-deep text-ivory hover:bg-navy"
                  >
                    <Send size={14} />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="grid h-full place-items-center p-10 text-sm text-muted-foreground">
                Select a query to view the conversation.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ author, body, mine }: { author: string; body: string; mine?: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm sm:max-w-[80%] ${
          mine ? "bg-navy-deep text-ivory" : "bg-secondary text-navy-deep"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{author}</p>
        <p className="mt-0.5 whitespace-pre-wrap break-words">{body}</p>
      </div>
    </div>
  );
}
