import { serve } from 'https://deno.land/std@0.118.0/http/server.ts';
import { JsonResponse, raptor, TError } from '../mod.ts';

serve(
	raptor()
		.make('GET', (req, next) => {
			try {
				// example req.noop is not a function
				req.noop();
				return new JsonResponse({ name: 'noop' });
			} catch (err) {
				return next(err);
			}
		})
		// On error
		.make('ERROR', (err: TError) => {
			const status = err.status || 500;
			return new JsonResponse({ status, message: err.message }, { status });
		})
		// On 404
		.make('404', () => {
			const status = 404;
			return new JsonResponse({ status, message: '404' }, { status });
		})
		.resolve,
);
