import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/queries")({
  component: QueriesPage,
});

function QueriesPage() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyBody, setReplyBody] = useState("");

  const load = async () => {
    const p = await fetchUserPrimaryProject();
    setProject(p);
    if (!p) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("queries")
      .select("*")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false });
    setQueries(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openThread = async (q: any) => {
    setActive(q);
    const { data } = await supabase
      .from("query_replies")
      .select("*")
      .eq("query_id", q.id)
      .order("created_at");
    setReplies(data ?? []);
  };

  const submit = async () => {
    if (!user || !project) return;
    setSubmitting(true);
    const { error } = await supabase.from("queries").insert({
      project_id: project.id,
      author_id: user.id,
      subject,
      body,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Query submitted");
    setSubject("");
    setBody("");
    setOpen(false);
    load();
  };

  const reply = async () => {
    if (!user || !active || !replyBody.trim()) return;
    const { error } = await supabase.from("query_replies").insert({
      query_id: active.id,
      author_id: user.id,
      body: replyBody,
    });
    if (error) return toast.error(error.message);
    setReplyBody("");
    openThread(active);
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Queries</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Questions & support</h1>
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
                <Textarea id="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              <Button onClick={submit} disabled={submitting || !subject || !body} className="w-full bg-navy-deep text-ivory hover:bg-navy">
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
                  active?.id === q.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-medium text-navy-deep">{q.subject}</h3>
                  <Badge variant={q.status === "open" ? "default" : "secondary"} className="text-[10px] capitalize">
                    {q.status}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.body}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {new Date(q.created_at).toLocaleDateString()}
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
                      author={r.author_id === user?.id ? "You" : "Team"}
                      body={r.body}
                      mine={r.author_id === user?.id}
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
                  <Button onClick={reply} disabled={!replyBody.trim()} className="bg-navy-deep text-ivory hover:bg-navy">
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
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          mine ? "bg-navy-deep text-ivory" : "bg-secondary text-navy-deep"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{author}</p>
        <p className="mt-0.5 whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  );
}
