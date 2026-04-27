import type { Context } from "@netlify/functions";
import { ZodError } from "zod";
import { buildContext } from "../../src/server/rpc/context";
import { getHandler, type RouterKeys } from "../../src/server/rpc/router";
import { AuthError } from "../../src/server/authz";

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { procedure?: string; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const procedure = body.procedure as RouterKeys | undefined;
  if (!procedure) {
    return Response.json({ error: "procedure required" }, { status: 400 });
  }
  const handler = getHandler(procedure);
  if (!handler) {
    return Response.json({ error: `Unknown procedure: ${procedure}` }, { status: 404 });
  }

  let ctx;
  try {
    ctx = await buildContext(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  let parsed;
  try {
    parsed = handler.input.parse(body.input ?? {});
  } catch (err) {
    if (err instanceof ZodError) {
      return Response.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
    }
    throw err;
  }

  try {
    const result = await handler.handler(parsed as never, ctx);
    return Response.json({ data: result });
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[rpc]", procedure, err);
    return Response.json({ error: message }, { status: 500 });
  }
};

export const config = { path: "/api/rpc" };
