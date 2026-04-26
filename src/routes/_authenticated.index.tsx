import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, homeForRole } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/")({
  component: () => {
    const { primaryRole } = useAuth();
    return <Navigate to={homeForRole(primaryRole)} />;
  },
});
