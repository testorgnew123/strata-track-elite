import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/field/queries")({
  validateSearch: (s: Record<string, unknown>) => ({
    projectId: typeof s.projectId === "string" ? s.projectId : undefined,
  }),
  component: FieldQueries,
});

function FieldQueries() {
  const { user } = useAuth();
  const { projectId: searchProjectId } = Route.useSearch();

  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    rpc("projects.listMine").then((list) => {
      setProjects(list);
      const first = searchProjectId && list.some((p: any) => p.id === searchProjectId)
        ? searchProjectId
        : list[0]?.id ?? "";
      setProjectId(first);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    setLoading(true);
    setActive(null);
    rpc("queries.list", { projectId })
      .then(setQueries)
      .finally(() => setLoading(false));
  }, [projectId]);

  const openQuery = async (q: any) => {
    setActive(q);
    const data = await rpc("replies.list", { queryId: q.id });
    setReplies(data);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const [threadData, listData] = await Promise.all([
          rpc("replies.list", { queryId: q.id }),
          rpc("queries.list", { projectId }),
        ]);
        setReplies(threadData);
        setQueries(listData);
        setActive((prev: any) => {
          const updated = listData.find((x: any) => x.id === q.id);
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

  const send = async () => {
    if (!user || !active || !reply.trim()) return;
    setBusy(true);
    try {
      await rpc("replies.create", { queryId: active.id, body: reply });
      setReply("");
      const [threadData, listData] = await Promise.all([
        rpc("replies.list", { queryId: active.id }),
        rpc("queries.list", { projectId }),
      ]);
      setReplies(threadData);
      setQueries(listData);
      const updated = listData.find((q: any) => q.id === active.id);
      if (updated) setActive(updated);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Queries</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">Client questions</h1>
      </header>

      {!active && projects.length > 1 && (
        <div className="space-y-1.5">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : active ? (
        <Card className="flex flex-col p-5">
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setActive(null);
            }}
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
                className={`rounded-2xl px-4 py-2.5 text-sm ${r.authorId === user?.id ? "bg-navy-deep text-ivory" : "bg-secondary text-navy-deep"}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  {r.authorId === user?.id ? "You" : "Client"}
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
              onClick={() => openQuery(q)}
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
