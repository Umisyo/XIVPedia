import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
	content: string;
	onChange: (markdown: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
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
			const md = editor.storage.markdown.getMarkdown();
			onChange(md);
		},
		editorProps: {
			attributes: {
				class: 'tiptap-editor outline-none',
			},
		},
	});

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
			<EditorToolbar editor={editor} />
			<div className="h-[500px] overflow-y-auto rounded-b-md border border-input px-4 py-3 dark:bg-input/30">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
