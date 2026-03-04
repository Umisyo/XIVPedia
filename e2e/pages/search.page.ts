import type { Locator, Page } from '@playwright/test';

export class SearchPage {
	constructor(private page: Page) {}

	/** 検索ページへ遷移（クエリ付きも可） */
	async goto(query?: string) {
		if (query) {
			await this.page.goto(`/search?q=${encodeURIComponent(query)}`);
		} else {
			await this.page.goto('/search');
		}
	}

	// --- 要素取得 ---

	/** ページ見出し「検索」 */
	get heading(): Locator {
		return this.page.getByRole('heading', { name: '検索' });
	}

	/** 検索入力フィールド */
	get searchInput(): Locator {
		return this.page.locator('#search-input');
	}

	/** 検索フォーム */
	get searchForm(): Locator {
		return this.page.locator('form[action="/search"]');
	}

	/** 検索結果の記事一覧 */
	get searchResults(): Locator {
		return this.page.locator('article');
	}

	/** 検索結果件数テキスト（例: 「攻略」の検索結果（3件）） */
	get resultCount(): Locator {
		return this.page.locator('p:has(span)').filter({ hasText: /の検索結果/ });
	}

	/** 検索結果が0件のときのメッセージ */
	get noResultsMessage(): Locator {
		return this.page.getByText('検索結果が見つかりませんでした');
	}

	/** クエリ未入力時のプレースホルダーメッセージ */
	get emptyQueryMessage(): Locator {
		return this.page.getByText('キーワードを入力して記事を検索してください');
	}

	/** ページネーション */
	get pagination(): Locator {
		return this.page.locator('nav[aria-label="ページネーション"]');
	}

	// --- アクション ---

	/** 検索バーにキーワードを入力して送信 */
	async search(query: string) {
		await this.searchInput.fill(query);
		await this.searchInput.press('Enter');
	}

	/** 検索結果の記事リンクをクリック（0始まりインデックス） */
	async clickResult(index: number) {
		await this.searchResults.nth(index).locator('a[href^="/articles/"]').click();
	}
}
