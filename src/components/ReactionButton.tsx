import { useState } from 'react';

interface ReactionButtonProps {
	slug: string;
	initialCount: number;
	initialReacted: boolean;
	isAuthenticated: boolean;
}

export default function ReactionButton({
	slug,
	initialCount,
	initialReacted,
	isAuthenticated,
}: ReactionButtonProps) {
	const [count, setCount] = useState(initialCount);
	const [reacted, setReacted] = useState(initialReacted);
	const [isLoading, setIsLoading] = useState(false);
	const [showLoginHint, setShowLoginHint] = useState(false);

	async function handleClick() {
		if (!isAuthenticated) {
			setShowLoginHint(true);
			return;
		}

		const prevCount = count;
		const prevReacted = reacted;

		// 楽観的更新
		setReacted(!reacted);
		setCount(reacted ? count - 1 : count + 1);
		setIsLoading(true);

		try {
			const res = await fetch(`/api/articles/${slug}/reactions`, {
				method: 'POST',
			});

			if (!res.ok) {
				// エラー時はUIを元に戻す
				setCount(prevCount);
				setReacted(prevReacted);
				return;
			}

			const json = await res.json();
			setCount(json.count);
			setReacted(json.reacted);
		} catch {
			// ネットワークエラー時もUIを元に戻す
			setCount(prevCount);
			setReacted(prevReacted);
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
				className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
					reacted
						? 'border-primary bg-primary/10 text-primary'
						: 'border-border bg-card text-muted-foreground hover:text-foreground'
				}`}
			>
				<span>👍</span>
				<span>{count}</span>
			</button>
			{showLoginHint && (
				<a href="/login" className="text-sm text-primary hover:underline transition-colors">
					ログインしてリアクション
				</a>
			)}
		</div>
	);
}
