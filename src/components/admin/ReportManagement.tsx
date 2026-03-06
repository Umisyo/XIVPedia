import { useCallback, useEffect, useState } from 'react';

interface Report {
	id: string;
	reason: 'spam' | 'inappropriate' | 'misleading' | 'other';
	description: string | null;
	targetType: 'article' | 'comment';
	targetId: string;
	targetSlug: string | null;
	targetTitle: string | null;
	reporterId: string;
	status: 'pending' | 'resolved' | 'dismissed';
	resolvedBy: string | null;
	resolvedAt: string | null;
	createdAt: string;
}

type StatusFilter = 'all' | 'pending' | 'resolved' | 'dismissed';

const REASON_LABELS: Record<Report['reason'], string> = {
	spam: 'スパム',
	inappropriate: '不適切',
	misleading: '誤解を招く',
	other: 'その他',
};

const STATUS_LABELS: Record<Report['status'], string> = {
	pending: '未対応',
	resolved: '対応済み',
	dismissed: '却下',
};

const STATUS_BADGE_CLASSES: Record<Report['status'], string> = {
	pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
	resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
	dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
	{ value: 'all', label: '全件' },
	{ value: 'pending', label: '未対応' },
	{ value: 'resolved', label: '対応済み' },
	{ value: 'dismissed', label: '却下' },
];

const LIMIT = 20;

export default function ReportManagement() {
	const [reports, setReports] = useState<Report[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

	const totalPages = Math.max(1, Math.ceil(total / LIMIT));

	const fetchReports = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(LIMIT),
			});
			if (statusFilter !== 'all') {
				params.set('status', statusFilter);
			}

			const res = await fetch(`/api/admin/reports?${params}`);
			if (!res.ok) {
				throw new Error('通報一覧の取得に失敗しました');
			}
			const json = await res.json();
			setReports(json.data);
			setTotal(json.meta.total);
		} catch {
			setError('通報一覧の取得に失敗しました');
		} finally {
			setIsLoading(false);
		}
	}, [page, statusFilter]);

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	useEffect(() => {
		if (toast) {
			const timer = setTimeout(() => setToast(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [toast]);

	function handleFilterChange(newFilter: StatusFilter) {
		setStatusFilter(newFilter);
		setPage(1);
	}

	async function handleStatusChange(reportId: string, newStatus: 'resolved' | 'dismissed') {
		setUpdatingReportId(reportId);

		try {
			const res = await fetch(`/api/admin/reports/${reportId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error ?? 'ステータスの変更に失敗しました');
			}

			const json = await res.json();
			setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...json.report } : r)));
			setToast({
				message: newStatus === 'resolved' ? '対応済みにしました' : '却下しました',
				type: 'success',
			});
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : 'ステータスの変更に失敗しました',
				type: 'error',
			});
		} finally {
			setUpdatingReportId(null);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	}

	function getTargetLink(report: Report): string {
		if (report.targetType === 'article' && report.targetSlug) {
			return `/articles/${report.targetSlug}`;
		}
		return '#';
	}

	function getTargetLabel(report: Report): string {
		if (report.targetType === 'article') {
			return report.targetTitle ?? `記事 (${report.targetId.slice(0, 8)})`;
		}
		return 'コメント';
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
				<button type="button" onClick={fetchReports} className="ml-2 underline hover:no-underline">
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
				<div className="border-b border-border px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h2 className="text-lg font-bold text-foreground">通報管理 ({total}件)</h2>
					<select
						value={statusFilter}
						onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
						className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
					>
						{FILTER_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				{reports.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-sm text-muted-foreground">通報はありません</p>
					</div>
				) : (
					<>
						{/* デスクトップ: テーブル表示 */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border text-left text-sm text-muted-foreground">
										<th className="px-4 py-3 font-medium">通報理由</th>
										<th className="px-4 py-3 font-medium">対象</th>
										<th className="px-4 py-3 font-medium">ステータス</th>
										<th className="px-4 py-3 font-medium">通報日時</th>
										<th className="px-4 py-3 font-medium">アクション</th>
									</tr>
								</thead>
								<tbody>
									{reports.map((report) => (
										<tr
											key={report.id}
											className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
										>
											<td className="px-4 py-3">
												<span className="text-sm font-medium text-foreground">
													{REASON_LABELS[report.reason]}
												</span>
												{report.description && (
													<p className="mt-1 text-xs text-muted-foreground line-clamp-2">
														{report.description}
													</p>
												)}
											</td>
											<td className="px-4 py-3">
												<a
													href={getTargetLink(report)}
													className="text-sm text-primary hover:underline"
												>
													{getTargetLabel(report)}
												</a>
											</td>
											<td className="px-4 py-3">
												<span
													className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[report.status]}`}
												>
													{STATUS_LABELS[report.status]}
												</span>
											</td>
											<td className="px-4 py-3">
												<span className="text-sm text-muted-foreground">
													{formatDate(report.createdAt)}
												</span>
											</td>
											<td className="px-4 py-3">
												{report.status === 'pending' ? (
													<div className="flex items-center gap-2">
														<button
															type="button"
															onClick={() => handleStatusChange(report.id, 'resolved')}
															disabled={updatingReportId === report.id}
															className="rounded-md border border-primary/50 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
														>
															対応済み
														</button>
														<button
															type="button"
															onClick={() => handleStatusChange(report.id, 'dismissed')}
															disabled={updatingReportId === report.id}
															className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
														>
															却下
														</button>
													</div>
												) : (
													<span className="text-xs text-muted-foreground">-</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* モバイル: カード表示 */}
						<div className="md:hidden divide-y divide-border">
							{reports.map((report) => (
								<div key={report.id} className="p-4 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-foreground">
											{REASON_LABELS[report.reason]}
										</span>
										<span
											className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[report.status]}`}
										>
											{STATUS_LABELS[report.status]}
										</span>
									</div>
									{report.description && (
										<p className="text-xs text-muted-foreground line-clamp-2">
											{report.description}
										</p>
									)}
									<div className="flex items-center justify-between">
										<a
											href={getTargetLink(report)}
											className="text-sm text-primary hover:underline"
										>
											{getTargetLabel(report)}
										</a>
										<span className="text-xs text-muted-foreground">
											{formatDate(report.createdAt)}
										</span>
									</div>
									{report.status === 'pending' && (
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => handleStatusChange(report.id, 'resolved')}
												disabled={updatingReportId === report.id}
												className="rounded-md border border-primary/50 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
											>
												対応済み
											</button>
											<button
												type="button"
												onClick={() => handleStatusChange(report.id, 'dismissed')}
												disabled={updatingReportId === report.id}
												className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
											>
												却下
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					</>
				)}

				{/* ページネーション */}
				{totalPages > 1 && (
					<div className="border-t border-border px-4 py-3 flex items-center justify-between">
						<button
							type="button"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page <= 1}
							className="rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
						>
							前ページ
						</button>
						<span className="text-sm text-muted-foreground">
							{page} / {totalPages}
						</span>
						<button
							type="button"
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page >= totalPages}
							className="rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
						>
							次ページ
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
