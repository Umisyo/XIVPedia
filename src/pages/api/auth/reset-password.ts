import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const { supabase } = context.locals;
	const origin = new URL(context.request.url).origin;
	const formData = await context.request.formData();
	const email = formData.get('email')?.toString() ?? '';

	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
	});

	return context.redirect('/forgot-password?message=check_email');
};
