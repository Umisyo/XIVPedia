import type { APIContext } from 'astro';
import { errorResponse, notFound, unauthorized } from '../../../lib/errors';
import { isAllowedContentType } from '../../../lib/images';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function detectMimeType(buffer: ArrayBuffer): string | null {
	const bytes = new Uint8Array(buffer);
	if (bytes.length < 4) return null;
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
		return 'image/png';
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	)
		return 'image/webp';
	return null;
}

export async function PUT(context: APIContext): Promise<Response> {
	const { currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	const key = context.params.key;
	if (!key) {
		return notFound('Image key is required');
	}

	const expectedPrefix = `images/${currentUser.id}/`;
	if (!key.startsWith(expectedPrefix)) {
		return errorResponse(403, 'FORBIDDEN', 'Cannot upload to this key');
	}
	if (key.includes('..') || key.includes('\0')) {
		return errorResponse(400, 'VALIDATION_ERROR', 'Invalid key');
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

	const detectedType = detectMimeType(body);
	if (!detectedType || detectedType !== contentType) {
		return errorResponse(
			400,
			'VALIDATION_ERROR',
			'File content does not match declared Content-Type',
		);
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
