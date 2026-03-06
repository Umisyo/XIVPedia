import type { APIContext } from 'astro';
import { createCategory, listCategories } from '../../../../lib/categories';
import { errorResponse, forbidden, unauthorized, validationError } from '../../../../lib/errors';
import { validateCreateCategory } from '../../../../lib/validation';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const categories = await listCategories(db);

	return new Response(JSON.stringify({ categories }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

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

	const result = validateCreateCategory(body);
	if (!result.success) {
		return validationError(result.errors);
	}

	try {
		const category = await createCategory(db, {
			name: result.data.name,
			slug: result.data.slug,
			displayOrder: result.data.displayOrder,
		});

		return new Response(JSON.stringify({ category }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		if (err instanceof Error && err.message.includes('unique')) {
			return validationError({ slug: ['同じ名前またはスラグのカテゴリが既に存在します'] });
		}
		console.error('Failed to create category:', err);
		return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
	}
}
