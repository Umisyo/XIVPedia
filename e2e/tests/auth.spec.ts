import { expect, test } from '@playwright/test';

test.describe('認証フロー', () => {
	test('ログインボタンが表示される', async ({ page }) => {
		await page.goto('/');
		const loginButton = page.locator('header nav a[href="/login"]');
		await expect(loginButton).toBeVisible();
		await expect(loginButton).toHaveText('ログイン');
	});

	test('ログインボタンが /login へのリンクである', async ({ page }) => {
		await page.goto('/');
		const loginButton = page.locator('header nav a[href="/login"]');
		await expect(loginButton).toHaveAttribute('href', '/login');
	});

	test('ログインページに Google ログインボタンが表示される', async ({ page }) => {
		await page.goto('/login');
		// ログインページの見出し
		await expect(page.getByText('ログイン', { exact: false })).toBeVisible();
		// Google でログインボタン
		const googleButton = page.getByRole('button', { name: /Google でログイン/ });
		await expect(googleButton).toBeVisible();
	});

	test('Google ログインボタンは POST /api/auth/google のフォーム内にある', async ({ page }) => {
		await page.goto('/login');
		const form = page.locator('form[action="/api/auth/google"]');
		await expect(form).toBeVisible();
		await expect(form).toHaveAttribute('method', 'POST');
		const submitButton = form.locator('button[type="submit"]');
		await expect(submitButton).toBeVisible();
	});

	test('未ログイン時に /articles/new にアクセスするとログインページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/articles/new');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('未ログイン時に /mypage にアクセスするとログインページにリダイレクトされる', async ({
		page,
	}) => {
		await page.goto('/mypage');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('ログインページから新規登録ページへのリンクが存在する', async ({ page }) => {
		await page.goto('/login');
		const registerLink = page.locator('a[href="/register"]');
		await expect(registerLink).toBeVisible();
		await expect(registerLink).toHaveText('新規登録');
	});
});
