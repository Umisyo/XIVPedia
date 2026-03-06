import { Flag, Loader2, X } from 'lucide-react';
import { useState } from 'react';

interface ReportButtonProps {
	targetType: 'article' | 'comment';
	targetId: string;
	isLoggedIn: boolean;
}

type ReportReason = 'spam' | 'inappropriate' | 'misleading' | 'other';

const REASON_LABELS: Record<ReportReason, string> = {
	spam: 'スパム',
	inappropriate: '不適切',
	misleading: '誤情報',
	other: 'その他',
};

export default function ReportButton({ targetType, targetId, isLoggedIn }: ReportButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [reason, setReason] = useState<ReportReason | ''>('');
	const [description, setDescription] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (!isLoggedIn) {
		return null;
	}

	function handleOpen() {
		setIsOpen(true);
		setReason('');
		setDescription('');
		setSuccessMessage(null);
		setErrorMessage(null);
	}

	function handleClose() {
		setIsOpen(false);
		setReason('');
		setDescription('');
		setSuccessMessage(null);
		setErrorMessage(null);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!reason) {
			setErrorMessage('通報理由を選択してください');
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const res = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reason,
					description: description.trim() || undefined,
					targetType,
					targetId,
				}),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				if (res.status === 409) {
					setErrorMessage('すでに通報済みです');
				} else {
					setErrorMessage(json?.error?.message ?? '通報の送信に失敗しました');
				}
				return;
			}

			setSuccessMessage('通報を受け付けました');
			setTimeout(() => {
				handleClose();
			}, 1500);
		} catch {
			setErrorMessage('通報の送信に失敗しました');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={handleOpen}
				className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
				aria-label="通報する"
			>
				<Flag size={14} />
				<span>通報</span>
			</button>

			{isOpen && (
				<div
					role="dialog"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={(e) => {
						if (e.target === e.currentTarget) handleClose();
					}}
					onKeyDown={(e) => {
						if (e.key === 'Escape') handleClose();
					}}
				>
					<div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
						<div className="flex items-center justify-between">
							<h3 id="report-dialog-title" className="text-lg font-bold text-foreground">
								{targetType === 'article' ? '記事' : 'コメント'}を通報
							</h3>
							<button
								type="button"
								onClick={handleClose}
								className="text-muted-foreground transition-colors hover:text-foreground"
								aria-label="閉じる"
							>
								<X size={20} />
							</button>
						</div>

						{successMessage ? (
							<div className="mt-4 rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
								{successMessage}
							</div>
						) : (
							<form onSubmit={handleSubmit} className="mt-4 space-y-4">
								{errorMessage && (
									<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
										{errorMessage}
									</div>
								)}

								<fieldset>
									<legend className="mb-2 text-sm font-medium text-foreground">通報理由</legend>
									<div className="space-y-2">
										{(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(
											([value, label]) => (
												<label
													key={value}
													className="flex items-center gap-2 text-sm text-foreground"
												>
													<input
														type="radio"
														name="reason"
														value={value}
														checked={reason === value}
														onChange={() => setReason(value)}
														className="accent-primary"
													/>
													{label}
												</label>
											),
										)}
									</div>
								</fieldset>

								<div>
									<label
										htmlFor="report-description"
										className="mb-1 block text-sm font-medium text-foreground"
									>
										詳細説明（任意）
									</label>
									<textarea
										id="report-description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										maxLength={1000}
										rows={3}
										placeholder="詳しい内容を入力してください..."
										className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<p className="mt-1 text-xs text-muted-foreground">{description.length}/1000</p>
								</div>

								<div className="flex justify-end gap-2">
									<button
										type="button"
										onClick={handleClose}
										disabled={isSubmitting}
										className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
									>
										キャンセル
									</button>
									<button
										type="submit"
										disabled={isSubmitting || !reason}
										className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{isSubmitting ? (
											<>
												<Loader2 size={14} className="animate-spin" />
												送信中...
											</>
										) : (
											'通報する'
										)}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</>
	);
}
