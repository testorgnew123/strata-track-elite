import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "client" | "engineer" | "admin";

interface Profile {
  id: string;
  full_name: string | null;
  mobile: string | null;
  avatar_url: string | null;
  language: "en" | "hi";
}

interface AuthCtx {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  hasRole: (r: AppRole) => boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const loadUserScope = async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(prof as Profile | null);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  useEffect(() => {
    // Listener FIRST (so we never miss SIGNED_IN)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Defer to avoid deadlock with supabase internals
        setTimeout(() => loadUserScope(sess.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadUserScope(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const primaryRole: AppRole | null = roles.includes("admin")
    ? "admin"
    : roles.includes("engineer")
      ? "engineer"
      : roles.includes("client")
        ? "client"
        : null;

  const value: AuthCtx = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    roles,
    primaryRole,
    hasRole: (r) => roles.includes(r),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      if (session?.user) await loadUserScope(session.user.id);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

export function homeForRole(role: AppRole | null): string {
  if (role === "admin") return "/admin";
  if (role === "engineer") return "/field";
  if (role === "client") return "/portal";
  return "/login";
}
