import {
	boolean,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';

// ユーザー
export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').unique(),
	passwordHash: text('password_hash'),
	emailVerified: boolean('email_verified').default(false).notNull(),
	username: text('username').notNull(),
	displayName: text('display_name').notNull(),
	avatarUrl: text('avatar_url'),
	role: text('role', { enum: ['user', 'moderator', 'admin'] })
		.default('user')
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// OAuth アカウント（複数プロバイダー対応）
export const accounts = pgTable(
	'accounts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		provider: text('provider', { enum: ['discord', 'google'] }).notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => [uniqueIndex('accounts_provider_account_idx').on(t.provider, t.providerAccountId)],
);

// メール確認トークン
export const emailVerificationTokens = pgTable('email_verification_tokens', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// パスワードリセットトークン
export const passwordResetTokens = pgTable('password_reset_tokens', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// タグ（FF14コンテンツカテゴリ）
export const tags = pgTable('tags', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	category: text('category', {
		enum: ['duty', 'job', 'crafting', 'gathering', 'general'],
	}).notNull(),
});

// 記事
export const articles = pgTable('articles', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	body: text('body').notNull(),
	authorId: uuid('author_id')
		.references(() => users.id)
		.notNull(),
	status: text('status', { enum: ['draft', 'published', 'archived'] })
		.default('draft')
		.notNull(),
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
		.references(() => users.id)
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
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.articleId, t.userId] })],
);
