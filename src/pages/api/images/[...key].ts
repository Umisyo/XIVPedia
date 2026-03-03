import type { APIContext } from 'astro';
import { errorResponse, notFound, unauthorized } from '../../../lib/errors';
import { isAllowedContentType } from '../../../lib/images';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function PUT(context: APIContext): Promise<Response> {
	const { currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	const key = context.params.key;
	if (!key) {
		return notFound('Image key is required');
	}

	const contentType = context.request.headers.get('content-type') ?? '';
	if (!isAllowedContentType(contentType)) {
		return errorResponse(
			400,
			'VALIDATION_ERROR',
			'Content-Type must be one of: image/png, image/jpeg, image/webp, image/gif',
		);
	}

	const contentLength = Number(context.request.headers.get('content-length') ?? '0');
	if (contentLength > MAX_FILE_SIZE) {
		return errorResponse(400, 'VALIDATION_ERROR', 'File size must not exceed 5MB');
	}

	const body = await context.request.arrayBuffer();
	if (body.byteLength > MAX_FILE_SIZE) {
		return errorResponse(400, 'VALIDATION_ERROR', 'File size must not exceed 5MB');
	}

	const bucket = context.locals.runtime.env.R2_BUCKET;

	await bucket.put(key, body, {
		httpMetadata: { contentType },
		customMetadata: { userId: currentUser.id },
	});

	return new Response(
		JSON.stringify({
			imageUrl: `/api/images/${key}`,
			key,
		}),
		{
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		},
	);
}

export async function GET(context: APIContext): Promise<Response> {
	const key = context.params.key;
	if (!key) {
		return notFound('Image key is required');
	}

	const bucket = context.locals.runtime.env.R2_BUCKET;
	const object = await bucket.get(key);

	if (!object) {
		return notFound('Image not found');
	}

	return new Response(object.body, {
		headers: {
			'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
			'Cache-Control': 'public, max-age=31536000, immutable',
			ETag: object.httpEtag,
		},
	});
}
