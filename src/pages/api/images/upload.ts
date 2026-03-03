import type { APIContext } from 'astro';
import { errorResponse, unauthorized, validationError } from '../../../lib/errors';
import { generateR2Key, validateUploadInput } from '../../../lib/images';

export async function POST(context: APIContext): Promise<Response> {
	const { currentUser } = context.locals;

	if (!currentUser) {
		return unauthorized();
	}

	let body: unknown;
	try {
		body = await context.request.json();
	} catch {
		return errorResponse(400, 'VALIDATION_ERROR', 'Invalid JSON body');
	}

	const validation = validateUploadInput(body);

	if (!validation.success) {
		return validationError(validation.errors);
	}

	const { contentType } = validation.data;
	const key = generateR2Key(currentUser.id, contentType);

	return new Response(
		JSON.stringify({
			uploadUrl: `/api/images/${key}`,
			imageUrl: `/api/images/${key}`,
			key,
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		},
	);
}
