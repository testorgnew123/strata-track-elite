import { api } from "./api-client";
import type { Input, Output, RouterKeys } from "@/server/rpc/router";

export async function rpc<K extends RouterKeys>(
  procedure: K,
  input?: Input<K>,
): Promise<Output<K>> {
  const res = await api<{ data: Output<K> }>("/api/rpc", {
    method: "POST",
    body: JSON.stringify({ procedure, input: input ?? {} }),
  });
  return res.data;
}
