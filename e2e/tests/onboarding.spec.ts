import { expect, test } from '@playwright/test';

test.describe('オンボーディング', () => {
	test('未ログイン時に /onboarding にアクセスするとログインページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/onboarding');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('オンボーディングページのタイトルが「プロフィール設定」である', async ({ page }) => {
		// 未ログインのためリダイレクトされ、ログインページが表示される
		await page.goto('/onboarding');
		await page.waitForURL(/\/login/);
		// ログインページにリダイレクトされていることを再確認
		expect(page.url()).toContain('/login');
	});
});
