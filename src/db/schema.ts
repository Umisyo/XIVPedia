import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// ユーザープロフィール（Supabase auth.users と連携）
export const profiles = pgTable('profiles', {
	id: uuid('id').primaryKey(),
	username: text('username').notNull().unique(),
	displayName: text('display_name').notNull(),
	avatarUrl: text('avatar_url'),
	role: text('role', { enum: ['user', 'moderator', 'admin'] })
		.default('user')
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// タグカテゴリ
export const tagCategories = pgTable('tag_categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	displayOrder: integer('display_order').default(0).notNull(),
});

// タグ（FF14コンテンツカテゴリ）
export const tags = pgTable('tags', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	category: text('category').notNull(),
});

// 記事
export const articles = pgTable('articles', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	body: text('body').notNull(),
	authorId: uuid('author_id')
		.references(() => profiles.id)
		.notNull(),
	status: text('status', { enum: ['draft', 'published', 'archived'] })
		.default('draft')
		.notNull(),
	patch: text('patch'),
	publishedAt: timestamp('published_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 記事-タグ 中間テーブル
export const articleTags = pgTable(
	'article_tags',
	{
		articleId: uuid('article_id')
			.references(() => articles.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(t) => [primaryKey({ columns: [t.articleId, t.tagId] })],
);

// コメント
export const comments = pgTable('comments', {
	id: uuid('id').defaultRandom().primaryKey(),
	body: text('body').notNull(),
	articleId: uuid('article_id')
		.references(() => articles.id, { onDelete: 'cascade' })
		.notNull(),
	authorId: uuid('author_id')
		.references(() => profiles.id)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// リアクション（👍）
export const reactions = pgTable(
	'reactions',
	{
		articleId: uuid('article_id')
			.references(() => articles.id, { onDelete: 'cascade' })
			.notNull(),
		userId: uuid('user_id')
			.references(() => profiles.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.articleId, t.userId] })],
);

// 通報
export const reports = pgTable('reports', {
	id: uuid('id').defaultRandom().primaryKey(),
	reason: text('reason', {
		enum: ['spam', 'inappropriate', 'misleading', 'other'],
	}).notNull(),
	description: text('description'),
	targetType: text('target_type', { enum: ['article', 'comment'] }).notNull(),
	targetId: uuid('target_id').notNull(),
	reporterId: uuid('reporter_id')
		.references(() => profiles.id)
		.notNull(),
	status: text('status', { enum: ['pending', 'resolved', 'dismissed'] })
		.default('pending')
		.notNull(),
	resolvedBy: uuid('resolved_by').references(() => profiles.id),
	resolvedAt: timestamp('resolved_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});
