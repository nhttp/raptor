import { serve } from 'https://deno.land/std@0.118.0/http/server.ts';
import { raptor } from '../mod.ts';

serve(
	raptor()
		.make('GET', () => new Response('Hello World'))
		.resolve,
);
