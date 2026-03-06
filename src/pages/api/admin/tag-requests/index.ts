import type { APIContext } from 'astro';
import { forbidden, unauthorized } from '../../../../lib/errors';
import { listAllTagRequests } from '../../../../lib/tag-requests';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const statusParam = context.url.searchParams.get('status');
	const statusFilter =
		statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected'
			? statusParam
			: undefined;

	const requests = await listAllTagRequests(db, statusFilter);

	return new Response(JSON.stringify({ requests }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
