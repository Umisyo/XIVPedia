import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { tags } from '../db/schema';

export type TagCategory = string;

/** @deprecated Use listCategories() from categories.ts instead */
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

export function generateTagSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[\s　]+/g, '-')
		.replace(/[^a-z0-9\u3000-\u9fff\uf900-\ufaff-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export interface CreateTagData {
	name: string;
	slug: string;
	category: TagCategory;
}

export async function createTag(db: Database, data: CreateTagData): Promise<TagInfo> {
	const [row] = await db
		.insert(tags)
		.values({
			name: data.name,
			slug: data.slug,
			category: data.category,
		})
		.returning({
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			category: tags.category,
		});
	return row;
}

export interface UpdateTagData {
	name?: string;
	slug?: string;
	category?: TagCategory;
}

export async function updateTag(
	db: Database,
	id: string,
	data: UpdateTagData,
): Promise<TagInfo | null> {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.slug !== undefined) updates.slug = data.slug;
	if (data.category !== undefined) updates.category = data.category;

	const [row] = await db.update(tags).set(updates).where(eq(tags.id, id)).returning({
		id: tags.id,
		name: tags.name,
		slug: tags.slug,
		category: tags.category,
	});
	return row ?? null;
}

export async function deleteTag(db: Database, id: string): Promise<boolean> {
	const result = await db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id });
	return result.length > 0;
}

export async function getTagById(db: Database, id: string): Promise<TagInfo | null> {
	const [row] = await db
		.select({
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			category: tags.category,
		})
		.from(tags)
		.where(eq(tags.id, id))
		.limit(1);
	return row ?? null;
}
