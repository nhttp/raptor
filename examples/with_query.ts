import { serve } from 'https://deno.land/std@0.118.0/http/server.ts';
import { raptor } from '../mod.ts';

serve(
	raptor()
		.make('GET/hello', (req) => {
			const query = new URL(req.url).searchParams;
			return new Response(`Hello ${query.get('name')}`);
		})
		.resolve,
);

// http://localhost:8000/hello?name=john
