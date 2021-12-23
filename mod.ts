// deno-lint-ignore no-explicit-any
type TObject = Record<string, any>;
export type TError = Error & { status?: number };
export type TNext = (err?: TError) => Response | Promise<Response>;
export type TContext = {
  request: Request;
  params: TObject;
  query: TObject;
  conn: TObject;
  respondWith: (r: Response) => Response;
  parsedUrl: URL;
  // deno-lint-ignore no-explicit-any
  [k: string]: any;
};
export type Handler<Ctx extends TContext = TContext> = (
  ctx: Ctx,
  next: TNext,
) => Response | Promise<Response>;
export type Handlers<Ctx extends TContext = TContext> =
  | Array<Handler<Ctx> | Handler<Ctx>[]>
  | Handler<Ctx>[];
type TVerb =
  | "WARE"
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "ANY"
  | "ERROR"
  | "404"
  | "ROUTER";
const _err = (err: TError) =>
  new Response(
    err.message,
    { status: err.status || 500 },
  );
/**
 * initial raptor
 * @example
 * raptor().make(verb, ...fns)
 */
export function raptor<Ctx extends TContext = TContext>({
  onError = _err,
  on404 = _err.bind(null, { status: 404, message: "404 not found" } as TError),
  sub = false,
}: {
  onError?: (
    err: TError,
    ctx: Ctx,
    next: TNext,
  ) => Response | Promise<Response>;
  on404?: (ctx: Ctx, next: TNext) => Response | Promise<Response>;
  sub?: boolean;
} = {}) {
  const route = {} as TObject;
  let wares = [] as Handler<Ctx>[];
  return {
    subs: [] as TObject[],
    /**
     * resolve server
     */
    resolve(req: Request, conn?: TObject) {
      const ctx = {
        parsedUrl: new URL(req.url),
        params: {},
        conn: conn || {},
        respondWith: (r: Response) => r,
        request: req,
      } as Ctx;
      let fns: Handler<Ctx>[] = [], routes = route[req.method] || [], i = 0;
      if (route["ANY"]) routes = route["ANY"].concat(routes);
      for (const [handlers, pattern, isParams] of routes) {
        if (pattern.test(ctx.parsedUrl.pathname)) {
          if (isParams) {
            ctx.params = pattern.exec(ctx.parsedUrl.pathname).groups || {};
          }
          fns = handlers;
          break;
        }
      }
      fns = wares.concat(fns, [on404]);
      const next: TNext = (err) =>
        err ? onError(err, ctx, next) : fns[i++](ctx, next);
      return next();
    },
    /**
     * make everything.
     * @example
     * .make(verb: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "OPTIONS" | "HEAD" | "ANY" | "ROUTER" | "WARE" | "ERROR" | "404", ...fns)
     *
     * // method with path
     * .make("GET/hello/:name", ...fns)
     *
     * // middlware
     * .make("WARE", ...fns)
     *
     * // router
     * .make("ROUTER/api/v1", [userRouter, itemRouter])
     */
    make(verb: TVerb | Omit<string, TVerb>, ...fns: Handlers<Ctx> | TObject[]) {
      fns = fns.flat();
      if (verb === "WARE") {
        wares = wares.concat(fns as Handler<Ctx>[]);
        return this;
      }
      if (verb === "ERROR") {
        onError = fns[0] as (
          err: TError,
          ctx: Ctx,
        ) => Response | Promise<Response>;
        return this;
      }
      if (verb === "404") {
        on404 = fns[0] as Handler<Ctx>;
        return this;
      }
      const idx = verb.indexOf("/");
      const method = idx !== -1
        ? verb.substring(0, verb.indexOf("/"))
        : verb as TVerb;
      let path = idx !== -1 ? verb.substring(verb.indexOf("/")) : "/";
      if (method === "ROUTER") {
        if (path === "/") path = "";
        const _fns = [] as Handler<Ctx>[];
        for (let i = 0; i < fns.length; i++) {
          if (typeof fns[i] === "function") _fns.push(fns[i] as Handler<Ctx>);
          if (typeof fns[i] === "object") {
            for (let j = 0; j < (fns as TObject[])[i].subs.length; j++) {
              const o = (fns as TObject[])[i].subs[j];
              o.fns = _fns.concat(o.fns);
              // recursive make
              this.make((o.method + path + o.path) as TVerb, ...o.fns);
            }
          }
        }
        return this;
      }
      if (!sub) {
        (route[method] = route[method] || []).push([
          fns,
          new RegExp(
            `^${
              path.replace(/\/$/, "").replace(
                /:(\w+)(\?)?(\.)?/g,
                "$2(?<$1>[^/]+)$2$3",
              ).replace(/(\/?)\*/g, "($1.*)?").replace(/\.(?=[\w(])/, "\\.")
            }/*$`,
          ),
          path.indexOf("/:") !== -1,
        ]);
      } else this.subs.push({ method, path, fns });
      return this;
    },
    getRoute: () => route,
  };
}

raptor.createRouter = () => raptor({ sub: true });
