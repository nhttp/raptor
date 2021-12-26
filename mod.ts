// deno-lint-ignore no-explicit-any
type TObject = Record<string, any>;
export type TError = Error & { status?: number };
export type NextFunc = (err?: TError) => Response | Promise<Response>;
export type HttpRequest = Request & {
	params: TObject;
	conn: TObject;
	// deno-lint-ignore no-explicit-any
	[k: string]: any;
};
export type Handler<Req extends HttpRequest = HttpRequest> = (
	req: Req,
	next: NextFunc,
) => Response | Promise<Response>;
export type Handlers<Req extends HttpRequest = HttpRequest> =
	| Array<Handler<Req> | Handler<Req>[]>
	| Handler<Req>[];
type TVerb =
	| 'WARE'
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'PATCH'
	| 'HEAD'
	| 'OPTIONS'
	| 'ANY'
	| 'ERROR'
	| '404'
	| 'ROUTER';
const _err = (err: TError) =>
	new Response(
		'ERROR: ' + err.message,
		{ status: err.status || 500 },
	);
const JSON_TYPE_CHARSET = 'application/json; charset=utf-8';
const findPath = (str: string) => {
	const idx = [];
	let i = -1;
	while ((i = str.indexOf('/', i + 1)) != -1) {
		idx.push(i);
		if (idx.length === 3) break;
	}
	let path = str.substring(idx[2]);
	if (path.indexOf('?') !== -1) path = path.substring(0, path.indexOf('?'));
	return path;
};
/**
 * initial raptor
 * @example
 * raptor().make(verb, ...fns)
 */
export function raptor<Req extends HttpRequest = HttpRequest>({
	onError = _err,
	on404 = _err.bind(null, { status: 404, message: '404 not found' } as TError),
	sub = false,
}: {
	onError?: (
		err: TError,
		req: Req,
		next: NextFunc,
	) => Response | Promise<Response>;
	on404?: (req: Req, next: NextFunc) => Response | Promise<Response>;
	sub?: boolean;
} = {}) {
	const route = {} as TObject;
	let wares = [] as Handler<Req>[];
	return {
		subs: [] as TObject[],
		/**
		 * resolve server
		 */
		resolve(request: Request, conn?: TObject) {
			const req = request as Req;
			req.params = {};
			req.conn = conn || {};
			const path = findPath(req.url);
			let fns: Handler<Req>[] = [], routes = route[req.method] || [], i = 0;
			if (route['ANY']) routes = route['ANY'].concat(routes);
			for (const [handlers, pattern, isParams] of routes) {
				if (pattern.test(path)) {
					if (isParams) {
						req.params = pattern.exec(path).groups || {};
					}
					fns = handlers;
					break;
				}
			}
			fns = wares.concat(fns, [on404]);
			const next: NextFunc = (err) => {
				let res: Response | Promise<Response>;
				try {
					res = err ? onError(err, req, next) : fns[i++](req, next);
				} catch (e) {
					return err ? onError(e, req, next) : next(e);
				}
				return res &&
					((res as Promise<Response>).then ? (res as Promise<Response>).then(void 0).catch(next) : res);
			};
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
		make(verb: TVerb | Omit<string, TVerb>, ...fns: Handlers<Req> | TObject[]) {
			fns = fns.flat();
			if (verb === 'WARE') {
				wares = wares.concat(fns as Handler<Req>[]);
				return this;
			}
			if (verb === 'ERROR') {
				onError = fns[0] as (
					err: TError,
					req: Req,
				) => Response | Promise<Response>;
				return this;
			}
			if (verb === '404') {
				on404 = fns[0] as Handler<Req>;
				return this;
			}
			const idx = verb.indexOf('/');
			const method = idx !== -1 ? verb.substring(0, verb.indexOf('/')) : verb as TVerb;
			let path = idx !== -1 ? verb.substring(verb.indexOf('/')) : '/';
			if (method === 'ROUTER') {
				if (path === '/') path = '';
				const _fns = [] as Handler<Req>[];
				for (let i = 0; i < fns.length; i++) {
					if (typeof fns[i] === 'function') _fns.push(fns[i] as Handler<Req>);
					if (typeof fns[i] === 'object') {
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
							path.replace(/\/$/, '').replace(
								/:(\w+)(\?)?(\.)?/g,
								'$2(?<$1>[^/]+)$2$3',
							).replace(/(\/?)\*/g, '($1.*)?').replace(/\.(?=[\w(])/, '\\.')
						}/*$`,
					),
					path.indexOf('/:') !== -1,
				]);
			} else this.subs.push({ method, path, fns });
			return this;
		},
		getRoute: () => route,
	};
}

raptor.createRouter = () => raptor({ sub: true });

export class JsonResponse extends Response {
	constructor(body: TObject, resInit: ResponseInit = {}) {
		if (resInit.headers) {
			if (resInit.headers instanceof Headers) {
				resInit.headers.set('content-type', JSON_TYPE_CHARSET);
			} else (resInit.headers as TObject)['content-type'] = JSON_TYPE_CHARSET;
		} else resInit.headers = { 'content-type': JSON_TYPE_CHARSET };
		super(JSON.stringify(body), resInit);
	}
}

export class HttpError extends Error {
	status: number;
	// deno-lint-ignore no-explicit-any
	constructor(status?: number, message?: any, name?: string) {
		super(message);
		this.message = message || 'Http Error';
		this.status = status || 500;
		this.name = name || 'HttpError';
	}
}
