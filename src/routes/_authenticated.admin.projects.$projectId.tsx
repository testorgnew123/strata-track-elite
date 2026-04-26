import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectReport } from "@/lib/server/pdf-report";
import { projectStatusLabel } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/projects/$projectId")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = useParams({ from: "/_authenticated/admin/projects/$projectId" });
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<"client" | "engineer">("engineer");

  const load = async () => {
    const [{ data: p }, { data: pm }, { data: ms }, { data: profs }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("project_members").select("*").eq("project_id", projectId),
      supabase.from("milestones").select("*").eq("project_id", projectId).order("sort_order"),
      supabase.from("profiles").select("id, full_name, mobile"),
    ]);
    setProject(p);
    setMembers(pm ?? []);
    setMilestones(ms ?? []);
    setProfiles(profs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const profileOf = (uid: string) => profiles.find((p) => p.id === uid);

  const updateField = async (
    patch: Partial<{
      name: string;
      client_display_name: string;
      address: string;
      status: "planning" | "in_progress" | "on_hold" | "handover" | "completed";
      progress_percent: number;
    }>,
  ) => {
    setSaving(true);
    const { error } = await supabase.from("projects").update(patch).eq("id", projectId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const addMember = async () => {
    if (!addUserId) return;
    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: addUserId, role: addRole });
    if (error) return toast.error(error.message);
    toast.success("Member added");
    setAddOpen(false);
    setAddUserId("");
    load();
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("project_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await generateProjectReport({ data: { projectId, accessToken: token } });
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
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (!project) return <Card className="p-8 text-sm text-muted-foreground">Not found.</Card>;

  const candidates = profiles.filter((p) => !members.some((m) => m.user_id === p.id));

  return (
    <div className="space-y-6 animate-rise-in">
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-navy-deep"
      >
        <ArrowLeft size={14} /> All projects
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{project.code}</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">{project.name}</h1>
          {project.address && <p className="mt-1 text-xs text-muted-foreground">{project.address}</p>}
        </div>
        <Button onClick={downloadReport} disabled={downloading} variant="outline">
          {downloading ? <Loader2 className="animate-spin" /> : <Download size={14} />}
          Download PDF
        </Button>
      </header>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" defaultValue={project.name} onSave={(v) => updateField({ name: v })} />
          <Field
            label="Client display name"
            defaultValue={project.client_display_name ?? ""}
            onSave={(v) => updateField({ client_display_name: v })}
          />
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={project.status} onValueChange={(v) => updateField({ status: v as "planning" | "in_progress" | "on_hold" | "handover" | "completed" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(projectStatusLabel).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Progress %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              defaultValue={project.progress_percent}
              onBlur={(e) => updateField({ progress_percent: Number(e.target.value) })}
            />
            <Progress value={project.progress_percent} className="h-1.5" />
          </div>
        </div>
        {saving && <p className="mt-3 text-xs text-muted-foreground">Saving…</p>}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-navy-deep">Team</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-navy-deep text-ivory hover:bg-navy">
                <UserPlus size={14} /> Add member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>User</Label>
                  <Select value={addUserId} onValueChange={setAddUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name || "(no name)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Role on this project</Label>
                  <Select value={addRole} onValueChange={(v) => setAddRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={addMember}
                  disabled={!addUserId}
                  className="w-full bg-navy-deep text-ivory hover:bg-navy"
                >
                  Add
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 space-y-2">
          {members.map((m) => {
            const p = profileOf(m.user_id);
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-navy-deep">{p?.full_name ?? m.user_id.slice(0, 8)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                  <X size={14} />
                </Button>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No members yet.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-navy-deep">Milestones</h2>
        <ol className="mt-4 space-y-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
            >
              <span className="text-navy-deep">{m.title}</span>
              <Badge variant={m.status === "completed" ? "default" : "secondary"} className="capitalize">
                {m.status.replace("_", " ")}
              </Badge>
            </li>
          ))}
          {milestones.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">No milestones yet.</p>
          )}
        </ol>
      </Card>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  onSave,
}: {
  label: string;
  defaultValue: string;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(defaultValue);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== defaultValue && onSave(v)} />
    </div>
  );
}
