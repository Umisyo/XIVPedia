import type { APIContext } from 'astro';
import { groupTagsByCategory, listTags, TAG_CATEGORIES, type TagCategory } from '../../../lib/tags';

export async function GET(context: APIContext): Promise<Response> {
	const { db } = context.locals;
	const params = context.url.searchParams;

	const rawCategory = params.get('category');
	let category: TagCategory | undefined;

	if (rawCategory) {
		if (!(TAG_CATEGORIES as readonly string[]).includes(rawCategory)) {
			return new Response(
				JSON.stringify({
					error: {
						code: 'VALIDATION_ERROR',
						message: `Invalid category. Must be one of: ${TAG_CATEGORIES.join(', ')}`,
					},
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			);
		}
		category = rawCategory as TagCategory;
	}

	const tagList = await listTags(db, { category });
	const grouped = groupTagsByCategory(tagList);

	return new Response(JSON.stringify({ data: grouped }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
