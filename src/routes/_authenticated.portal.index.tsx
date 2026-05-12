import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, ListChecks, MessageSquare, CalendarClock, Star } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { projectStatusLabel } from "@/lib/portal-data";
import { usePortalProject } from "@/lib/portal-project-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthedMedia } from "@/components/ui/authed-media";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: PortalOverview,
});

function PortalOverview() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { selectedProject: project, loading: projectLoading } = usePortalProject();
  const [stats, setStats] = useState<{
    pendingAcks: number;
    openQueries: number;
    nextMilestone: Output<"milestones.list">[number] | null;
    recentPhoto: Output<"progress.list">[number] | null;
    rated: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectLoading) return;
    if (!project) {
      setStats(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    (async () => {
      const [ms, qs, progressRows, rating] = await Promise.all([
        rpc("milestones.list", { projectId: project.id }),
        rpc("queries.listOpen", { projectId: project.id }),
        rpc("progress.list", { projectId: project.id, limit: 1 }),
        rpc("ratings.get", { projectId: project.id }),
      ]);
      if (!alive) return;
      const photo = progressRows[0] ?? null;
      setStats({
        pendingAcks: ms.filter((m) => m.status === "completed" && !m.acknowledgedAt).length,
        openQueries: qs.filter((q) => q.status === "open").length,
        nextMilestone: ms.find((m) => m.status !== "completed") ?? null,
        recentPhoto: photo,
        rated: !!rating,
      });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [project?.id, projectLoading]);

  const greeting = profile?.fullName ? profile.fullName.split(" ")[0] : "there";

  return (
    <div className="space-y-8 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          {t("portal.welcome")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep md:text-4xl">
          Hello, {greeting}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's the latest on {project?.name ?? "your project"}.
        </p>
      </header>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : !project ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No project assigned yet. Your project manager will share access shortly.
          </p>
        </Card>
      ) : (
        <>
          {/* Hero project card */}
          <Card className="overflow-hidden border-border/60">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {project.code}
                </p>
                <h2 className="mt-1 font-display text-2xl font-light text-navy-deep md:text-3xl">
                  {project.name}
                </h2>
                {project.address && (
                  <p className="mt-1 text-sm text-muted-foreground">{project.address}</p>
                )}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium uppercase tracking-wider text-navy-deep">
                      {projectStatusLabel[project.status] ?? project.status}
                    </span>
                    <span className="text-muted-foreground">{project.progressPercent}%</span>
                  </div>
                  <Progress value={project.progressPercent} className="mt-2 h-1.5" />
                </div>
                {project.expectedHandoverDate && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t("portal.handoverIn")}:{" "}
                    <span className="font-medium text-navy-deep">
                      {new Date(project.expectedHandoverDate).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard
              icon={ListChecks}
              label={t("portal.pendingAcks")}
              value={String(stats?.pendingAcks ?? 0)}
              href="/portal/milestones"
            />
            <StatCard
              icon={MessageSquare}
              label={t("portal.openQueries")}
              value={String(stats?.openQueries ?? 0)}
              href="/portal/queries"
            />
            <StatCard
              icon={CalendarClock}
              label="Next milestone"
              value={stats?.nextMilestone?.title ?? "—"}
              href="/portal/milestones"
              compact
            />
          </div>

          {/* Latest update + handover prompts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {stats?.recentPhoto && (
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  {stats.recentPhoto.photoUrl && (
                    <AuthedMedia
                      src={stats.recentPhoto.photoUrl}
                      alt={stats.recentPhoto.caption ?? "Latest progress"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-gold">Latest update</p>
                  <p className="mt-2 text-sm text-navy-deep">{stats.recentPhoto.caption}</p>
                  <Link
                    to="/portal/progress"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy-deep underline-offset-4 hover:underline"
                  >
                    See all photos →
                  </Link>
                </div>
              </Card>
            )}

            {project.status === "completed" && !stats?.rated && (
              <Card className="border-gold/40 bg-gold/5 p-6">
                <Star className="text-gold" />
                <h3 className="mt-3 font-display text-xl text-navy-deep">
                  How was your experience?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Take 30 seconds to rate the project and share a referral.
                </p>
                <Link
                  to="/portal/settings"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-navy-deep px-4 py-2 text-xs font-medium uppercase tracking-wider text-ivory transition-colors hover:bg-navy"
                >
                  Rate & refer
                </Link>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  compact,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href: string;
  compact?: boolean;
}) {
  return (
    <Link to={href} className="group">
      <Card className="flex h-full items-center gap-4 p-4 transition-colors group-hover:border-gold/40">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-navy-deep">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-0.5 truncate font-display text-navy-deep ${compact ? "text-base font-medium" : "text-2xl font-light"}`}
          >
            {value}
          </p>
        </div>
      </Card>
    </Link>
  );
}
