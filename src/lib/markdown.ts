import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import vitesseDark from 'shiki/themes/vitesse-dark.mjs';
import { parseDiagramJson, renderDiagramSvg } from '@/components/diagram/renderDiagramSvg';

import { renderMacroBlock } from './macro-highlight';

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighterCore({
			themes: [vitesseDark],
			langs: [
				import('shiki/langs/javascript.mjs'),
				import('shiki/langs/typescript.mjs'),
				import('shiki/langs/html.mjs'),
				import('shiki/langs/css.mjs'),
				import('shiki/langs/json.mjs'),
				import('shiki/langs/markdown.mjs'),
				import('shiki/langs/bash.mjs'),
				import('shiki/langs/yaml.mjs'),
				import('shiki/langs/xml.mjs'),
				import('shiki/langs/python.mjs'),
				import('shiki/langs/lua.mjs'),
			],
			engine: createJavaScriptRegexEngine(),
		});
	}
	return highlighterPromise;
}

export async function renderMarkdown(markdown: string): Promise<string> {
	const highlighter = await getHighlighter();

	const marked = new Marked();

	const renderer = {
		code({ text, lang }: { text: string; lang?: string | undefined }) {
			if (lang === 'diagram') {
				const data = parseDiagramJson(text);
				if (data) {
					return `<div class="diagram-container">${renderDiagramSvg(data)}</div>`;
				}
			}

			// FF14マクロブロックは専用レンダラーで処理
			if (lang === 'ffxiv-macro') {
				return renderMacroBlock(text);
			}

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
	const sanitized = sanitizeHtml(html, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			'img',
			'svg',
			'circle',
			'rect',
			'line',
			'text',
			'pre',
			'code',
			'span',
			'div',
			'button',
		]),
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			'*': ['class', 'style'],
			img: ['src', 'alt', 'width', 'height'],
			svg: ['xmlns', 'viewBox', 'width', 'height'],
			circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'opacity'],
			rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'rx', 'opacity'],
			line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
			text: ['x', 'y', 'text-anchor', 'fill', 'font-size', 'font-weight', 'font-family'],
			span: ['style'],
			code: ['class'],
			pre: ['class'],
			a: ['href', 'target', 'rel'],
			button: ['type', 'class', 'data-macro-text'],
		},
		allowedSchemes: ['http', 'https'],
		disallowedTagsMode: 'discard',
	});
	return sanitized;
}
