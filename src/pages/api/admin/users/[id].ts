import type { APIContext } from 'astro';
import { count as countFn, eq } from 'drizzle-orm';
import { profiles } from '../../../../db/schema';
import {
	errorResponse,
	forbidden,
	notFound,
	unauthorized,
	validationError,
} from '../../../../lib/errors';

const VALID_ROLES = ['user', 'moderator', 'admin'] as const;
type Role = (typeof VALID_ROLES)[number];

export async function PATCH(context: APIContext): Promise<Response> {
	const { db, currentUser } = context.locals;
	const targetId = context.params.id as string;

	if (!currentUser) {
		return unauthorized();
	}

	if (currentUser.profile?.role !== 'admin') {
		return forbidden();
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return validationError({ _: ['Request body must be valid JSON'] });
	}

	const { role } = body as { role?: string };

	if (!role || !VALID_ROLES.includes(role as Role)) {
		return validationError({ role: ['Role must be one of: user, moderator, admin'] });
	}

	const newRole = role as Role;

	// 自分自身のadmin権限剥奪を禁止
	if (targetId === currentUser.id && newRole !== 'admin') {
		return errorResponse(400, 'VALIDATION_ERROR', 'Cannot remove your own admin role');
	}

	// 対象ユーザーの存在確認
	const [targetUser] = await db.select().from(profiles).where(eq(profiles.id, targetId)).limit(1);

	if (!targetUser) {
		return notFound('User not found');
	}

	// 最低1人のadmin保証
	if (targetUser.role === 'admin' && newRole !== 'admin') {
		const [adminCount] = await db
			.select({ count: countFn() })
			.from(profiles)
			.where(eq(profiles.role, 'admin'));

		if (adminCount.count <= 1) {
			return errorResponse(400, 'VALIDATION_ERROR', 'At least one admin must exist');
		}
	}

	// role更新
	const [updatedUser] = await db
		.update(profiles)
		.set({ role: newRole, updatedAt: new Date() })
		.where(eq(profiles.id, targetId))
		.returning({
			id: profiles.id,
			username: profiles.username,
			displayName: profiles.displayName,
			avatarUrl: profiles.avatarUrl,
			role: profiles.role,
			createdAt: profiles.createdAt,
		});

	return new Response(JSON.stringify({ user: updatedUser }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
