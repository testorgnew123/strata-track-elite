import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal/progress")({
  component: ProgressGallery,
});

const CATS = ["all", "structure", "plumbing", "electrical", "finishing", "exterior", "other"] as const;

function ProgressGallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof CATS)[number]>("all");

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      if (!p) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("progress_updates")
        .select("*")
        .eq("project_id", p.id)
        .order("taken_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Progress</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Daily updates</h1>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <Button
            key={c}
            variant={filter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(c)}
            className={`h-8 capitalize ${filter === c ? "bg-navy-deep text-ivory hover:bg-navy" : ""}`}
          >
            {c}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No progress photos in this category yet.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <Card key={u.id} className="overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {u.photo_url && (
                  <img
                    src={u.photo_url}
                    alt={u.caption ?? "Progress"}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-4">
                <Badge variant="secondary" className="capitalize">
                  {u.category}
                </Badge>
                <p className="mt-2 text-sm text-navy-deep">{u.caption}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(u.taken_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
