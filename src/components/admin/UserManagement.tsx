import { useCallback, useEffect, useState } from 'react';

interface User {
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	role: 'user' | 'moderator' | 'admin';
	createdAt: string;
}

interface Props {
	currentUserId: string;
}

export default function UserManagement({ currentUserId }: Props) {
	const [users, setUsers] = useState<User[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

	const fetchUsers = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch('/api/admin/users');
			if (!res.ok) {
				throw new Error('ユーザー一覧の取得に失敗しました');
			}
			const json = await res.json();
			setUsers(json.users);
			setTotal(json.total);
		} catch {
			setError('ユーザー一覧の取得に失敗しました');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	useEffect(() => {
		if (toast) {
			const timer = setTimeout(() => setToast(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [toast]);

	async function handleRoleChange(userId: string, newRole: string) {
		setUpdatingUserId(userId);

		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: newRole }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error ?? 'ロールの変更に失敗しました');
			}

			const json = await res.json();
			setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: json.user.role } : u)));
			setToast({ message: 'ロールを変更しました', type: 'success' });
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : 'ロールの変更に失敗しました',
				type: 'error',
			});
		} finally {
			setUpdatingUserId(null);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
				{error}
				<button type="button" onClick={fetchUsers} className="ml-2 underline hover:no-underline">
					再読み込み
				</button>
			</div>
		);
	}

	return (
		<div>
			{/* トースト */}
			{toast && (
				<div
					className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm shadow-lg transition-all ${
						toast.type === 'success'
							? 'border border-primary/50 bg-primary/10 text-primary'
							: 'border border-destructive/50 bg-destructive/10 text-destructive'
					}`}
				>
					{toast.message}
				</div>
			)}

			<div className="rounded-lg border border-border bg-card">
				<div className="border-b border-border px-4 py-3">
					<h2 className="text-lg font-bold text-foreground">ユーザー管理 ({total}人)</h2>
				</div>

				{/* デスクトップ: テーブル表示 */}
				<div className="hidden md:block overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-border text-left text-sm text-muted-foreground">
								<th className="px-4 py-3 font-medium">ユーザー</th>
								<th className="px-4 py-3 font-medium">ユーザー名</th>
								<th className="px-4 py-3 font-medium">ロール</th>
								<th className="px-4 py-3 font-medium">作成日</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr
									key={user.id}
									className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											{user.avatarUrl ? (
												<img
													src={user.avatarUrl}
													alt={user.displayName}
													className="h-8 w-8 rounded-full object-cover"
													loading="lazy"
												/>
											) : (
												<span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
													{user.displayName.charAt(0)}
												</span>
											)}
											<span className="text-sm font-medium text-foreground">
												{user.displayName}
											</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<span className="text-sm text-muted-foreground">@{user.username}</span>
									</td>
									<td className="px-4 py-3">
										<select
											value={user.role}
											onChange={(e) => handleRoleChange(user.id, e.target.value)}
											disabled={user.id === currentUserId || updatingUserId === user.id}
											className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
										>
											<option value="user">ユーザー</option>
											<option value="moderator">モデレーター</option>
											<option value="admin">管理者</option>
										</select>
										{user.id === currentUserId && (
											<span className="ml-2 text-xs text-muted-foreground">(自分)</span>
										)}
									</td>
									<td className="px-4 py-3">
										<span className="text-sm text-muted-foreground">
											{formatDate(user.createdAt)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* モバイル: カード表示 */}
				<div className="md:hidden divide-y divide-border">
					{users.map((user) => (
						<div key={user.id} className="p-4 space-y-3">
							<div className="flex items-center gap-3">
								{user.avatarUrl ? (
									<img
										src={user.avatarUrl}
										alt={user.displayName}
										className="h-10 w-10 rounded-full object-cover"
										loading="lazy"
									/>
								) : (
									<span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium">
										{user.displayName.charAt(0)}
									</span>
								)}
								<div>
									<p className="text-sm font-medium text-foreground">{user.displayName}</p>
									<p className="text-xs text-muted-foreground">@{user.username}</p>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">ロール:</span>
									<select
										value={user.role}
										onChange={(e) => handleRoleChange(user.id, e.target.value)}
										disabled={user.id === currentUserId || updatingUserId === user.id}
										className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
									>
										<option value="user">ユーザー</option>
										<option value="moderator">モデレーター</option>
										<option value="admin">管理者</option>
									</select>
									{user.id === currentUserId && (
										<span className="text-xs text-muted-foreground">(自分)</span>
									)}
								</div>
								<span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
