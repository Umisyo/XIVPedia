import type { APIContext } from 'astro';

export function GET(context: APIContext) {
	const siteUrl = context.url.origin;

	const body = `User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/
Disallow: /mypage
Disallow: /settings/
Disallow: /onboarding
Disallow: /login
Disallow: /register

Sitemap: ${siteUrl}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
