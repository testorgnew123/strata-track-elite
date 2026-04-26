import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, UserPlus, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; temp_password: string } | null>(null);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    mobile: "",
    role: "client" as "client" | "engineer" | "admin",
  });

  const load = async () => {
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
    setRows((profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] })));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const invite = async () => {
    setBusy(true);
    setCreated(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: form,
      });
      if (error) throw error;
      const result = data as { email: string; temp_password: string };
      setCreated(result);
      toast.success("User invited");
      setForm({ email: "", full_name: "", mobile: "", role: "client" });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast.success("Copied");
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Users</p>
          <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">All users</h1>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setCreated(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-navy-deep text-ivory hover:bg-navy">
              <UserPlus size={14} /> Invite user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a user</DialogTitle>
            </DialogHeader>
            {created ? (
              <div className="space-y-4">
                <div className="rounded-md border border-gold/30 bg-gold/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Account created
                  </p>
                  <p className="mt-2 text-sm text-navy-deep">
                    Share these credentials with the new user — they should sign in and change the password.
                  </p>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded bg-background p-2">
                      <span className="font-mono">{created.email}</span>
                      <button onClick={() => copy(created.email)} className="text-muted-foreground hover:text-navy-deep">
                        <Copy size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded bg-background p-2">
                      <span className="font-mono">{created.temp_password}</span>
                      <button onClick={() => copy(created.temp_password)} className="text-muted-foreground hover:text-navy-deep">
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setCreated(null)} variant="outline" className="w-full">
                  Invite another
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile (optional)</Label>
                  <Input
                    id="mobile"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={invite}
                  disabled={!form.email || !form.full_name || busy}
                  className="w-full bg-navy-deep text-ivory hover:bg-navy"
                >
                  {busy ? <Loader2 className="animate-spin" /> : "Create account"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
