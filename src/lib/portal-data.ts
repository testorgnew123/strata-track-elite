import { supabase } from "@/integrations/supabase/client";

export async function fetchUserPrimaryProject() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  // Get the first project this user is a member of, or any project if admin
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (isAdmin) {
    const { data: p } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return p;
  }
  const { data: members } = await supabase
    .from("project_members")
    .select("project_id, projects(*)")
    .eq("user_id", u.user.id)
    .limit(1);
  return (members?.[0]?.projects as any) ?? null;
}

export const projectStatusLabel: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  on_hold: "On hold",
  handover: "Handover",
  completed: "Completed",
};
