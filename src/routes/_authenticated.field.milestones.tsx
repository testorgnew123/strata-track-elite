import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/field/milestones")({
  component: FieldMs,
});

function FieldMs() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const p = await fetchUserPrimaryProject();
    if (!p) return setLoading(false);
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

  const complete = async (id: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("milestones")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Marked complete");
    load();
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Milestones</p>
        <h1 className="mt-2 font-display text-2xl font-light text-navy-deep">Mark progress</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-navy-deep">{m.title}</h3>
                  {m.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                  )}
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.status}
                    {m.target_date && ` · target ${new Date(m.target_date).toLocaleDateString()}`}
                  </p>
                </div>
                {m.status === "completed" ? (
                  <Check className="shrink-0 text-gold" />
                ) : (
                  <Button
                    size="sm"
                    onClick={() => complete(m.id)}
                    disabled={busy === m.id}
                    className="bg-navy-deep text-ivory hover:bg-navy"
                  >
                    {busy === m.id ? <Loader2 className="animate-spin" /> : "Complete"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
