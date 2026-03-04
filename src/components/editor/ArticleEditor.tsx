import { Eye, Gamepad2, Pen, Save, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TagInfo } from '@/lib/tags';
import { ImageUploader } from './ImageUploader';
import { MarkdownPreview } from './MarkdownPreview';
import { RichTextEditor } from './RichTextEditor';
import { TagSelector } from './TagSelector';

interface ArticleData {
	id: string;
	title: string;
	slug: string;
	body: string;
	status: string;
	tags: TagInfo[];
	patch?: string | null;
}

interface ArticleEditorProps {
	mode: 'new' | 'edit';
	tags: TagInfo[];
	article?: ArticleData;
}

type EditorMode = 'visual' | 'markdown';

export function ArticleEditor({ mode, tags, article }: ArticleEditorProps) {
	const [title, setTitle] = useState(article?.title ?? '');
	const [body, setBody] = useState(article?.body ?? '');
	const [selectedTags, setSelectedTags] = useState<string[]>(article?.tags.map((t) => t.id) ?? []);
	const [patch, setPatch] = useState(article?.patch ?? '');
	const [patchIndependent, setPatchIndependent] = useState(
		article?.patch === null || article?.patch === undefined ? mode === 'new' : false,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
	const [editorMode, setEditorMode] = useState<EditorMode>('visual');
	const [richEditorKey, setRichEditorKey] = useState(0);

	const [showMacroDialogMd, setShowMacroDialogMd] = useState(false);
	const [macroTextMd, setMacroTextMd] = useState('');

	const macroLineCountMd = macroTextMd ? macroTextMd.split('\n').length : 0;

	const handleImageInsert = useCallback((markdown: string) => {
		setBody((prev) => `${prev}\n${markdown}\n`);
	}, []);

	const handleInsertMacro = useCallback((macro: string) => {
		const macroBlock = `\n\n\`\`\`ffxiv-macro\n${macro}\n\`\`\`\n`;
		setBody((prev) => prev + macroBlock);
		setRichEditorKey((prev) => prev + 1);
	}, []);

	const insertMacroMd = useCallback(() => {
		if (macroTextMd.trim()) {
			handleInsertMacro(macroTextMd.trim());
		}
		setMacroTextMd('');
		setShowMacroDialogMd(false);
	}, [macroTextMd, handleInsertMacro]);

	const cancelMacroMd = useCallback(() => {
		setMacroTextMd('');
		setShowMacroDialogMd(false);
	}, []);

	const handleEditorModeChange = useCallback(
		(newMode: EditorMode) => {
			if (newMode === editorMode) return;
			if (newMode === 'visual') {
				setRichEditorKey((prev) => prev + 1);
			}
			setEditorMode(newMode);
		},
		[editorMode],
	);

	async function handleSubmit(status: 'draft' | 'published') {
		setErrors({});
		setIsSubmitting(true);

		try {
			const payload = {
				title,
				body,
				tags: selectedTags,
				status,
				patch: patchIndependent ? null : patch || null,
			};

			const url = mode === 'new' ? '/api/articles' : `/api/articles/${article?.slug}`;
			const method = mode === 'new' ? 'POST' : 'PUT';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const json = await res.json();
				const errBody = json?.error;
				if (errBody?.details) {
					setErrors(errBody.details);
				} else {
					setErrors({ _: [errBody?.message ?? '保存に失敗しました'] });
				}
				return;
			}

			const { data } = await res.json();
			window.location.href = `/articles/${data.slug}`;
		} catch {
			setErrors({ _: ['ネットワークエラーが発生しました'] });
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* Global errors */}
			{errors._ && (
				<div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{errors._.map((msg) => (
						<p key={msg}>{msg}</p>
					))}
				</div>
			)}

			{/* Title */}
			<div className="space-y-2">
				<Label htmlFor="title">タイトル</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="記事のタイトル"
					maxLength={100}
					aria-invalid={!!errors.title}
				/>
				{errors.title && <p className="text-sm text-destructive">{errors.title[0]}</p>}
				<p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
			</div>

			{/* Tags */}
			<TagSelector tags={tags} selectedIds={selectedTags} onChange={setSelectedTags} />
			{errors.tags && <p className="text-sm text-destructive">{errors.tags[0]}</p>}

			{/* Patch */}
			<div className="space-y-2">
				<Label>パッチバージョン</Label>
				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={patchIndependent}
							onChange={(e) => {
								setPatchIndependent(e.target.checked);
								if (e.target.checked) setPatch('');
							}}
							className="rounded border-input"
						/>
						パッチに依存しない
					</label>
					{!patchIndependent && (
						<Input
							value={patch}
							onChange={(e) => setPatch(e.target.value)}
							placeholder="例: 7.0"
							className="w-32"
							maxLength={10}
						/>
					)}
				</div>
				{errors.patch && <p className="text-sm text-destructive">{errors.patch[0]}</p>}
			</div>

			{/* Editor */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>本文</Label>
					<div className="flex gap-1 rounded-md border border-input p-0.5">
						<button
							type="button"
							onClick={() => handleEditorModeChange('visual')}
							className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
								editorMode === 'visual'
									? 'bg-secondary text-foreground'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<Eye className="h-3.5 w-3.5" />
							ビジュアル
						</button>
						<button
							type="button"
							onClick={() => handleEditorModeChange('markdown')}
							className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
								editorMode === 'markdown'
									? 'bg-secondary text-foreground'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<Pen className="h-3.5 w-3.5" />
							Markdown
						</button>
					</div>
				</div>

				{editorMode === 'visual' ? (
					<>
						<RichTextEditor
							key={richEditorKey}
							content={body}
							onChange={setBody}
							onInsertMacro={handleInsertMacro}
						/>
						{errors.body && <p className="text-sm text-destructive mt-1">{errors.body[0]}</p>}
						<p className="text-xs text-muted-foreground text-right mt-1">
							{body.length.toLocaleString()}/50,000
						</p>
					</>
				) : (
					<>
						{/* Mobile tab switcher */}
						<div className="flex gap-1 md:hidden">
							<button
								type="button"
								onClick={() => setActiveTab('edit')}
								className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									activeTab === 'edit'
										? 'bg-secondary text-foreground'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								エディター
							</button>
							<button
								type="button"
								onClick={() => setActiveTab('preview')}
								className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									activeTab === 'preview'
										? 'bg-secondary text-foreground'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								プレビュー
							</button>
						</div>

						{/* Two-column layout (desktop) / Tab content (mobile) */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className={activeTab !== 'edit' ? 'hidden md:block' : ''}>
								<textarea
									value={body}
									onChange={(e) => setBody(e.target.value)}
									placeholder="Markdown で記事を書く..."
									className="h-[500px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none font-mono dark:bg-input/30"
									aria-invalid={!!errors.body}
								/>
								{errors.body && <p className="text-sm text-destructive mt-1">{errors.body[0]}</p>}
								<p className="text-xs text-muted-foreground text-right mt-1">
									{body.length.toLocaleString()}/50,000
								</p>
							</div>
							<div
								className={`rounded-md border border-border p-4 overflow-y-auto h-[500px] ${
									activeTab !== 'preview' ? 'hidden md:block' : ''
								}`}
							>
								{body ? (
									<MarkdownPreview body={body} />
								) : (
									<p className="text-sm text-muted-foreground">プレビューがここに表示されます</p>
								)}
							</div>
						</div>
					</>
				)}
			</div>

			{/* Image uploader & Macro insert (Markdown mode only) */}
			{editorMode === 'markdown' && (
				<div className="space-y-3">
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setShowMacroDialogMd(true)}
						>
							<Gamepad2 className="h-4 w-4 mr-1" />
							マクロ挿入
						</Button>
					</div>
					<ImageUploader onInsert={handleImageInsert} />
				</div>
			)}

			{showMacroDialogMd && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg">
						<h3 className="text-lg font-semibold mb-4">FF14マクロを挿入</h3>
						<div className="space-y-3">
							<textarea
								value={macroTextMd}
								onChange={(e) => {
									const lines = e.target.value.split('\n');
									if (lines.length <= 15) {
										setMacroTextMd(e.target.value);
									}
								}}
								placeholder={'/ac アクション名 <wait.3>\n/p メッセージ <se.1>'}
								className="w-full h-48 rounded-md border border-input bg-[#1a1a2e] px-3 py-2 text-sm font-mono text-[#c8d0d8] placeholder:text-[#4a5568] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-none"
								// biome-ignore lint/a11y/noAutofocus: Macro dialog textarea needs immediate focus
								autoFocus
							/>
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>各行が / で始まるマクロコマンドです</span>
								<span className={macroLineCountMd > 15 ? 'text-destructive' : ''}>
									{macroLineCountMd}/15行
								</span>
							</div>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<Button type="button" variant="outline" onClick={cancelMacroMd}>
								キャンセル
							</Button>
							<Button type="button" onClick={insertMacroMd} disabled={!macroTextMd.trim()}>
								挿入
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Submit buttons */}
			<div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-border">
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onClick={() => handleSubmit('draft')}
				>
					<Save className="h-4 w-4" />
					下書き保存
				</Button>
				<Button type="button" disabled={isSubmitting} onClick={() => handleSubmit('published')}>
					<Send className="h-4 w-4" />
					公開する
				</Button>
			</div>
		</div>
	);
}
