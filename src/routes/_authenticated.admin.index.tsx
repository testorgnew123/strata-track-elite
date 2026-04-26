import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderKanban, Users, MessageSquare, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDash,
});

function AdminDash() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: projects }, { count: users }, { count: openQ }, { count: photos }, { data: rp }] =
        await Promise.all([
          supabase.from("projects").select("*", { head: true, count: "exact" }),
          supabase.from("profiles").select("*", { head: true, count: "exact" }),
          supabase.from("queries").select("*", { head: true, count: "exact" }).eq("status", "open"),
          supabase.from("progress_updates").select("*", { head: true, count: "exact" }),
          supabase
            .from("projects")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
      setStats({ projects, users, openQ, photos });
      setRecent(rp ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Admin</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Operations dashboard</h1>
      </header>

      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile icon={FolderKanban} label="Projects" value={stats.projects ?? 0} />
          <StatTile icon={Users} label="Users" value={stats.users ?? 0} />
          <StatTile icon={MessageSquare} label="Open queries" value={stats.openQ ?? 0} />
          <StatTile icon={Camera} label="Total photos" value={stats.photos ?? 0} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent projects
        </h2>
        <div className="grid gap-3">
          {recent.map((p) => (
            <Link key={p.id} to="/admin/projects">
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-gold/40">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.code}</p>
                  <p className="font-medium text-navy-deep">{p.name}</p>
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.status} · {p.progress_percent}%
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <Icon size={18} />
      <p className="mt-2 font-display text-3xl font-light text-navy-deep">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </Card>
  );
}
