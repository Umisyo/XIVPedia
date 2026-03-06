import type { APIContext } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { notifications } from '../../../db/schema';
import { unauthorized } from '../../../lib/errors';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	const rows = await db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, currentUser.id))
		.orderBy(desc(notifications.createdAt))
		.limit(50);

	return new Response(JSON.stringify({ notifications: rows }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
