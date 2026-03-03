import { Marked } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['vitesse-dark'],
			langs: [
				'javascript',
				'typescript',
				'html',
				'css',
				'json',
				'markdown',
				'bash',
				'yaml',
				'xml',
				'python',
				'lua',
			],
		});
	}
	return highlighterPromise;
}

export async function renderMarkdown(markdown: string): Promise<string> {
	const highlighter = await getHighlighter();

	const marked = new Marked();

	const renderer = {
		code({ text, lang }: { text: string; lang?: string | undefined }) {
			const language = lang || 'text';
			try {
				const loadedLangs: string[] = highlighter.getLoadedLanguages();
				if (loadedLangs.includes(language)) {
					return highlighter.codeToHtml(text, {
						lang: language,
						theme: 'vitesse-dark',
					});
				}
			} catch {
				// Fall through to plain code block
			}
			const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return `<pre class="shiki"><code>${escaped}</code></pre>`;
		},
	};

	marked.use({ renderer });

	const html = await marked.parse(markdown);
	return html;
}
