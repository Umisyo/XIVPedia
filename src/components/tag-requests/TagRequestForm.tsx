import { useState } from 'react';

interface Category {
	id: string;
	name: string;
	slug: string;
	displayOrder: number;
}

interface TagRequestFormProps {
	categories: Category[];
}

export default function TagRequestForm({ categories }: TagRequestFormProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState(categories[0]?.slug ?? '');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});
		setSuccess(false);

		try {
			const res = await fetch('/api/tag-requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), description: description.trim(), category }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				if (json?.error?.details) {
					setErrors(json.error.details);
				} else {
					setErrors({ _: [json?.error?.message ?? 'タグ申請に失敗しました'] });
				}
				return;
			}

			setName('');
			setDescription('');
			setSuccess(true);
		} catch {
			setErrors({ _: ['タグ申請に失敗しました'] });
		} finally {
			setIsSubmitting(false);
		}
	}

	if (categories.length === 0) {
		return (
			<div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
				カテゴリが登録されていないため、タグの申請ができません。
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{errors._ && (
				<div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{errors._.map((msg) => (
						<p key={msg}>{msg}</p>
					))}
				</div>
			)}

			{success && (
				<div className="rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
					タグ申請を送信しました。管理者の承認をお待ちください。
				</div>
			)}

			<div className="space-y-2">
				<label htmlFor="tag-name" className="block text-sm font-medium text-foreground">
					タグ名 <span className="text-destructive">*</span>
				</label>
				<input
					id="tag-name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="例: 極ナイツ・オブ・ラウンド"
					maxLength={50}
					className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
				/>
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name[0]}</p>
				)}
			</div>

			<div className="space-y-2">
				<label htmlFor="tag-category" className="block text-sm font-medium text-foreground">
					カテゴリ <span className="text-destructive">*</span>
				</label>
				<select
					id="tag-category"
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
				>
					{categories.map((cat) => (
						<option key={cat.slug} value={cat.slug}>
							{cat.name}
						</option>
					))}
				</select>
				{errors.category && (
					<p className="text-xs text-destructive">{errors.category[0]}</p>
				)}
			</div>

			<div className="space-y-2">
				<label htmlFor="tag-description" className="block text-sm font-medium text-foreground">
					申請理由 <span className="text-destructive">*</span>
				</label>
				<textarea
					id="tag-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="このタグが必要な理由や用途を記入してください"
					maxLength={500}
					rows={3}
					className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
				/>
				<p className="text-xs text-muted-foreground">{description.length}/500</p>
				{errors.description && (
					<p className="text-xs text-destructive">{errors.description[0]}</p>
				)}
			</div>

			<button
				type="submit"
				disabled={isSubmitting || !name.trim() || !description.trim()}
				className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
			>
				{isSubmitting ? '送信中...' : 'タグを申請する'}
			</button>
		</form>
	);
}
