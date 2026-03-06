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

export function TagSelector({ tags, selectedIds, onChange, categories }: TagSelectorProps) {
	const categoryLabels = new Map(categories?.map((c) => [c.slug, c.name]) ?? []);
	const grouped = new Map<string, TagInfo[]>();
	for (const tag of tags) {
		const list = grouped.get(tag.category) ?? [];
		list.push(tag);
		grouped.set(tag.category, list);
	}

	function handleToggle(tagId: string) {
		if (selectedIds.includes(tagId)) {
			onChange(selectedIds.filter((id) => id !== tagId));
		} else if (selectedIds.length < 10) {
			onChange([...selectedIds, tagId]);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>タグ</Label>
				<span className="text-xs text-muted-foreground">{selectedIds.length}/10</span>
			</div>
			{[...grouped.entries()].map(([category, categoryTags]) => (
				<div key={category}>
					<p className="text-xs font-medium text-muted-foreground mb-2">
						{categoryLabels.get(category) ?? category}
					</p>
					<div className="flex flex-wrap gap-2">
						{categoryTags.map((tag) => {
							const isSelected = selectedIds.includes(tag.id);
							return (
								<button
									key={tag.id}
									type="button"
									onClick={() => handleToggle(tag.id)}
									disabled={!isSelected && selectedIds.length >= 10}
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
						})}
					</div>
				</div>
			))}
			<p className="text-xs text-muted-foreground">
				ここにないタグが欲しい場合は、右上のメニューからタグ申請できます
			</p>
		</div>
	);
}
