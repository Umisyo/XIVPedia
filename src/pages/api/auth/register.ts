import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const { supabase } = context.locals;
	const origin = new URL(context.request.url).origin;
	const formData = await context.request.formData();
	const email = formData.get('email')?.toString() ?? '';
	const password = formData.get('password')?.toString() ?? '';
	const username = formData.get('username')?.toString() ?? '';
	const displayName = formData.get('displayName')?.toString() ?? '';

	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				username,
				display_name: displayName,
			},
			emailRedirectTo: `${origin}/api/auth/callback`,
		},
	});

	if (error) {
		return context.redirect('/register?error=signup_failed');
	}

	return context.redirect('/login?message=check_email');
};
