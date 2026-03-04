type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; errors: Record<string, string[]> };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface CreateCommentInput {
	body: string;
}

export interface CreateArticleInput {
	title: string;
	body: string;
	tags?: string[];
	status?: 'draft' | 'published';
}

export interface UpdateArticleInput {
	title?: string;
	body?: string;
	tags?: string[];
	status?: 'draft' | 'published';
}

export function validateCreateArticle(data: unknown): ValidationResult<CreateArticleInput> {
	if (typeof data !== 'object' || data === null) {
		return { success: false, errors: { _: ['Request body must be a JSON object'] } };
	}

	const obj = data as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	// title
	if (obj.title === undefined || obj.title === null) {
		errors.title = ['title is required'];
	} else if (typeof obj.title !== 'string') {
		errors.title = ['title must be a string'];
	} else if (obj.title.length < 1 || obj.title.length > 100) {
		errors.title = ['title must be between 1 and 100 characters'];
	}

	// body
	if (obj.body === undefined || obj.body === null) {
		errors.body = ['body is required'];
	} else if (typeof obj.body !== 'string') {
		errors.body = ['body must be a string'];
	} else if (obj.body.length < 1 || obj.body.length > 50000) {
		errors.body = ['body must be between 1 and 50000 characters'];
	}

	// tags (optional)
	if (obj.tags !== undefined) {
		if (!Array.isArray(obj.tags)) {
			errors.tags = ['tags must be an array'];
		} else if (obj.tags.length > 10) {
			errors.tags = ['tags must have at most 10 items'];
		} else if (!obj.tags.every((t: unknown) => typeof t === 'string')) {
			errors.tags = ['each tag must be a string'];
		}
	}

	// status (optional)
	if (obj.status !== undefined) {
		if (obj.status !== 'draft' && obj.status !== 'published') {
			errors.status = ['status must be "draft" or "published"'];
		}
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return {
		success: true,
		data: {
			title: obj.title as string,
			body: obj.body as string,
			tags: obj.tags as string[] | undefined,
			status: (obj.status as 'draft' | 'published') ?? undefined,
		},
	};
}

export function validateUpdateArticle(data: unknown): ValidationResult<UpdateArticleInput> {
	if (typeof data !== 'object' || data === null) {
		return { success: false, errors: { _: ['Request body must be a JSON object'] } };
	}

	const obj = data as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	const hasTitle = obj.title !== undefined;
	const hasBody = obj.body !== undefined;
	const hasTags = obj.tags !== undefined;
	const hasStatus = obj.status !== undefined;

	if (!hasTitle && !hasBody && !hasTags && !hasStatus) {
		return {
			success: false,
			errors: { _: ['At least one field must be provided'] },
		};
	}

	// title (optional)
	if (hasTitle) {
		if (typeof obj.title !== 'string') {
			errors.title = ['title must be a string'];
		} else if (obj.title.length < 1 || obj.title.length > 100) {
			errors.title = ['title must be between 1 and 100 characters'];
		}
	}

	// body (optional)
	if (hasBody) {
		if (typeof obj.body !== 'string') {
			errors.body = ['body must be a string'];
		} else if (obj.body.length < 1 || obj.body.length > 50000) {
			errors.body = ['body must be between 1 and 50000 characters'];
		}
	}

	// tags (optional)
	if (hasTags) {
		if (!Array.isArray(obj.tags)) {
			errors.tags = ['tags must be an array'];
		} else if (obj.tags.length > 10) {
			errors.tags = ['tags must have at most 10 items'];
		} else if (!obj.tags.every((t: unknown) => typeof t === 'string')) {
			errors.tags = ['each tag must be a string'];
		}
	}

	// status (optional)
	if (hasStatus) {
		if (obj.status !== 'draft' && obj.status !== 'published') {
			errors.status = ['status must be "draft" or "published"'];
		}
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const result: UpdateArticleInput = {};
	if (hasTitle) result.title = obj.title as string;
	if (hasBody) result.body = obj.body as string;
	if (hasTags) result.tags = obj.tags as string[];
	if (hasStatus) result.status = obj.status as 'draft' | 'published';

	return { success: true, data: result };
}

export function validateCreateComment(data: unknown): ValidationResult<CreateCommentInput> {
	if (typeof data !== 'object' || data === null) {
		return { success: false, errors: { _: ['Request body must be a JSON object'] } };
	}

	const obj = data as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	// body
	if (obj.body === undefined || obj.body === null) {
		errors.body = ['body is required'];
	} else if (typeof obj.body !== 'string') {
		errors.body = ['body must be a string'];
	} else if (obj.body.length < 1 || obj.body.length > 2000) {
		errors.body = ['body must be between 1 and 2000 characters'];
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return {
		success: true,
		data: {
			body: obj.body as string,
		},
	};
}
