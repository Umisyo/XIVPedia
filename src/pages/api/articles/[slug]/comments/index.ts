import type { APIContext } from 'astro';
import { count, desc, eq } from 'drizzle-orm';
import { articles, comments, profiles } from '../../../../../db/schema';
import { notFound, unauthorized, validationError } from '../../../../../lib/errors';
import { createNotification } from '../../../../../lib/notifications';
import { validateCreateComment } from '../../../../../lib/validation';

export async function GET(context: APIContext): Promise<Response> {
	const { db } = context.locals;
	const slug = context.params.slug as string;
	const params = context.url.searchParams;

	const limit = Math.min(Math.max(Number(params.get('limit') ?? '50'), 1), 100);
	const offset = Math.max(Number(params.get('offset') ?? '0'), 0);

	const articleRow = await db
		.select({ id: articles.id })
		.from(articles)
		.where(eq(articles.slug, slug))
		.limit(1);

	if (articleRow.length === 0) {
		return notFound('Article not found');
	}

	const articleId = articleRow[0].id;

	const [totalResult] = await db
		.select({ count: count() })
		.from(comments)
		.where(eq(comments.articleId, articleId));

	const rows = await db
		.select({
			id: comments.id,
			body: comments.body,
			articleId: comments.articleId,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
			author: {
				id: profiles.id,
				displayName: profiles.displayName,
				avatarUrl: profiles.avatarUrl,
			},
		})
		.from(comments)
		.innerJoin(profiles, eq(comments.authorId, profiles.id))
		.where(eq(comments.articleId, articleId))
		.orderBy(desc(comments.createdAt))
		.limit(limit)
		.offset(offset);

	return new Response(JSON.stringify({ comments: rows, total: totalResult?.count ?? 0 }), {
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

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}
	const validation = validateCreateComment(body);

	if (!validation.success) {
		return validationError(validation.errors);
	}

	const articleRow = await db
		.select({ id: articles.id, authorId: articles.authorId, title: articles.title })
		.from(articles)
		.where(eq(articles.slug, slug))
		.limit(1);

	if (articleRow.length === 0) {
		return notFound('Article not found');
	}

	const article = articleRow[0];

	const [inserted] = await db
		.insert(comments)
		.values({
			body: validation.data.body,
			articleId: article.id,
			authorId: currentUser.id,
		})
		.returning();

	// 自分自身の記事へのコメントでなければ通知を作成
	if (article.authorId !== currentUser.id) {
		await createNotification(db, {
			userId: article.authorId,
			type: 'comment',
			message: `あなたの記事「${article.title}」に新しいコメントがつきました`,
			link: `/articles/${slug}`,
		});
	}

	const [commentWithAuthor] = await db
		.select({
			id: comments.id,
			body: comments.body,
			articleId: comments.articleId,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
			author: {
				id: profiles.id,
				displayName: profiles.displayName,
				avatarUrl: profiles.avatarUrl,
			},
		})
		.from(comments)
		.innerJoin(profiles, eq(comments.authorId, profiles.id))
		.where(eq(comments.id, inserted.id))
		.limit(1);

	return new Response(JSON.stringify(commentWithAuthor), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
}
