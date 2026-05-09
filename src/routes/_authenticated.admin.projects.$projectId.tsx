import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Plus, Trash2, UserPlus, X } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { getAccessToken } from "@/lib/api-client";
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
  const [project, setProject] = useState<Output<"projects.get">>(null);
  const [members, setMembers] = useState<Output<"members.list">>([]);
  const [milestones, setMilestones] = useState<Output<"milestones.list">>([]);
  const [profiles, setProfiles] = useState<Output<"admin.listProfiles">>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [msOpen, setMsOpen] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDescription, setMsDescription] = useState("");
  const [msTargetDate, setMsTargetDate] = useState("");
  const [addingMs, setAddingMs] = useState(false);

  const load = async () => {
    try {
      const [p, pm, ms, profs] = await Promise.all([
        rpc("projects.get", { projectId }),
        rpc("members.list", { projectId }),
        rpc("milestones.list", { projectId }),
        rpc("admin.listProfiles"),
      ]);
      setProject(p);
      setMembers(pm);
      setMilestones(ms);
      setProfiles(profs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const profileOf = (uid: string) => profiles.find((p) => p.id === uid);

  const updateField = async (
    patch: Partial<{
      name: string;
      clientDisplayName: string;
      address: string;
      status: "planning" | "in_progress" | "on_hold" | "handover" | "completed";
      progressPercent: number;
    }>,
  ) => {
    setSaving(true);
    try {
      await rpc("projects.update", { id: projectId, patch });
      toast.success("Saved");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addMember = async () => {
    if (!addUserId) return;
    try {
      await rpc("members.add", { projectId, userId: addUserId });
      toast.success("Member added");
      setAddOpen(false);
      setAddUserId("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const addMilestone = async () => {
    if (!msTitle.trim()) return;
    setAddingMs(true);
    try {
      await rpc("milestones.create", {
        projectId,
        title: msTitle.trim(),
        description: msDescription.trim() || undefined,
        targetDate: msTargetDate || undefined,
      });
      toast.success("Milestone added");
      setMsOpen(false);
      setMsTitle("");
      setMsDescription("");
      setMsTargetDate("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAddingMs(false);
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      await rpc("milestones.delete", { id });
      toast.success("Milestone deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeMember = async (id: string) => {
    try {
      await rpc("members.remove", { id });
      toast.success("Removed");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const token = getAccessToken();
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

  const candidates = profiles.filter((p) => !members.some((m) => m.userId === p.id));

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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {project.code}
          </p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">{project.name}</h1>
          {project.clientDisplayName && (
            <p className="text-xs text-muted-foreground">{project.clientDisplayName}</p>
          )}
          {project.address && (
            <p className="mt-1 text-xs text-muted-foreground">{project.address}</p>
          )}
        </div>
        <Button onClick={downloadReport} disabled={downloading} variant="outline">
          {downloading ? <Loader2 className="animate-spin" /> : <Download size={14} />}
          Download PDF
        </Button>
      </header>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            defaultValue={project.name}
            onSave={(v) => updateField({ name: v })}
          />
          <Field
            label="Client display name"
            defaultValue={project.clientDisplayName ?? ""}
            onSave={(v) => updateField({ clientDisplayName: v })}
          />
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={project.status}
              onValueChange={(v) =>
                updateField({
                  status: v as "planning" | "in_progress" | "on_hold" | "handover" | "completed",
                })
              }
            >
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
              defaultValue={project.progressPercent}
              onBlur={(e) => updateField({ progressPercent: Number(e.target.value) })}
            />
            <Progress value={project.progressPercent} className="h-1.5" />
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
                          {p.fullName || "(no name)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The user's role on this project mirrors their global role set in Admin → Users.
                </p>
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
            const p = profileOf(m.userId);
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy-deep">
                    {p?.fullName ?? m.userId.slice(0, 8)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{p?.email ?? ""}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {m.role}
                </Badge>
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-navy-deep">Milestones</h2>
          <Dialog open={msOpen} onOpenChange={setMsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-navy-deep text-ivory hover:bg-navy">
                <Plus size={14} /> Add milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    placeholder="Milestone title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input
                    value={msDescription}
                    onChange={(e) => setMsDescription(e.target.value)}
                    placeholder="Short description"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target date (optional)</Label>
                  <Input
                    type="date"
                    value={msTargetDate}
                    onChange={(e) => setMsTargetDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={addMilestone}
                  disabled={!msTitle.trim() || addingMs}
                  className="w-full bg-navy-deep text-ivory hover:bg-navy"
                >
                  {addingMs ? <Loader2 className="animate-spin" size={14} /> : "Add"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ol className="mt-4 space-y-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-navy-deep">{m.title}</span>
                {m.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                )}
                {m.targetDate && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Target: {new Date(m.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={m.status === "completed" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {m.status.replace("_", " ")}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => deleteMilestone(m.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
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
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== defaultValue && onSave(v)}
      />
    </div>
  );
}
