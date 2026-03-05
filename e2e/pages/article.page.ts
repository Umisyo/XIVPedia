import type { Locator, Page } from '@playwright/test';

export class ArticlePage {
	constructor(private page: Page) {}

	async goto(slug: string) {
		await this.page.goto(`/articles/${slug}`);
	}

	// 記事詳細
	get title(): Locator {
		return this.page.locator('article header h1');
	}

	get content(): Locator {
		return this.page.locator('.article-content');
	}

	get authorName(): Locator {
		return this.page.locator('article header .font-medium').first();
	}

	get tags(): Locator {
		return this.page.locator('article header .bg-secondary');
	}

	get patchBadge(): Locator {
		return this.page.locator('article header').getByText(/^Patch /);
	}

	get editButton(): Locator {
		return this.page.getByRole('link', { name: '編集' });
	}

	get deleteButton(): Locator {
		return this.page.getByRole('button', { name: '削除' });
	}

	// リアクション
	get reactionButton(): Locator {
		return this.page.locator('article button').filter({ hasText: '👍' });
	}

	get reactionCount(): Locator {
		return this.reactionButton.locator('span').last();
	}

	get reactionLoginHint(): Locator {
		return this.page.getByRole('link', { name: 'ログインしてリアクション' });
	}

	async toggleReaction() {
		await this.reactionButton.click();
	}

	// コメント
	get commentSection(): Locator {
		return this.page.locator('section').filter({ hasText: 'コメント' });
	}

	get commentHeading(): Locator {
		return this.page.getByRole('heading', { name: /コメント/ });
	}

	get commentInput(): Locator {
		return this.page.getByPlaceholder('コメントを入力...');
	}

	get commentSubmitButton(): Locator {
		return this.page.getByRole('button', { name: '投稿する' });
	}

	get commentList(): Locator {
		return this.commentSection.locator('.rounded-lg.border.border-border.bg-card');
	}

	get commentLoginPrompt(): Locator {
		return this.page.getByText('ログインしてコメントする');
	}

	get loadMoreButton(): Locator {
		return this.page.getByRole('button', { name: 'もっと読む' });
	}

	get noCommentsMessage(): Locator {
		return this.page.getByText('まだコメントはありません');
	}

	async postComment(text: string) {
		await this.commentInput.fill(text);
		await this.commentSubmitButton.click();
	}

	async deleteComment(index: number) {
		const deleteButtons = this.commentSection.getByRole('button', { name: '削除' });
		await deleteButtons.nth(index).click();
	}
}
