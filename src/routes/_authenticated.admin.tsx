import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileSearch,
  Bell,
  CalendarClock,
  FileText,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { RoleGate } from "./_authenticated";

const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/documents", label: "Documents", icon: FileText },
  { to: "/admin/visits", label: "Site Visits", icon: CalendarClock },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/audit", label: "Audit", icon: FileSearch },
];

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <RoleGate allow={["admin"]}>
      <PortalShell navItems={items} layout="sidebar">
        <Outlet />
      </PortalShell>
    </RoleGate>
  ),
});
