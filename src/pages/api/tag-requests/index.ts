import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { tags } from '../../../db/schema';
import { listCategorySlugs } from '../../../lib/categories';
import { errorResponse, unauthorized, validationError } from '../../../lib/errors';
import {
	checkDuplicateTagRequest,
	createTagRequest,
	listTagRequestsByUser,
} from '../../../lib/tag-requests';
import { validateCreateTagRequest } from '../../../lib/validation';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser?.profile) {
		return unauthorized();
	}

	const requests = await listTagRequestsByUser(db, currentUser.id);

	return new Response(JSON.stringify({ requests }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser?.profile) {
		return unauthorized();
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const result = validateCreateTagRequest(body);
	if (!result.success) {
		return validationError(result.errors);
	}

	// カテゴリの存在チェック
	const validSlugs = await listCategorySlugs(db);
	if (!validSlugs.includes(result.data.category)) {
		return validationError({ category: ['指定されたカテゴリは存在しません'] });
	}

	// 同名タグが既に存在するかチェック
	const [existingTag] = await db
		.select({ id: tags.id })
		.from(tags)
		.where(eq(tags.name, result.data.name))
		.limit(1);

	if (existingTag) {
		return validationError({ name: ['同じ名前のタグが既に存在します'] });
	}

	// 同名の保留中申請が既にあるかチェック
	const hasDuplicate = await checkDuplicateTagRequest(db, result.data.name);
	if (hasDuplicate) {
		return validationError({ name: ['同じ名前のタグ申請が既に保留中です'] });
	}

	try {
		const request = await createTagRequest(db, {
			name: result.data.name,
			description: result.data.description,
			category: result.data.category,
			requesterId: currentUser.id,
		});

		return new Response(JSON.stringify({ request }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		console.error('Failed to create tag request:', err);
		return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
	}
}
