import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const { supabase } = context.locals;
	const formData = await context.request.formData();
	const password = formData.get('password')?.toString() ?? '';

	const { error } = await supabase.auth.updateUser({ password });

	if (error) {
		return context.redirect('/reset-password?error=update_failed');
	}

	return context.redirect('/login?message=password_updated');
};
