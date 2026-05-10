import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { useAuth } from "@/lib/auth-context";
import { watermarkImage } from "@/lib/watermark";
import { getAccessToken, refreshAccessToken } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_authenticated/field/progress")({
  validateSearch: (s: Record<string, unknown>) => ({
    projectId: typeof s.projectId === "string" ? s.projectId : undefined,
  }),
  component: FieldProgress,
});

function FieldProgress() {
  const { user } = useAuth();
  const { projectId: searchProjectId } = Route.useSearch();

  const [projects, setProjects] = useState<Output<"projects.listMine">>([]);
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    rpc("projects.listMine").then((list) => {
      setProjects(list);
      const first =
        searchProjectId && list.some((p) => p.id === searchProjectId)
          ? searchProjectId
          : (list[0]?.id ?? "");
      setProjectId(first);
    });
  }, []);

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-8 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Progress</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">
          Update progress & milestones
        </h1>
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

      <ProgressSection projectId={projectId} userId={user?.id ?? null} projects={projects} />
      <MilestonesSection projectId={projectId} />
    </div>
  );
}

function ProgressSection({
  projectId,
  userId,
  projects,
}: {
  projectId: string;
  userId: string | null;
  projects: Output<"projects.listMine">;
}) {
  const [progressValue, setProgressValue] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("structure");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    rpc("projects.get", { projectId }).then((p) => {
      setProgressValue(p.progressPercent ?? 0);
    });
  }, [projectId]);

  const onPick = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
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

  const submitPhoto = async () => {
    if (!file || !userId || !projectId) return;
    setSubmitting(true);
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error("No project selected");

      let toUpload: File = file;
      try {
        toUpload = await watermarkImage(file, project.code ?? "PROJECT");
      } catch {
        // fall back to original file
      }

      const form = new FormData();
      form.append("projectId", projectId);
      form.append("category", category);
      if (caption) form.append("caption", caption);
      form.append("file", toUpload);

      let token = getAccessToken();
      if (!token) token = await refreshAccessToken();
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      toast.success("Update posted");
      setFile(null);
      setPreview(null);
      setCaption("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg text-navy-deep">Mark progress</h2>
        <p className="text-xs text-muted-foreground">
          Update overall percent and post a photo update.
        </p>
      </div>

      {projectId && (
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
                onChange={(e) =>
                  setProgressValue(Math.min(100, Math.max(0, Number(e.target.value))))
                }
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

      <Card className="p-5">
        <label className="flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-border bg-secondary/40">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <Camera size={28} className="mx-auto text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Tap to take or pick a photo</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["structure", "plumbing", "electrical", "finishing", "exterior", "other"].map(
                  (c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cap">Caption</Label>
            <Textarea
              id="cap"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <Button
            onClick={submitPhoto}
            disabled={!file || !projectId || submitting}
            className="w-full bg-navy-deep text-ivory hover:bg-navy"
          >
            {submitting ? <Loader2 className="animate-spin" /> : "Post update"}
          </Button>
        </div>
      </Card>
    </section>
  );
}

function MilestonesSection({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Output<"milestones.list">>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    rpc("milestones.list", { projectId })
      .then(setItems)
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

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg text-navy-deep">Mark milestones</h2>
        <p className="text-xs text-muted-foreground">
          Mark project milestones as completed once finished on site.
        </p>
      </div>

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
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No milestones yet.
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
