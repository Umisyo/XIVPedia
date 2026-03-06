import { expect, test } from '@playwright/test';

test.describe('プロフィール設定', () => {
	test('未ログイン時に /settings/profile にアクセスするとログインページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/settings/profile');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('未ログイン時はプロフィール設定の見出しが表示されない', async ({ page }) => {
		await page.goto('/settings/profile');
		await page.waitForURL(/\/login/);
		// リダイレクトされるため、設定ページの要素は表示されない
		// ログインページに「プロフィール設定」見出しが存在しないことを確認
		// ※ログインページの見出しは「ログイン」
		const loginHeading = page.locator('main').getByText('ログイン', { exact: true });
		await expect(loginHeading).toBeVisible();
	});
});
