import type { APIContext } from 'astro';
import { forbidden, unauthorized } from '../../../../lib/errors';
import { listReports } from '../../../../lib/reports';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const params = context.url.searchParams;
	const VALID_STATUSES = ['pending', 'resolved', 'dismissed'] as const;
	const rawStatus = params.get('status');
	const status =
		rawStatus && VALID_STATUSES.includes(rawStatus as (typeof VALID_STATUSES)[number])
			? (rawStatus as (typeof VALID_STATUSES)[number])
			: undefined;
	const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? '20') || 20));

	const result = await listReports(db, {
		status,
		page,
		limit,
	});

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
