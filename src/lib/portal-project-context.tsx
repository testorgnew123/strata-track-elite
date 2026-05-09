import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { rpc } from "@/lib/rpc";
import type { Output } from "@/server/rpc/router";

export type PortalProject = Output<"projects.listMine">[number];

interface PortalProjectCtx {
  projects: PortalProject[];
  selectedProjectId: string | null;
  selectedProject: PortalProject | null;
  setSelectedProjectId: (id: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<PortalProjectCtx | null>(null);
const STORAGE_KEY = "portal:selectedProjectId";

export function PortalProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await rpc("projects.listMine");
    setProjects(list);
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const valid = stored && list.some((p) => p.id === stored);
    setSelectedProjectIdState(valid ? stored : (list[0]?.id ?? null));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  const setSelectedProjectId = useCallback((id: string) => {
    setSelectedProjectIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <Ctx.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        refresh,
        loading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePortalProject(): PortalProjectCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortalProject must be used inside PortalProjectProvider");
  return v;
}
