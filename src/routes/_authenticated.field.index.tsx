import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, ListChecks, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject, projectStatusLabel } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/field/")({
  component: FieldToday,
});

function FieldToday() {
  const [project, setProject] = useState<any>(null);
  const [counts, setCounts] = useState({ photos: 0, openMs: 0, queries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      setProject(p);
      if (!p) return setLoading(false);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [{ count: photos }, { count: openMs }, { count: queries }] = await Promise.all([
        supabase
          .from("progress_updates")
          .select("*", { head: true, count: "exact" })
          .eq("project_id", p.id)
          .gte("taken_at", today.toISOString()),
        supabase
          .from("milestones")
          .select("*", { head: true, count: "exact" })
          .eq("project_id", p.id)
          .neq("status", "completed"),
        supabase
          .from("queries")
          .select("*", { head: true, count: "exact" })
          .eq("project_id", p.id)
          .eq("status", "open"),
      ]);
      setCounts({ photos: photos ?? 0, openMs: openMs ?? 0, queries: queries ?? 0 });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Today</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">Field dashboard</h1>
      </header>

      {loading ? (
        <Skeleton className="h-48" />
      ) : !project ? (
        <Card className="p-6 text-sm text-muted-foreground">No project assigned.</Card>
      ) : (
        <>
          <Card className="p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{project.code}</p>
            <h2 className="mt-1 font-display text-xl text-navy-deep">{project.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{project.address}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="font-medium text-navy-deep">{projectStatusLabel[project.status]}</span>
              <span className="text-muted-foreground">{project.progress_percent}%</span>
            </div>
            <Progress value={project.progress_percent} className="mt-2 h-1.5" />
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <Tile to="/field/upload" icon={Camera} value={counts.photos} label="Photos today" />
            <Tile to="/field/milestones" icon={ListChecks} value={counts.openMs} label="Open milestones" />
            <Tile to="/field/queries" icon={MessageSquare} value={counts.queries} label="Open queries" />
          </div>
        </>
      )}
    </div>
  );
}

function Tile({
  to,
  icon: Icon,
  value,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  value: number;
  label: string;
}) {
  return (
    <Link to={to}>
      <Card className="flex flex-col items-center p-4 text-center transition-colors hover:border-gold/40">
        <Icon size={20} />
        <p className="mt-2 font-display text-2xl font-light text-navy-deep">{value}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </Card>
    </Link>
  );
}
