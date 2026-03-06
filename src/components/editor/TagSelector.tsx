import { useState } from 'react';
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

const DROPDOWN_THRESHOLD = 6;

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

	function handleDropdownAdd(tagId: string) {
		if (tagId && !selectedIds.includes(tagId) && selectedIds.length < 10) {
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
				<CategoryTagGroup
					key={category}
					categoryName={categoryLabels.get(category) ?? category}
					categoryTags={categoryTags}
					selectedIds={selectedIds}
					onToggle={handleToggle}
					onDropdownAdd={handleDropdownAdd}
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
	onDropdownAdd: (tagId: string) => void;
}

function CategoryTagGroup({
	categoryName,
	categoryTags,
	selectedIds,
	onToggle,
	onDropdownAdd,
}: CategoryTagGroupProps) {
	const [dropdownValue, setDropdownValue] = useState('');
	const useDropdown = categoryTags.length >= DROPDOWN_THRESHOLD;
	const selectedInCategory = categoryTags.filter((t) => selectedIds.includes(t.id));
	const unselectedInCategory = categoryTags.filter((t) => !selectedIds.includes(t.id));

	return (
		<div>
			<p className="text-xs font-medium text-muted-foreground mb-2">{categoryName}</p>
			{useDropdown ? (
				<div className="space-y-2">
					{selectedInCategory.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{selectedInCategory.map((tag) => (
								<button
									key={tag.id}
									type="button"
									onClick={() => onToggle(tag.id)}
									aria-pressed={true}
									className="rounded-md px-2.5 py-1 text-xs transition-colors bg-primary text-primary-foreground"
								>
									{tag.name} ✕
								</button>
							))}
						</div>
					)}
					<select
						value={dropdownValue}
						onChange={(e) => {
							onDropdownAdd(e.target.value);
							setDropdownValue('');
						}}
						disabled={selectedIds.length >= 10}
						className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none disabled:opacity-50"
					>
						<option value="">タグを選択...</option>
						{unselectedInCategory.map((tag) => (
							<option key={tag.id} value={tag.id}>
								{tag.name}
							</option>
						))}
					</select>
				</div>
			) : (
				<div className="flex flex-wrap gap-2">
					{categoryTags.map((tag) => {
						const isSelected = selectedIds.includes(tag.id);
						return (
							<button
								key={tag.id}
								type="button"
								onClick={() => onToggle(tag.id)}
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
			)}
		</div>
	);
}
