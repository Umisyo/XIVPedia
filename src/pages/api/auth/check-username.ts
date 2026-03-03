import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { profiles } from '../../../db/schema';

export const GET: APIRoute = async (context) => {
	const { db } = context.locals;
	const username = context.url.searchParams.get('username') ?? '';

	if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
		return new Response(JSON.stringify({ available: false, reason: 'invalid' }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const [existing] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.username, username))
		.limit(1);

	return new Response(JSON.stringify({ available: !existing }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
