import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseClient(
	supabaseUrl: string,
	supabaseKey: string,
	request: Request,
	cookies: AstroCookies,
) {
	return createServerClient(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return parseCookieHeader(request.headers.get('Cookie') ?? '').filter(
					(c): c is { name: string; value: string } => c.value !== undefined,
				);
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					cookies.set(name, value, options);
				}
			},
		},
	});
}
