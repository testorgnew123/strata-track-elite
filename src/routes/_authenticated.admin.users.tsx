import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, UserPlus, Copy, Pencil, Trash2, KeyRound } from "lucide-react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";
import { useAuth } from "@/lib/auth-context";
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
  DialogFooter,
  DialogDescription,
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

type Role = "client" | "engineer" | "admin";
type UserRow = Output<"admin.listUsers">[number];

function generateTempPassword(): string {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  let out = "";
  for (const n of arr) out += charset[n % charset.length];
  return out + "@1A";
}

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [resets, setResets] = useState<Output<"admin.passwordResetHistory">>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; temp_password: string } | null>(null);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    mobile: "",
    role: "client" as Role,
  });

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ email: "", fullName: "", mobile: "", role: "client" as Role });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetResult, setResetResult] = useState<{
    email: string;
    emailSent: boolean;
    expiresAt: string;
  } | null>(null);

  const load = async () => {
    try {
      const [data, history] = await Promise.all([
        rpc("admin.listUsers"),
        rpc("admin.passwordResetHistory", {}),
      ]);
      setRows(data);
      setResets(history);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const invite = async () => {
    setBusy(true);
    setCreated(null);
    try {
      const tempPassword = generateTempPassword();
      const result = await rpc("admin.inviteUser", {
        email: form.email,
        fullName: form.full_name,
        mobile: form.mobile || undefined,
        role: form.role,
        tempPassword,
      });
      setCreated({ email: result.email, temp_password: tempPassword });
      toast.success("User invited");
      setForm({ email: "", full_name: "", mobile: "", role: "client" });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (u: UserRow) => {
    setEditing(u);
    setEditForm({
      email: u.email ?? "",
      fullName: u.fullName ?? "",
      mobile: u.mobile ?? "",
      role: ((u.roles[0] as Role) ?? "client"),
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await rpc("admin.updateUser", {
        userId: editing.id,
        email: editForm.email || undefined,
        fullName: editForm.fullName,
        mobile: editForm.mobile,
        role: editForm.role,
      });
      toast.success("User updated");
      setEditing(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await rpc("admin.deleteUser", { userId: deleting.id });
      toast.success("User deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeletingBusy(false);
    }
  };

  const confirmReset = async () => {
    if (!resetting) return;
    setResetBusy(true);
    try {
      const res = await rpc("admin.resetUserPassword", { userId: resetting.id });
      setResetResult({
        email: res.email,
        emailSent: res.emailSent,
        expiresAt: res.expiresAt,
      });
      if (res.emailSent) {
        toast.success("Reset link sent to user's email");
      } else {
        toast.error("Reset link generated but email delivery failed — see details");
      }
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setResetBusy(false);
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
                    Share these credentials with the new user — they should sign in and change the
                    password.
                  </p>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded bg-background p-2">
                      <span className="font-mono">{created.email}</span>
                      <button
                        onClick={() => copy(created.email)}
                        className="text-muted-foreground hover:text-navy-deep"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded bg-background p-2">
                      <span className="font-mono">{created.temp_password}</span>
                      <button
                        onClick={() => copy(created.temp_password)}
                        className="text-muted-foreground hover:text-navy-deep"
                      >
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
                    onValueChange={(v) => setForm({ ...form, role: v as Role })}
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
          {rows.map((u) => {
            const isSelf = currentUser?.id === u.id;
            return (
              <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4">
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="truncate font-medium text-navy-deep">{u.fullName || "(no name)"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email ?? u.mobile}
                    {isSelf && <span className="ml-2 text-gold">(you)</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 ? (
                    <Badge variant="outline">no role</Badge>
                  ) : (
                    u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="capitalize">
                        {r}
                      </Badge>
                    ))
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(u)}
                    title="Edit user"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setResetting(u);
                      setResetResult(null);
                    }}
                    title="Reset password"
                  >
                    <KeyRound size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(u)}
                    disabled={isSelf}
                    title={isSelf ? "You cannot delete yourself" : "Delete user"}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit user dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update the user&apos;s details and role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input
                value={editForm.mobile}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v as Role })}
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
              <p className="text-[11px] text-muted-foreground">
                Changing role updates this user&apos;s role on every project they belong to.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={savingEdit}
              className="bg-navy-deep text-ivory hover:bg-navy"
            >
              {savingEdit ? <Loader2 className="animate-spin" size={14} /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              This permanently removes <strong>{deleting?.fullName || deleting?.email}</strong> and
              all of their related data (project memberships, queries, ratings, etc.). This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deletingBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingBusy ? <Loader2 className="animate-spin" size={14} /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={!!resetting}
        onOpenChange={(v) => {
          if (!v) {
            setResetting(null);
            setResetResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Send a password reset link to{" "}
              <strong>{resetting?.fullName || resetting?.email}</strong>. The link expires in 30
              minutes. The user will choose a new password from the email link.
            </DialogDescription>
          </DialogHeader>
          {resetResult ? (
            <div className="space-y-3">
              <div
                className={`rounded-md border p-4 ${
                  resetResult.emailSent
                    ? "border-gold/30 bg-gold/5"
                    : "border-destructive/40 bg-destructive/5"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    resetResult.emailSent ? "text-gold" : "text-destructive"
                  }`}
                >
                  {resetResult.emailSent ? "Reset link sent" : "Email delivery failed"}
                </p>
                <p className="mt-2 text-sm text-navy-deep">
                  {resetResult.emailSent ? (
                    <>
                      Reset email dispatched to <strong>{resetResult.email}</strong>. The link
                      expires{" "}
                      <strong>
                        {new Date(resetResult.expiresAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      Reset token created for <strong>{resetResult.email}</strong>, but the email
                      could not be delivered. Check SMTP configuration and Email Log.
                    </>
                  )}
                </p>
              </div>
              <Button
                onClick={() => {
                  setResetting(null);
                  setResetResult(null);
                }}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetting(null)}
                disabled={resetBusy}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReset}
                disabled={resetBusy}
                className="bg-navy-deep text-ivory hover:bg-navy"
              >
                {resetBusy ? <Loader2 className="animate-spin" size={14} /> : "Reset password"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {!loading && resets.length > 0 && (
        <Card className="p-5">
          <h2 className="font-display text-lg text-navy-deep">Recent password resets</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Visible to admins only. Reset emails are also recorded in the email log.
          </p>
          <div className="mt-3 divide-y divide-border text-xs">
            {resets.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-navy-deep">{r.targetEmail ?? "(unknown user)"}</p>
                  <p className="text-muted-foreground">
                    by {r.actorName ?? r.actorEmail ?? "system"} ·{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
