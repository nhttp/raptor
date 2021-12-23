import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { Handler, raptor } from "../mod.ts";

const simpleBodyParser: Handler = (ctx, next) => {
  ctx.getBody = async () => {
    const req = ctx.request;
    const type = req.headers.get("content-type") || "";
    if (type.startsWith("application/json")) {
      return await req.json();
    }
    if (type.startsWith("application/x-www-form-urlencoded")) {
      const text = await req.text();
      return Object.fromEntries(new URLSearchParams(text).entries());
    }
    if (type.startsWith("multipart/form-data")) {
      const form = await req.formData();
      return Object.fromEntries(form.entries());
    }
    return {};
  };
  return next();
};

serve(
  raptor()
    .make("WARE", simpleBodyParser)
    .make("POST/save", async (ctx) => {
      const body = await ctx.getBody();
      console.log(body);
      return new Response("Success");
    })
    .resolve,
);
