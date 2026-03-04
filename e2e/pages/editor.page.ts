import type { Locator, Page } from '@playwright/test';

export class EditorPage {
	constructor(private page: Page) {}

	async gotoNew() {
		await this.page.goto('/articles/new');
	}

	async gotoEdit(slug: string) {
		await this.page.goto(`/articles/${slug}/edit`);
	}

	get heading(): Locator {
		return this.page.getByRole('heading', { level: 1 });
	}

	get titleInput(): Locator {
		return this.page.locator('#title');
	}

	get bodyEditor(): Locator {
		return this.page.getByPlaceholder('Markdown で記事を書く...');
	}

	get publishButton(): Locator {
		return this.page.getByRole('button', { name: '公開する' });
	}

	get draftButton(): Locator {
		return this.page.getByRole('button', { name: '下書き保存' });
	}

	get tagSelector(): Locator {
		return this.page.locator('[class*="TagSelector"], [data-testid="tag-selector"]');
	}

	get visualModeButton(): Locator {
		return this.page.getByRole('button', { name: 'ビジュアル' });
	}

	get markdownModeButton(): Locator {
		return this.page.getByRole('button', { name: 'Markdown' });
	}

	get patchInput(): Locator {
		return this.page.getByPlaceholder('例: 7.0');
	}

	get patchIndependentCheckbox(): Locator {
		return this.page.getByLabel('パッチに依存しない');
	}

	get diagramButton(): Locator {
		return this.page.getByRole('button', { name: '散開図' });
	}

	async fillTitle(title: string) {
		await this.titleInput.fill(title);
	}

	async fillBody(body: string) {
		// Markdown モードに切り替えてからテキストエリアに入力
		await this.markdownModeButton.click();
		await this.bodyEditor.fill(body);
	}

	async selectTag(tagName: string) {
		await this.tagSelector.click();
		await this.page.getByText(tagName).click();
	}

	async publish() {
		await this.publishButton.click();
	}

	async saveDraft() {
		await this.draftButton.click();
	}
}
