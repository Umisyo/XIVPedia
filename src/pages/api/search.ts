import type { APIContext } from 'astro';
import { searchArticles } from '../../lib/search';

export async function GET(context: APIContext): Promise<Response> {
	const { db } = context.locals;
	const params = context.url.searchParams;

	const query = params.get('q') ?? '';
	const page = Math.max(1, Math.min(100, Number.parseInt(params.get('page') ?? '1', 10) || 1));
	const limit = Math.max(1, Math.min(100, Number.parseInt(params.get('limit') ?? '20', 10) || 20));

	const result = await searchArticles(db, { query, page, limit });

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'private, no-cache',
		},
	});
}
