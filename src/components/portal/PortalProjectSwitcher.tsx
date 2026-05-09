import { FolderKanban } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortalProject } from "@/lib/portal-project-context";

export function PortalProjectSwitcher() {
  const { projects, selectedProjectId, setSelectedProjectId, loading } = usePortalProject();

  if (loading || projects.length === 0) return null;
  // Only show switcher when client is on multiple projects.
  if (projects.length === 1) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-navy-deep">
        <FolderKanban size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Active project
        </p>
        <Select value={selectedProjectId ?? ""} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="mt-0.5 h-8 border-0 bg-transparent p-0 text-sm font-medium text-navy-deep shadow-none focus:ring-0">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.code}
                </span>
                <span className="ml-2">{p.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
