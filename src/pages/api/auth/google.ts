import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const { supabase } = context.locals;
	const origin = new URL(context.request.url).origin;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${origin}/api/auth/callback`,
		},
	});

	if (error || !data.url) {
		return context.redirect('/login?error=oauth');
	}

	return context.redirect(data.url);
};
