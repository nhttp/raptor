import { assertEquals as expect } from 'https://deno.land/std@0.119.0/testing/asserts.ts';
import { raptor } from './mod.ts';

// deno-lint-ignore no-explicit-any
type TObject = { [k: string]: any };

const { test } = Deno;
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const router = raptor.createRouter();

test('Make is function', () => {
	expect(typeof router.make, 'function');
});

methods.forEach((method) => {
	router.make(method + '/deno', () => {});
});

test('Router subs is array', () => {
	expect(Array.isArray(router.subs), true);
});

// check route method + path
router.subs.forEach(({ method, path }: TObject) => {
	if (method === 'GET') {
		test('Route GET/deno', () => {
			expect(method + path, 'GET/deno');
		});
	} else if (method === 'POST') {
		test('Route POST/deno', () => {
			expect(method + path, 'POST/deno');
		});
	} else if (method === 'PUT') {
		test('Route PUT/deno', () => {
			expect(method + path, 'PUT/deno');
		});
	} else if (method === 'DELETE') {
		test('Route DELETE/deno', () => {
			expect(method + path, 'DELETE/deno');
		});
	} else if (method === 'PATCH') {
		test('Route PATCH/deno', () => {
			expect(method + path, 'PATCH/deno');
		});
	}
});

// test params
const app = raptor()
	.make('POST/:filename.(png|jpg|gif)', () => {})
	.make('PUT/:id', () => {})
	.make('DELETE/:id?', () => {})
	.make('GET/*', () => {});

const route = app.getRoute();
const METHOD_URL_MATCH = [
	['GET', '/exact/all'],
	['POST', '/image.jpg'],
	['POST', '/image.pdf'],
	['PUT', '/123'],
	['DELETE', '/321'],
	['DELETE', '/'],
];

const find = (method: string, path: string) => {
	const routes = route[method] || [];
	let params = {};
	for (const [_, pattern, isParams] of routes) {
		if (pattern.test(path)) {
			if (isParams) params = pattern.exec(path).groups || {};
			break;
		}
	}
	return params;
};

METHOD_URL_MATCH.forEach(([method, url]) => {
	if (method === 'GET' && url === '/exact/all') {
		test('Route GET/exact/all', () => {
			const params: TObject = find(method, url);
			expect(params, {});
		});
	} else if (method === 'POST' && url === '/image.jpg') {
		test('Route POST/image.jpg', () => {
			const params: TObject = find(method, url);
			expect(params.filename, 'image');
		});
	} else if (method === 'POST' && url === '/image.pdf') {
		test('Route POST/image.pdf', () => {
			const params: TObject = find(method, url);
			expect(params.filename, undefined);
		});
	} else if (method === 'PUT' && url === '/123') {
		test('Route PUT/123', () => {
			const params: TObject = find(method, url);
			expect(params.id, '123');
		});
	} else if (method === 'DELETE' && url === '/321') {
		test('Route DELETE/321', () => {
			const params: TObject = find(method, url);
			expect(params.id, '321');
		});
	} else if (method === 'DELETE' && url === '/') {
		test('Route DELETE/', () => {
			const params: TObject = find(method, url);
			expect(params.id, undefined);
		});
	}
});
