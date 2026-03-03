import type { APIContext } from 'astro';
import { and, count, eq } from 'drizzle-orm';
import { articles, reactions } from '../../../../db/schema';
import { notFound, unauthorized } from '../../../../lib/errors';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	const articleRow = await db
		.select({ id: articles.id })
		.from(articles)
		.where(eq(articles.slug, slug))
		.limit(1);

	if (articleRow.length === 0) {
		return notFound('Article not found');
	}

	const articleId = articleRow[0].id;

	const [countResult] = await db
		.select({ count: count() })
		.from(reactions)
		.where(eq(reactions.articleId, articleId));

	let reacted = false;
	if (currentUser) {
		const userReaction = await db
			.select({ userId: reactions.userId })
			.from(reactions)
			.where(and(eq(reactions.articleId, articleId), eq(reactions.userId, currentUser.id)))
			.limit(1);
		reacted = userReaction.length > 0;
	}

	return new Response(JSON.stringify({ count: countResult?.count ?? 0, reacted }), {
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
		.select({ userId: reactions.userId })
		.from(reactions)
		.where(and(eq(reactions.articleId, articleId), eq(reactions.userId, currentUser.id)))
		.limit(1);

	if (existing.length > 0) {
		await db
			.delete(reactions)
			.where(and(eq(reactions.articleId, articleId), eq(reactions.userId, currentUser.id)));
	} else {
		await db.insert(reactions).values({
			articleId,
			userId: currentUser.id,
		});
	}

	const reacted = existing.length === 0;

	const [countResult] = await db
		.select({ count: count() })
		.from(reactions)
		.where(eq(reactions.articleId, articleId));

	return new Response(JSON.stringify({ reacted, count: countResult?.count ?? 0 }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
