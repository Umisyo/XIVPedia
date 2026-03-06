import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { highlightMacroLine } from '../../lib/macro-highlight';

export function MacroBlockNodeView({ node, editor, getPos }: NodeViewProps) {
	const language = node.attrs.language as string | undefined;

	if (language !== 'ffxiv-macro') {
		return (
			<NodeViewWrapper as="pre">
				<NodeViewContent<'code'> as="code" />
			</NodeViewWrapper>
		);
	}

	return <MacroPreview node={node} editor={editor} getPos={getPos} />;
}

function MacroPreview({ node, editor, getPos }: Pick<NodeViewProps, 'node' | 'editor' | 'getPos'>) {
	const text = node.textContent;
	const lines = text.split('\n');
	const lineCount = lines.length;
	// highlightMacroLine escapes all HTML entities before wrapping in span tags
	const highlighted = lines.map((line) => highlightMacroLine(line)).join('\n');

	const [editing, setEditing] = useState(false);
	const [editText, setEditText] = useState(text);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setEditText(text);
	}, [text]);

	useEffect(() => {
		if (editing && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [editing]);

	const editLineCount = editText ? editText.split('\n').length : 0;

	const handleSave = useCallback(() => {
		const pos = getPos();
		if (pos === undefined) return;
		const trimmed = editText.trim();
		if (!trimmed) return;

		editor
			.chain()
			.command(({ tr, dispatch }) => {
				if (dispatch) {
					const newNode = editor.schema.nodes.macroCodeBlock.create(
						{ language: 'ffxiv-macro' },
						trimmed ? editor.schema.text(trimmed) : undefined,
					);
					tr.replaceWith(pos, pos + node.nodeSize, newNode);
				}
				return true;
			})
			.run();
		setEditing(false);
	}, [editText, editor, getPos, node.nodeSize]);

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

	const handleCancel = useCallback(() => {
		setEditText(text);
		setEditing(false);
	}, [text]);

	if (editing) {
		return (
			<NodeViewWrapper>
				<div className="ffxiv-macro-block" contentEditable={false}>
					<div className="ffxiv-macro-header">
						<span className="ffxiv-macro-label">FFXIV マクロ - 編集中</span>
					</div>
					<div style={{ padding: '0.75rem 1rem' }}>
						<textarea
							ref={textareaRef}
							value={editText}
							onChange={(e) => {
								const newLines = e.target.value.split('\n');
								if (newLines.length <= 15) {
									setEditText(e.target.value);
								}
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') handleCancel();
								if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
							}}
							className="w-full h-40 rounded-md border border-[#0f3460] bg-[#12122a] px-3 py-2 text-sm font-mono text-[#c8d0d8] placeholder:text-[#4a5568] outline-none resize-none"
							placeholder="/ac アクション名 <wait.3>"
						/>
						<div className="flex items-center justify-between mt-2">
							<span className={`text-xs ${editLineCount > 15 ? 'text-red-400' : 'text-[#6080a0]'}`}>
								{editLineCount}/15行（Ctrl+Enter で保存）
							</span>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleCancel}
									className="px-3 py-1 text-xs rounded border border-[#0f3460] text-[#a0b4d0] hover:bg-[#1a4080]"
								>
									キャンセル
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={!editText.trim()}
									className="px-3 py-1 text-xs rounded bg-[#0f3460] text-[#a0b4d0] hover:bg-[#1a4080] disabled:opacity-40"
								>
									保存
								</button>
							</div>
						</div>
					</div>
				</div>
			</NodeViewWrapper>
		);
	}

	return (
		<NodeViewWrapper>
			<div className="ffxiv-macro-block" contentEditable={false}>
				<div className="ffxiv-macro-header">
					<span className="ffxiv-macro-label">FFXIV マクロ</span>
					<div className="ffxiv-macro-actions">
						<button
							type="button"
							className="ffxiv-macro-action-btn"
							onClick={() => setEditing(true)}
							title="編集"
						>
							<Pencil size={12} />
						</button>
						<button
							type="button"
							className="ffxiv-macro-action-btn"
							onClick={handleDelete}
							title="削除"
						>
							<Trash2 size={12} />
						</button>
					</div>
				</div>
				<pre className="ffxiv-macro-code">
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Macro text is HTML-escaped by highlightMacroLine before wrapping in span tags */}
					<code dangerouslySetInnerHTML={{ __html: highlighted }} />
				</pre>
				<div className="ffxiv-macro-footer">
					<span className="ffxiv-macro-line-count">{lineCount}/15行</span>
				</div>
			</div>
		</NodeViewWrapper>
	);
}
