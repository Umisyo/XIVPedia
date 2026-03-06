import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { articles, comments } from '../../../../../db/schema';
import { forbidden, notFound, unauthorized } from '../../../../../lib/errors';

export async function DELETE(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;
	const commentId = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	const articleRow = await db
		.select({ id: articles.id, authorId: articles.authorId })
		.from(articles)
		.where(eq(articles.slug, slug))
		.limit(1);

	if (articleRow.length === 0) {
		return notFound('Article not found');
	}

	const commentRow = await db
		.select({ id: comments.id, authorId: comments.authorId })
		.from(comments)
		.where(and(eq(comments.id, commentId), eq(comments.articleId, articleRow[0].id)))
		.limit(1);

	if (commentRow.length === 0) {
		return notFound('Comment not found');
	}

	const isCommentAuthor = currentUser.id === commentRow[0].authorId;
	const isArticleAuthor = currentUser.id === articleRow[0].authorId;
	const isAdmin = currentUser.profile?.role === 'admin';

	if (!isCommentAuthor && !isArticleAuthor && !isAdmin) {
		return forbidden();
	}

	await db.delete(comments).where(eq(comments.id, commentId));

	return new Response(null, { status: 204 });
}
