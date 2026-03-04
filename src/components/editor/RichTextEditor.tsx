import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback } from 'react';
import { Markdown } from 'tiptap-markdown';
import { EditorToolbar } from './EditorToolbar';
import { DiagramBlock } from './extensions/DiagramBlock';
import { MacroCodeBlock } from './MacroCodeBlock';

interface RichTextEditorProps {
	content: string;
	onChange: (markdown: string) => void;
	onInsertMacro?: (macro: string) => void;
}

export function RichTextEditor({ content, onChange, onInsertMacro }: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
				codeBlock: false,
			}),
			MacroCodeBlock,
			DiagramBlock,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
			}),
			Placeholder.configure({
				placeholder: 'ビジュアルモードで記事を書く...',
			}),
			Markdown.configure({
				html: false,
				transformPastedText: true,
				transformCopiedText: true,
			}),
		],
		content,
		onUpdate: ({ editor }) => {
			const storage = editor.storage as unknown as Record<string, { getMarkdown: () => string }>;
			const md = storage.markdown.getMarkdown();
			onChange(md);
		},
		editorProps: {
			attributes: {
				class: 'tiptap-editor outline-none',
			},
		},
	});

	const handleInsertMacro = useCallback(
		(macro: string) => {
			if (!editor) return;
			if (onInsertMacro) {
				onInsertMacro(macro);
			} else {
				// Fallback: append macro block via Markdown storage
				const storage = editor.storage as unknown as Record<string, { getMarkdown: () => string }>;
				const currentMd = storage.markdown.getMarkdown();
				const macroBlock = `\n\n\`\`\`ffxiv-macro\n${macro}\n\`\`\`\n`;
				const newMd = currentMd + macroBlock;
				onChange(newMd);
			}
		},
		[editor, onInsertMacro, onChange],
	);

	if (!editor) {
		return (
			<div className="flex flex-col">
				<div className="h-9 rounded-t-md border border-b-0 border-input bg-secondary/50" />
				<div className="h-[500px] rounded-b-md border border-input dark:bg-input/30" />
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<EditorToolbar editor={editor} onInsertMacro={handleInsertMacro} />
			<div className="h-[500px] overflow-y-auto rounded-b-md border border-input px-4 py-3 dark:bg-input/30">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
