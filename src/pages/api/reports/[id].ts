import type { APIContext } from 'astro';
import { forbidden, notFound, unauthorized, validationError } from '../../../lib/errors';
import { updateReportStatus } from '../../../lib/reports';
import { validateUpdateReport } from '../../../lib/validation';

export async function PUT(context: APIContext): Promise<Response> {
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

	const validation = validateUpdateReport(body);

	if (!validation.success) {
		return validationError(validation.errors);
	}

	const updated = await updateReportStatus(db, id, validation.data.status, currentUser.id);

	if (!updated) {
		return notFound('Report not found');
	}

	return new Response(JSON.stringify({ data: updated }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
