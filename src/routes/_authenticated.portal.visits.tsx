import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { usePortalProject } from "@/lib/portal-project-context";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const { user } = useAuth();
  const { selectedProject: project, loading: projectLoading } = usePortalProject();
  const [visits, setVisits] = useState<Output<"visits.list">>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("Morning, 10:00 AM");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!project) {
      setVisits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await rpc("visits.list", { projectId: project.id });
      setVisits(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (projectLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, projectLoading]);

  const request = async () => {
    if (!user || !project) return;
    setSubmitting(true);
    try {
      await rpc("visits.create", {
        projectId: project.id,
        requestedDate: date,
        requestedSlot: slot,
        notes: notes || undefined,
      });
      toast.success("Site visit requested");
      setDate("");
      setNotes("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Site visits</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">
          Walk through your site
        </h1>
      </header>

      <Card className="p-6">
        <h2 className="font-display text-lg text-navy-deep">Request a visit</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">Preferred date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slot">Preferred time</Label>
            <Input
              id="slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              placeholder="Morning, 10:00 AM"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What would you like to focus on?"
            />
          </div>
        </div>
        <Button
          onClick={request}
          disabled={!date || submitting}
          className="mt-4 bg-navy-deep text-ivory hover:bg-navy"
        >
          {submitting ? <Loader2 className="animate-spin" /> : "Request visit"}
        </Button>
      </Card>

      {loading ? (
        <Skeleton className="h-48" />
      ) : visits.length === 0 ? null : (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your requests
          </h2>
          <div className="space-y-3">
            {visits.map((v) => (
              <Card key={v.id} className="flex items-center gap-4 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-navy-deep">
                  <CalendarClock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy-deep">
                    {new Date(v.requestedDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                    {v.requestedSlot && (
                      <span className="text-muted-foreground"> · {v.requestedSlot}</span>
                    )}
                  </p>
                  {v.notes && <p className="mt-1 text-xs text-muted-foreground">{v.notes}</p>}
                </div>
                <Badge
                  variant={v.status === "requested" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {v.status}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
