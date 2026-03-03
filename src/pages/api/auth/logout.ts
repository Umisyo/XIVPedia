import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const { supabase } = context.locals;
	await supabase.auth.signOut();
	return context.redirect('/');
};
