import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { profiles } from '../../../db/schema';
import { errorResponse, unauthorized, validationError } from '../../../lib/errors';

export async function POST(context: APIContext): Promise<Response> {
	const { currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	if (!currentUser.profile) {
		return errorResponse(
			400,
			'VALIDATION_ERROR',
			'Profile not found. Please complete onboarding first.',
		);
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return errorResponse(400, 'VALIDATION_ERROR', 'Invalid JSON body');
	}

	if (typeof body !== 'object' || body === null) {
		return errorResponse(400, 'VALIDATION_ERROR', 'Request body must be a JSON object');
	}

	const obj = body as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	const updates: Partial<{ displayName: string; avatarUrl: string }> = {};

	if (obj.displayName !== undefined) {
		if (typeof obj.displayName !== 'string') {
			errors.displayName = ['displayName must be a string'];
		} else {
			const trimmed = obj.displayName.trim();
			if (trimmed.length < 1 || trimmed.length > 50) {
				errors.displayName = ['displayName must be between 1 and 50 characters'];
			} else {
				updates.displayName = trimmed;
			}
		}
	}

	const TRUSTED_AVATAR_DOMAINS = ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'];

	if (obj.avatarUrl !== undefined) {
		if (typeof obj.avatarUrl !== 'string') {
			errors.avatarUrl = ['avatarUrl must be a string'];
		} else {
			try {
				const parsed = new URL(obj.avatarUrl);
				if (parsed.protocol !== 'https:') {
					errors.avatarUrl = ['avatarUrl must be an HTTPS URL'];
				} else if (!TRUSTED_AVATAR_DOMAINS.includes(parsed.hostname)) {
					errors.avatarUrl = ['avatarUrl domain is not allowed'];
				} else {
					updates.avatarUrl = obj.avatarUrl;
				}
			} catch {
				if (obj.avatarUrl.startsWith('/api/images/')) {
					updates.avatarUrl = obj.avatarUrl;
				} else {
					errors.avatarUrl = ['avatarUrl must be a valid URL or internal image path'];
				}
			}
		}
	}

	if (Object.keys(errors).length > 0) {
		return validationError(errors);
	}

	if (Object.keys(updates).length === 0) {
		return errorResponse(400, 'VALIDATION_ERROR', 'At least one field must be provided');
	}

	const { db } = context.locals;

	const [updated] = await db
		.update(profiles)
		.set({
			...updates,
			updatedAt: new Date(),
		})
		.where(eq(profiles.id, currentUser.id))
		.returning({
			displayName: profiles.displayName,
			avatarUrl: profiles.avatarUrl,
		});

	return new Response(
		JSON.stringify({
			success: true,
			profile: {
				displayName: updated.displayName,
				avatarUrl: updated.avatarUrl,
			},
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		},
	);
}
