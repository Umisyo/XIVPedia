import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { profiles } from '../../../db/schema';

export const POST: APIRoute = async (context) => {
	const { supabase, db } = context.locals;

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return context.redirect('/login');
	}

	const formData = await context.request.formData();
	const username = formData.get('username')?.toString()?.trim() ?? '';
	const displayName = formData.get('displayName')?.toString()?.trim() ?? '';

	if (!username || !displayName) {
		return context.redirect('/onboarding?error=missing_fields');
	}

	if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
		return context.redirect('/onboarding?error=invalid_username');
	}

	if (displayName.length < 1 || displayName.length > 50) {
		return context.redirect('/onboarding?error=invalid_display_name');
	}

	const [existing] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.username, username))
		.limit(1);

	if (existing) {
		return context.redirect('/onboarding?error=username_taken');
	}

	const rawAvatarUrl = formData.get('avatarUrl')?.toString()?.trim() || null;
	let customAvatarUrl: string | null = null;
	if (rawAvatarUrl) {
		try {
			const parsed = new URL(rawAvatarUrl);
			if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
				customAvatarUrl = rawAvatarUrl;
			}
		} catch {
			if (rawAvatarUrl.startsWith('/api/images/')) {
				customAvatarUrl = rawAvatarUrl;
			}
		}
	}
	const avatarUrl = customAvatarUrl || user.user_metadata?.avatar_url || null;

	await db.insert(profiles).values({
		id: user.id,
		username,
		displayName,
		avatarUrl,
	});

	return context.redirect('/');
};
