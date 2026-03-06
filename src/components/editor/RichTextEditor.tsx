import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import type { EditorView } from '@tiptap/pm/view';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useRef, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import { EditorToolbar } from './EditorToolbar';
import { DiagramBlock } from './extensions/DiagramBlock';
import { MacroCodeBlock } from './MacroCodeBlock';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface RichTextEditorProps {
	content: string;
	onChange: (markdown: string) => void;
	onInsertMacro?: (macro: string) => void;
	onOpenDiagram?: () => void;
}

async function uploadImage(file: File): Promise<{ imageUrl: string; alt: string } | null> {
	if (!ALLOWED_IMAGE_TYPES.has(file.type)) return null;
	if (file.size > MAX_IMAGE_SIZE) return null;

	const metaRes = await fetch('/api/images/upload', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			filename: file.name,
			contentType: file.type,
			size: file.size,
		}),
	});
	if (!metaRes.ok) return null;

	const { uploadUrl, imageUrl } = await metaRes.json();

	const putRes = await fetch(uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': file.type },
		body: file,
	});
	if (!putRes.ok) return null;

	const alt = file.name.replace(/[[\]()]/g, '');
	return { imageUrl, alt };
}

export function RichTextEditor({
	content,
	onChange,
	onInsertMacro,
	onOpenDiagram,
}: RichTextEditorProps) {
	const [uploadError, setUploadError] = useState<string | null>(null);
	const isUploadingRef = useRef(false);

	const handleImageDrop = useCallback(
		(view: EditorView, event: DragEvent, _slice: unknown, moved: boolean): boolean => {
			if (moved || !event.dataTransfer?.files?.length) return false;

			const file = event.dataTransfer.files[0];
			if (!file || !ALLOWED_IMAGE_TYPES.has(file.type)) return false;

			event.preventDefault();
			if (isUploadingRef.current) return true;
			isUploadingRef.current = true;
			setUploadError(null);

			uploadImage(file)
				.then((result) => {
					if (result) {
						const { state } = view;
						const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
						const insertPos = pos?.pos ?? state.selection.from;
						const node = state.schema.nodes.image.create({ src: result.imageUrl, alt: result.alt });
						const tr = state.tr.insert(insertPos, node);
						view.dispatch(tr);
					} else {
						setUploadError('画像のアップロードに失敗しました');
					}
				})
				.catch(() => {
					setUploadError('画像のアップロードに失敗しました');
				})
				.finally(() => {
					isUploadingRef.current = false;
				});

			return true;
		},
		[],
	);

	const handleImagePaste = useCallback((view: EditorView, event: ClipboardEvent): boolean => {
		const items = event.clipboardData?.items;
		if (!items) return false;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (!file) continue;

				event.preventDefault();
				if (isUploadingRef.current) return true;
				isUploadingRef.current = true;
				setUploadError(null);

				uploadImage(file)
					.then((result) => {
						if (result) {
							const node = view.state.schema.nodes.image.create({
								src: result.imageUrl,
								alt: result.alt,
							});
							const tr = view.state.tr.replaceSelectionWith(node);
							view.dispatch(tr);
						} else {
							setUploadError('画像のアップロードに失敗しました');
						}
					})
					.catch(() => {
						setUploadError('画像のアップロードに失敗しました');
					})
					.finally(() => {
						isUploadingRef.current = false;
					});

				return true;
			}
		}
		return false;
	}, []);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			MacroCodeBlock,
			DiagramBlock,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
			}),
			Image.configure({
				inline: false,
				allowBase64: false,
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
			handleDrop: handleImageDrop,
			handlePaste: handleImagePaste,
		},
	});

	const handleInsertMacro = useCallback(
		(macro: string) => {
			if (!editor) return;
			if (onInsertMacro) {
				onInsertMacro(macro);
			} else {
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
			<EditorToolbar
				editor={editor}
				onInsertMacro={handleInsertMacro}
				onOpenDiagram={onOpenDiagram}
			/>
			<div className="h-[500px] overflow-y-auto rounded-b-md border border-input px-4 py-3 dark:bg-input/30">
				<EditorContent editor={editor} />
			</div>
			{uploadError && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
		</div>
	);
}
