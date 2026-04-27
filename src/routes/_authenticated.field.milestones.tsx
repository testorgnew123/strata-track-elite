import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { rpc } from "@/lib/rpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/field/milestones")({
  validateSearch: (s: Record<string, unknown>) => ({
    projectId: typeof s.projectId === "string" ? s.projectId : undefined,
  }),
  component: FieldMs,
});

function FieldMs() {
  const { projectId: searchProjectId } = Route.useSearch();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);

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
    setLoading(true);
    Promise.all([
      rpc("milestones.list", { projectId }),
      rpc("projects.get", { projectId }),
    ])
      .then(([ms, proj]) => {
        setItems(ms);
        setProgressValue(proj.progressPercent ?? 0);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const complete = async (id: string) => {
    setBusy(id);
    try {
      await rpc("milestones.update", { id, patch: { status: "completed" } });
      toast.success("Marked complete");
      const data = await rpc("milestones.list", { projectId });
      setItems(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveProgress = async () => {
    if (!projectId) return;
    setSavingProgress(true);
    try {
      await rpc("projects.setProgress", { id: projectId, progressPercent: progressValue });
      toast.success("Progress updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingProgress(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Milestones</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">Mark progress</h1>
      </header>

      {projects.length > 1 && (
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

      {selectedProject && projects.length === 1 && (
        <p className="text-xs text-muted-foreground">
          Project: <span className="font-medium text-navy-deep">{selectedProject.name}</span>
        </p>
      )}

      {!loading && projectId && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Project progress</Label>
              <span className="text-sm font-medium text-navy-deep">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={progressValue}
                onChange={(e) => setProgressValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-24"
              />
              <Button
                size="sm"
                onClick={saveProgress}
                disabled={savingProgress}
                className="bg-navy-deep text-ivory hover:bg-navy"
              >
                {savingProgress ? <Loader2 className="animate-spin" size={14} /> : "Update"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-navy-deep">{m.title}</h3>
                  {m.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                  )}
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.status}
                    {m.targetDate && ` · target ${new Date(m.targetDate).toLocaleDateString()}`}
                  </p>
                </div>
                {m.status === "completed" ? (
                  <Check className="shrink-0 text-gold" />
                ) : (
                  <Button
                    size="sm"
                    onClick={() => complete(m.id)}
                    disabled={busy === m.id}
                    className="bg-navy-deep text-ivory hover:bg-navy"
                  >
                    {busy === m.id ? <Loader2 className="animate-spin" /> : "Complete"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">No milestones yet.</Card>
          )}
        </div>
      )}
    </div>
  );
}
