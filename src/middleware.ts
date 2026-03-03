import { defineMiddleware } from 'astro:middleware';
import { eq } from 'drizzle-orm';
import { createDb } from './db';
import { profiles } from './db/schema';
import { createSupabaseClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
	const env = context.locals.runtime.env;
	context.locals.db = createDb(env.DATABASE_URL);
	context.locals.supabase = createSupabaseClient(
		env.SUPABASE_URL,
		env.SUPABASE_PUBLISHABLE_KEY,
		context.request,
		context.cookies,
	);

	const {
		data: { user },
	} = await context.locals.supabase.auth.getUser();

	if (user) {
		const [profile] = await context.locals.db
			.select()
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);

		context.locals.currentUser = {
			id: user.id,
			email: user.email ?? '',
			profile: profile ?? null,
		};
	} else {
		context.locals.currentUser = null;
	}

	return next();
});
