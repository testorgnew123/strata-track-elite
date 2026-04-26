import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/portal/readiness")({
  component: ReadinessPage,
});

function ReadinessPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      if (!p) return setLoading(false);
      const { data } = await supabase
        .from("readiness_items")
        .select("*")
        .eq("project_id", p.id)
        .order("sort_order");
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const done = items.filter((i) => i.status === "done").length;
  const total = items.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Readiness</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Handover checklist</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl font-light text-navy-deep">{pct}%</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {done} of {items.length} ready
              </p>
            </div>
            <Progress value={pct} className="mt-3 h-1.5" />
          </Card>

          <div className="space-y-2">
            {items.map((i) => (
              <Card key={i.id} className="flex items-center gap-4 p-4">
                {i.status === "done" ? (
                  <CheckCircle2 size={20} className="text-gold" />
                ) : (
                  <Circle size={20} className="text-muted-foreground" />
                )}
                <p
                  className={`flex-1 text-sm ${i.status === "done" ? "text-navy-deep line-through opacity-60" : "text-navy-deep"}`}
                >
                  {i.title}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
