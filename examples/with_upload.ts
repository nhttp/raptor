import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { HttpError, raptor } from "../mod.ts";

serve(
  raptor()
    .make("POST/upload", async (req) => {
      const type = req.headers.get("content-type") || "";
      if (!type.startsWith("multipart/form-data")) {
        throw new HttpError(415, "Content-Type must be multipart/form-data");
      }
      const form = await req.formData();
      if (!form.get("image")) throw new HttpError(422, "Field image required");
      const file = form.get("image") as File;
      const buf = await file.arrayBuffer();
      await Deno.writeFile(
        `${Deno.cwd()}/public/${file.name}`,
        new Uint8Array(buf),
      );
      return new Response("Success upload");
    })
    .resolve,
);

// requires --allow-write --allow-read permissions.
// requires form/data content-types.
// requires field image and value file.
