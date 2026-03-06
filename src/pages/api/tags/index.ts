import type { APIContext } from 'astro';
import { listCategorySlugs } from '../../../lib/categories';
import { groupTagsByCategory, listTags } from '../../../lib/tags';

export async function GET(context: APIContext): Promise<Response> {
	const { db } = context.locals;
	const params = context.url.searchParams;

	const rawCategory = params.get('category');
	let category: string | undefined;

	if (rawCategory) {
		const validSlugs = await listCategorySlugs(db);
		if (!validSlugs.includes(rawCategory)) {
			return new Response(
				JSON.stringify({
					error: {
						code: 'VALIDATION_ERROR',
						message: `Invalid category. Must be one of: ${validSlugs.join(', ')}`,
					},
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			);
		}
		category = rawCategory;
	}

	const tagList = await listTags(db, { category });
	const grouped = groupTagsByCategory(tagList);

	return new Response(JSON.stringify({ data: grouped }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
		},
	});
}
