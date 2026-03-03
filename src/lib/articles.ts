import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db';
import { articles, articleTags, profiles, reactions, tags } from '../db/schema';
import { generateSlug } from './slug';

export interface ListArticlesOptions {
	page?: number;
	limit?: number;
	tag?: string;
	status?: 'draft' | 'published' | 'archived';
	sort?: 'newest' | 'popular';
}

export interface CreateArticleData {
	title: string;
	body: string;
	tags?: string[];
	status?: 'draft' | 'published';
}

export interface UpdateArticleData {
	title?: string;
	body?: string;
	tags?: string[];
	status?: 'draft' | 'published';
}

interface AuthorInfo {
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
}

interface TagInfo {
	id: string;
	name: string;
	slug: string;
	category: string;
}

interface ArticleDetail {
	id: string;
	title: string;
	slug: string;
	body: string;
	status: string;
	publishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	author: AuthorInfo;
	tags: TagInfo[];
}

async function getTagsForArticles(
	db: Database,
	articleIds: string[],
): Promise<Map<string, TagInfo[]>> {
	if (articleIds.length === 0) return new Map();

	const rows = await db
		.select({
			articleId: articleTags.articleId,
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			category: tags.category,
		})
		.from(articleTags)
		.innerJoin(tags, eq(articleTags.tagId, tags.id))
		.where(inArray(articleTags.articleId, articleIds));

	const map = new Map<string, TagInfo[]>();
	for (const row of rows) {
		const list = map.get(row.articleId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			slug: row.slug,
			category: row.category,
		});
		map.set(row.articleId, list);
	}
	return map;
}

export async function listArticles(db: Database, options: ListArticlesOptions = {}) {
	const page = Math.max(1, options.page ?? 1);
	const limit = Math.min(100, Math.max(1, options.limit ?? 20));
	const offset = (page - 1) * limit;
	const status = (options.status ?? 'published') as 'draft' | 'published' | 'archived';

	const conditions = [eq(articles.status, status)];

	if (options.tag) {
		const tagRow = await db
			.select({ id: tags.id })
			.from(tags)
			.where(eq(tags.slug, options.tag))
			.limit(1);

		if (tagRow.length > 0) {
			const articleIdsWithTag = db
				.select({ articleId: articleTags.articleId })
				.from(articleTags)
				.where(eq(articleTags.tagId, tagRow[0].id));
			conditions.push(inArray(articles.id, articleIdsWithTag));
		} else {
			return { data: [], meta: { page, limit, total: 0 } };
		}
	}

	const where = and(...conditions);

	const sort = options.sort ?? 'newest';

	const selectFields = {
		id: articles.id,
		title: articles.title,
		slug: articles.slug,
		body: articles.body,
		status: articles.status,
		publishedAt: articles.publishedAt,
		createdAt: articles.createdAt,
		updatedAt: articles.updatedAt,
		authorId: profiles.id,
		authorUsername: profiles.username,
		authorDisplayName: profiles.displayName,
		authorAvatarUrl: profiles.avatarUrl,
	};

	const totalResult = await db.select({ total: count() }).from(articles).where(where);

	let rows: {
		id: string;
		title: string;
		slug: string;
		body: string;
		status: string;
		publishedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
		authorId: string | null;
		authorUsername: string | null;
		authorDisplayName: string | null;
		authorAvatarUrl: string | null;
	}[];

	if (sort === 'popular') {
		const reactionCount = sql<number>`count(${reactions.userId})`.as('reaction_count');

		rows = await db
			.select({
				...selectFields,
				reactionCount,
			})
			.from(articles)
			.leftJoin(profiles, eq(articles.authorId, profiles.id))
			.leftJoin(reactions, eq(articles.id, reactions.articleId))
			.where(where)
			.groupBy(articles.id, profiles.id)
			.orderBy(desc(reactionCount), desc(articles.publishedAt))
			.limit(limit)
			.offset(offset);
	} else {
		rows = await db
			.select(selectFields)
			.from(articles)
			.leftJoin(profiles, eq(articles.authorId, profiles.id))
			.where(where)
			.orderBy(desc(articles.createdAt))
			.limit(limit)
			.offset(offset);
	}

	const total = totalResult[0]?.total ?? 0;
	const articleIds = rows.map((r) => r.id);
	const tagsMap = await getTagsForArticles(db, articleIds);

	const data: ArticleDetail[] = rows.map((row) => ({
		id: row.id,
		title: row.title,
		slug: row.slug,
		body: row.body,
		status: row.status,
		publishedAt: row.publishedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		author: {
			id: row.authorId as string,
			username: row.authorUsername as string,
			displayName: row.authorDisplayName as string,
			avatarUrl: row.authorAvatarUrl ?? null,
		},
		tags: tagsMap.get(row.id) ?? [],
	}));

	return { data, meta: { page, limit, total } };
}

