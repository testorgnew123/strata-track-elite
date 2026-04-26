import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Camera,
  ListChecks,
  FileText,
  MessageSquare,
  CalendarClock,
  ClipboardCheck,
  Settings,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { RoleGate } from "./_authenticated";

const items: NavItem[] = [
  { to: "/portal", label: "Overview", icon: LayoutDashboard },
  { to: "/portal/progress", label: "Progress", icon: Camera },
  { to: "/portal/milestones", label: "Milestones", icon: ListChecks },
  { to: "/portal/documents", label: "Documents", icon: FileText },
  { to: "/portal/queries", label: "Queries", icon: MessageSquare },
  { to: "/portal/visits", label: "Site Visits", icon: CalendarClock },
  { to: "/portal/readiness", label: "Readiness", icon: ClipboardCheck },
  { to: "/portal/settings", label: "Settings", icon: Settings },
];

export const Route = createFileRoute("/_authenticated/portal")({
  component: () => (
    <RoleGate allow={["client", "admin"]}>
      <PortalShell navItems={items} layout="sidebar">
        <Outlet />
      </PortalShell>
    </RoleGate>
  ),
});
