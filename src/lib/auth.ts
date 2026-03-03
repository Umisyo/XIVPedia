import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { users } from '../db/schema';

export interface AuthUser {
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	role: 'user' | 'moderator' | 'admin';
}

export async function resolveUser(request: Request, db: Database): Promise<AuthUser | null> {
	const header = request.headers.get('Authorization');
	if (!header?.startsWith('Bearer ')) return null;

	const userId = header.slice(7).trim();
	if (!userId) return null;

	const [user] = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			role: users.role,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return (user as AuthUser) ?? null;
}
