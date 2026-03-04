const RATE_LIMITS: Record<string, { window: number; max: number }> = {
	'POST /api/articles': { window: 3600, max: 10 },
	'POST /api/articles/*/comments': { window: 60, max: 5 },
	'POST /api/reports': { window: 3600, max: 20 },
	'POST /api/images/upload': { window: 3600, max: 30 },
};

function matchRateLimitKey(
	method: string,
	path: string,
): { key: string; limit: { window: number; max: number } } | null {
	for (const [pattern, limit] of Object.entries(RATE_LIMITS)) {
		const [patternMethod, ...patternPathParts] = pattern.split(' ');
		const patternPath = patternPathParts.join(' ');

		if (method !== patternMethod) continue;

		const regex = new RegExp(`^${patternPath.replace(/\*/g, '[^/]+')}$`);
		if (regex.test(path)) {
			return { key: pattern, limit };
		}
	}
	return null;
}

function buildCacheUrl(method: string, path: string, identifier: string): string {
	return `https://rate-limit.internal/${method}/${path}/${identifier}`;
}

export async function checkRateLimit(
	key: string,
	limit: { window: number; max: number },
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
	const cache = (caches as unknown as { default: Cache }).default;
	const cacheUrl = new Request(key);

	const cached = await cache.match(cacheUrl);
	const now = Math.floor(Date.now() / 1000);

	if (cached) {
		const data = (await cached.json()) as { count: number; resetAt: number };

		if (now >= data.resetAt) {
			const resetAt = now + limit.window;
			const response = new Response(JSON.stringify({ count: 1, resetAt }), {
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': `s-maxage=${limit.window}`,
				},
			});
			await cache.put(cacheUrl, response);
			return { allowed: true, remaining: limit.max - 1, resetAt };
		}

		const newCount = data.count + 1;
		const ttl = data.resetAt - now;

		if (newCount > limit.max) {
			return { allowed: false, remaining: 0, resetAt: data.resetAt };
		}

		const response = new Response(JSON.stringify({ count: newCount, resetAt: data.resetAt }), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `s-maxage=${ttl}`,
			},
		});
		await cache.put(cacheUrl, response);
		return {
			allowed: true,
			remaining: limit.max - newCount,
			resetAt: data.resetAt,
		};
	}

	const resetAt = now + limit.window;
	const response = new Response(JSON.stringify({ count: 1, resetAt }), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': `s-maxage=${limit.window}`,
		},
	});
	await cache.put(cacheUrl, response);
	return { allowed: true, remaining: limit.max - 1, resetAt };
}

export function getRateLimitConfig(
	method: string,
	path: string,
): { key: string; limit: { window: number; max: number } } | null {
	return matchRateLimitKey(method, path);
}

export function buildRateLimitKey(method: string, path: string, identifier: string): string {
	return buildCacheUrl(method, path, identifier);
}
