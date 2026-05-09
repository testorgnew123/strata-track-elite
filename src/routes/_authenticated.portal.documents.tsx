import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/documents")({
  component: DocsPage,
});

function DocsPage() {
  const [docs, setDocs] = useState<Output<"documents.list">>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      if (!p) {
        setLoading(false);
        return;
      }
      try {
        const data = await rpc("documents.list", { projectId: p.id });
        setDocs(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const view = async (id: string) => {
    try {
      const { viewUrl } = await rpc("documents.signedUrl", { id });
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open this file.");
    }
  };

  const download = async (id: string) => {
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

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Documents</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Project files</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : docs.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No documents yet.</Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-center gap-4 p-4">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-secondary text-navy-deep">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium text-navy-deep">{d.title}</h3>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {d.category.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  v{d.version} · {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => view(d.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-navy-deep transition-colors hover:bg-secondary"
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => download(d.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-navy-deep transition-colors hover:bg-secondary"
              >
                <Download size={14} /> Download
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
