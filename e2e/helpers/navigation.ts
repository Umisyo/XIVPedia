import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { ArticlePage } from '../pages/article.page';

/**
 * 記事詳細ページに遷移するヘルパー。
 * 記事一覧から最初の記事へ遷移する。記事がなければテストをスキップする。
 */
export async function navigateToFirstArticle(page: Page): Promise<ArticlePage> {
	await page.goto('/articles');

	const articleLinks = page.locator('a[href^="/articles/"]').filter({
		has: page.locator('h2'),
	});
	const count = await articleLinks.count();

	if (count === 0) {
		test.skip(true, '記事が存在しないためスキップ');
		return new ArticlePage(page);
	}

	await articleLinks.first().click();

	const articlePage = new ArticlePage(page);
	await expect(articlePage.title).toBeVisible();

	return articlePage;
}
