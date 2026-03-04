import { expect, test } from '@playwright/test';
import { navigateToFirstArticle } from '../helpers/navigation';
import { ArticlePage } from '../pages/article.page';

test.describe('コメントセクション表示', () => {
	test('記事詳細ページにコメントセクションが表示される', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.commentHeading).toBeVisible();
		await expect(articlePage.commentHeading).toHaveText(/コメント \(\d+件\)/);
	});

	test('コメントがない場合は空メッセージが表示される', async ({ page }) => {
		await page.goto('/articles');

		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		const href = await articleLinks.first().getAttribute('href');
		const slug = href?.split('/articles/')[1];

		await page.route(`**/api/articles/${slug}/comments*`, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ comments: [], total: 0 }),
			});
		});

		await articleLinks.first().click();

		const articlePage = new ArticlePage(page);
		await expect(articlePage.noCommentsMessage).toBeVisible();
	});

	test('コメント一覧がAPIレスポンスから表示される', async ({ page }) => {
		await page.goto('/articles');

		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		const href = await articleLinks.first().getAttribute('href');
		const slug = href?.split('/articles/')[1];

		await page.route(`**/api/articles/${slug}/comments*`, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					comments: [
						{
							id: 'comment-1',
							body: 'とても参考になりました！',
							createdAt: new Date().toISOString(),
							author: {
								id: 'user-1',
								displayName: 'テストユーザー',
								avatarUrl: null,
							},
						},
						{
							id: 'comment-2',
							body: 'フェーズ2の解説もお願いします。',
							createdAt: new Date().toISOString(),
							author: {
								id: 'user-2',
								displayName: 'テストユーザー2',
								avatarUrl: null,
							},
						},
					],
					total: 2,
				}),
			});
		});

		await articleLinks.first().click();

		await expect(page.getByText('とても参考になりました！')).toBeVisible();
		await expect(page.getByText('フェーズ2の解説もお願いします。')).toBeVisible();
		await expect(page.getByText('テストユーザー').first()).toBeVisible();
		await expect(page.getByText('テストユーザー2')).toBeVisible();
	});
});

test.describe('コメント投稿フォーム', () => {
	test('未ログイン時はログイン促進メッセージが表示される', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.commentLoginPrompt).toBeVisible();

		const loginLink = articlePage.commentSection.getByRole('link', {
			name: 'ログイン',
		});
		await expect(loginLink).toBeVisible();
		await expect(loginLink).toHaveAttribute('href', '/login');
	});

	test('未ログイン時はコメント入力欄が表示されない', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.commentInput).not.toBeVisible();
		await expect(articlePage.commentSubmitButton).not.toBeVisible();
	});
});

test.describe('コメント「もっと読む」', () => {
	test('コメントが多い場合は「もっと読む」ボタンが表示される', async ({ page }) => {
		await page.goto('/articles');

		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		const href = await articleLinks.first().getAttribute('href');
		const slug = href?.split('/articles/')[1];

		const comments = Array.from({ length: 50 }, (_, i) => ({
			id: `comment-${i}`,
			body: `テストコメント ${i + 1}`,
			createdAt: new Date().toISOString(),
			author: {
				id: `user-${i}`,
				displayName: `ユーザー${i + 1}`,
				avatarUrl: null,
			},
		}));

		await page.route(`**/api/articles/${slug}/comments*`, async (route) => {
			const url = new URL(route.request().url());
			const offset = Number(url.searchParams.get('offset')) || 0;
			const limit = Number(url.searchParams.get('limit')) || 50;

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					comments: comments.slice(offset, offset + limit),
					total: 75,
				}),
			});
		});

		await articleLinks.first().click();

		const articlePage = new ArticlePage(page);
		await expect(articlePage.loadMoreButton).toBeVisible();
	});

	test('コメントが少ない場合は「もっと読む」ボタンが表示されない', async ({ page }) => {
		await page.goto('/articles');

		const articleLinks = page.locator('a[href^="/articles/"]').filter({
			has: page.locator('h2'),
		});
		const count = await articleLinks.count();

		if (count === 0) {
			test.skip(true, '記事が存在しないためスキップ');
			return;
		}

		const href = await articleLinks.first().getAttribute('href');
		const slug = href?.split('/articles/')[1];

		await page.route(`**/api/articles/${slug}/comments*`, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					comments: [
						{
							id: 'comment-1',
							body: 'テストコメント',
							createdAt: new Date().toISOString(),
							author: {
								id: 'user-1',
								displayName: 'テストユーザー',
								avatarUrl: null,
							},
						},
					],
					total: 1,
				}),
			});
		});

		await articleLinks.first().click();

		const articlePage = new ArticlePage(page);
		await expect(articlePage.loadMoreButton).not.toBeVisible();
	});
});
