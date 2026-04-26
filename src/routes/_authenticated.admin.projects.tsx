import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { projectStatusLabel } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: AdminProjects,
});

function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
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
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      code: form.code,
      name: form.name,
      client_display_name: form.client_display_name || null,
      address: form.address || null,
      start_date: form.start_date || null,
      expected_handover_date: form.expected_handover_date || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setOpen(false);
    setForm({ code: "", name: "", client_display_name: "", address: "", start_date: "", expected_handover_date: "" });
    load();
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Projects</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">All projects</h1>
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
                    value={(form as any)[k]}
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
              <div className="grid grid-cols-2 gap-3">
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
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.code}</p>
                  <h3 className="font-display text-lg text-navy-deep">{p.name}</h3>
                  {p.client_display_name && (
                    <p className="text-xs text-muted-foreground">{p.client_display_name}</p>
                  )}
                </div>
                <Badge variant="secondary" className="capitalize">
                  {projectStatusLabel[p.status] ?? p.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.progress_percent}%</span>
                {p.expected_handover_date && (
                  <span>Handover: {new Date(p.expected_handover_date).toLocaleDateString()}</span>
                )}
              </div>
              <Progress value={p.progress_percent} className="mt-2 h-1.5" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
