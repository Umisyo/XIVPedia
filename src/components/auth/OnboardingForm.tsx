import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingFormProps {
	error?: string;
	defaultDisplayName?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
	missing_fields: 'すべての項目を入力してください。',
	invalid_username: 'ユーザー名は英数字とアンダースコアのみ、3〜20文字で入力してください。',
	invalid_display_name: '表示名は1〜50文字で入力してください。',
	username_taken: 'このユーザー名は既に使用されています。',
};

export function OnboardingForm({ error, defaultDisplayName }: OnboardingFormProps) {
	const [username, setUsername] = useState('');
	const [usernameStatus, setUsernameStatus] = useState<
		'idle' | 'checking' | 'available' | 'taken' | 'invalid'
	>('idle');

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
						<Button type="submit" className="w-full" disabled={usernameStatus !== 'available'}>
							設定を完了
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
