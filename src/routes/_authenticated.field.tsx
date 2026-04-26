import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Camera, ListChecks, MessageSquare } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { RoleGate } from "./_authenticated";

const items: NavItem[] = [
  { to: "/field", label: "Today", icon: LayoutDashboard },
  { to: "/field/upload", label: "Upload", icon: Camera },
  { to: "/field/milestones", label: "Milestones", icon: ListChecks },
  { to: "/field/queries", label: "Queries", icon: MessageSquare },
];

export const Route = createFileRoute("/_authenticated/field")({
  component: () => (
    <RoleGate allow={["engineer", "admin"]}>
      <PortalShell navItems={items} layout="bottom-bar">
        <Outlet />
      </PortalShell>
    </RoleGate>
  ),
});
