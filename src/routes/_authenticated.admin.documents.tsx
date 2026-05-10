import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { getAccessToken, refreshAccessToken } from "@/lib/api-client";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: AdminDocuments,
});

type DocCategory = "contract" | "floor_plan" | "permit" | "report" | "invoice_doc" | "other";

const CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: "contract", label: "Contract" },
  { value: "floor_plan", label: "Floor plan" },
  { value: "permit", label: "Permit" },
  { value: "report", label: "Report" },
  { value: "invoice_doc", label: "Invoice / Doc" },
  { value: "other", label: "Other" },
];

function formatBytes(b?: number | null): string {
  if (!b && b !== 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function AdminDocuments() {
  const [docs, setDocs] = useState<Output<"admin.listAllDocuments">>([]);
  const [projects, setProjects] = useState<Output<"projects.list">>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("other");
  const [file, setFile] = useState<File | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [d, p] = await Promise.all([rpc("admin.listAllDocuments"), rpc("projects.list")]);
      setDocs(d);
      setProjects(p);
      if (!projectId && p.length) setProjectId(p[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setTitle("");
    setCategory("other");
    setFile(null);
  };

  const submit = async () => {
    if (!projectId) return toast.error("Select a project first");
    if (!title.trim()) return toast.error("Enter a document title");
    if (!file) return toast.error("Choose a file to upload");
    if (file.size > 50 * 1024 * 1024) return toast.error("File exceeds 50 MB limit");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("projectId", projectId);
      form.append("title", title.trim());
      form.append("category", category);
      form.append("file", file);

      let token = getAccessToken();
      if (!token) token = await refreshAccessToken();
      const res = await fetch("/api/upload-document", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      toast.success("Document uploaded");
      resetForm();
      setOpen(false);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const viewDoc = async (id: string) => {
    try {
      const { viewUrl } = await rpc("documents.signedUrl", { id });
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open this file.");
    }
  };

  const downloadDoc = async (id: string) => {
    try {
      const { downloadUrl, filename } = await rpc("documents.signedUrl", { id });
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename ?? "";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast.error("Could not download this file.");
    }
  };

  const removeDoc = async (id: string) => {
    setDeletingId(id);
    try {
      await rpc("documents.delete", { id });
      toast.success("Document deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Documents</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">All documents</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload project files visible to clients in their portal.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-navy-deep text-ivory hover:bg-navy">
              <Upload size={14} /> Upload document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload a document</DialogTitle>
              <DialogDescription>
                Files are stored securely and shown to all client members of the chosen project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
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
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Final floor plans v2"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as DocCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>File</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.dxf,.txt,.csv,.zip"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="text-[11px] text-muted-foreground">
                    {file.name} · {formatBytes(file.size)}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">Max 50 MB.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={submitting || !projectId || !title.trim() || !file}
                className="bg-navy-deep text-ivory hover:bg-navy"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : docs.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No documents uploaded yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-3 p-4 sm:gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary text-navy-deep">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1 basis-full sm:basis-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium text-navy-deep">{d.title}</h3>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {d.category.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground break-words">
                  {d.projectCode} — {d.projectName} · v{d.version} · {formatBytes(d.fileSizeBytes)}{" "}
                  · {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => viewDoc(d.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-navy-deep transition-colors hover:bg-secondary"
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => downloadDoc(d.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-navy-deep transition-colors hover:bg-secondary"
              >
                <Download size={14} /> Download
              </button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeDoc(d.id)}
                disabled={deletingId === d.id}
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                {deletingId === d.id ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Trash2 size={14} />
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
