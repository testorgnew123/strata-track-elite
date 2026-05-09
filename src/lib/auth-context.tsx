import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getAccessToken, refreshAccessToken, setAccessToken } from "./api-client";
import { rpc } from "./rpc";

export type AppRole = "client" | "engineer" | "admin";

interface Profile {
  id: string;
  fullName: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  language: "en" | "hi";
}

interface CurrentUser {
  id: string;
  email: string;
}

interface AuthCtx {
  loading: boolean;
  user: CurrentUser | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  hasRole: (r: AppRole) => boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ roles: AppRole[]; primaryRole: AppRole | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const loadScope = useCallback(async () => {
    try {
      const data = await rpc("me.get");
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(
        data.profile
          ? {
              id: data.profile.id,
              fullName: data.profile.fullName,
              mobile: data.profile.mobile,
              avatarUrl: data.profile.avatarUrl,
              language: data.profile.language,
            }
          : null,
      );
      setRoles(data.roles as AppRole[]);
    } catch {
      setUser(null);
      setProfile(null);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!getAccessToken()) {
          await refreshAccessToken();
        }
        if (getAccessToken()) {
          await loadScope();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [loadScope]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Sign-in failed");
      }
      const data = await res.json();
      setAccessToken(data.accessToken);
      await loadScope();
      const newRoles = (data.user?.roles ?? []) as AppRole[];
      const newPrimary: AppRole | null = newRoles.includes("admin")
        ? "admin"
        : newRoles.includes("engineer")
          ? "engineer"
          : newRoles.includes("client")
            ? "client"
            : null;
      return { roles: newRoles, primaryRole: newPrimary };
    },
    [loadScope],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAccessToken(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
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
    user,
    profile,
    roles,
    primaryRole,
    hasRole: (r) => roles.includes(r),
    signIn,
    signOut,
    refresh: loadScope,
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
