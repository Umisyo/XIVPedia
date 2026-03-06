import type { Locator, Page } from '@playwright/test';

export class HomePage {
	constructor(private page: Page) {}

	// ナビゲーション
	async goto() {
		await this.page.goto('/');
	}

	// --- ヘッダー要素 ---

	/** サイトロゴ（トップページへのリンク） */
	get logo(): Locator {
		return this.page.locator('header a[href="/"]');
	}

	/** デスクトップ用ヘッダーナビゲーション */
	get headerNav(): Locator {
		return this.page.locator('header nav');
	}

	/** 「記事一覧」ナビリンク */
	get articlesLink(): Locator {
		return this.page.locator('header nav a[href="/articles"]');
	}

	/** 「タグ」ナビリンク */
	get tagsLink(): Locator {
		return this.page.locator('header nav a[href="/tags"]');
	}

	/** ヘッダー内の検索入力フィールド */
	get searchInput(): Locator {
		return this.page.locator('header #search-input');
	}

	/** ログインボタン（未認証時のヘッダー） */
	get loginButton(): Locator {
		return this.page.locator('header nav a[href="/login"]');
	}

	/** 投稿ボタン（認証時のヘッダー） */
	get postButton(): Locator {
		return this.page.locator('header nav a[href="/articles/new"]');
	}

	/** マイページリンク（認証時のヘッダー） */
	get mypageLink(): Locator {
		return this.page.locator('header nav a[href="/mypage"]');
	}

	/** ユーザーメニューのトグルボタン（認証時のヘッダー） */
	get userMenu(): Locator {
		return this.page.locator('header nav button[type="button"]');
	}

	// --- トップページコンテンツ ---

	/** ヒーローセクションのロゴ画像 */
	get heroHeading(): Locator {
		return this.page.locator('section img[alt="XIVPedia"]');
	}

	/** 「人気の記事」セクション見出し */
	get popularSectionHeading(): Locator {
		return this.page.getByRole('heading', { name: /人気の記事/ });
	}

	/** 人気記事のカード一覧 */
	get popularArticles(): Locator {
		return this.page
			.locator('section')
			.filter({ has: this.popularSectionHeading })
			.locator('article');
	}

	/** 「新着記事」セクション見出し */
	get newestSectionHeading(): Locator {
		return this.page.getByRole('heading', { name: /新着記事/ });
	}

	/** 新着記事のカード一覧 */
	get newestArticles(): Locator {
		return this.page
			.locator('section')
			.filter({ has: this.newestSectionHeading })
			.locator('article');
	}

	/** 「カテゴリ」セクション見出し */
	get categorySectionHeading(): Locator {
		return this.page.getByRole('heading', { name: /カテゴリ/ });
	}

	/** カテゴリ内のタグリンク一覧 */
	get categoryTags(): Locator {
		return this.page
			.locator('section')
			.filter({ has: this.categorySectionHeading })
			.locator('a[href^="/tags/"]');
	}

	// --- アクション ---

	/** 記事カードのリンクをクリック（0始まりインデックス） */
	async clickArticle(index: number) {
		const cards = this.page.locator('article a[href^="/articles/"]');
		await cards.nth(index).click();
	}

	/** カテゴリセクション内の指定タグ名リンクをクリック */
	async clickTag(tagName: string) {
		await this.categoryTags.filter({ hasText: tagName }).first().click();
	}

	/** ヘッダーの「記事一覧」リンクで遷移 */
	async navigateToArticles() {
		await this.articlesLink.click();
	}

	/** ヘッダーの「タグ」リンクで遷移 */
	async navigateToTags() {
		await this.tagsLink.click();
	}
}
