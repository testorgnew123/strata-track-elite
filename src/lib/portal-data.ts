import { rpc } from "./rpc";

export async function fetchUserPrimaryProject() {
  return rpc("me.primaryProject");
}

export const projectStatusLabel: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  on_hold: "On hold",
  handover: "Handover",
  completed: "Completed",
};
