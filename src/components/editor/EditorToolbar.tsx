import type { Editor } from '@tiptap/react';
import {
	Bold,
	Gamepad2,
	Grid2x2,
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
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
	editor: Editor;
	onInsertMacro: (macro: string) => void;
	onOpenDiagram?: () => void;
}

export function EditorToolbar({ editor, onInsertMacro, onOpenDiagram }: EditorToolbarProps) {
	const [linkUrl, setLinkUrl] = useState('');
	const [showLinkInput, setShowLinkInput] = useState(false);
	const [showMacroDialog, setShowMacroDialog] = useState(false);
	const [macroText, setMacroText] = useState('');
	const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

	const macroLineCount = macroText ? macroText.split('\n').length : 0;

	const insertMacro = useCallback(() => {
		if (macroText.trim()) {
			onInsertMacro(macroText.trim());
		}
		setMacroText('');
		setShowMacroDialog(false);
	}, [macroText, onInsertMacro]);

	const cancelMacro = useCallback(() => {
		setMacroText('');
		setShowMacroDialog(false);
		editor.chain().focus().run();
	}, [editor]);

	const toggleLink = useCallback(() => {
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const { from, to } = editor.state.selection;
		savedSelectionRef.current = { from, to };
		setShowLinkInput(true);
	}, [editor]);

	const applyLink = useCallback(() => {
		if (linkUrl && /^(https?:\/\/|mailto:)/i.test(linkUrl)) {
			const chain = editor.chain().focus();
			if (savedSelectionRef.current) {
				const { from, to } = savedSelectionRef.current;
				chain.setTextSelection({ from, to });
			}
			chain.setLink({ href: linkUrl }).run();
		}
		setLinkUrl('');
		setShowLinkInput(false);
		savedSelectionRef.current = null;
	}, [editor, linkUrl]);

	const cancelLink = useCallback(() => {
		setLinkUrl('');
		setShowLinkInput(false);
		savedSelectionRef.current = null;
		editor.chain().focus().run();
	}, [editor]);

	return (
		<div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-input bg-secondary/50 px-1 py-1">
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				active={editor.isActive('heading', { level: 1 })}
				tooltip="見出し1"
			>
				<Heading1 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				active={editor.isActive('heading', { level: 2 })}
				tooltip="見出し2"
			>
				<Heading2 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				active={editor.isActive('heading', { level: 3 })}
				tooltip="見出し3"
			>
				<Heading3 className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				active={editor.isActive('bold')}
				tooltip="太字"
			>
				<Bold className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				active={editor.isActive('italic')}
				tooltip="斜体"
			>
				<Italic className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				active={editor.isActive('bulletList')}
				tooltip="箇条書き"
			>
				<List className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				active={editor.isActive('orderedList')}
				tooltip="番号付きリスト"
			>
				<ListOrdered className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				active={editor.isActive('blockquote')}
				tooltip="引用"
			>
				<Quote className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarSeparator />

			<ToolbarButton onClick={toggleLink} active={editor.isActive('link')} tooltip="リンクを挿入">
				<Link className="h-4 w-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<div className="flex items-center gap-1 ml-0.5">
				<button
					type="button"
					onClick={() => setShowMacroDialog(true)}
					className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
				>
					<Gamepad2 className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">マクロ</span>
				</button>
				{onOpenDiagram && (
					<button
						type="button"
						onClick={onOpenDiagram}
						className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
					>
						<Grid2x2 className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">散開図</span>
					</button>
				)}
			</div>

			<ToolbarSeparator />

			<ToolbarButton
				onClick={() => editor.chain().focus().undo().run()}
				active={false}
				disabled={!editor.can().undo()}
				tooltip="元に戻す"
			>
				<Undo className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().redo().run()}
				active={false}
				disabled={!editor.can().redo()}
				tooltip="やり直す"
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

			{showMacroDialog && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="macro-dialog-title"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onKeyDown={(e) => {
						if (e.key === 'Escape') cancelMacro();
					}}
				>
					<div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg">
						<h3 id="macro-dialog-title" className="text-lg font-semibold mb-4">
							FF14マクロを挿入
						</h3>
						<div className="space-y-3">
							<textarea
								value={macroText}
								onChange={(e) => {
									const lines = e.target.value.split('\n');
									if (lines.length <= 15) {
										setMacroText(e.target.value);
									}
								}}
								placeholder={'/ac アクション名 <wait.3>\n/p メッセージ <se.1>'}
								className="w-full h-48 rounded-md border border-input bg-[#1a1a2e] px-3 py-2 text-sm font-mono text-[#c8d0d8] placeholder:text-[#4a5568] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-none"
								// biome-ignore lint/a11y/noAutofocus: Macro dialog textarea needs immediate focus
								autoFocus
							/>
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>各行が / で始まるマクロコマンドです</span>
								<span className={macroLineCount > 15 ? 'text-destructive' : ''}>
									{macroLineCount}/15行
								</span>
							</div>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<Button type="button" variant="outline" onClick={cancelMacro}>
								キャンセル
							</Button>
							<Button type="button" onClick={insertMacro} disabled={!macroText.trim()}>
								挿入
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function ToolbarButton({
	onClick,
	active,
	disabled,
	tooltip,
	children,
}: {
	onClick: () => void;
	active: boolean;
	disabled?: boolean;
	tooltip: string;
	children: React.ReactNode;
}) {
	return (
		<div className="group relative">
			<button
				type="button"
				onClick={onClick}
				disabled={disabled}
				aria-label={tooltip}
				className={`inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors disabled:opacity-40 ${
					active
						? 'bg-secondary text-foreground'
						: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
				}`}
			>
				{children}
			</button>
			<span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border opacity-0 transition-opacity group-hover:opacity-100">
				{tooltip}
			</span>
		</div>
	);
}

function ToolbarSeparator() {
	return <div className="mx-0.5 h-5 w-px bg-border" />;
}
