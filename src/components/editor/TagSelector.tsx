import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import type { TagInfo } from '@/lib/tags';

export interface CategoryLabel {
	slug: string;
	name: string;
}

interface TagSelectorProps {
	tags: TagInfo[];
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	categories?: CategoryLabel[];
}

const VISIBLE_THRESHOLD = 5;

export function TagSelector({ tags, selectedIds, onChange, categories }: TagSelectorProps) {
	const categoryLabels = new Map(categories?.map((c) => [c.slug, c.name]) ?? []);
	const grouped = new Map<string, TagInfo[]>();
	for (const tag of tags) {
		const list = grouped.get(tag.category) ?? [];
		list.push(tag);
		grouped.set(tag.category, list);
	}

	const handleToggle = useCallback(
		(tagId: string) => {
			if (selectedIds.includes(tagId)) {
				onChange(selectedIds.filter((id) => id !== tagId));
			} else if (selectedIds.length < 10) {
				onChange([...selectedIds, tagId]);
			}
		},
		[selectedIds, onChange],
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>タグ</Label>
				<span className="text-xs text-muted-foreground">{selectedIds.length}/10</span>
			</div>
			{[...grouped.entries()].map(([category, categoryTags]) => (
				<CategoryTagGroup
					key={category}
					categoryName={categoryLabels.get(category) ?? category}
					categoryTags={categoryTags}
					selectedIds={selectedIds}
					onToggle={handleToggle}
				/>
			))}
			<p className="text-xs text-muted-foreground">
				ここにないタグが欲しい場合は、右上のメニューからタグ申請できます
			</p>
		</div>
	);
}

interface CategoryTagGroupProps {
	categoryName: string;
	categoryTags: TagInfo[];
	selectedIds: string[];
	onToggle: (tagId: string) => void;
}

function CategoryTagGroup({
	categoryName,
	categoryTags,
	selectedIds,
	onToggle,
}: CategoryTagGroupProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const hasMore = categoryTags.length > VISIBLE_THRESHOLD;

	// Show first 5 tags + any selected tags beyond the first 5
	const visibleTags = hasMore
		? categoryTags.filter((tag, index) => index < VISIBLE_THRESHOLD || selectedIds.includes(tag.id))
		: categoryTags;

	// Count tags not shown in the visible area
	const hiddenCount = hasMore ? categoryTags.length - visibleTags.length : 0;

	return (
		<div>
			<p className="text-xs font-medium text-muted-foreground mb-2">{categoryName}</p>
			<div className="flex flex-wrap gap-2">
				{visibleTags.map((tag) => (
					<TagButton
						key={tag.id}
						tag={tag}
						isSelected={selectedIds.includes(tag.id)}
						disabled={!selectedIds.includes(tag.id) && selectedIds.length >= 10}
						onToggle={onToggle}
					/>
				))}
				{hasMore && (
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="rounded-md px-2.5 py-1 text-xs transition-colors bg-secondary text-muted-foreground hover:bg-secondary/80 border border-dashed border-muted-foreground/30"
					>
						さらに表示{hiddenCount > 0 ? `（+${hiddenCount}）` : ''}
					</button>
				)}
			</div>
			{isModalOpen && (
				<TagModal
					categoryName={categoryName}
					categoryTags={categoryTags}
					selectedIds={selectedIds}
					onToggle={onToggle}
					onClose={() => setIsModalOpen(false)}
				/>
			)}
		</div>
	);
}

interface TagButtonProps {
	tag: TagInfo;
	isSelected: boolean;
	disabled: boolean;
	onToggle: (tagId: string) => void;
}

function TagButton({ tag, isSelected, disabled, onToggle }: TagButtonProps) {
	return (
		<button
			type="button"
			onClick={() => onToggle(tag.id)}
			disabled={disabled}
			aria-pressed={isSelected}
			className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
				isSelected
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-muted-foreground hover:bg-secondary/80 disabled:opacity-50'
			}`}
		>
			{tag.name}
		</button>
	);
}

interface TagModalProps {
	categoryName: string;
	categoryTags: TagInfo[];
	selectedIds: string[];
	onToggle: (tagId: string) => void;
	onClose: () => void;
}

function TagModal({ categoryName, categoryTags, selectedIds, onToggle, onClose }: TagModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) {
			dialog.showModal();
		}
		return () => {
			if (dialog?.open) {
				dialog.close();
			}
		};
	}, []);

	function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
		if (e.target === dialogRef.current) {
			onClose();
		}
	}

	return (
		<dialog
			ref={dialogRef}
			onClick={handleBackdropClick}
			onKeyDown={(e) => {
				if (e.key === 'Escape') onClose();
			}}
			onClose={onClose}
			aria-label={`${categoryName}のタグを選択`}
			className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-lg border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/50"
		>
			<div className="flex flex-col">
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<h3 className="text-sm font-semibold">{categoryName}</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
						aria-label="閉じる"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="overflow-y-auto p-4 max-h-64">
					<div className="flex flex-wrap gap-2">
						{categoryTags.map((tag) => (
							<TagButton
								key={tag.id}
								tag={tag}
								isSelected={selectedIds.includes(tag.id)}
								disabled={!selectedIds.includes(tag.id) && selectedIds.length >= 10}
								onToggle={onToggle}
							/>
						))}
					</div>
				</div>
				<div className="flex justify-end border-t border-border px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						完了
					</button>
				</div>
			</div>
		</dialog>
	);
}
