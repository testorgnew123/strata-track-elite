import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ListChecks, MessageSquare } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { projectStatusLabel } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/field/")({
  component: FieldDashboard,
});

function FieldDashboard() {
  const [projects, setProjects] = useState<Output<"projects.listMine">>([]);
  const [stats, setStats] = useState<
    Record<string, { photos: number; openMs: number; queries: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = async (list: Output<"projects.listMine">) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const perProject = await Promise.all(
      list.map(async (p) => {
        const [photos, ms, qs] = await Promise.all([
          rpc("progress.list", { projectId: p.id, limit: 200 }),
          rpc("milestones.list", { projectId: p.id }),
          rpc("queries.listOpen", { projectId: p.id }),
        ]);
        return {
          id: p.id,
          photos: photos.filter((x) => new Date(x.takenAt) >= today).length,
          openMs: ms.filter((m) => m.status !== "completed").length,
          queries: qs.filter((q) => q.status === "open").length,
        };
      }),
    );
    setStats(Object.fromEntries(perProject.map((s) => [s.id, s])));
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await rpc("projects.listMine");
        setProjects(list);
        await fetchStats(list);
        intervalRef.current = setInterval(() => fetchStats(list).catch(() => null), 15000);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Today</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">My projects</h1>
      </header>

      {loading ? (
        <Skeleton className="h-48" />
      ) : projects.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No projects assigned.</Card>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const s = stats[p.id] ?? { photos: 0, openMs: 0, queries: 0 };
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {p.code}
                    </p>
                    <h2 className="mt-0.5 font-display text-lg text-navy-deep">{p.name}</h2>
                    {p.address && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.address}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize shrink-0">
                    {projectStatusLabel[p.status] ?? p.status}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-navy-deep">{p.progressPercent}%</span>
                </div>
                <Progress value={p.progressPercent} className="mt-1.5 h-1.5" />

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <QuickLink
                    to="/field/progress"
                    projectId={p.id}
                    icon={Camera}
                    value={s.photos}
                    label="Photos today"
                  />
                  <QuickLink
                    to="/field/progress"
                    projectId={p.id}
                    icon={ListChecks}
                    value={s.openMs}
                    label="Open milestones"
                  />
                  <QuickLink
                    to="/field/queries"
                    projectId={p.id}
                    icon={MessageSquare}
                    value={s.queries}
                    label="Open queries"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickLink({
  to,
  projectId,
  icon: Icon,
  value,
  label,
}: {
  to: string;
  projectId: string;
  icon: React.ComponentType<{ size?: number }>;
  value: number;
  label: string;
}) {
  return (
    <Link to={to} search={{ projectId }}>
      <div className="flex flex-col items-center rounded-md border border-border bg-secondary/40 p-3 text-center transition-colors hover:border-gold/40">
        <Icon size={16} />
        <p className="mt-1 font-display text-xl font-light text-navy-deep">{value}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground leading-tight">
          {label}
        </p>
      </div>
    </Link>
  );
}
