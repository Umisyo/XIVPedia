import type { APIContext } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { articles } from '../db/schema';
import { listTags } from '../lib/tags';

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toW3CDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

export async function GET(context: APIContext) {
	const db = context.locals.db;
	const siteUrl = context.url.origin;

	const [articleRows, allTags] = await Promise.all([
		db
			.select({
				slug: articles.slug,
				updatedAt: articles.updatedAt,
			})
			.from(articles)
			.where(eq(articles.status, 'published'))
			.orderBy(desc(articles.publishedAt)),
		listTags(db),
	]);

	const staticPages = [
		{ loc: '/', priority: '1.0', changefreq: 'daily' },
		{ loc: '/articles', priority: '0.8', changefreq: 'daily' },
		{ loc: '/tags', priority: '0.6', changefreq: 'weekly' },
		{ loc: '/search', priority: '0.5', changefreq: 'weekly' },
		{ loc: '/terms', priority: '0.3', changefreq: 'yearly' },
		{ loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
	];

	const staticEntries = staticPages
		.map(
			(p) => `  <url>
    <loc>${escapeXml(`${siteUrl}${p.loc}`)}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
		)
		.join('\n');

	const articleEntries = articleRows
		.map(
			(row) => `  <url>
    <loc>${escapeXml(`${siteUrl}/articles/${row.slug}`)}</loc>
    <lastmod>${toW3CDate(new Date(row.updatedAt))}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
		)
		.join('\n');

	const tagEntries = allTags
		.map(
			(tag) => `  <url>
    <loc>${escapeXml(`${siteUrl}/tags/${tag.slug}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
		)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${articleEntries}
${tagEntries}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
