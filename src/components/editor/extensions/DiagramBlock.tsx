import CodeBlock from '@tiptap/extension-code-block';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { parseDiagramJson, renderDiagramSvg } from '@/components/diagram/renderDiagramSvg';

function DiagramNodeView({ node, editor, getPos, selected }: NodeViewProps) {
	const text = node.textContent;

	const svgHtml = useMemo(() => {
		const data = parseDiagramJson(text);
		if (!data) return null;
		return renderDiagramSvg(data);
	}, [text]);

	const handleDelete = useCallback(() => {
		const pos = getPos();
		if (pos === undefined) return;
		editor
			.chain()
			.command(({ tr, dispatch }) => {
				if (dispatch) {
					tr.delete(pos, pos + node.nodeSize);
				}
				return true;
			})
			.run();
	}, [editor, getPos, node.nodeSize]);

	if (!svgHtml) {
		return (
			<NodeViewWrapper>
				<div className="diagram-preview diagram-preview--error" contentEditable={false}>
					<div className="diagram-preview-header">
						<span className="diagram-preview-label">散開図 - エラー</span>
						<button
							type="button"
							className="diagram-preview-action-btn"
							onClick={handleDelete}
							title="削除"
						>
							<Trash2 size={12} />
						</button>
					</div>
					<pre className="diagram-preview-raw">
						<code>{text}</code>
					</pre>
				</div>
			</NodeViewWrapper>
		);
	}

	return (
		<NodeViewWrapper>
			<div
				className={`diagram-preview${selected ? ' diagram-preview--selected' : ''}`}
				contentEditable={false}
			>
				<div className="diagram-preview-header">
					<span className="diagram-preview-label">散開図</span>
					<button
						type="button"
						className="diagram-preview-action-btn"
						onClick={handleDelete}
						title="削除"
					>
						<Trash2 size={12} />
					</button>
				</div>
				<div className="diagram-preview-body">
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is generated from validated DiagramData via parseDiagramJson + renderDiagramSvg; input is JSON-parsed and type-checked, not raw user HTML */}
					<div className="diagram-container" dangerouslySetInnerHTML={{ __html: svgHtml }} />
				</div>
			</div>
		</NodeViewWrapper>
	);
}

export const DiagramBlock = CodeBlock.extend({
	name: 'diagramBlock',

	parseHTML() {
		return [
			{
				tag: 'pre',
				preserveWhitespace: 'full' as const,
				getAttrs: (node) => {
					const el = node as HTMLElement;
					const code = el.querySelector('code');
					if (!code?.classList.contains('language-diagram')) return false;
					return { language: 'diagram' };
				},
				priority: 200,
			},
		];
	},

	addStorage() {
		return {
			markdown: {
				serialize(state: { write: (text: string) => void }, node: { textContent: string }) {
					state.write(`\`\`\`diagram\n${node.textContent}\n\`\`\``);
				},
				parse: {},
			},
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(DiagramNodeView);
	},
});
