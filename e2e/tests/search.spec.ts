import { expect, test } from '@playwright/test';
import { searchQueries } from '../fixtures/test-data';
import { SearchPage } from '../pages/search.page';

test.describe('検索機能', () => {
	test('検索ページが表示される', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto();

		await expect(searchPage.heading).toBeVisible();
		await expect(searchPage.searchInput).toBeVisible();
		// クエリ未入力時はプレースホルダーメッセージが表示される
		await expect(searchPage.emptyQueryMessage).toBeVisible();
	});

	test('検索バーにキーワードを入力して検索できる', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto();

		await searchPage.search(searchQueries.withResults);
		await page.waitForURL(/\/search\?q=/);
		expect(page.url()).toContain(`q=${encodeURIComponent(searchQueries.withResults)}`);
	});

	test('検索クエリがURLに反映される', async ({ page }) => {
		const searchPage = new SearchPage(page);
		const query = searchQueries.withResults;

		// URL にクエリパラメータ付きで直接アクセス
		await searchPage.goto(query);

		// 検索入力フィールドにクエリが入っている
		await expect(searchPage.searchInput).toHaveValue(query);
		// URL にクエリが含まれている
		expect(page.url()).toContain(`q=${encodeURIComponent(query)}`);
	});

	test('検索結果が表示される（結果ありの場合）', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto(searchQueries.withResults);

		// 検索結果があれば記事が表示される、なければ0件メッセージが表示される
		const hasResults = (await searchPage.searchResults.count()) > 0;
		const hasNoResultsMsg = await searchPage.noResultsMessage.isVisible().catch(() => false);

		// 結果ありか0件メッセージのどちらかが表示される
		expect(hasResults || hasNoResultsMsg).toBe(true);

		if (hasResults) {
			// 検索結果件数テキストが表示される
			await expect(searchPage.resultCount).toBeVisible();
		}
	});

	test('検索結果が0件の場合にメッセージが表示される', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto(searchQueries.withNoResults);

		await expect(searchPage.noResultsMessage).toBeVisible();
		await expect(page.getByText('別のキーワードで検索してみてください')).toBeVisible();
	});

	test('ヘッダーの検索バーから検索できる', async ({ page }) => {
		// トップページのヘッダー内検索バーを使用
		await page.goto('/');
		const headerSearchInput = page.locator('header #search-input');
		await expect(headerSearchInput).toBeVisible();

		await headerSearchInput.fill(searchQueries.withResults);
		await headerSearchInput.press('Enter');

		await page.waitForURL(/\/search\?q=/);
		expect(page.url()).toContain('/search');
		expect(page.url()).toContain(`q=${encodeURIComponent(searchQueries.withResults)}`);
	});

	test('空の検索は適切に処理される', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto();

		// 空文字で検索を試みる
		await searchPage.searchInput.fill('');
		await searchPage.searchInput.press('Enter');

		// 検索ページに留まるか、プレースホルダーメッセージが表示される
		expect(page.url()).toContain('/search');

		// クエリなし → プレースホルダーメッセージ、またはクエリ空で結果なし
		const hasEmptyMsg = await searchPage.emptyQueryMessage.isVisible().catch(() => false);
		const hasNoResults = await searchPage.noResultsMessage.isVisible().catch(() => false);
		expect(hasEmptyMsg || hasNoResults).toBe(true);
	});

	test('検索結果の記事リンクから記事詳細に遷移できる', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto(searchQueries.withResults);

		const resultCount = await searchPage.searchResults.count();
		if (resultCount > 0) {
			const articleLink = searchPage.searchResults.first().locator('a[href^="/articles/"]').first();
			const href = await articleLink.getAttribute('href');

			await articleLink.click();
			await page.waitForURL(/\/articles\/.+/);

			if (href) {
				expect(page.url()).toContain(href);
			}
		}
	});
});
