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

interface ForgotPasswordFormProps {
	message?: string;
}

export function ForgotPasswordForm({ message }: ForgotPasswordFormProps) {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">パスワードリセット</CardTitle>
					<CardDescription>
						登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
					</CardDescription>
				</CardHeader>
				<CardContent>
					{message && (
						<div className="mb-4 rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>
					)}

					<form action="/api/auth/reset-password" method="POST" className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">メールアドレス</Label>
							<Input id="email" name="email" type="email" placeholder="mail@example.com" required />
						</div>
						<Button type="submit" className="w-full">
							リセットリンクを送信
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
