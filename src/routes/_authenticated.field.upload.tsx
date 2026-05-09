import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/field/upload")({
  validateSearch: (s: Record<string, unknown>) => ({
    projectId: typeof s.projectId === "string" ? s.projectId : undefined,
  }),
  component: UploadPage,
});

function UploadPage() {
  const { user } = useAuth();
  const { projectId: searchProjectId } = Route.useSearch();

  const [projects, setProjects] = useState<Output<"projects.listMine">>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("structure");
  const [submitting, setSubmitting] = useState(false);

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

  const onPick = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async () => {
    if (!file || !user || !projectId) return;
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

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Upload</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">
          Post a progress update
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

      {selectedProject && (
        <p className="text-xs text-muted-foreground">
          Uploading to: <span className="font-medium text-navy-deep">{selectedProject.name}</span>
        </p>
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
            onClick={submit}
            disabled={!file || !projectId || submitting}
            className="w-full bg-navy-deep text-ivory hover:bg-navy"
          >
            {submitting ? <Loader2 className="animate-spin" /> : "Post update"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
