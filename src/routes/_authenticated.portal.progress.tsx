import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { usePortalProject } from "@/lib/portal-project-context";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AuthedImage } from "@/components/ui/authed-image";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/progress")({
  component: ProgressPage,
});

const CATS = [
  "all",
  "structure",
  "plumbing",
  "electrical",
  "finishing",
  "exterior",
  "other",
] as const;

function ProgressPage() {
  const { user } = useAuth();
  const { selectedProject, loading: projectLoading } = usePortalProject();
  const [items, setItems] = useState<Output<"progress.list">>([]);
  const [milestones, setMilestones] = useState<Output<"milestones.list">>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof CATS)[number]>("all");
  const [acking, setAcking] = useState<string | null>(null);

  const load = async () => {
    if (!selectedProject) {
      setItems([]);
      setMilestones([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [photos, ms] = await Promise.all([
        rpc("progress.list", { projectId: selectedProject.id, limit: 200 }),
        rpc("milestones.list", { projectId: selectedProject.id }),
      ]);
      setItems(photos);
      setMilestones(ms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id, projectLoading]);

  const acknowledge = async (id: string) => {
    if (!user) return;
    setAcking(id);
    try {
      await rpc("milestones.acknowledge", { id });
      toast.success("Milestone acknowledged");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAcking(null);
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-10 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Progress</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">
          Project progress & milestones
        </h1>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl text-navy-deep">Project Progress</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <Button
              key={c}
              variant={filter === c ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(c)}
              className={`h-8 capitalize ${filter === c ? "bg-navy-deep text-ivory hover:bg-navy" : ""}`}
            >
              {c}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No progress photos in this category yet.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((u) => (
              <Card key={u.id} className="overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {u.photoUrl && (
                    <AuthedImage
                      src={u.photoUrl}
                      alt={u.caption ?? "Progress"}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="capitalize">
                    {u.category}
                  </Badge>
                  <p className="mt-2 text-sm text-navy-deep">{u.caption}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(u.takenAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-navy-deep">Milestones</h2>
        <p className="text-sm text-muted-foreground">
          Acknowledge each completed milestone to confirm you're informed.
        </p>

        {loading ? (
          <Skeleton className="h-72" />
        ) : milestones.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No milestones yet.
          </Card>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-border pl-6">
            {milestones.map((m) => {
              const isDone = m.status === "completed";
              const isAcked = !!m.acknowledgedAt;
              return (
                <li key={m.id} className="relative">
                  <span
                    className={`absolute -left-[31px] top-3 grid h-6 w-6 place-items-center rounded-full border-2 ${
                      isDone
                        ? "border-gold bg-gold text-navy-deep"
                        : m.status === "in_progress"
                          ? "border-gold bg-background text-gold"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <Circle size={8} fill="currentColor" />
                    )}
                  </span>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg text-navy-deep">{m.title}</h3>
                        {m.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-wider">
                          {m.targetDate && (
                            <span className="text-muted-foreground">
                              Target: {new Date(m.targetDate).toLocaleDateString()}
                            </span>
                          )}
                          {m.completedAt && (
                            <span className="text-gold">
                              Completed: {new Date(m.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {isDone && (
                        <div className="shrink-0">
                          {isAcked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-navy-deep">
                              <CheckCircle2 size={14} className="text-gold" /> Acknowledged
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => acknowledge(m.id)}
                              disabled={acking === m.id}
                              className="bg-navy-deep text-ivory hover:bg-navy"
                            >
                              {acking === m.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                "Acknowledge"
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
