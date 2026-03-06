import type { APIContext } from 'astro';
import { and, count, eq } from 'drizzle-orm';
import { notifications } from '../../../db/schema';
import { unauthorized } from '../../../lib/errors';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	const [result] = await db
		.select({ count: count() })
		.from(notifications)
		.where(and(eq(notifications.userId, currentUser.id), eq(notifications.isRead, false)));

	return new Response(JSON.stringify({ count: result?.count ?? 0 }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
