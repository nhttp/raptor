import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { raptor } from "../mod.ts";

serve(
  raptor()
    .make("WARE", (ctx, next) => {
      ctx.foo = "foo";
      return next();
    })
    .make("GET/hello", (ctx, next) => {
      ctx.bar = "bar";
      return next();
    }, (ctx) => {
      return new Response(`Hello ${ctx.foo}${ctx.bar}`);
    })
    .resolve,
);
