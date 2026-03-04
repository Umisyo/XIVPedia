import type { APIContext } from 'astro';
import { errorResponse, forbidden, unauthorized, validationError } from '../../../lib/errors';
import { createReport, listReports } from '../../../lib/reports';
import { validateCreateReport } from '../../../lib/validation';

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

	const validation = validateCreateReport(body);

	if (!validation.success) {
		return validationError(validation.errors);
	}

	const result = await createReport(db, validation.data, currentUser.id);

	if (result.duplicate) {
		return errorResponse(409, 'VALIDATION_ERROR', 'You have already reported this content');
	}

	return new Response(JSON.stringify({ data: result.data }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const params = context.url.searchParams;
	const page = Number(params.get('page') ?? '1');
	const limit = Number(params.get('limit') ?? '20');

	const validStatuses = ['pending', 'resolved', 'dismissed'] as const;
	const rawStatus = params.get('status');
	let status: (typeof validStatuses)[number] | undefined;

	if (rawStatus && validStatuses.includes(rawStatus as (typeof validStatuses)[number])) {
		status = rawStatus as (typeof validStatuses)[number];
	}

	const result = await listReports(db, { status, page, limit });

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
