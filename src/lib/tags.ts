import type { InferSelectModel } from 'drizzle-orm';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { tags } from '../db/schema';

type TagRow = InferSelectModel<typeof tags>;

export type TagCategory = TagRow['category'];

export const TAG_CATEGORIES = ['duty', 'job', 'crafting', 'gathering', 'general'] as const;

export interface TagInfo {
	id: string;
	name: string;
	slug: string;
	category: TagCategory;
}

export interface ListTagsOptions {
	category?: TagCategory;
}

export async function listTags(db: Database, options: ListTagsOptions = {}): Promise<TagInfo[]> {
	const query = db
		.select({
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			category: tags.category,
		})
		.from(tags);

	const rows = options.category
		? await query
				.where(eq(tags.category, options.category))
				.orderBy(asc(tags.category), asc(tags.name))
		: await query.orderBy(asc(tags.category), asc(tags.name));

	return rows;
}

export type GroupedTags = Record<string, TagInfo[]>;

export function groupTagsByCategory(tagList: TagInfo[]): GroupedTags {
	const grouped: GroupedTags = {};
	for (const tag of tagList) {
		const list = grouped[tag.category] ?? [];
		list.push(tag);
		grouped[tag.category] = list;
	}
	return grouped;
}
