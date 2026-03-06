import { useCallback, useEffect, useState } from 'react';

interface TagRequest {
	id: string;
	name: string;
	description: string;
	category: string;
	status: 'pending' | 'approved' | 'rejected';
	requesterName: string | null;
	rejectionReason: string | null;
	createdAt: string;
	reviewedAt: string | null;
}

interface Category {
	id: string;
	name: string;
	slug: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
	pending: {
		label: '審査中',
		className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
	},
	approved: {
		label: '承認済み',
		className: 'bg-green-500/10 text-green-700 border-green-500/30',
	},
	rejected: {
		label: '却下',
		className: 'bg-destructive/10 text-destructive border-destructive/30',
	},
};

export default function TagRequestManagement() {
	const [requests, setRequests] = useState<TagRequest[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>('pending');

	// 却下理由入力
	const [rejectingId, setRejectingId] = useState<string | null>(null);
	const [rejectionReason, setRejectionReason] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	const categoryLabels = new Map(categories.map((c) => [c.slug, c.name]));

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const params = statusFilter ? `?status=${statusFilter}` : '';
			const [reqRes, catRes] = await Promise.all([
				fetch(`/api/admin/tag-requests${params}`),
				fetch('/api/admin/categories'),
			]);
			if (!reqRes.ok || !catRes.ok) throw new Error('データの取得に失敗しました');
			const [reqJson, catJson] = await Promise.all([reqRes.json(), catRes.json()]);
			setRequests(reqJson.requests);
			setCategories(catJson.categories);
		} catch {
			setError('データの取得に失敗しました');
		} finally {
			setIsLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (toast) {
			const timer = setTimeout(() => setToast(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [toast]);

	async function handleApprove(id: string) {
		setIsProcessing(true);
		try {
			const res = await fetch(`/api/admin/tag-requests/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'approved' }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error?.message ?? json?.error?.details?._?.[0] ?? '承認に失敗しました');
			}
			setRequests((prev) => prev.filter((r) => r.id !== id));
			setToast({ message: 'タグ申請を承認し、タグを作成しました', type: 'success' });
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : '承認に失敗しました',
				type: 'error',
			});
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleReject(id: string) {
		if (!rejectionReason.trim()) return;
		setIsProcessing(true);
		try {
			const res = await fetch(`/api/admin/tag-requests/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'rejected', rejectionReason: rejectionReason.trim() }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error?.message ?? '却下に失敗しました');
			}
			setRequests((prev) => prev.filter((r) => r.id !== id));
			setRejectingId(null);
			setRejectionReason('');
			setToast({ message: 'タグ申請を却下しました', type: 'success' });
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : '却下に失敗しました',
				type: 'error',
			});
		} finally {
			setIsProcessing(false);
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
				<button type="button" onClick={fetchData} className="ml-2 underline hover:no-underline">
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
						タグ申請管理 ({requests.length}件)
					</h2>
					<div className="flex gap-1">
						{['pending', 'approved', 'rejected', ''].map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2 py-1 text-xs transition-colors ${
									statusFilter === s
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:bg-muted'
								}`}
							>
								{s === 'pending' ? '審査中' : s === 'approved' ? '承認済み' : s === 'rejected' ? '却下' : 'すべて'}
							</button>
						))}
					</div>
				</div>

				<div className="divide-y divide-border">
					{requests.length === 0 ? (
						<div className="p-8 text-center text-sm text-muted-foreground">
							該当する申請はありません
						</div>
					) : (
						requests.map((req) => {
							const statusInfo = STATUS_LABELS[req.status] ?? STATUS_LABELS.pending;
							return (
								<div key={req.id} className="p-4 space-y-3">
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<h3 className="text-sm font-medium text-foreground">{req.name}</h3>
												<span
													className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
												>
													{statusInfo.label}
												</span>
											</div>
											<p className="text-xs text-muted-foreground">
												カテゴリ: {categoryLabels.get(req.category) ?? req.category}
											</p>
											<p className="text-xs text-muted-foreground">{req.description}</p>
											<p className="text-xs text-muted-foreground">
												申請者: {req.requesterName ?? '不明'} /
												{new Date(req.createdAt).toLocaleDateString('ja-JP')}
											</p>
										</div>

										{req.status === 'pending' && (
											<div className="flex gap-1 shrink-0">
												<button
													type="button"
													onClick={() => handleApprove(req.id)}
													disabled={isProcessing}
													className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
												>
													承認
												</button>
												<button
													type="button"
													onClick={() => {
														setRejectingId(req.id);
														setRejectionReason('');
													}}
													disabled={isProcessing}
													className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
												>
													却下
												</button>
											</div>
										)}
									</div>

									{req.status === 'rejected' && req.rejectionReason && (
										<div className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
											却下理由: {req.rejectionReason}
										</div>
									)}

									{rejectingId === req.id && (
										<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
											<label
												htmlFor={`reject-reason-${req.id}`}
												className="block text-xs font-medium text-foreground"
											>
												却下理由 <span className="text-destructive">*</span>
											</label>
											<textarea
												id={`reject-reason-${req.id}`}
												value={rejectionReason}
												onChange={(e) => setRejectionReason(e.target.value)}
												placeholder="却下する理由を記入してください"
												maxLength={500}
												rows={2}
												className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
											/>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleReject(req.id)}
													disabled={isProcessing || !rejectionReason.trim()}
													className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
												>
													{isProcessing ? '処理中...' : '却下する'}
												</button>
												<button
													type="button"
													onClick={() => {
														setRejectingId(null);
														setRejectionReason('');
													}}
													disabled={isProcessing}
													className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
												>
													キャンセル
												</button>
											</div>
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
