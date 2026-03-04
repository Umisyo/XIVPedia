// テスト用記事データ
export const testArticle = {
	title: '極ナイツ・オブ・ラウンド討滅戦 攻略ガイド',
	body: 'フェーズ1ではMTがボスの正面を維持し、STはザコ処理を担当します。',
	tags: ['極コンテンツ', '蒼天のイシュガルド', '討滅戦'],
} as const;

export const testArticleMinimal = {
	title: 'テスト記事',
	body: 'テスト本文',
	tags: ['テスト'],
} as const;

// テスト用ユーザー情報
export const testUser = {
	displayName: 'テストユーザー',
	email: 'test@example.com',
} as const;

export const testUserSecondary = {
	displayName: 'テストユーザー2',
	email: 'test2@example.com',
} as const;

// テスト用コメントデータ
export const testComment = {
	body: 'とても参考になりました！フェーズ2の解説もお願いします。',
} as const;

export const testCommentReply = {
	body: 'ありがとうございます。フェーズ2の解説も追加予定です。',
} as const;

// テスト用検索クエリ
export const searchQueries = {
	withResults: '攻略',
	withNoResults: 'zzzxxxyyy存在しないクエリ',
	withTag: '極コンテンツ',
} as const;

// APIルートパス定数
export const apiRoutes = {
	articles: '/api/articles',
	articleById: (id: string) => `/api/articles/${id}`,
	comments: '/api/comments',
	commentById: (id: string) => `/api/comments/${id}`,
	search: '/api/search',
	tags: '/api/tags',
	users: '/api/users',
	userById: (id: string) => `/api/users/${id}`,
} as const;
