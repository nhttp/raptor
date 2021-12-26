import { serve } from 'https://deno.land/std@0.118.0/http/server.ts';
import { raptor } from '../mod.ts';

serve(
	raptor()
		.make('WARE', (req, next) => {
			req.foo = 'foo';
			return next();
		})
		.make('GET/hello', (req, next) => {
			req.bar = 'bar';
			return next();
		}, (req) => {
			return new Response(`Hello ${req.foo}${req.bar}`);
		})
		.resolve,
);
