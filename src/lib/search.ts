import { and, count, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db';
import { articles, articleTags, profiles, reactions, tags } from '../db/schema';

export interface SearchArticlesOptions {
	query: string;
	page?: number;
	limit?: number;
}

export interface SearchResult {
	slug: string;
	title: string;
	excerpt: string;
	author: { displayName: string; avatarUrl: string | null };
	publishedAt: string | null;
	reactionCount: number;
	tags: { name: string; slug: string }[];
}

export interface SearchResponse {
	results: SearchResult[];
	total: number;
	page: number;
	limit: number;
}

/**
 * 記事本文から検索キーワード周辺の抜粋を生成する。
 * キーワードが見つかった場合はその周辺を中心に最大200文字を切り出す。
 * 見つからない場合は先頭200文字を返す。
 */
function generateExcerpt(body: string, query: string, maxLength = 200): string {
	const lowerBody = body.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const index = lowerBody.indexOf(lowerQuery);

	if (index === -1) {
		// キーワードが見つからない場合は先頭から切り出し
		if (body.length <= maxLength) return body;
		return `${body.slice(0, maxLength)}...`;
	}

	// キーワードを中心に前後を切り出す
	const halfWindow = Math.floor((maxLength - query.length) / 2);
	const start = Math.max(0, index - halfWindow);
	let end = Math.min(body.length, index + query.length + halfWindow);

	// 切り出し範囲が maxLength を超えないように調整
	if (end - start > maxLength) {
		end = start + maxLength;
	}

	let excerpt = body.slice(start, end);
	if (start > 0) excerpt = `...${excerpt}`;
	if (end < body.length) excerpt = `${excerpt}...`;

	return excerpt;
}

/**
 * 全文検索で記事を検索する。
 * pg_trgm の ILIKE を使用して title と body を検索し、
 * published 状態の記事のみを対象とする。
 */
export async function searchArticles(
	db: Database,
	options: SearchArticlesOptions,
): Promise<SearchResponse> {
	const { query } = options;
	const page = Math.max(1, options.page || 1);
	const limit = Math.min(100, Math.max(1, options.limit || 20));
	const offset = (page - 1) * limit;

	// 空クエリの場合は空結果を返す
	if (!query || query.trim() === '') {
		return { results: [], total: 0, page, limit };
	}

	const escapedQuery = query.replace(/[%_\\]/g, '\\$&');
	const searchPattern = `%${escapedQuery}%`;

	// 検索条件: published かつ title または body に ILIKE マッチ
	const where = and(
		eq(articles.status, 'published'),
		sql`(${articles.title} ILIKE ${searchPattern} OR ${articles.body} ILIKE ${searchPattern})`,
	);

	// 合計件数を取得
	const totalResult = await db.select({ total: count() }).from(articles).where(where);
	const total = totalResult[0]?.total ?? 0;

	if (total === 0) {
		return { results: [], total: 0, page, limit };
	}

	// 記事データを取得（リアクション数を含む）
	const reactionCount = sql<number>`count(DISTINCT ${reactions.userId})`.as('reaction_count');

	const rows = await db
		.select({
			id: articles.id,
			slug: articles.slug,
			title: articles.title,
			body: articles.body,
			publishedAt: articles.publishedAt,
			authorDisplayName: profiles.displayName,
			authorAvatarUrl: profiles.avatarUrl,
			reactionCount,
		})
		.from(articles)
		.leftJoin(profiles, eq(articles.authorId, profiles.id))
		.leftJoin(reactions, eq(articles.id, reactions.articleId))
		.where(where)
		.groupBy(articles.id, profiles.id)
		.orderBy(sql`${articles.publishedAt} DESC NULLS LAST`)
		.limit(limit)
		.offset(offset);

	// 記事IDリストからタグ情報を一括取得
	const articleIds = rows.map((r) => r.id);
	const tagsMap = await getTagsForArticles(db, articleIds);

	const results: SearchResult[] = rows.map((row) => ({
		slug: row.slug,
		title: row.title,
		excerpt: generateExcerpt(row.body, query),
		author: {
			displayName: row.authorDisplayName ?? '不明',
			avatarUrl: row.authorAvatarUrl ?? null,
		},
		publishedAt: row.publishedAt?.toISOString() ?? null,
		reactionCount: Number(row.reactionCount),
		tags: tagsMap.get(row.id) ?? [],
	}));

	return { results, total, page, limit };
}

/**
 * 記事IDリストに対応するタグ情報を取得する
 */
async function getTagsForArticles(
	db: Database,
	articleIds: string[],
): Promise<Map<string, { name: string; slug: string }[]>> {
	if (articleIds.length === 0) return new Map();

	const rows = await db
		.select({
			articleId: articleTags.articleId,
			name: tags.name,
			slug: tags.slug,
		})
		.from(articleTags)
		.innerJoin(tags, eq(articleTags.tagId, tags.id))
		.where(inArray(articleTags.articleId, articleIds));

	const map = new Map<string, { name: string; slug: string }[]>();
	for (const row of rows) {
		const list = map.get(row.articleId) ?? [];
		list.push({ name: row.name, slug: row.slug });
		map.set(row.articleId, list);
	}
	return map;
}
