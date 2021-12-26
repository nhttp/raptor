import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { json, urlencoded } from "https://deno.land/x/parsec@0.1.1/mod.ts";
import { raptor } from "../mod.ts";

serve(
  raptor()
    .make("WARE", async (req, next) => {
      await json(req);
      await urlencoded(req);
      return next();
    })
    .make("POST/save", (req) => {
      console.log(req.parsedBody);
      return new Response("Success");
    })
    .resolve,
);
