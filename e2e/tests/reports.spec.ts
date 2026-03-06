import { expect, test } from '@playwright/test';
import { navigateToFirstArticle } from '../helpers/navigation';

test.describe('通報フロー', () => {
	test('未ログイン時は記事詳細ページに通報ボタンが表示されない', async ({ page }) => {
		await navigateToFirstArticle(page);

		// ReportButton は isLoggedIn=false の場合 null を返すため表示されない
		const reportButton = page.getByRole('button', { name: '通報する' });
		await expect(reportButton).not.toBeVisible();
	});

	test('未ログイン時は通報テキストが表示されない', async ({ page }) => {
		await navigateToFirstArticle(page);

		// 通報ボタンのラベルテキストも表示されない
		const reportText = page.locator('button').filter({ hasText: '通報' });
		await expect(reportText).not.toBeVisible();
	});
});
