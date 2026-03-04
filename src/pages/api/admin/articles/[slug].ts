import type { APIContext } from 'astro';
import { deleteArticle, getArticleBySlug } from '../../../../lib/articles';
import { forbidden, notFound, unauthorized } from '../../../../lib/errors';

export async function DELETE(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const article = await getArticleBySlug(db, slug);
	if (!article) {
		return notFound('Article not found');
	}

	await deleteArticle(db, article.id);

	return new Response(null, { status: 204 });
}
