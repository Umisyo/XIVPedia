import type { Database } from '../db';
import { notifications } from '../db/schema';

export async function createNotification(
	db: Database,
	data: {
		userId: string;
		type: 'comment' | 'reaction' | 'tag_request_approved' | 'tag_request_rejected';
		message: string;
		link?: string;
	},
) {
	await db.insert(notifications).values(data);
}
