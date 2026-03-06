import { expect, test } from '@playwright/test';

test.describe('管理者ダッシュボード', () => {
	test('未ログイン時に /admin にアクセスするとトップページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/admin');
		// admin以外（未ログイン含む）はトップページにリダイレクトされる
		await page.waitForURL(/^(?!.*\/admin)/);
		expect(page.url()).not.toContain('/admin');
	});

	test('一般ユーザー（未ログイン）は管理画面の見出しを見ることができない', async ({
		page,
	}) => {
		await page.goto('/admin');
		// リダイレクトされるため、管理画面の見出しは表示されない
		const adminHeading = page.getByRole('heading', { name: '管理画面' });
		await expect(adminHeading).not.toBeVisible();
	});

	test('/admin ページはリダイレクト後にトップページのコンテンツが表示される', async ({
		page,
	}) => {
		await page.goto('/admin');
		// トップページにリダイレクトされるため、トップページの要素が表示される
		await page.waitForURL(/\/$/);
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
	});
});
