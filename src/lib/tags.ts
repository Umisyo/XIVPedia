import type { InferSelectModel } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import type { Database } from '../db';
import { tags } from '../db/schema';

type TagRow = InferSelectModel<typeof tags>;

export interface TagInfo {
	id: string;
	name: string;
	slug: string;
	category: TagRow['category'];
}

export async function listTags(db: Database): Promise<TagInfo[]> {
	const rows = await db
		.select({
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			category: tags.category,
		})
		.from(tags)
		.orderBy(asc(tags.category), asc(tags.name));

	return rows;
}
