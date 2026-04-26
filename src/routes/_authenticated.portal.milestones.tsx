import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/milestones")({
  component: MilestonesPage,
});

function MilestonesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState<string | null>(null);

  const load = async () => {
    const p = await fetchUserPrimaryProject();
    if (!p) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", p.id)
      .order("sort_order");
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const acknowledge = async (id: string) => {
    if (!user) return;
    setAcking(id);
    const { error } = await supabase
      .from("milestones")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: user.id })
      .eq("id", id);
    setAcking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Milestone acknowledged");
    load();
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Milestones</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Project timeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acknowledge each completed milestone to confirm you're informed.
        </p>
      </header>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <ol className="relative space-y-4 border-l-2 border-border pl-6">
          {items.map((m) => {
            const isDone = m.status === "completed";
            const isAcked = !!m.acknowledged_at;
            return (
              <li key={m.id} className="relative">
                <span
                  className={`absolute -left-[31px] top-3 grid h-6 w-6 place-items-center rounded-full border-2 ${
                    isDone
                      ? "border-gold bg-gold text-navy-deep"
                      : m.status === "in_progress"
                        ? "border-gold bg-background text-gold"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}
                </span>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg text-navy-deep">{m.title}</h3>
                      {m.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-wider">
                        {m.target_date && (
                          <span className="text-muted-foreground">
                            Target: {new Date(m.target_date).toLocaleDateString()}
                          </span>
                        )}
                        {m.completed_at && (
                          <span className="text-gold">
                            Completed: {new Date(m.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {isDone && (
                      <div className="shrink-0">
                        {isAcked ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-navy-deep">
                            <CheckCircle2 size={14} className="text-gold" /> Acknowledged
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => acknowledge(m.id)}
                            disabled={acking === m.id}
                            className="bg-navy-deep text-ivory hover:bg-navy"
                          >
                            {acking === m.id ? <Loader2 className="animate-spin" /> : "Acknowledge"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
