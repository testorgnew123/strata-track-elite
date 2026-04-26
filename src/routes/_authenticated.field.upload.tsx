import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { useAuth } from "@/lib/auth-context";
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
  component: UploadPage,
});

function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("structure");
  const [submitting, setSubmitting] = useState(false);

  const onPick = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async () => {
    if (!file || !user) return;
    setSubmitting(true);
    const project = await fetchUserPrimaryProject();
    if (!project) {
      setSubmitting(false);
      return toast.error("No project assigned");
    }
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${project.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("progress-photos")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      setSubmitting(false);
      return toast.error(upErr.message);
    }
    const { data: signed } = await supabase.storage
      .from("progress-photos")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const photoUrl = signed?.signedUrl ?? path;
    const { error } = await supabase.from("progress_updates").insert({
      project_id: project.id,
      author_id: user.id,
      category: category as any,
      caption,
      photo_url: photoUrl,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Update posted");
    setFile(null);
    setPreview(null);
    setCaption("");
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Upload</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">Post a progress update</h1>
      </header>

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
                {["structure", "plumbing", "electrical", "finishing", "exterior", "other"].map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cap">Caption</Label>
            <Textarea id="cap" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>

          <Button
            onClick={submit}
            disabled={!file || submitting}
            className="w-full bg-navy-deep text-ivory hover:bg-navy"
          >
            {submitting ? <Loader2 className="animate-spin" /> : "Post update"}
          </Button>
        </div>
      </Card>

      <Input
        type="hidden"
        value=""
        readOnly
        aria-hidden
      />
    </div>
  );
}
