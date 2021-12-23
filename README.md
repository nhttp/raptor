## Raptor

[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![deno.land](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fraptor@0.0.1%2Fmod.ts)](https://deno.land/x/raptor)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](http://makeapullrequest.com)
![deps badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fdep-count%2Fhttps%2Fdeno.land%2Fx%2Fraptor%2Fmod.ts)
![cache badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fcache-size%2Fhttps%2Fdeno.land%2Fx%2Fraptor%2Fmod.ts)

Simple and small, router handler for [Deno](https://deno.land/) server and
[Deploy](https://deno.com/deploy).

> Raptor implemented to [nhttp](https://nhttp.deno.dev)

## Features

- Middleware support.
- Sub Router support.

## Usage

```ts
import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { raptor } from "https://deno.land/x/raptor@0.0.1/mod.ts";

serve(
  raptor()
    .make("GET", () => new Response("Hello World"))
    .make("GET/hello/:name", (ctx) => new Response(`Hello ${ctx.params.name}`))
    .resolve,
);

console.log("Raptor was here !!");
```

## Run

```bash
deno run --allow-net file.ts
```

and visit `http://localhost:8000` with path `/` and `/hello/yourname`

## Make

Make everything with `raptor().make(verb, ...fns)`.

the verb is =>
`GET | POST | DELETE | PUT | PATCH | OPTIONS | HEAD | ANY | ROUTER | WARE` and
path.

### Make Method Handlers

```ts
serve(
  raptor()
    .make("GET/hello/:name", (ctx) => new Response(`Hello ${ctx.params.name}`))
    .resolve,
);
```

### Make Global Middleware

```ts
serve(
  raptor()
    .make("WARE", (ctx, next) => {
      ctx.foo = "foo";
      return next();
    })
    .make("GET/hello", (ctx) => new Response(`Hello ${ctx.foo}`))
    .resolve,
);
```

### If Inline Middleware

```ts
serve(
  raptor()
    .make("GET/hello", (ctx, next) => {
      ctx.foo = "foo";
      return next();
    }, (ctx) => {
      return new Response(`Hello ${ctx.foo}`);
    })
    .resolve,
);
```

### Make Sub Router

```ts
const router = raptor.createRouter();
router.make("GET/user", () => new Response("Hello from router"));

serve(
  raptor()
    .make("ROUTER/api/v1", [router])
    .resolve,
);

// visit http://localhost:8000/api/v1/user
```

[See examples](https://github.com/nhttp/raptor/tree/master/examples)

## License

[MIT](LICENSE)
