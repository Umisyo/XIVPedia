import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const { supabase } = context.locals;
	const formData = await context.request.formData();
	const email = formData.get('email')?.toString() ?? '';
	const password = formData.get('password')?.toString() ?? '';

	const { error } = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		return context.redirect('/login?error=invalid_credentials');
	}

	return context.redirect('/');
};
