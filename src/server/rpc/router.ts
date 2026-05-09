import { z } from "zod";
import { handlers as rawHandlers } from "./handlers";
import type { RpcContext } from "./context";

export type RpcHandler<I, O> = {
  input: z.ZodType<I>;
  handler: (input: I, ctx: RpcContext) => Promise<O>;
};

export type Router = typeof rawHandlers;
export type RouterKeys = keyof Router;

export type Input<K extends RouterKeys> =
  Router[K] extends RpcHandler<infer I, infer _O> ? I : never;
export type Output<K extends RouterKeys> =
  Router[K] extends RpcHandler<infer _I, infer O> ? Awaited<O> : never;

export function getHandler<K extends RouterKeys>(name: K): Router[K] {
  return rawHandlers[name];
}

export function listProcedures(): string[] {
  return Object.keys(rawHandlers);
}
