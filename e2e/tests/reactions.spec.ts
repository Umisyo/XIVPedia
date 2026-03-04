import { expect, test } from '@playwright/test';
import { navigateToFirstArticle } from '../helpers/navigation';

test.describe('リアクションボタン表示', () => {
	test('記事詳細ページにリアクションボタンが表示される', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.reactionButton).toBeVisible();
	});

	test('リアクションボタンに👍とカウントが表示される', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.reactionButton).toContainText('👍');

		const countText = await articlePage.reactionCount.textContent();
		expect(countText).not.toBeNull();
		expect(Number(countText?.trim())).toBeGreaterThanOrEqual(0);
	});

	test('リアクションボタンがクリック可能である', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.reactionButton).toBeEnabled();
	});
});

test.describe('未ログイン時のリアクション', () => {
	test('未ログイン時にリアクションボタンをクリックするとログインを促すリンクが表示される', async ({
		page,
	}) => {
		const articlePage = await navigateToFirstArticle(page);

		await expect(articlePage.reactionLoginHint).not.toBeVisible();

		await articlePage.toggleReaction();

		await expect(articlePage.reactionLoginHint).toBeVisible();
		await expect(articlePage.reactionLoginHint).toHaveAttribute('href', '/login');
	});

	test('未ログイン時にリアクションボタンをクリックしてもカウントが変わらない', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		const countBefore = await articlePage.reactionCount.textContent();

		await articlePage.toggleReaction();

		const countAfter = await articlePage.reactionCount.textContent();
		expect(countAfter).toBe(countBefore);
	});

	test('ログイン促進リンクをクリックするとログインページに遷移する', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		await articlePage.toggleReaction();
		await expect(articlePage.reactionLoginHint).toBeVisible();

		await articlePage.reactionLoginHint.click();

		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});
});

test.describe('リアクションAPI通信', () => {
	test('未ログイン時はリアクションAPIが呼ばれない', async ({ page }) => {
		const articlePage = await navigateToFirstArticle(page);

		let apiCalled = false;
		const slug = page.url().split('/articles/')[1]?.split('/')[0];

		await page.route(`**/api/articles/${slug}/reactions`, async (route) => {
			apiCalled = true;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ count: 1, reacted: true }),
			});
		});

		await articlePage.toggleReaction();

		// ログインヒントが表示されるのを待ってからAPIが呼ばれていないことを確認
		await expect(articlePage.reactionLoginHint).toBeVisible();
		expect(apiCalled).toBe(false);
	});
});
