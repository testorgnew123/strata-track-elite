import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AdminAudit,
});

function AdminAudit() {
  const [rows, setRows] = useState<Output<"admin.audit.list">>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await rpc("admin.audit.list", { limit: 200 });
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Audit</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Activity log</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No audit entries yet. Actions will appear here as users interact with the portal.
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-center justify-between p-3 text-xs">
              <div>
                <p className="font-medium text-navy-deep">{r.action}</p>
                <p className="text-muted-foreground">
                  {r.entityType} · {r.entityId?.slice(0, 8)}
                </p>
              </div>
              <p className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
