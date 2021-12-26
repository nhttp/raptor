import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { JsonResponse, raptor } from "../mod.ts";

serve(
  raptor()
    .make("GET", () => new JsonResponse({ name: "john" }))
    .resolve,
);
