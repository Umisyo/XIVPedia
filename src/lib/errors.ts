type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR';

interface ErrorBody {
	error: {
		code: ErrorCode;
		message: string;
		details?: Record<string, string[]>;
	};
}

export function errorResponse(
	status: number,
	code: ErrorCode,
	message: string,
	details?: Record<string, string[]>,
): Response {
	const body: ErrorBody = { error: { code, message } };
	if (details) body.error.details = details;
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export function validationError(details: Record<string, string[]>): Response {
	return errorResponse(400, 'VALIDATION_ERROR', 'Validation failed', details);
}

export function notFound(message = 'Resource not found'): Response {
	return errorResponse(404, 'NOT_FOUND', message);
}

export function unauthorized(message = 'Authentication required'): Response {
	return errorResponse(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Permission denied'): Response {
	return errorResponse(403, 'FORBIDDEN', message);
}
