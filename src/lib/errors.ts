type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'NOT_FOUND'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'INTERNAL_ERROR'
	| 'RATE_LIMITED';

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

export function rateLimitError(retryAfter: number): Response {
	const body: ErrorBody = {
		error: {
			code: 'RATE_LIMITED',
			message: 'Too many requests. Please try again later.',
		},
	};
	return new Response(JSON.stringify(body), {
		status: 429,
		headers: {
			'Content-Type': 'application/json',
			'Retry-After': String(retryAfter),
		},
	});
}
