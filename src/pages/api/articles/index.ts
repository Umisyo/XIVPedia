import type { APIContext } from 'astro';
import { createArticle, listArticles } from '../../../lib/articles';
import { unauthorized, validationError } from '../../../lib/errors';
import { validateCreateArticle } from '../../../lib/validation';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const params = context.url.searchParams;

	const page = Number(params.get('page') ?? '1');
	const limit = Number(params.get('limit') ?? '20');
	const tag = params.get('tag') ?? undefined;
	const validStatuses = ['draft', 'published', 'archived'] as const;
	const rawStatus = params.get('status');
	let status: (typeof validStatuses)[number] | undefined;

	if (rawStatus && validStatuses.includes(rawStatus as (typeof validStatuses)[number])) {
		status = rawStatus as (typeof validStatuses)[number];
	}

	if (status && !currentUser) {
		status = 'published';
	}

	const result = await listArticles(db, { page, limit, tag, status });

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	const body = await context.request.json();
	const validation = validateCreateArticle(body);

	if (!validation.success) {
		return validationError(validation.errors);
	}

	const article = await createArticle(db, validation.data, currentUser.id);

	return new Response(JSON.stringify({ data: article }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
}
