const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXTENSION_MAP: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
};

export interface UploadInput {
	filename: string;
	contentType: string;
	size: number;
}

type ValidationResult<T> =
	| { success: true; data: T }
	| { success: false; errors: Record<string, string[]> };

export function validateUploadInput(data: unknown): ValidationResult<UploadInput> {
	if (typeof data !== 'object' || data === null) {
		return { success: false, errors: { _: ['Request body must be a JSON object'] } };
	}

	const obj = data as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	if (typeof obj.filename !== 'string' || obj.filename.length === 0) {
		errors.filename = ['filename is required and must be a non-empty string'];
	}

	if (typeof obj.contentType !== 'string') {
		errors.contentType = ['contentType is required and must be a string'];
	} else if (!ALLOWED_CONTENT_TYPES.has(obj.contentType)) {
		errors.contentType = [`contentType must be one of: ${[...ALLOWED_CONTENT_TYPES].join(', ')}`];
	}

	if (typeof obj.size !== 'number' || !Number.isFinite(obj.size)) {
		errors.size = ['size is required and must be a number'];
	} else if (obj.size <= 0) {
		errors.size = ['size must be greater than 0'];
	} else if (obj.size > MAX_FILE_SIZE) {
		errors.size = [`size must not exceed ${MAX_FILE_SIZE} bytes (5MB)`];
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return {
		success: true,
		data: {
			filename: obj.filename as string,
			contentType: obj.contentType as string,
			size: obj.size as number,
		},
	};
}

export function isAllowedContentType(contentType: string): boolean {
	return ALLOWED_CONTENT_TYPES.has(contentType);
}

export function generateR2Key(userId: string, contentType: string): string {
	const timestamp = Date.now();
	const randomId = crypto.randomUUID().slice(0, 8);
	const ext = EXTENSION_MAP[contentType] ?? 'bin';
	return `images/${userId}/${timestamp}-${randomId}.${ext}`;
}
