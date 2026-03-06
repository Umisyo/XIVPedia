import { useState } from 'react';

interface BookmarkButtonProps {
	slug: string;
	initialBookmarked: boolean;
	isAuthenticated: boolean;
}

export default function BookmarkButton({
	slug,
	initialBookmarked,
	isAuthenticated,
}: BookmarkButtonProps) {
	const [bookmarked, setBookmarked] = useState(initialBookmarked);
	const [isLoading, setIsLoading] = useState(false);
	const [showLoginHint, setShowLoginHint] = useState(false);

	async function handleClick() {
		if (!isAuthenticated) {
			setShowLoginHint(true);
			return;
		}

		const prevBookmarked = bookmarked;

		// 楽観的更新
		setBookmarked(!bookmarked);
		setIsLoading(true);

		try {
			const res = await fetch(`/api/articles/${slug}/bookmark`, {
				method: 'POST',
			});

			if (!res.ok) {
				setBookmarked(prevBookmarked);
				return;
			}

			const json = await res.json();
			setBookmarked(json.bookmarked);
		} catch {
			setBookmarked(prevBookmarked);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-start gap-2">
			<button
				type="button"
				onClick={handleClick}
				disabled={isLoading}
				aria-label={bookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
				className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
					bookmarked
						? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
						: 'border-border bg-card text-muted-foreground hover:text-foreground'
				}`}
			>
				{bookmarked ? (
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
					</svg>
				) : (
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
					</svg>
				)}
				<span>{bookmarked ? 'ブックマーク済み' : 'ブックマーク'}</span>
			</button>
			{showLoginHint && (
				<a href="/login" className="text-sm text-primary hover:underline transition-colors">
					ログインしてブックマーク
				</a>
			)}
		</div>
	);
}
