import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { articles, bookmarks } from '../../../../db/schema';
import { notFound, unauthorized } from '../../../../lib/errors';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	if (!currentUser) {
		return new Response(JSON.stringify({ bookmarked: false }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const articleRow = await db
		.select({ id: articles.id })
		.from(articles)
		.where(eq(articles.slug, slug))
		.limit(1);

	if (articleRow.length === 0) {
		return notFound('Article not found');
	}

	const articleId = articleRow[0].id;

	const userBookmark = await db
		.select({ userId: bookmarks.userId })
		.from(bookmarks)
		.where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.userId, currentUser.id)))
		.limit(1);

	return new Response(JSON.stringify({ bookmarked: userBookmark.length > 0 }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	if (!currentUser) {
		return unauthorized();
	}

	const articleRow = await db
		.select({ id: articles.id })
		.from(articles)
		.where(eq(articles.slug, slug))
		.limit(1);

	if (articleRow.length === 0) {
		return notFound('Article not found');
	}

	const articleId = articleRow[0].id;

	const existing = await db
		.select({ userId: bookmarks.userId })
		.from(bookmarks)
		.where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.userId, currentUser.id)))
		.limit(1);

	if (existing.length > 0) {
		await db
			.delete(bookmarks)
			.where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.userId, currentUser.id)));
	} else {
		await db.insert(bookmarks).values({
			articleId,
			userId: currentUser.id,
		});
	}

	const bookmarked = existing.length === 0;

	return new Response(JSON.stringify({ bookmarked }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
