import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { raptor, TContext } from "../mod.ts";

serve(
  raptor<
    TContext & {
      json: (
        // deno-lint-ignore no-explicit-any
        data: Record<string, any>,
        status?: number,
      ) => Response | Promise<Response>;
    }
  >()
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
    .make("GET", ({ json }) => json({ name: "john" }))
    .resolve,
);
