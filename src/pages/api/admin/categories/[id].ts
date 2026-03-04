import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { tags } from '../../../../db/schema';
import { deleteCategory, getCategoryById, updateCategory } from '../../../../lib/categories';
import { forbidden, notFound, unauthorized, validationError } from '../../../../lib/errors';
import { validateUpdateCategory } from '../../../../lib/validation';

export async function PATCH(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const categoryId = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const existing = await getCategoryById(db, categoryId);
	if (!existing) {
		return notFound('Category not found');
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const result = validateUpdateCategory(body);
	if (!result.success) {
		return validationError(result.errors);
	}

	// slugが変わる場合、既存タグのcategoryも更新する
	const oldSlug = existing.slug;
	const newSlug = result.data.slug;

	try {
		const category = await updateCategory(db, categoryId, result.data);
		if (!category) {
			return notFound('Category not found');
		}

		if (newSlug && newSlug !== oldSlug) {
			await db.update(tags).set({ category: newSlug }).where(eq(tags.category, oldSlug));
		}

		return new Response(JSON.stringify({ category }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		if (err instanceof Error && err.message.includes('unique')) {
			return validationError({ slug: ['同じ名前またはスラグのカテゴリが既に存在します'] });
		}
		throw err;
	}
}

export async function DELETE(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const categoryId = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const existing = await getCategoryById(db, categoryId);
	if (!existing) {
		return notFound('Category not found');
	}

	// このカテゴリを使用しているタグがあるか確認
	const tagsUsingCategory = await db
		.select({ id: tags.id })
		.from(tags)
		.where(eq(tags.category, existing.slug))
		.limit(1);

	if (tagsUsingCategory.length > 0) {
		return validationError({
			_: ['このカテゴリを使用しているタグが存在するため削除できません'],
		});
	}

	const deleted = await deleteCategory(db, categoryId);
	if (!deleted) {
		return notFound('Category not found');
	}

	return new Response(null, { status: 204 });
}
