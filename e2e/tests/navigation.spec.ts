import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('ナビゲーション', () => {
	test('トップページが表示される', async ({ page }) => {
		const homePage = new HomePage(page);
		await homePage.goto();

		// ヒーローセクションのロゴが表示される
		await expect(homePage.heroHeading).toBeVisible();
		// 「人気の記事」セクションが存在する
		await expect(homePage.popularSectionHeading).toBeVisible();
		// 「新着記事」セクションが存在する
		await expect(homePage.newestSectionHeading).toBeVisible();
		// 「カテゴリ」セクションが存在する
		await expect(homePage.categorySectionHeading).toBeVisible();
	});

	test('ヘッダーのロゴからトップページに遷移できる', async ({ page }) => {
		// まず別のページに移動
		await page.goto('/articles');
		await page.waitForLoadState('domcontentloaded');

		const homePage = new HomePage(page);
		await homePage.logo.click();
		await page.waitForURL('/');
		expect(page.url()).toMatch(/\/$/);
	});

	test('ヘッダーの「記事一覧」リンクから /articles に遷移できる', async ({ page }) => {
		const homePage = new HomePage(page);
		await homePage.goto();

		await homePage.navigateToArticles();
		await page.waitForURL(/\/articles/);
		expect(page.url()).toContain('/articles');

		// 記事一覧ページの見出しを確認
		await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible();
	});

	test('ヘッダーの「タグ」リンクから /tags に遷移できる', async ({ page }) => {
		const homePage = new HomePage(page);
		await homePage.goto();

		await homePage.navigateToTags();
		await page.waitForURL(/\/tags/);
		expect(page.url()).toContain('/tags');

		// タグ一覧ページの見出しを確認
		await expect(page.getByRole('heading', { name: 'タグ一覧' })).toBeVisible();
	});

	test('トップページの記事カードから記事詳細に遷移できる', async ({ page }) => {
		const homePage = new HomePage(page);
		await homePage.goto();

		// 記事カードが存在するか確認
		const articleLinks = page.locator('article a[href^="/articles/"]');
		const count = await articleLinks.count();

		if (count > 0) {
			// 最初の記事カードのリンク先を取得
			const href = await articleLinks.first().getAttribute('href');
			await articleLinks.first().click();
			await page.waitForURL(/\/articles\/.+/);
			expect(page.url()).toContain('/articles/');
			if (href) {
				expect(page.url()).toContain(href);
			}
		}
	});

	test('タグ一覧からタグ別記事ページに遷移できる', async ({ page }) => {
		await page.goto('/tags');
		await page.waitForLoadState('domcontentloaded');

		// タグリンクが存在するか確認
		const tagLinks = page.locator('a[href^="/tags/"]');
		const count = await tagLinks.count();

		if (count > 0) {
			await tagLinks.first().click();
			await page.waitForURL(/\/tags\/.+/);
			expect(page.url()).toContain('/tags/');

			// タグ別記事ページの見出しを確認
			await expect(page.getByRole('heading', { name: /タグ:/ })).toBeVisible();
		}
	});

	test('記事一覧ページでソート切り替えができる', async ({ page }) => {
		await page.goto('/articles');
		await page.waitForLoadState('domcontentloaded');

		// 「人気順」ソートリンクをクリック
		const popularSort = page.locator('a', { hasText: '人気順' });
		await expect(popularSort).toBeVisible();
		await popularSort.click();
		await page.waitForURL(/sort=popular/);
		expect(page.url()).toContain('sort=popular');

		// 「新着順」ソートリンクをクリック
		const newestSort = page.locator('a', { hasText: '新着順' });
		await expect(newestSort).toBeVisible();
		await newestSort.click();
		await page.waitForURL(/sort=newest/);
		expect(page.url()).toContain('sort=newest');
	});

	test('記事一覧からタグフィルタリングできる', async ({ page }) => {
		await page.goto('/articles');
		await page.waitForLoadState('domcontentloaded');

		// タグフィルタセクションのタグリンクを確認
		const tagFilterLabel = page.locator('span', { hasText: 'タグ:' });
		const tagFilterExists = (await tagFilterLabel.count()) > 0;

		if (tagFilterExists) {
			// タグフィルタ内の最初のタグリンクをクリック
			const tagLinks = page.locator('#tag-list a[href*="tag="]');
			const count = await tagLinks.count();

			if (count > 0) {
				const tagLink = tagLinks.first();
				await tagLink.click();
				await page.waitForURL(/tag=/);
				expect(page.url()).toContain('tag=');
			}
		}
	});

	test('ヘッダーのナビゲーションリンクが正しく表示される', async ({ page }) => {
		const homePage = new HomePage(page);
		await homePage.goto();

		// ロゴが「XIVPedia」テキストを含む
		await expect(homePage.logo).toContainText('XIVPedia');

		// 「記事一覧」リンクが表示される
		await expect(homePage.articlesLink).toBeVisible();
		await expect(homePage.articlesLink).toHaveText('記事一覧');

		// 「タグ」リンクが表示される
		await expect(homePage.tagsLink).toBeVisible();
		await expect(homePage.tagsLink).toHaveText('タグ');

		// 検索入力フィールドが表示される
		await expect(homePage.searchInput).toBeVisible();
	});
});
