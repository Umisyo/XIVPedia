import type { Editor } from '@tiptap/react';
import {
	Bold,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link,
	List,
	ListOrdered,
	Quote,
	Redo,
	Undo,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
	editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
	const [linkUrl, setLinkUrl] = useState('');
	const [showLinkInput, setShowLinkInput] = useState(false);

	const toggleLink = useCallback(() => {
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		setShowLinkInput(true);
	}, [editor]);

	const applyLink = useCallback(() => {
		if (linkUrl && /^(https?:\/\/|mailto:)/i.test(linkUrl)) {
			editor.chain().focus().setLink({ href: linkUrl }).run();
		}
		setLinkUrl('');
		setShowLinkInput(false);
	}, [editor, linkUrl]);

	const cancelLink = useCallback(() => {
		setLinkUrl('');
		setShowLinkInput(false);
		editor.chain().focus().run();
	}, [editor]);

	return (
		<div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-input bg-secondary/50 px-1 py-1">
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				active={editor.isActive('heading', { level: 1 })}
				title="見出し1"
			>
				<Heading1 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				active={editor.isActive('heading', { level: 2 })}
				title="見出し2"
			>
				<Heading2 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				active={editor.isActive('heading', { level: 3 })}
				title="見出し3"
			>
				<Heading3 className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				active={editor.isActive('bold')}
				title="太字"
			>
				<Bold className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				active={editor.isActive('italic')}
				title="斜体"
			>
				<Italic className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				active={editor.isActive('bulletList')}
				title="箇条書き"
			>
				<List className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				active={editor.isActive('orderedList')}
				title="番号付きリスト"
			>
				<ListOrdered className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				active={editor.isActive('blockquote')}
				title="引用"
			>
				<Quote className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				active={editor.isActive('codeBlock')}
				title="コードブロック"
			>
				<Code className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton onClick={toggleLink} active={editor.isActive('link')} title="リンク">
				<Link className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().undo().run()}
				active={false}
				disabled={!editor.can().undo()}
				title="元に戻す"
			>
				<Undo className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().redo().run()}
				active={false}
				disabled={!editor.can().redo()}
				title="やり直す"
			>
				<Redo className="h-4 w-4" />
			</ToolbarButton>

			{showLinkInput && (
				<div className="flex items-center gap-1 ml-2">
					<input
						type="url"
						value={linkUrl}
						onChange={(e) => setLinkUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') applyLink();
							if (e.key === 'Escape') cancelLink();
						}}
						placeholder="URLを入力..."
						className="h-7 w-48 rounded border border-input bg-transparent px-2 text-xs outline-none focus:border-ring"
						// biome-ignore lint/a11y/noAutofocus: Link input needs immediate focus
						autoFocus
					/>
					<Button type="button" variant="ghost" size="xs" onClick={applyLink}>
						OK
					</Button>
					<Button type="button" variant="ghost" size="xs" onClick={cancelLink}>
						取消
					</Button>
				</div>
			)}
		</div>
	);
}

function ToolbarButton({
	onClick,
	active,
	disabled,
	title,
	children,
}: {
	onClick: () => void;
	active: boolean;
	disabled?: boolean;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={`inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors disabled:opacity-40 ${
				active
					? 'bg-secondary text-foreground'
					: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
			}`}
		>
			{children}
		</button>
	);
}

function ToolbarSeparator() {
	return <div className="mx-0.5 h-5 w-px bg-border" />;
}
