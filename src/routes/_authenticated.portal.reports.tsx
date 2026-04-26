import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { generateProjectReport } from "@/lib/server/pdf-report";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      setProject(p);
      setLoading(false);
    })();
  }, []);

  const download = async () => {
    if (!project) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await generateProjectReport({
        data: { projectId: project.id, accessToken: token },
      });
      // Decode base64 → blob → download
      const bin = atob(res.base64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Reports</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Branded progress reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a PDF snapshot of your project — milestones, latest photos, and current progress.
        </p>
      </header>

      {loading ? (
        <Skeleton className="h-48" />
      ) : !project ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No project assigned.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-deep text-gold">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{project.code}</p>
                <h2 className="font-display text-xl text-navy-deep">{project.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Includes header, progress %, milestone timeline, and the 6 most recent site photos.
                </p>
              </div>
            </div>
            <Button onClick={download} disabled={busy} className="bg-navy-deep text-ivory hover:bg-navy">
              {busy ? <Loader2 className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
