import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
	slug: string;
}

export default function ArticleDeleteButton({ slug }: Props) {
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete() {
		if (!window.confirm('この記事を削除しますか？')) {
			return;
		}

		setIsDeleting(true);

		try {
			const res = await fetch(`/api/admin/articles/${slug}`, {
				method: 'DELETE',
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.error ?? '記事の削除に失敗しました');
			}

			window.location.href = '/';
		} catch (err) {
			alert(err instanceof Error ? err.message : '記事の削除に失敗しました');
			setIsDeleting(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleDelete}
			disabled={isDeleting}
			className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive shadow-xs hover:bg-destructive hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isDeleting ? (
				<>
					<Loader2 size={16} className="animate-spin" />
					削除中...
				</>
			) : (
				<>
					<Trash2 size={16} />
					削除
				</>
			)}
		</button>
	);
}
