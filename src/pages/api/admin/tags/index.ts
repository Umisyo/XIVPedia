import type { APIContext } from 'astro';
import { listCategorySlugs } from '../../../../lib/categories';
import { errorResponse, forbidden, unauthorized, validationError } from '../../../../lib/errors';
import { createTag, generateTagSlug, listTags } from '../../../../lib/tags';
import { validateCreateTag } from '../../../../lib/validation';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const tagList = await listTags(db);

	return new Response(JSON.stringify({ tags: tagList }), {
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

	const result = validateCreateTag(body);
	if (!result.success) {
		return validationError(result.errors);
	}

	// カテゴリの存在チェック
	const validSlugs = await listCategorySlugs(db);
	if (!validSlugs.includes(result.data.category)) {
		return validationError({ category: ['指定されたカテゴリは存在しません'] });
	}

	const slug = result.data.slug ?? generateTagSlug(result.data.name);
	if (!slug) {
		return validationError({ slug: ['スラグを生成できません。手動で指定してください'] });
	}

	try {
		const tag = await createTag(db, {
			name: result.data.name,
			slug,
			category: result.data.category,
		});

		return new Response(JSON.stringify({ tag }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		if (err instanceof Error && err.message.includes('unique')) {
			return validationError({ name: ['同じ名前またはスラグのタグが既に存在します'] });
		}
		console.error('Failed to create tag:', err);
		return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
	}
}
