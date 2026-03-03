import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { useEffect, useState } from 'react';

const marked = new Marked();

interface MarkdownPreviewProps {
	body: string;
}

export function MarkdownPreview({ body }: MarkdownPreviewProps) {
	const [html, setHtml] = useState('');

	useEffect(() => {
		let cancelled = false;

		async function render() {
			const raw = await marked.parse(body);
			const sanitized = DOMPurify.sanitize(raw, { FORCE_BODY: true });
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
