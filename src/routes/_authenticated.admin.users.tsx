import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      setRows(
        (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }))
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Users</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">All users</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-2">
          {rows.map((u) => (
            <Card key={u.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy-deep">{u.full_name || "(no name)"}</p>
                <p className="text-xs text-muted-foreground">{u.mobile}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {u.roles.length === 0 ? (
                  <Badge variant="outline">no role</Badge>
                ) : (
                  u.roles.map((r: string) => (
                    <Badge key={r} variant="secondary" className="capitalize">
                      {r}
                    </Badge>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
