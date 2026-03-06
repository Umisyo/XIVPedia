import type { APIContext } from 'astro';
import { listCategorySlugs } from '../../../../lib/categories';
import {
	errorResponse,
	forbidden,
	notFound,
	unauthorized,
	validationError,
} from '../../../../lib/errors';
import { deleteTag, generateTagSlug, getTagById, updateTag } from '../../../../lib/tags';
import { validateUpdateTag } from '../../../../lib/validation';

export async function PATCH(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const tagId = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const existing = await getTagById(db, tagId);
	if (!existing) {
		return notFound('Tag not found');
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const result = validateUpdateTag(body);
	if (!result.success) {
		return validationError(result.errors);
	}

	// カテゴリの存在チェック
	if (result.data.category !== undefined) {
		const validSlugs = await listCategorySlugs(db);
		if (!validSlugs.includes(result.data.category)) {
			return validationError({ category: ['指定されたカテゴリは存在しません'] });
		}
	}

	const updates: Parameters<typeof updateTag>[2] = {};
	if (result.data.name !== undefined) {
		updates.name = result.data.name;
	}
	if (result.data.slug !== undefined) {
		updates.slug = result.data.slug;
	} else if (result.data.name !== undefined) {
		updates.slug = generateTagSlug(result.data.name);
		if (!updates.slug) {
			return validationError({ slug: ['スラグを生成できません。手動で指定してください'] });
		}
	}
	if (result.data.category !== undefined) {
		updates.category = result.data.category;
	}

	try {
		const tag = await updateTag(db, tagId, updates);
		if (!tag) {
			return notFound('Tag not found');
		}

		return new Response(JSON.stringify({ tag }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		if (err instanceof Error && err.message.includes('unique')) {
			return validationError({ name: ['同じ名前またはスラグのタグが既に存在します'] });
		}
		console.error('Failed to update tag:', err);
		return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
	}
}

export async function DELETE(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const tagId = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const deleted = await deleteTag(db, tagId);
	if (!deleted) {
		return notFound('Tag not found');
	}

	return new Response(null, { status: 204 });
}
