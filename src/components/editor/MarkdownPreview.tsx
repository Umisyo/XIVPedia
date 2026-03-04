import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { useCallback, useEffect, useState } from 'react';

import { renderMacroBlock } from '../../lib/macro-highlight';

const marked = new Marked({
	renderer: {
		code({ text, lang }: { text: string; lang?: string | undefined }) {
			if (lang === 'ffxiv-macro') {
				return renderMacroBlock(text);
			}
			const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return `<pre><code>${escaped}</code></pre>`;
		},
	},
});

interface MarkdownPreviewProps {
	body: string;
}

export function MarkdownPreview({ body }: MarkdownPreviewProps) {
	const [html, setHtml] = useState('');

	useEffect(() => {
		let cancelled = false;

		async function render() {
			const raw = await marked.parse(body);
			// Content is sanitized via DOMPurify to prevent XSS
			const sanitized = DOMPurify.sanitize(raw, {
				FORCE_BODY: true,
				ADD_TAGS: ['button'],
				ADD_ATTR: ['data-macro-text', 'class'],
			});
			if (!cancelled) {
				setHtml(sanitized);
			}
		}

		render();
		return () => {
			cancelled = true;
		};
	}, [body]);

	const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;
		if (!target.classList.contains('ffxiv-macro-copy')) return;

		const macroText = target.getAttribute('data-macro-text');
		if (!macroText) return;

		navigator.clipboard.writeText(macroText).then(() => {
			const originalText = target.textContent;
			target.textContent = 'コピー済み';
			target.setAttribute('data-copied', 'true');
			setTimeout(() => {
				target.textContent = originalText;
				target.removeAttribute('data-copied');
			}, 2000);
		});
	}, []);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: Copy button click delegation, not interactive content
		// biome-ignore lint/a11y/noStaticElementInteractions: Event delegation for copy buttons inside rendered HTML
		<div
			className="article-content prose-preview"
			onClick={handleClick}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Content sanitized via DOMPurify
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
