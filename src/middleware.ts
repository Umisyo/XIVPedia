import { defineMiddleware } from 'astro:middleware';
import { eq } from 'drizzle-orm';
import { createDb } from './db';
import { profiles } from './db/schema';
import { rateLimitError } from './lib/errors';
import { buildRateLimitKey, checkRateLimit, getRateLimitConfig } from './lib/rate-limit';
import { createSupabaseClient } from './lib/supabase';

const ONBOARDING_SKIP_PATHS = ['/onboarding', '/api/', '/login', '/register'];

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

		if (!profile) {
			const path = context.url.pathname;
			const shouldSkip = ONBOARDING_SKIP_PATHS.some((p) => path.startsWith(p));
			if (!shouldSkip) {
				return context.redirect('/onboarding');
			}
		}
	} else {
		context.locals.currentUser = null;
	}

	// Rate limiting
	const method = context.request.method;
	const path = context.url.pathname;

	const config = getRateLimitConfig(method, path);
	if (config) {
		const ip =
			context.request.headers.get('cf-connecting-ip') ??
			context.request.headers.get('x-forwarded-for') ??
			'unknown';
		const userId = user?.id ?? '';
		const identifier = userId ? `${ip}:${userId}` : ip;
		const cacheKey = buildRateLimitKey(method, path, identifier);

		const result = await checkRateLimit(cacheKey, config.limit);
		const now = Math.floor(Date.now() / 1000);
		const retryAfter = Math.max(0, result.resetAt - now);

		if (!result.allowed) {
			return rateLimitError(retryAfter);
		}

		const response = await next();
		response.headers.set('X-RateLimit-Remaining', String(result.remaining));
		response.headers.set('X-RateLimit-Reset', String(result.resetAt));
		return response;
	}

	return next();
});
