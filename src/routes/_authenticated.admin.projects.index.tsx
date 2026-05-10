import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { projectStatusLabel } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/projects/")({
  component: AdminProjects,
});

function AdminProjects() {
  const [projects, setProjects] = useState<Output<"projects.list">>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    client_display_name: "",
    address: "",
    start_date: "",
    expected_handover_date: "",
  });

  const load = async () => {
    try {
      const data = await rpc("projects.list");
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      await rpc("projects.create", {
        code: form.code,
        name: form.name,
        clientDisplayName: form.client_display_name || undefined,
        address: form.address || undefined,
        startDate: form.start_date || undefined,
        expectedHandoverDate: form.expected_handover_date || undefined,
      });
      toast.success("Project created");
      setOpen(false);
      setForm({
        code: "",
        name: "",
        client_display_name: "",
        address: "",
        start_date: "",
        expected_handover_date: "",
      });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Projects</p>
          <h1 className="mt-2 font-display text-2xl font-light text-navy-deep sm:text-3xl">
            All projects
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-deep text-ivory hover:bg-navy">
              <Plus size={14} /> New project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {[
                ["code", "Code (unique)"],
                ["name", "Name"],
                ["client_display_name", "Client display name"],
              ].map(([k, label]) => (
                <div key={k} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={(form as Record<string, unknown>)[k] as string}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Handover date</Label>
                  <Input
                    type="date"
                    value={form.expected_handover_date}
                    onChange={(e) => setForm({ ...form, expected_handover_date: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={create}
                disabled={!form.code || !form.name || busy}
                className="w-full bg-navy-deep text-ivory hover:bg-navy"
              >
                {busy ? <Loader2 className="animate-spin" /> : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : projects.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No projects yet. Create one above.
        </p>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Link key={p.id} to="/admin/projects/$projectId" params={{ projectId: p.id }}>
              <Card className="p-4 transition-colors hover:border-gold/40 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1 basis-full sm:basis-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {p.code}
                    </p>
                    <h3 className="break-words font-display text-base text-navy-deep sm:text-lg">
                      {p.name}
                    </h3>
                    {p.clientDisplayName && (
                      <p className="break-words text-xs text-muted-foreground">
                        {p.clientDisplayName}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {projectStatusLabel[p.status] ?? p.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{p.progressPercent}%</span>
                  {p.expectedHandoverDate && (
                    <span>Handover: {new Date(p.expectedHandoverDate).toLocaleDateString()}</span>
                  )}
                </div>
                <Progress value={p.progressPercent} className="mt-2 h-1.5" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
