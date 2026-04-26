import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/field/queries")({
  component: FieldQueries,
});

function FieldQueries() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const p = await fetchUserPrimaryProject();
    if (!p) return setLoading(false);
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

  const open = async (q: any) => {
    setActive(q);
    const { data } = await supabase
      .from("query_replies")
      .select("*")
      .eq("query_id", q.id)
      .order("created_at");
    setReplies(data ?? []);
  };

  const send = async () => {
    if (!user || !active || !reply.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("query_replies").insert({
      query_id: active.id,
      author_id: user.id,
      body: reply,
    });
    if (!error) {
      await supabase.from("queries").update({ status: "answered" }).eq("id", active.id);
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    setReply("");
    open(active);
    load();
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Queries</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">Client questions</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : active ? (
        <Card className="flex flex-col p-5">
          <button
            onClick={() => setActive(null)}
            className="mb-3 self-start text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back
          </button>
          <h2 className="font-display text-lg text-navy-deep">{active.subject}</h2>
          <div className="mt-3 space-y-2">
            <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-navy-deep">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Client</p>
              <p>{active.body}</p>
            </div>
            {replies.map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl px-4 py-2.5 text-sm ${r.author_id === user?.id ? "bg-navy-deep text-ivory" : "bg-secondary text-navy-deep"}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  {r.author_id === user?.id ? "You" : "Client"}
                </p>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" />
            <Button onClick={send} disabled={!reply.trim() || busy} className="bg-navy-deep text-ivory hover:bg-navy">
              {busy ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {queries.map((q) => (
            <button
              key={q.id}
              onClick={() => open(q)}
              className="block w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-gold/40"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-medium text-navy-deep">{q.subject}</h3>
                <Badge variant={q.status === "open" ? "default" : "secondary"} className="capitalize">
                  {q.status}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.body}</p>
            </button>
          ))}
          {queries.length === 0 && (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              No client questions right now.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
