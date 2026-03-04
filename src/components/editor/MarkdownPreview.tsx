import { parseDiagramJson, renderDiagramSvg } from '@/components/diagram/renderDiagramSvg';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { useEffect, useState } from 'react';

const marked = new Marked({
	renderer: {
		code({ text, lang }: { text: string; lang?: string | undefined }) {
			if (lang === 'diagram') {
				const data = parseDiagramJson(text);
				if (data) {
					return `<div class="diagram-container">${renderDiagramSvg(data)}</div>`;
				}
			}
			const escaped = text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
			return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
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
			const sanitized = DOMPurify.sanitize(raw, {
				FORCE_BODY: true,
				ADD_TAGS: ['svg', 'circle', 'rect', 'line', 'text', 'g', 'defs', 'clipPath'],
				ADD_ATTR: ['viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'rx', 'ry', 'opacity', 'text-anchor', 'font-size', 'font-weight', 'font-family', 'xmlns', 'd'],
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

	return (
		<div
			className="article-content prose-preview"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Content sanitized via DOMPurify
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
