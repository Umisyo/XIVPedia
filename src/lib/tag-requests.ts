import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { profiles, tagRequests } from '../db/schema';

export interface TagRequestInfo {
	id: string;
	name: string;
	description: string;
	category: string;
	status: 'pending' | 'approved' | 'rejected';
	requesterId: string;
	requesterName: string | null;
	reviewedBy: string | null;
	rejectionReason: string | null;
	createdAt: Date;
	reviewedAt: Date | null;
}

export async function createTagRequest(
	db: Database,
	data: { name: string; description: string; category: string; requesterId: string },
): Promise<TagRequestInfo> {
	const [row] = await db
		.insert(tagRequests)
		.values({
			name: data.name,
			description: data.description,
			category: data.category,
			requesterId: data.requesterId,
		})
		.returning();

	return {
		...row,
		status: row.status as TagRequestInfo['status'],
		requesterName: null,
	};
}

export async function listTagRequestsByUser(
	db: Database,
	userId: string,
): Promise<TagRequestInfo[]> {
	const rows = await db
		.select({
			id: tagRequests.id,
			name: tagRequests.name,
			description: tagRequests.description,
			category: tagRequests.category,
			status: tagRequests.status,
			requesterId: tagRequests.requesterId,
			requesterName: profiles.displayName,
			reviewedBy: tagRequests.reviewedBy,
			rejectionReason: tagRequests.rejectionReason,
			createdAt: tagRequests.createdAt,
			reviewedAt: tagRequests.reviewedAt,
		})
		.from(tagRequests)
		.leftJoin(profiles, eq(tagRequests.requesterId, profiles.id))
		.where(eq(tagRequests.requesterId, userId))
		.orderBy(desc(tagRequests.createdAt));

	return rows.map((r) => ({
		...r,
		status: r.status as TagRequestInfo['status'],
	}));
}

export async function listAllTagRequests(
	db: Database,
	statusFilter?: 'pending' | 'approved' | 'rejected',
): Promise<TagRequestInfo[]> {
	const baseConditions = statusFilter ? eq(tagRequests.status, statusFilter) : undefined;

	const rows = await db
		.select({
			id: tagRequests.id,
			name: tagRequests.name,
			description: tagRequests.description,
			category: tagRequests.category,
			status: tagRequests.status,
			requesterId: tagRequests.requesterId,
			requesterName: profiles.displayName,
			reviewedBy: tagRequests.reviewedBy,
			rejectionReason: tagRequests.rejectionReason,
			createdAt: tagRequests.createdAt,
			reviewedAt: tagRequests.reviewedAt,
		})
		.from(tagRequests)
		.leftJoin(profiles, eq(tagRequests.requesterId, profiles.id))
		.where(baseConditions)
		.orderBy(desc(tagRequests.createdAt));

	return rows.map((r) => ({
		...r,
		status: r.status as TagRequestInfo['status'],
	}));
}

export async function getTagRequestById(db: Database, id: string): Promise<TagRequestInfo | null> {
	const [row] = await db
		.select({
			id: tagRequests.id,
			name: tagRequests.name,
			description: tagRequests.description,
			category: tagRequests.category,
			status: tagRequests.status,
			requesterId: tagRequests.requesterId,
			requesterName: profiles.displayName,
			reviewedBy: tagRequests.reviewedBy,
			rejectionReason: tagRequests.rejectionReason,
			createdAt: tagRequests.createdAt,
			reviewedAt: tagRequests.reviewedAt,
		})
		.from(tagRequests)
		.leftJoin(profiles, eq(tagRequests.requesterId, profiles.id))
		.where(eq(tagRequests.id, id))
		.limit(1);

	if (!row) return null;
	return { ...row, status: row.status as TagRequestInfo['status'] };
}

export async function reviewTagRequest(
	db: Database,
	id: string,
	data: {
		status: 'approved' | 'rejected';
		reviewedBy: string;
		rejectionReason?: string;
	},
): Promise<TagRequestInfo | null> {
	const [row] = await db
		.update(tagRequests)
		.set({
			status: data.status,
			reviewedBy: data.reviewedBy,
			rejectionReason: data.status === 'rejected' ? (data.rejectionReason ?? null) : null,
			reviewedAt: new Date(),
		})
		.where(and(eq(tagRequests.id, id), eq(tagRequests.status, 'pending')))
		.returning();

	if (!row) return null;
	return {
		...row,
		status: row.status as TagRequestInfo['status'],
		requesterName: null,
	};
}

export async function checkDuplicateTagRequest(db: Database, name: string): Promise<boolean> {
	const [row] = await db
		.select({ id: tagRequests.id })
		.from(tagRequests)
		.where(and(eq(tagRequests.name, name), eq(tagRequests.status, 'pending')))
		.limit(1);

	return !!row;
}
