import { serve } from 'https://deno.land/std@0.118.0/http/server.ts';
import { raptor } from '../mod.ts';

serve(
	raptor()
		.make('GET/hello/:name', (req) => new Response(`Hello ${req.params.name}`))
		.resolve,
);
