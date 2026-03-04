import { and, count, desc, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { reports } from '../db/schema';

export interface CreateReportData {
	reason: 'spam' | 'inappropriate' | 'misleading' | 'other';
	description?: string;
	targetType: 'article' | 'comment';
	targetId: string;
}

export interface ListReportsOptions {
	status?: 'pending' | 'resolved' | 'dismissed';
	page?: number;
	limit?: number;
}

export async function createReport(db: Database, data: CreateReportData, reporterId: string) {
	// 重複チェック: 同じユーザーが同じ targetType + targetId を重複通報できない
	const existing = await db
		.select({ id: reports.id })
		.from(reports)
		.where(
			and(
				eq(reports.reporterId, reporterId),
				eq(reports.targetType, data.targetType),
				eq(reports.targetId, data.targetId),
			),
		)
		.limit(1);

	if (existing.length > 0) {
		return { duplicate: true, data: null } as const;
	}

	const [inserted] = await db
		.insert(reports)
		.values({
			reason: data.reason,
			description: data.description ?? null,
			targetType: data.targetType,
			targetId: data.targetId,
			reporterId,
		})
		.returning();

	return { duplicate: false, data: inserted } as const;
}

export async function listReports(db: Database, options: ListReportsOptions = {}) {
	const page = Math.max(1, options.page ?? 1);
	const limit = Math.min(100, Math.max(1, options.limit ?? 20));
	const offset = (page - 1) * limit;

	const conditions = [];
	if (options.status) {
		conditions.push(eq(reports.status, options.status));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const totalResult = await db.select({ total: count() }).from(reports).where(where);

	const rows = await db
		.select()
		.from(reports)
		.where(where)
		.orderBy(desc(reports.createdAt))
		.limit(limit)
		.offset(offset);

	const total = totalResult[0]?.total ?? 0;

	return { data: rows, meta: { page, limit, total } };
}

export async function updateReportStatus(
	db: Database,
	id: string,
	status: 'resolved' | 'dismissed',
	resolvedBy: string,
) {
	const existing = await db
		.select({ id: reports.id })
		.from(reports)
		.where(eq(reports.id, id))
		.limit(1);

	if (existing.length === 0) {
		return null;
	}

	const [updated] = await db
		.update(reports)
		.set({
			status,
			resolvedBy,
			resolvedAt: new Date(),
		})
		.where(eq(reports.id, id))
		.returning();

	return updated;
}
