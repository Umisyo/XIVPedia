import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordFormProps {
	error?: string;
}

export function ResetPasswordForm({ error }: ResetPasswordFormProps) {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">新しいパスワードを設定</CardTitle>
					<CardDescription>新しいパスワードを入力してください。</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<form action="/api/auth/update-password" method="POST" className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="password">新しいパスワード</Label>
							<Input id="password" name="password" type="password" required />
						</div>
						<Button type="submit" className="w-full">
							パスワードを更新
						</Button>
					</form>
				</CardContent>
				<CardFooter className="text-sm">
					<a href="/login" className="text-muted-foreground hover:underline">
						ログインに戻る
					</a>
				</CardFooter>
			</Card>
		</div>
	);
}
