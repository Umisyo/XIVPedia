import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { tags } from '../../../../db/schema';
import { listCategorySlugs } from '../../../../lib/categories';
import {
	errorResponse,
	forbidden,
	notFound,
	unauthorized,
	validationError,
} from '../../../../lib/errors';
import { getTagRequestById, reviewTagRequest } from '../../../../lib/tag-requests';
import { createTag, generateTagSlug } from '../../../../lib/tags';
import { validateReviewTagRequest } from '../../../../lib/validation';

export async function PATCH(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const id = context.params.id;
	if (!id) {
		return notFound();
	}

	const existing = await getTagRequestById(db, id);
	if (!existing) {
		return notFound('Tag request not found');
	}

	if (existing.status !== 'pending') {
		return validationError({ _: ['この申請は既に処理済みです'] });
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const result = validateReviewTagRequest(body);
	if (!result.success) {
		return validationError(result.errors);
	}

	try {
		if (result.data.status === 'approved') {
			const validSlugs = await listCategorySlugs(db);
			if (!validSlugs.includes(existing.category)) {
				return validationError({ _: ['申請されたカテゴリが存在しません'] });
			}

			const slug = result.data.slug || generateTagSlug(existing.name);
			if (!slug) {
				return validationError({ _: ['スラグを生成できません。手動で指定してください'] });
			}

			// 同名タグの最終チェック
			const [existingTag] = await db
				.select({ id: tags.id })
				.from(tags)
				.where(eq(tags.name, existing.name))
				.limit(1);

			if (existingTag) {
				return validationError({ _: ['同じ名前のタグが既に存在します'] });
			}

			// タグ作成とステータス更新をトランザクションで実行
			const updated = await db.transaction(async (tx) => {
				await createTag(tx as unknown as typeof db, {
					name: existing.name,
					slug,
					category: existing.category,
				});

				return reviewTagRequest(tx as unknown as typeof db, id, {
					status: result.data.status,
					reviewedBy: currentUser.id,
					rejectionReason: result.data.rejectionReason,
				});
			});

			if (!updated) {
				return notFound('Tag request not found or already processed');
			}

			return new Response(JSON.stringify({ request: updated }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 却下の場合
		const updated = await reviewTagRequest(db, id, {
			status: result.data.status,
			reviewedBy: currentUser.id,
			rejectionReason: result.data.rejectionReason,
		});

		if (!updated) {
			return notFound('Tag request not found or already processed');
		}

		return new Response(JSON.stringify({ request: updated }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		if (err instanceof Error && err.message.includes('unique')) {
			return validationError({ _: ['同じ名前またはスラグのタグが既に存在します'] });
		}
		console.error('Failed to review tag request:', err);
		return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
	}
}
