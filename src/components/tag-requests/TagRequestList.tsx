import { useCallback, useEffect, useState } from 'react';

interface TagRequest {
	id: string;
	name: string;
	description: string;
	category: string;
	status: 'pending' | 'approved' | 'rejected';
	rejectionReason: string | null;
	createdAt: string;
	reviewedAt: string | null;
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

export default function TagRequestList() {
	const [requests, setRequests] = useState<TagRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRequests = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/tag-requests');
			if (!res.ok) throw new Error('データの取得に失敗しました');
			const json = await res.json();
			setRequests(json.requests);
		} catch {
			setError('データの取得に失敗しました');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRequests();
	}, [fetchRequests]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
				{error}
				<button type="button" onClick={fetchRequests} className="ml-2 underline hover:no-underline focus:border-ring focus:ring-1 focus:ring-ring rounded">
					再読み込み
				</button>
			</div>
		);
	}

	if (requests.length === 0) {
		return (
			<div className="rounded-md border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
				まだタグ申請はありません
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{requests.map((req) => {
				const statusInfo = STATUS_LABELS[req.status] ?? STATUS_LABELS.pending;
				return (
					<div key={req.id} className="rounded-md border border-border bg-card p-4 space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-foreground">{req.name}</h3>
							<span
								className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
							>
								{statusInfo.label}
							</span>
						</div>
						<p className="text-xs text-muted-foreground">{req.description}</p>
						<p className="text-xs text-muted-foreground">
							申請日: {new Date(req.createdAt).toLocaleDateString('ja-JP')}
						</p>
						{req.status === 'rejected' && req.rejectionReason && (
							<div className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
								却下理由: {req.rejectionReason}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
