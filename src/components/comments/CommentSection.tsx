import { useCallback, useEffect, useState } from 'react';

interface Comment {
	id: string;
	body: string;
	createdAt: string;
	author: {
		id: string;
		displayName: string;
		avatarUrl: string | null;
	};
}

interface CommentSectionProps {
	slug: string;
	articleAuthorId: string;
	currentUser: {
		id: string;
		displayName: string;
		avatarUrl: string | null;
		role: string;
	} | null;
}

const PAGE_SIZE = 50;

function formatRelativeTime(dateString: string): string {
	const now = new Date();
	const date = new Date(dateString);
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	if (diffSeconds < 60) {
		return 'たった今';
	}
	if (diffMinutes < 60) {
		return `${diffMinutes}分前`;
	}
	if (diffHours < 24) {
		return `${diffHours}時間前`;
	}
	if (diffDays < 30) {
		return `${diffDays}日前`;
	}
	if (diffMonths < 12) {
		return `${diffMonths}ヶ月前`;
	}
	return `${diffYears}年前`;
}

export default function CommentSection({
	slug,
	articleAuthorId,
	currentUser,
}: CommentSectionProps) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoadingComments, setIsLoadingComments] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [body, setBody] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchComments = useCallback(
		async (offset = 0) => {
			try {
				const res = await fetch(
					`/api/articles/${slug}/comments?limit=${PAGE_SIZE}&offset=${offset}`,
				);
				if (!res.ok) {
					throw new Error('コメントの取得に失敗しました');
				}
				const json = await res.json();
				return json as { comments: Comment[]; total: number };
			} catch {
				setError('コメントの取得に失敗しました');
				return null;
			}
		},
		[slug],
	);

	const loadInitialComments = useCallback(async () => {
		setIsLoadingComments(true);
		const data = await fetchComments(0);
		if (data) {
			setComments(data.comments);
			setTotal(data.total);
			setError(null);
		}
		setIsLoadingComments(false);
	}, [fetchComments]);

	async function handleLoadMore() {
		setIsLoadingMore(true);
		const data = await fetchComments(comments.length);
		if (data) {
			setComments((prev) => [...prev, ...data.comments]);
			setTotal(data.total);
		}
		setIsLoadingMore(false);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const trimmedBody = body.trim();
		if (!trimmedBody) {
			setError('コメントを入力してください');
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const res = await fetch(`/api/articles/${slug}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body: trimmedBody }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error ?? 'コメントの投稿に失敗しました');
			}

			const newComment: Comment = await res.json();
			setComments((prev) => [newComment, ...prev]);
			setTotal((prev) => prev + 1);
			setBody('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'コメントの投稿に失敗しました');
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDelete(commentId: string) {
		if (!window.confirm('このコメントを削除しますか？')) {
			return;
		}

		const prevComments = comments;
		const prevTotal = total;

		// 楽観的更新
		setComments((prev) => prev.filter((c) => c.id !== commentId));
		setTotal((prev) => prev - 1);

		try {
			const res = await fetch(`/api/articles/${slug}/comments/${commentId}`, { method: 'DELETE' });

			if (!res.ok) {
				// エラー時はUIを元に戻す
				setComments(prevComments);
				setTotal(prevTotal);
				setError('コメントの削除に失敗しました');
			}
		} catch {
			// ネットワークエラー時もUIを元に戻す
			setComments(prevComments);
			setTotal(prevTotal);
			setError('コメントの削除に失敗しました');
		}
	}

	function canDelete(comment: Comment): boolean {
		if (!currentUser) return false;
		if (currentUser.role === 'admin') return true;
		if (currentUser.id === comment.author.id) return true;
		if (currentUser.id === articleAuthorId) return true;
		return false;
	}

	useEffect(() => {
		loadInitialComments();
	}, [loadInitialComments]);

	const hasMore = comments.length < total;

	return (
		<section className="mt-10">
			<h2 className="text-lg font-bold text-foreground">コメント ({total}件)</h2>

			{error && (
				<div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{/* コメント一覧 */}
			<div className="mt-4 space-y-4">
				{isLoadingComments ? (
					<p className="text-sm text-muted-foreground">読み込み中...</p>
				) : comments.length === 0 ? (
					<p className="text-sm text-muted-foreground">まだコメントはありません</p>
				) : (
					comments.map((comment) => (
						<div key={comment.id} className="rounded-lg border border-border bg-card p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2">
									{comment.author.avatarUrl ? (
										<img
											src={comment.author.avatarUrl}
											alt={comment.author.displayName}
											className="h-8 w-8 rounded-full"
											loading="lazy"
										/>
									) : (
										<span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
											{comment.author.displayName.charAt(0)}
										</span>
									)}
									<span className="text-sm font-medium text-foreground">
										{comment.author.displayName}
									</span>
									<span className="text-xs text-muted-foreground">
										{formatRelativeTime(comment.createdAt)}
									</span>
								</div>
								{canDelete(comment) && (
									<button
										type="button"
										onClick={() => handleDelete(comment.id)}
										className="text-xs text-muted-foreground transition-colors hover:text-destructive"
									>
										削除
									</button>
								)}
							</div>
							<p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
						</div>
					))
				)}
			</div>

			{/* もっと読むボタン */}
			{hasMore && (
				<div className="mt-4 flex justify-center">
					<button
						type="button"
						onClick={handleLoadMore}
						disabled={isLoadingMore}
						className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isLoadingMore ? '読み込み中...' : 'もっと読む'}
					</button>
				</div>
			)}

			{/* コメント投稿フォーム / ログインリンク */}
			<div className="mt-6">
				{currentUser ? (
					<form onSubmit={handleSubmit}>
						<textarea
							value={body}
							onChange={(e) => setBody(e.target.value)}
							placeholder="コメントを入力..."
							rows={3}
							className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<div className="mt-2 flex justify-end">
							<button
								type="submit"
								disabled={isSubmitting || !body.trim()}
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSubmitting ? '投稿中...' : '投稿する'}
							</button>
						</div>
					</form>
				) : (
					<p className="text-sm text-muted-foreground">
						<a href="/login" className="text-primary transition-colors hover:underline">
							ログイン
						</a>
						してコメントする
					</p>
				)}
			</div>
		</section>
	);
}