export async function getArticleBySlug(db: Database, slug: string): Promise<ArticleDetail | null> {
	const rows = await db
		.select({
			id: articles.id,
			title: articles.title,
			slug: articles.slug,
			body: articles.body,
			status: articles.status,
			publishedAt: articles.publishedAt,
			createdAt: articles.createdAt,
			updatedAt: articles.updatedAt,
			authorId: profiles.id,
			authorUsername: profiles.username,
			authorDisplayName: profiles.displayName,
			authorAvatarUrl: profiles.avatarUrl,
		})
		.from(articles)
		.leftJoin(profiles, eq(articles.authorId, profiles.id))
		.where(eq(articles.slug, slug))
		.limit(1);

	if (rows.length === 0) return null;

	const row = rows[0];
	const tagsMap = await getTagsForArticles(db, [row.id]);

	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		body: row.body,
		status: row.status,
		publishedAt: row.publishedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		author: {
			id: row.authorId as string,
			username: row.authorUsername as string,
			displayName: row.authorDisplayName as string,
			avatarUrl: row.authorAvatarUrl ?? null,
		},
		tags: tagsMap.get(row.id) ?? [],
	};
}

export async function createArticle(
	db: Database,
	data: CreateArticleData,
	authorId: string,
): Promise<ArticleDetail> {
	const slug = generateSlug();
	const status = data.status ?? 'draft';
	const now = new Date();

	const [inserted] = await db
		.insert(articles)
		.values({
			title: data.title,
			slug,
			body: data.body,
			authorId,
			status,
			publishedAt: status === 'published' ? now : null,
		})
		.returning({ id: articles.id, slug: articles.slug });

	if (data.tags && data.tags.length > 0) {
		await db
			.insert(articleTags)
			.values(data.tags.map((tagId) => ({ articleId: inserted.id, tagId })));
	}

	return (await getArticleBySlug(db, inserted.slug)) as ArticleDetail;
}

export async function updateArticle(
	db: Database,
	articleId: string,
	data: UpdateArticleData,
): Promise<ArticleDetail | null> {
	const existing = await db
		.select({ publishedAt: articles.publishedAt, slug: articles.slug })
		.from(articles)
		.where(eq(articles.id, articleId))
		.limit(1);

	if (existing.length === 0) return null;

	const updates: Record<string, unknown> = { updatedAt: new Date() };
	if (data.title !== undefined) updates.title = data.title;
	if (data.body !== undefined) updates.body = data.body;
	if (data.status !== undefined) {
		updates.status = data.status;
		if (data.status === 'published' && existing[0].publishedAt === null) {
			updates.publishedAt = new Date();
		}
	}

	await db.update(articles).set(updates).where(eq(articles.id, articleId));

	if (data.tags !== undefined) {
		await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
		if (data.tags.length > 0) {
			await db.insert(articleTags).values(data.tags.map((tagId) => ({ articleId, tagId })));
		}
	}

	const [updated] = await db
		.select({ slug: articles.slug })
		.from(articles)
		.where(eq(articles.id, articleId))
		.limit(1);

	return getArticleBySlug(db, updated.slug);
}

export async function deleteArticle(db: Database, articleId: string): Promise<void> {
	await db.delete(articles).where(eq(articles.id, articleId));
}
