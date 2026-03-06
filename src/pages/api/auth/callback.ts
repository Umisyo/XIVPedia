import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
	const { supabase } = context.locals;
	const code = context.url.searchParams.get('code');
	const rawNext = context.url.searchParams.get('next') ?? '/';
	const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return context.redirect(next);
		}
	}

	return context.redirect('/login?error=auth');
};
