import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { raptor, TContext, TError } from "../mod.ts";

type Ctx = TContext & {
  json: (
    // deno-lint-ignore no-explicit-any
    data: Record<string, any>,
    status?: number,
  ) => Response | Promise<Response>;
};

serve(
  raptor<Ctx>()
    // make global middleware ctx.json
    .make("WARE", (ctx, next) => {
      ctx.json = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
          status,
        });
      };
      return next();
    })
    .make("GET", (ctx, next) => {
      try {
        // example ctx.noop is not a function
        ctx.noop();
        return ctx.json({ name: "noop" });
      } catch (err) {
        return next(err);
      }
    })
    // On error
    .make("ERROR", (err: TError, ctx: Ctx) => {
      const status = err.status || 500;
      return ctx.json({ status, message: err.message }, status);
    })
    // On 404
    .make("404", (ctx) => {
      const status = 404;
      return ctx.json({ status, message: "404" }, status);
    })
    .resolve,
);
