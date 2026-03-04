import { useCallback, useEffect, useState } from 'react';

interface Tag {
	id: string;
	name: string;
	slug: string;
	category: string;
}

type TagCategory = 'duty' | 'job' | 'crafting' | 'gathering' | 'general';

const CATEGORY_LABELS: Record<string, string> = {
	duty: 'コンテンツ',
	job: 'ジョブ',
	crafting: 'クラフター',
	gathering: 'ギャザラー',
	general: '全般',
};

const CATEGORIES: TagCategory[] = ['duty', 'job', 'crafting', 'gathering', 'general'];

export default function TagManagement() {
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	// 新規作成フォーム
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newName, setNewName] = useState('');
	const [newCategory, setNewCategory] = useState<TagCategory>('general');
	const [isCreating, setIsCreating] = useState(false);
	const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

	// 編集状態
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [editCategory, setEditCategory] = useState<TagCategory>('general');
	const [isUpdating, setIsUpdating] = useState(false);
	const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

	// 削除確認
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchTags = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch('/api/admin/tags');
			if (!res.ok) {
				throw new Error('タグ一覧の取得に失敗しました');
			}
			const json = await res.json();
			setTags(json.tags);
		} catch {
			setError('タグ一覧の取得に失敗しました');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTags();
	}, [fetchTags]);

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
			const res = await fetch('/api/admin/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName, category: newCategory }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				if (json?.error?.details) {
					setCreateErrors(json.error.details);
				} else {
					setCreateErrors({ _: [json?.error?.message ?? 'タグの作成に失敗しました'] });
				}
				return;
			}

			const json = await res.json();
			setTags((prev) => [...prev, json.tag].sort((a, b) => a.name.localeCompare(b.name)));
			setNewName('');
			setNewCategory('general');
			setShowCreateForm(false);
			setToast({ message: 'タグを作成しました', type: 'success' });
		} catch {
			setCreateErrors({ _: ['タグの作成に失敗しました'] });
		} finally {
			setIsCreating(false);
		}
	}

	function startEdit(tag: Tag) {
		setEditingId(tag.id);
		setEditName(tag.name);
		setEditCategory(tag.category as TagCategory);
		setEditErrors({});
	}

	function cancelEdit() {
		setEditingId(null);
		setEditErrors({});
	}

	async function handleUpdate() {
		if (!editingId) return;
		setIsUpdating(true);
		setEditErrors({});

		try {
			const res = await fetch(`/api/admin/tags/${editingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editName, category: editCategory }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				if (json?.error?.details) {
					setEditErrors(json.error.details);
				} else {
					setEditErrors({ _: [json?.error?.message ?? 'タグの更新に失敗しました'] });
				}
				return;
			}

			const json = await res.json();
			setTags((prev) => prev.map((t) => (t.id === editingId ? json.tag : t)));
			setEditingId(null);
			setToast({ message: 'タグを更新しました', type: 'success' });
		} catch {
			setEditErrors({ _: ['タグの更新に失敗しました'] });
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete(id: string) {
		setIsDeleting(true);

		try {
			const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error?.message ?? 'タグの削除に失敗しました');
			}

			setTags((prev) => prev.filter((t) => t.id !== id));
			setDeletingId(null);
			setToast({ message: 'タグを削除しました', type: 'success' });
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : 'タグの削除に失敗しました',
				type: 'error',
			});
		} finally {
			setIsDeleting(false);
		}
	}

	// カテゴリ別にグループ化
	const grouped = new Map<string, Tag[]>();
	for (const tag of tags) {
		const list = grouped.get(tag.category) ?? [];
		list.push(tag);
		grouped.set(tag.category, list);
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
				<button type="button" onClick={fetchTags} className="ml-2 underline hover:no-underline">
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
				<div className="border-b border-border px-4 py-3 flex items-center justify-between">
					<h2 className="text-lg font-bold text-foreground">タグ管理 ({tags.length}件)</h2>
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

				{/* 新規作成フォーム */}
				{showCreateForm && (
					<div className="border-b border-border p-4 bg-muted/30">
						<div className="space-y-3 max-w-md">
							{createErrors._ && (
								<p className="text-sm text-destructive">{createErrors._.join(', ')}</p>
							)}
							<div>
								<label
									htmlFor="new-tag-name"
									className="block text-sm font-medium text-foreground mb-1"
								>
									タグ名
								</label>
								<input
									id="new-tag-name"
									type="text"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="例: 極ナイツ・オブ・ラウンド"
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
								/>
								{createErrors.name && (
									<p className="mt-1 text-xs text-destructive">{createErrors.name.join(', ')}</p>
								)}
							</div>
							<div>
								<label
									htmlFor="new-tag-category"
									className="block text-sm font-medium text-foreground mb-1"
								>
									カテゴリ
								</label>
								<select
									id="new-tag-category"
									value={newCategory}
									onChange={(e) => setNewCategory(e.target.value as TagCategory)}
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
								>
									{CATEGORIES.map((cat) => (
										<option key={cat} value={cat}>
											{CATEGORY_LABELS[cat]}
										</option>
									))}
								</select>
								{createErrors.category && (
									<p className="mt-1 text-xs text-destructive">
										{createErrors.category.join(', ')}
									</p>
								)}
							</div>
							<button
								type="button"
								onClick={handleCreate}
								disabled={isCreating || !newName.trim()}
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
							>
								{isCreating ? '作成中...' : '作成'}
							</button>
						</div>
					</div>
				)}

				{/* 削除確認ダイアログ */}
				{deletingId && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-sm mx-4">
							<h3 className="text-lg font-bold text-foreground mb-2">タグを削除</h3>
							<p className="text-sm text-muted-foreground mb-4">
								このタグを削除しますか？関連する記事からもタグが外れます。この操作は取り消せません。
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

				{/* タグ一覧 (カテゴリ別) */}
				<div className="divide-y divide-border">
					{tags.length === 0 ? (
						<div className="p-8 text-center text-sm text-muted-foreground">
							タグがまだ登録されていません
						</div>
					) : (
						CATEGORIES.map((category) => {
							const categoryTags = grouped.get(category);
							if (!categoryTags || categoryTags.length === 0) return null;

							return (
								<div key={category} className="p-4">
									<h3 className="text-sm font-medium text-muted-foreground mb-3">
										{CATEGORY_LABELS[category]} ({categoryTags.length})
									</h3>
									<div className="space-y-2">
										{categoryTags.map((tag) => (
											<div key={tag.id}>
												{editingId === tag.id ? (
													// 編集フォーム
													<div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
														{editErrors._ && (
															<p className="text-sm text-destructive">{editErrors._.join(', ')}</p>
														)}
														<div className="flex flex-col sm:flex-row gap-2">
															<div className="flex-1">
																<input
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
															<select
																value={editCategory}
																onChange={(e) => setEditCategory(e.target.value as TagCategory)}
																className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
															>
																{CATEGORIES.map((cat) => (
																	<option key={cat} value={cat}>
																		{CATEGORY_LABELS[cat]}
																	</option>
																))}
															</select>
														</div>
														{editErrors.category && (
															<p className="text-xs text-destructive">
																{editErrors.category.join(', ')}
															</p>
														)}
														<div className="flex gap-2">
															<button
																type="button"
																onClick={handleUpdate}
																disabled={isUpdating || !editName.trim()}
																className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
															>
																{isUpdating ? '更新中...' : '保存'}
															</button>
															<button
																type="button"
																onClick={cancelEdit}
																disabled={isUpdating}
																className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
															>
																キャンセル
															</button>
														</div>
													</div>
												) : (
													// 表示モード
													<div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors group">
														<div className="flex items-center gap-2">
															<span className="text-sm text-foreground">{tag.name}</span>
															<span className="text-xs text-muted-foreground">({tag.slug})</span>
														</div>
														<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
															<button
																type="button"
																onClick={() => startEdit(tag)}
																className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
															>
																編集
															</button>
															<button
																type="button"
																onClick={() => setDeletingId(tag.id)}
																className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
															>
																削除
															</button>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
