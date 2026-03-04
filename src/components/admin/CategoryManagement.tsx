import { useCallback, useEffect, useState } from 'react';

interface Category {
	id: string;
	name: string;
	slug: string;
	displayOrder: number;
}

export default function CategoryManagement() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	// 新規作成
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newName, setNewName] = useState('');
	const [newSlug, setNewSlug] = useState('');
	const [newOrder, setNewOrder] = useState(0);
	const [isCreating, setIsCreating] = useState(false);
	const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

	// 編集
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [editSlug, setEditSlug] = useState('');
	const [editOrder, setEditOrder] = useState(0);
	const [isUpdating, setIsUpdating] = useState(false);
	const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

	// 削除
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchCategories = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/admin/categories');
			if (!res.ok) throw new Error('カテゴリ一覧の取得に失敗しました');
			const json = await res.json();
			setCategories(json.categories);
		} catch {
			setError('カテゴリ一覧の取得に失敗しました');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	useEffect(() => {
		if (toast) {
			const timer = setTimeout(() => setToast(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [toast]);

	async function handleCreate() {
		setIsCreating(true);
		setCreateErrors({});
		try {
			const res = await fetch('/api/admin/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName, slug: newSlug, displayOrder: newOrder }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				if (json?.error?.details) setCreateErrors(json.error.details);
				else setCreateErrors({ _: [json?.error?.message ?? 'カテゴリの作成に失敗しました'] });
				return;
			}
			const json = await res.json();
			setCategories((prev) =>
				[...prev, json.category].sort((a, b) => a.displayOrder - b.displayOrder),
			);
			setNewName('');
			setNewSlug('');
			setNewOrder(0);
			setShowCreateForm(false);
			setToast({ message: 'カテゴリを作成しました', type: 'success' });
		} catch {
			setCreateErrors({ _: ['カテゴリの作成に失敗しました'] });
		} finally {
			setIsCreating(false);
		}
	}

	function startEdit(cat: Category) {
		setEditingId(cat.id);
		setEditName(cat.name);
		setEditSlug(cat.slug);
		setEditOrder(cat.displayOrder);
		setEditErrors({});
	}

	async function handleUpdate() {
		if (!editingId) return;
		setIsUpdating(true);
		setEditErrors({});
		try {
			const res = await fetch(`/api/admin/categories/${editingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editName, slug: editSlug, displayOrder: editOrder }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				if (json?.error?.details) setEditErrors(json.error.details);
				else setEditErrors({ _: [json?.error?.message ?? 'カテゴリの更新に失敗しました'] });
				return;
			}
			const json = await res.json();
			setCategories((prev) =>
				prev
					.map((c) => (c.id === editingId ? json.category : c))
					.sort((a, b) => a.displayOrder - b.displayOrder),
			);
			setEditingId(null);
			setToast({ message: 'カテゴリを更新しました', type: 'success' });
		} catch {
			setEditErrors({ _: ['カテゴリの更新に失敗しました'] });
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete(id: string) {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(
					json?.error?.details?._?.[0] ?? json?.error?.message ?? 'カテゴリの削除に失敗しました',
				);
			}
			setCategories((prev) => prev.filter((c) => c.id !== id));
			setDeletingId(null);
			setToast({ message: 'カテゴリを削除しました', type: 'success' });
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : 'カテゴリの削除に失敗しました',
				type: 'error',
			});
			setDeletingId(null);
		} finally {
			setIsDeleting(false);
		}
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
				<button
					type="button"
					onClick={fetchCategories}
					className="ml-2 underline hover:no-underline"
				>
					再読み込み
				</button>
			</div>
		);
	}

	return (
		<div>
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
				<div className="border-b border-border px-4 py-3 flex items-center justify-between">
					<h2 className="text-lg font-bold text-foreground">
						カテゴリ管理 ({categories.length}件)
					</h2>
					<button
						type="button"
						onClick={() => {
							setShowCreateForm(!showCreateForm);
							setCreateErrors({});
						}}
						className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						{showCreateForm ? 'キャンセル' : '新規追加'}
					</button>
				</div>

				{showCreateForm && (
					<div className="border-b border-border p-4 bg-muted/30">
						<div className="space-y-3 max-w-md">
							{createErrors._ && (
								<p className="text-sm text-destructive">{createErrors._.join(', ')}</p>
							)}
							<div>
								<label
									htmlFor="new-cat-name"
									className="block text-sm font-medium text-foreground mb-1"
								>
									表示名
								</label>
								<input
									id="new-cat-name"
									type="text"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="例: コンテンツ"
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
								/>
								{createErrors.name && (
									<p className="mt-1 text-xs text-destructive">{createErrors.name.join(', ')}</p>
								)}
							</div>
							<div>
								<label
									htmlFor="new-cat-slug"
									className="block text-sm font-medium text-foreground mb-1"
								>
									スラグ
								</label>
								<input
									id="new-cat-slug"
									type="text"
									value={newSlug}
									onChange={(e) => setNewSlug(e.target.value)}
									placeholder="例: duty"
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
								/>
								{createErrors.slug && (
									<p className="mt-1 text-xs text-destructive">{createErrors.slug.join(', ')}</p>
								)}
							</div>
							<div>
								<label
									htmlFor="new-cat-order"
									className="block text-sm font-medium text-foreground mb-1"
								>
									表示順
								</label>
								<input
									id="new-cat-order"
									type="number"
									value={newOrder}
									onChange={(e) => setNewOrder(Number(e.target.value))}
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
								/>
								{createErrors.displayOrder && (
									<p className="mt-1 text-xs text-destructive">
										{createErrors.displayOrder.join(', ')}
									</p>
								)}
							</div>
							<button
								type="button"
								onClick={handleCreate}
								disabled={isCreating || !newName.trim() || !newSlug.trim()}
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
							>
								{isCreating ? '作成中...' : '作成'}
							</button>
						</div>
					</div>
				)}

				{deletingId && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-sm mx-4">
							<h3 className="text-lg font-bold text-foreground mb-2">カテゴリを削除</h3>
							<p className="text-sm text-muted-foreground mb-4">
								このカテゴリを削除しますか？タグが紐づいている場合は削除できません。
							</p>
							<div className="flex gap-2 justify-end">
								<button
									type="button"
									onClick={() => setDeletingId(null)}
									disabled={isDeleting}
									className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
								>
									キャンセル
								</button>
								<button
									type="button"
									onClick={() => handleDelete(deletingId)}
									disabled={isDeleting}
									className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
								>
									{isDeleting ? '削除中...' : '削除'}
								</button>
							</div>
						</div>
					</div>
				)}

				<div className="divide-y divide-border">
					{categories.length === 0 ? (
						<div className="p-8 text-center text-sm text-muted-foreground">
							カテゴリがまだ登録されていません
						</div>
					) : (
						categories.map((cat) => (
							<div key={cat.id}>
								{editingId === cat.id ? (
									<div className="p-4 rounded-md border border-primary/30 bg-primary/5 m-2 space-y-3">
										{editErrors._ && (
											<p className="text-sm text-destructive">{editErrors._.join(', ')}</p>
										)}
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
											<div>
												<label
													htmlFor={`edit-cat-name-${cat.id}`}
													className="block text-xs text-muted-foreground mb-1"
												>
													表示名
												</label>
												<input
													id={`edit-cat-name-${cat.id}`}
													type="text"
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
												/>
												{editErrors.name && (
													<p className="mt-1 text-xs text-destructive">
														{editErrors.name.join(', ')}
													</p>
												)}
											</div>
											<div>
												<label
													htmlFor={`edit-cat-slug-${cat.id}`}
													className="block text-xs text-muted-foreground mb-1"
												>
													スラグ
												</label>
												<input
													id={`edit-cat-slug-${cat.id}`}
													type="text"
													value={editSlug}
													onChange={(e) => setEditSlug(e.target.value)}
													className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
												/>
												{editErrors.slug && (
													<p className="mt-1 text-xs text-destructive">
														{editErrors.slug.join(', ')}
													</p>
												)}
											</div>
											<div>
												<label
													htmlFor={`edit-cat-order-${cat.id}`}
													className="block text-xs text-muted-foreground mb-1"
												>
													表示順
												</label>
												<input
													id={`edit-cat-order-${cat.id}`}
													type="number"
													value={editOrder}
													onChange={(e) => setEditOrder(Number(e.target.value))}
													className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
												/>
												{editErrors.displayOrder && (
													<p className="mt-1 text-xs text-destructive">
														{editErrors.displayOrder.join(', ')}
													</p>
												)}
											</div>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={handleUpdate}
												disabled={isUpdating || !editName.trim() || !editSlug.trim()}
												className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
											>
												{isUpdating ? '更新中...' : '保存'}
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												disabled={isUpdating}
												className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
											>
												キャンセル
											</button>
										</div>
									</div>
								) : (
									<div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group">
										<div className="flex items-center gap-3">
											<span className="text-xs text-muted-foreground w-8 text-right">
												{cat.displayOrder}
											</span>
											<span className="text-sm font-medium text-foreground">{cat.name}</span>
											<span className="text-xs text-muted-foreground">({cat.slug})</span>
										</div>
										<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<button
												type="button"
												onClick={() => startEdit(cat)}
												className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
											>
												編集
											</button>
											<button
												type="button"
												onClick={() => setDeletingId(cat.id)}
												className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
											>
												削除
											</button>
										</div>
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
