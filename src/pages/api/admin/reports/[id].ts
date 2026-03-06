import type { APIContext } from 'astro';
import { forbidden, notFound, unauthorized, validationError } from '../../../../lib/errors';
import { updateReportStatus } from '../../../../lib/reports';

const VALID_STATUSES = ['resolved', 'dismissed'] as const;
type ReportStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const id = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const { status } = body as { status?: string };

	if (!status || !VALID_STATUSES.includes(status as ReportStatus)) {
		return validationError({ status: ['Status must be one of: resolved, dismissed'] });
	}

	const updated = await updateReportStatus(db, id, status as ReportStatus, currentUser.id);

	if (!updated) {
		return notFound('Report not found');
	}

	return new Response(JSON.stringify({ report: updated }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
