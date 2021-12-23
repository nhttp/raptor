import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { raptor } from "../mod.ts";

const router = raptor.createRouter();
router.make("GET/user", () => new Response("Hello from router"));

serve(
  raptor()
    .make("ROUTER/api/v1", [router])
    .resolve,
);
