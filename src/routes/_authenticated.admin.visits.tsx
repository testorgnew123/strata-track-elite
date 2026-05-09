import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/visits")({
  component: AdminVisits,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "default",
  confirmed: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

function AdminVisits() {
  const [visits, setVisits] = useState<Output<"visits.listAll">>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    rpc("visits.listAll", {})
      .then(setVisits)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, status: "confirmed" | "cancelled") => {
    setBusy(id + status);
    try {
      await rpc("visits.update", { id, patch: { status } });
      toast.success(status === "confirmed" ? "Visit confirmed" : "Visit declined");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Site visits</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Visit requests</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : visits.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No visit requests yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-navy-deep">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {v.projectCode} · {v.projectName}
                    </p>
                    <p className="mt-0.5 font-medium text-navy-deep">
                      {new Date(v.requestedDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {v.requestedSlot && (
                        <span className="text-muted-foreground"> · {v.requestedSlot}</span>
                      )}
                    </p>
                    {v.notes && <p className="mt-1 text-xs text-muted-foreground">{v.notes}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Requested {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"} className="capitalize">
                    {v.status}
                  </Badge>
                  {v.status === "requested" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-navy-deep text-ivory hover:bg-navy"
                        disabled={busy !== null}
                        onClick={() => decide(v.id, "confirmed")}
                      >
                        <Check size={14} />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        disabled={busy !== null}
                        onClick={() => decide(v.id, "cancelled")}
                      >
                        <X size={14} />
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
