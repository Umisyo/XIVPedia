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
	patch?: string | null;
}

export interface UpdateArticleInput {
	title?: string;
	body?: string;
	tags?: string[];
	status?: 'draft' | 'published';
	patch?: string | null;
}

export interface CreateReportInput {
	reason: 'spam' | 'inappropriate' | 'misleading' | 'other';
	description?: string;
	targetType: 'article' | 'comment';
	targetId: string;
}

export interface UpdateReportInput {
	status: 'resolved' | 'dismissed';
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

	// patch (optional)
	if (obj.patch !== undefined && obj.patch !== null && obj.patch !== '') {
		if (typeof obj.patch !== 'string') {
			errors.patch = ['patch must be a string'];
		} else if (!/^\d+\.\d+$/.test(obj.patch)) {
			errors.patch = ['patch must be in X.Y format (e.g. 7.0, 6.5)'];
		}
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const patchValue = obj.patch === '' || obj.patch === undefined ? undefined : (obj.patch as string | null);

	return {
		success: true,
		data: {
			title: obj.title as string,
			body: obj.body as string,
			tags: obj.tags as string[] | undefined,
			status: (obj.status as 'draft' | 'published') ?? undefined,
			patch: patchValue,
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
	const hasPatch = 'patch' in obj;

	if (!hasTitle && !hasBody && !hasTags && !hasStatus && !hasPatch) {
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

	// patch (optional)
	if (hasPatch && obj.patch !== null && obj.patch !== '') {
		if (typeof obj.patch !== 'string') {
			errors.patch = ['patch must be a string'];
		} else if (!/^\d+\.\d+$/.test(obj.patch)) {
			errors.patch = ['patch must be in X.Y format (e.g. 7.0, 6.5)'];
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
	if (hasPatch) result.patch = obj.patch === '' ? null : (obj.patch as string | null);

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REPORT_REASONS = ['spam', 'inappropriate', 'misleading', 'other'] as const;
const TARGET_TYPES = ['article', 'comment'] as const;

export function validateCreateReport(data: unknown): ValidationResult<CreateReportInput> {
	if (typeof data !== 'object' || data === null) {
		return { success: false, errors: { _: ['Request body must be a JSON object'] } };
	}

	const obj = data as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	// reason
	if (obj.reason === undefined || obj.reason === null) {
		errors.reason = ['reason is required'];
	} else if (typeof obj.reason !== 'string') {
		errors.reason = ['reason must be a string'];
	} else if (!(REPORT_REASONS as readonly string[]).includes(obj.reason)) {
		errors.reason = ['reason must be one of: spam, inappropriate, misleading, other'];
	}

	// targetType
	if (obj.targetType === undefined || obj.targetType === null) {
		errors.targetType = ['targetType is required'];
	} else if (typeof obj.targetType !== 'string') {
		errors.targetType = ['targetType must be a string'];
	} else if (!(TARGET_TYPES as readonly string[]).includes(obj.targetType)) {
		errors.targetType = ['targetType must be one of: article, comment'];
	}

	// targetId
	if (obj.targetId === undefined || obj.targetId === null) {
		errors.targetId = ['targetId is required'];
	} else if (typeof obj.targetId !== 'string') {
		errors.targetId = ['targetId must be a string'];
	} else if (!UUID_REGEX.test(obj.targetId)) {
		errors.targetId = ['targetId must be a valid UUID'];
	}

	// description (optional)
	if (obj.description !== undefined && obj.description !== null) {
		if (typeof obj.description !== 'string') {
			errors.description = ['description must be a string'];
		} else if (obj.description.length > 1000) {
			errors.description = ['description must be at most 1000 characters'];
		}
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return {
		success: true,
		data: {
			reason: obj.reason as CreateReportInput['reason'],
			targetType: obj.targetType as CreateReportInput['targetType'],
			targetId: obj.targetId as string,
			description: (obj.description as string) ?? undefined,
		},
	};
}

const REPORT_STATUSES = ['resolved', 'dismissed'] as const;

export function validateUpdateReport(data: unknown): ValidationResult<UpdateReportInput> {
	if (typeof data !== 'object' || data === null) {
		return { success: false, errors: { _: ['Request body must be a JSON object'] } };
	}

	const obj = data as Record<string, unknown>;
	const errors: Record<string, string[]> = {};

	// status
	if (obj.status === undefined || obj.status === null) {
		errors.status = ['status is required'];
	} else if (typeof obj.status !== 'string') {
		errors.status = ['status must be a string'];
	} else if (!(REPORT_STATUSES as readonly string[]).includes(obj.status)) {
		errors.status = ['status must be one of: resolved, dismissed'];
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return {
		success: true,
		data: {
			status: obj.status as UpdateReportInput['status'],
		},
	};
}
