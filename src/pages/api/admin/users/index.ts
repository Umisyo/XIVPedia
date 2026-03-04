import type { APIContext } from 'astro';
import { count as countFn } from 'drizzle-orm';
import { profiles } from '../../../../db/schema';
import { forbidden, unauthorized } from '../../../../lib/errors';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const params = context.url.searchParams;
	const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? '50')));
	const offset = Math.max(0, Number(params.get('offset') ?? '0'));

	const [users, totalResult] = await Promise.all([
		db
			.select({
				id: profiles.id,
				username: profiles.username,
				displayName: profiles.displayName,
				avatarUrl: profiles.avatarUrl,
				role: profiles.role,
				createdAt: profiles.createdAt,
			})
			.from(profiles)
			.limit(limit)
			.offset(offset)
			.orderBy(profiles.createdAt),
		db.select({ count: countFn() }).from(profiles),
	]);

	return new Response(JSON.stringify({ users, total: totalResult[0].count }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
