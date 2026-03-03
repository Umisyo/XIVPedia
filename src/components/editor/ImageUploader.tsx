import { Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploaderProps {
	onInsert: (markdown: string) => void;
}

export function ImageUploader({ onInsert }: ImageUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const upload = useCallback(
		async (file: File) => {
			setError(null);

			if (!ALLOWED_TYPES.has(file.type)) {
				setError('対応形式: PNG, JPEG, WebP, GIF');
				return;
			}
			if (file.size > MAX_SIZE) {
				setError('ファイルサイズは5MB以下にしてください');
				return;
			}

			setIsUploading(true);
			try {
				// Step 1: Get upload URL
				const metaRes = await fetch('/api/images/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						filename: file.name,
						contentType: file.type,
						size: file.size,
					}),
				});

				if (!metaRes.ok) {
					const err = await metaRes.json();
					throw new Error(err.message ?? 'アップロードURLの取得に失敗しました');
				}

				const { uploadUrl, imageUrl } = await metaRes.json();

				// Step 2: Upload binary to R2
				const putRes = await fetch(uploadUrl, {
					method: 'PUT',
					headers: { 'Content-Type': file.type },
					body: file,
				});

				if (!putRes.ok) {
					throw new Error('画像のアップロードに失敗しました');
				}

				// Step 3: Insert markdown
				const safeAlt = file.name.replace(/[[\]()]/g, '');
				onInsert(`![${safeAlt}](${imageUrl})`);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'アップロードに失敗しました');
			} finally {
				setIsUploading(false);
			}
		},
		[onInsert],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const file = e.dataTransfer.files[0];
			if (file) upload(file);
		},
		[upload],
	);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) upload(file);
			if (inputRef.current) inputRef.current.value = '';
		},
		[upload],
	);

	return (
		<div className="space-y-2">
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Drop zone requires drag events on div */}
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
					isDragging
						? 'border-primary bg-primary/5'
						: 'border-border hover:border-muted-foreground/50'
				}`}
			>
				{isUploading ? (
					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						アップロード中...
					</div>
				) : (
					<div className="space-y-2">
						<Upload className="mx-auto h-6 w-6 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">ドラッグ&ドロップ または</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => inputRef.current?.click()}
						>
							ファイルを選択
						</Button>
						<p className="text-xs text-muted-foreground">PNG, JPEG, WebP, GIF（最大5MB）</p>
					</div>
				)}
			</div>

			{error && (
				<div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					<X className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	);
}
