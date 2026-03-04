import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { tagCategories } from '../db/schema';

export interface CategoryInfo {
	id: string;
	name: string;
	slug: string;
	displayOrder: number;
}

export async function listCategories(db: Database): Promise<CategoryInfo[]> {
	return db
		.select({
			id: tagCategories.id,
			name: tagCategories.name,
			slug: tagCategories.slug,
			displayOrder: tagCategories.displayOrder,
		})
		.from(tagCategories)
		.orderBy(asc(tagCategories.displayOrder), asc(tagCategories.name));
}

export async function getCategoryById(db: Database, id: string): Promise<CategoryInfo | null> {
	const [row] = await db
		.select({
			id: tagCategories.id,
			name: tagCategories.name,
			slug: tagCategories.slug,
			displayOrder: tagCategories.displayOrder,
		})
		.from(tagCategories)
		.where(eq(tagCategories.id, id))
		.limit(1);
	return row ?? null;
}

export interface CreateCategoryData {
	name: string;
	slug: string;
	displayOrder?: number;
}

export async function createCategory(
	db: Database,
	data: CreateCategoryData,
): Promise<CategoryInfo> {
	const [row] = await db
		.insert(tagCategories)
		.values({
			name: data.name,
			slug: data.slug,
			displayOrder: data.displayOrder ?? 0,
		})
		.returning({
			id: tagCategories.id,
			name: tagCategories.name,
			slug: tagCategories.slug,
			displayOrder: tagCategories.displayOrder,
		});
	return row;
}

export interface UpdateCategoryData {
	name?: string;
	slug?: string;
	displayOrder?: number;
}

export async function updateCategory(
	db: Database,
	id: string,
	data: UpdateCategoryData,
): Promise<CategoryInfo | null> {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.slug !== undefined) updates.slug = data.slug;
	if (data.displayOrder !== undefined) updates.display_order = data.displayOrder;

	const [row] = await db
		.update(tagCategories)
		.set(updates)
		.where(eq(tagCategories.id, id))
		.returning({
			id: tagCategories.id,
			name: tagCategories.name,
			slug: tagCategories.slug,
			displayOrder: tagCategories.displayOrder,
		});
	return row ?? null;
}

export async function deleteCategory(db: Database, id: string): Promise<boolean> {
	const result = await db
		.delete(tagCategories)
		.where(eq(tagCategories.id, id))
		.returning({ id: tagCategories.id });
	return result.length > 0;
}

export async function listCategorySlugs(db: Database): Promise<string[]> {
	const rows = await db
		.select({ slug: tagCategories.slug })
		.from(tagCategories)
		.orderBy(asc(tagCategories.displayOrder));
	return rows.map((r) => r.slug);
}
