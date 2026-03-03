import type { APIContext } from 'astro';
import { deleteArticle, getArticleBySlug, updateArticle } from '../../../lib/articles';
import { forbidden, notFound, unauthorized, validationError } from '../../../lib/errors';
import { validateUpdateArticle } from '../../../lib/validation';

export async function GET(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	const article = await getArticleBySlug(db, slug);
	if (!article) {
		return notFound('Article not found');
	}

	if (article.status === 'draft' && currentUser?.id !== article.author.id) {
		return notFound('Article not found');
	}

	return new Response(JSON.stringify({ data: article }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function PUT(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	if (!currentUser) {
		return unauthorized();
	}

	const article = await getArticleBySlug(db, slug);
	if (!article) {
		return notFound('Article not found');
	}

	if (currentUser.id !== article.author.id && currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	const body = await context.request.json();
	const validation = validateUpdateArticle(body);

	if (!validation.success) {
		return validationError(validation.errors);
	}

	const updated = await updateArticle(db, article.id, validation.data);

	return new Response(JSON.stringify({ data: updated }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function DELETE(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const slug = context.params.slug as string;

	if (!currentUser) {
		return unauthorized();
	}

	const article = await getArticleBySlug(db, slug);
	if (!article) {
		return notFound('Article not found');
	}

	if (currentUser.id !== article.author.id && currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	await deleteArticle(db, article.id);

	return new Response(null, { status: 204 });
}
