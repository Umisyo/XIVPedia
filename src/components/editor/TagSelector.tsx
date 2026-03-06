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

const VISIBLE_COUNT = 5;

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
	const hasMore = categoryTags.length > VISIBLE_COUNT;
	const visibleTags = hasMore ? categoryTags.slice(0, VISIBLE_COUNT) : categoryTags;
	const hiddenCount = categoryTags.length - VISIBLE_COUNT;

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
						さらに表示（+{hiddenCount}）
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
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	function handleOverlayClick(e: React.MouseEvent) {
		if (e.target === overlayRef.current) onClose();
	}

	return (
		<div
			ref={overlayRef}
			role="dialog"
			aria-modal="true"
			aria-label={`${categoryName}のタグを選択`}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={handleOverlayClick}
			onKeyDown={(e) => {
				if (e.key === 'Escape') onClose();
			}}
		>
			<div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg mx-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">{categoryName}</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
						aria-label="閉じる"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
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
				<div className="flex justify-end mt-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						完了
					</button>
				</div>
			</div>
		</div>
	);
}
