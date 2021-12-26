import { serve } from 'https://deno.land/std@0.118.0/http/server.ts';
import staticFiles from 'https://deno.land/x/static_files@1.1.4/mod.ts';
import { raptor } from '../mod.ts';

const serveFile = staticFiles('public', {
	prefix: '/assets',
});

serve(
	raptor()
		.make('WARE', (request, next) =>
			serveFile({
				request,
				respondWith: request.respondWith,
			}, next))
		.resolve,
);

// http://localhost:8000/assets/yourfile
