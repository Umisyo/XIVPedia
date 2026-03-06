import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { notifications } from '../../../db/schema';
import { unauthorized, validationError } from '../../../lib/errors';

export async function POST(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const data = body as { id?: string; all?: boolean };

	if (data.all) {
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(and(eq(notifications.userId, currentUser.id), eq(notifications.isRead, false)));

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (data.id) {
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(and(eq(notifications.id, data.id), eq(notifications.userId, currentUser.id)));

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return validationError({ _: ['id or all is required'] });
}
