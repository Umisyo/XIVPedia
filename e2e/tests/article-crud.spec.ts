import { expect, test } from '@playwright/test';
import { ArticlePage } from '../pages/article.page';
import { EditorPage } from '../pages/editor.page';

test.describe('記事一覧ページ', () => {
	test('記事一覧ページが表示される', async ({ page }) => {
		await page.goto('/articles');

		await expect(page.getByRole('heading', { name: '記事一覧', level: 1 })).toBeVisible();
	});

	test('ソートタブ（新着順・人気順）が表示される', async ({ page }) => {
		await page.goto('/articles');

		await expect(page.getByRole('link', { name: '新着順' })).toBeVisible();
		await expect(page.getByRole('link', { name: '人気順' })).toBeVisible();
	});

	test('パッチフィルターが表示される', async ({ page }) => {
		await page.goto('/articles');

		await expect(page.getByText('パッチ:')).toBeVisible();
		await expect(page.getByRole('link', { name: 'すべて' })).toBeVisible();
	});

	test('記事が存在しない場合は空メッセージが表示される', async ({ page }) => {
		// 存在しないタグでフィルタして記事が0件になるケースをテスト
		await page.goto('/articles?tag=nonexistent-tag-12345');

		await expect(page.getByText('記事が見つかりませんでした')).toBeVisible();
	});
});

test.describe('記事詳細ページ', () => {
	test('存在しない記事にアクセスすると404にリダイレクトされる', async ({ page }) => {
		const response = await page.goto('/articles/non-existent-slug-12345');

		// 404ページにリダイレクトされるか、404ステータスが返る
		const url = page.url();
		const status = response?.status();
		expect(status === 404 || url.includes('404')).toBeTruthy();
	});

	test('記事詳細ページにタイトル・本文・著者情報が表示される', async ({ page }) => {
		// 実際の記事が存在する前提でテストする場合はスキップ
		// ここではページ構造のスモークテストとして、記事一覧から遷移できることを確認
		await page.goto('/articles');

		// 記事カードのリンクが存在するか確認
		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		// 最初の記事リンクをクリック
		const firstLink = articleLinks.first();
		const articleTitle = await firstLink.locator('h2').textContent();
		await firstLink.click();

		// 記事詳細ページの構造を確認
		const articlePage = new ArticlePage(page);
		await expect(articlePage.title).toBeVisible();

		if (articleTitle) {
			await expect(articlePage.title).toHaveText(articleTitle);
		}

		await expect(articlePage.content).toBeVisible();
		await expect(articlePage.authorName).toBeVisible();
	});

	test('記事詳細ページにリアクションボタンが表示される', async ({ page }) => {
		await page.goto('/articles');

		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		await articleLinks.first().click();

		const articlePage = new ArticlePage(page);
		await expect(articlePage.reactionButton).toBeVisible();
	});

	test('記事詳細ページにコメントセクションが表示される', async ({ page }) => {
		await page.goto('/articles');

		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		await articleLinks.first().click();

		const articlePage = new ArticlePage(page);
		await expect(articlePage.commentHeading).toBeVisible();
	});
});

test.describe('記事作成ページ（認証）', () => {
	test('未ログイン時に /articles/new にアクセスするとログインページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/articles/new');

		// 未ログイン時は /login にリダイレクトされる
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('未ログイン時に編集ページにアクセスするとログインページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/articles/some-slug/edit');

		// 未ログイン時は /login にリダイレクトされるか 404 になる
		const url = page.url();
		expect(url.includes('/login') || url.includes('/404')).toBeTruthy();
	});

	test('EditorPage POM の基本構造を検証（ログインが必要なためリダイレクトを確認）', async ({
		page,
	}) => {
		const editorPage = new EditorPage(page);
		await editorPage.gotoNew();

		// 未ログインのためリダイレクトされる
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});
});
