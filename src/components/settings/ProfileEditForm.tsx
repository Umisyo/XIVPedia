import { Camera, Loader2 } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileEditFormProps {
	currentDisplayName: string;
	currentAvatarUrl?: string;
}

export function ProfileEditForm({ currentDisplayName, currentAvatarUrl }: ProfileEditFormProps) {
	const [displayName, setDisplayName] = useState(currentDisplayName);
	const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? '');
	const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl ?? '');
	const [savedDisplayName, setSavedDisplayName] = useState(currentDisplayName);
	const [savedAvatarUrl, setSavedAvatarUrl] = useState(currentAvatarUrl ?? '');
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<{
		type: 'success' | 'error';
		text: string;
	} | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Show local preview immediately
		const localPreview = URL.createObjectURL(file);
		setAvatarPreview(localPreview);

		setIsUploading(true);
		setMessage(null);

		try {
			// Step 1: Get upload URL from the upload API
			const uploadRes = await fetch('/api/images/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type,
					size: file.size,
				}),
			});

			if (!uploadRes.ok) {
				const errorData = await uploadRes.json();
				throw new Error(errorData.error?.message ?? 'Failed to get upload URL');
			}

			const { uploadUrl, imageUrl } = await uploadRes.json();

			// Step 2: Upload the file to the signed URL
			const putRes = await fetch(uploadUrl, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file,
			});

			if (!putRes.ok) {
				throw new Error('Failed to upload image');
			}

			// Step 3: Store the image URL for saving
			setAvatarUrl(imageUrl);
			setAvatarPreview(imageUrl);
		} catch (err) {
			setMessage({
				type: 'error',
				text: err instanceof Error ? err.message : '画像のアップロードに失敗しました。',
			});
			// Revert preview on error
			setAvatarPreview(currentAvatarUrl ?? '');
		} finally {
			setIsUploading(false);
			// Revoke object URL to free memory
			URL.revokeObjectURL(localPreview);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSaving(true);
		setMessage(null);

		const trimmed = displayName.trim();
		if (trimmed.length < 1 || trimmed.length > 50) {
			setMessage({
				type: 'error',
				text: '表示名は1〜50文字で入力してください。',
			});
			setIsSaving(false);
			return;
		}

		const body: Record<string, string> = {};

		if (trimmed !== savedDisplayName) {
			body.displayName = trimmed;
		}

		if (avatarUrl && avatarUrl !== savedAvatarUrl) {
			body.avatarUrl = avatarUrl;
		}

		if (Object.keys(body).length === 0) {
			setMessage({
				type: 'error',
				text: '変更がありません。',
			});
			setIsSaving(false);
			return;
		}

		try {
			const res = await fetch('/api/auth/update-profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error?.message ?? 'プロフィールの更新に失敗しました。');
			}

			if (body.displayName) setSavedDisplayName(body.displayName);
			if (body.avatarUrl) setSavedAvatarUrl(body.avatarUrl);
			setMessage({
				type: 'success',
				text: 'プロフィールを更新しました。',
			});
		} catch (err) {
			setMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'プロフィールの更新に失敗しました。',
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">プロフィール編集</CardTitle>
					<CardDescription>表示名やアバターを変更できます</CardDescription>
				</CardHeader>
				<CardContent>
					{message && (
						<div
							className={`mb-4 rounded-md p-3 text-sm ${
								message.type === 'success'
									? 'bg-green-500/10 text-green-600'
									: 'bg-destructive/10 text-destructive'
							}`}
						>
							{message.text}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Avatar section */}
						<div className="space-y-2">
							<Label>アバター</Label>
							<div className="flex items-center gap-4">
								<button
									type="button"
									onClick={handleAvatarClick}
									disabled={isUploading}
									className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-muted bg-muted hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								>
									{avatarPreview ? (
										<img
											src={avatarPreview}
											alt="アバター"
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-muted-foreground">
											<Camera className="h-8 w-8" />
										</div>
									)}
									{isUploading && (
										<div className="absolute inset-0 flex items-center justify-center bg-background/60">
											<Loader2 className="h-6 w-6 animate-spin" />
										</div>
									)}
								</button>
								<div className="flex flex-col gap-1">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleAvatarClick}
										disabled={isUploading}
									>
										{isUploading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												アップロード中...
											</>
										) : (
											'画像を選択'
										)}
									</Button>
									<p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF（最大5MB）</p>
								</div>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/webp,image/gif"
								className="hidden"
								onChange={handleFileChange}
							/>
						</div>

						{/* Display name section */}
						<div className="space-y-2">
							<Label htmlFor="displayName">表示名</Label>
							<Input
								id="displayName"
								type="text"
								placeholder="表示名"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								required
								minLength={1}
								maxLength={50}
							/>
							<p className="text-xs text-muted-foreground">1〜50文字で入力してください</p>
						</div>

						<Button type="submit" className="w-full" disabled={isSaving || isUploading}>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									保存中...
								</>
							) : (
								'変更を保存'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
