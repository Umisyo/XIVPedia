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

interface RegisterFormProps {
	error?: string;
}

export function RegisterForm({ error }: RegisterFormProps) {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">新規登録</CardTitle>
					<CardDescription>アカウントを作成してください</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<form action="/api/auth/register" method="POST" className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">メールアドレス</Label>
							<Input id="email" name="email" type="email" placeholder="mail@example.com" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">ユーザー名</Label>
							<Input id="username" name="username" type="text" placeholder="username" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="displayName">表示名</Label>
							<Input
								id="displayName"
								name="displayName"
								type="text"
								placeholder="表示名"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">パスワード</Label>
							<Input id="password" name="password" type="password" required />
						</div>
						<Button type="submit" className="w-full">
							登録
						</Button>
					</form>
				</CardContent>
				<CardFooter className="text-sm">
					<div className="text-muted-foreground">
						既にアカウントをお持ちの方は{' '}
						<a href="/login" className="text-primary hover:underline">
							ログイン
						</a>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
