import { Camera, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingFormProps {
	error?: string;
	defaultDisplayName?: string;
	defaultAvatarUrl?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
	missing_fields: 'すべての項目を入力してください。',
	invalid_username: 'ユーザー名は英数字とアンダースコアのみ、3〜20文字で入力してください。',
	invalid_display_name: '表示名は1〜50文字で入力してください。',
	username_taken: 'このユーザー名は既に使用されています。',
};

export function OnboardingForm({
	error,
	defaultDisplayName,
	defaultAvatarUrl,
}: OnboardingFormProps) {
	const [username, setUsername] = useState('');
	const [usernameStatus, setUsernameStatus] = useState<
		'idle' | 'checking' | 'available' | 'taken' | 'invalid'
	>('idle');
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(defaultAvatarUrl);
	const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl ?? '');
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | undefined>();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const checkUsername = useCallback(async (value: string) => {
		if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
			setUsernameStatus(value.length > 0 ? 'invalid' : 'idle');
			return;
		}

		setUsernameStatus('checking');
		try {
			const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value)}`);
			const data = await res.json();
			setUsernameStatus(data.available ? 'available' : 'taken');
		} catch {
			setUsernameStatus('idle');
		}
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (username) {
				checkUsername(username);
			} else {
				setUsernameStatus('idle');
			}
		}, 400);
		return () => clearTimeout(timer);
	}, [username, checkUsername]);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			setUploadError('ファイルサイズは5MB以下にしてください');
			return;
		}

		setUploadError(undefined);
		const localPreview = URL.createObjectURL(file);
		setPreviewUrl(localPreview);
		setUploading(true);

		try {
			const res = await fetch('/api/images/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type,
					size: file.size,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error?.message ?? 'アップロードURLの取得に失敗しました');
			}

			const { uploadUrl, imageUrl } = await res.json();

			const putRes = await fetch(uploadUrl, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file,
			});

			if (!putRes.ok) {
				throw new Error('画像のアップロードに失敗しました');
			}

			setAvatarUrl(imageUrl);
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : 'アップロードに失敗しました');
			setPreviewUrl(defaultAvatarUrl);
		} finally {
			setUploading(false);
			URL.revokeObjectURL(localPreview);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">プロフィール設定</CardTitle>
					<CardDescription>ユーザーネームと表示名を設定してください</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{ERROR_MESSAGES[error] ?? 'エラーが発生しました。'}
						</div>
					)}

					<form action="/api/auth/setup-profile" method="POST" className="space-y-4">
						<div className="space-y-2">
							<Label>アバター</Label>
							<div className="flex items-center gap-4">
								{previewUrl ? (
									<img src={previewUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
								) : (
									<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
										<User size={24} className="text-muted-foreground" />
									</div>
								)}
								<div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={uploading}
										onClick={() => fileInputRef.current?.click()}
										aria-label="アバターを変更"
									>
										<Camera size={16} className="mr-1" />
										{uploading ? 'アップロード中...' : '画像を変更'}
									</Button>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/png,image/jpeg,image/webp,image/gif"
										className="hidden"
										onChange={handleFileSelect}
										aria-label="アバター画像を選択"
									/>
								</div>
							</div>
							{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
							<input type="hidden" name="avatarUrl" value={avatarUrl} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">ユーザー名</Label>
							<Input
								id="username"
								name="username"
								type="text"
								placeholder="username"
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">英数字とアンダースコアのみ、3〜20文字</p>
							<div aria-live="polite">
								{usernameStatus === 'checking' && (
									<p className="text-xs text-muted-foreground">確認中...</p>
								)}
								{usernameStatus === 'available' && (
									<p className="text-xs text-green-600">このユーザー名は使用できます</p>
								)}
								{usernameStatus === 'taken' && (
									<p className="text-xs text-destructive">このユーザー名は既に使用されています</p>
								)}
								{usernameStatus === 'invalid' && (
									<p className="text-xs text-destructive">
										英数字とアンダースコアのみ、3〜20文字で入力してください
									</p>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="displayName">表示名</Label>
							<Input
								id="displayName"
								name="displayName"
								type="text"
								placeholder="表示名"
								defaultValue={defaultDisplayName}
								required
							/>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={usernameStatus !== 'available' || uploading}
						>
							設定を完了
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
