export function generateSlug(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	let result = 'article-';
	for (const byte of bytes) {
		result += chars[byte % chars.length];
	}
	return result;
}
