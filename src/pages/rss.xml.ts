import type { APIContext } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { articles } from '../db/schema';

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, '');
}

function toRfc2822(date: Date): string {
	return date.toUTCString();
}

export async function GET(context: APIContext) {
	const db = context.locals.db;
	const siteUrl = context.url.origin;

	const rows = await db
		.select({
			title: articles.title,
			slug: articles.slug,
			body: articles.body,
			publishedAt: articles.publishedAt,
		})
		.from(articles)
		.where(eq(articles.status, 'published'))
		.orderBy(desc(articles.publishedAt))
		.limit(20);

	const items = rows
		.map((row) => {
			const description = escapeXml(stripHtml(row.body).slice(0, 200));
			const link = `${siteUrl}/articles/${row.slug}`;
			const pubDate = row.publishedAt ? toRfc2822(new Date(row.publishedAt)) : '';

			return `    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${link}</link>
      <description>${description}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      <guid>${link}</guid>
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>XIVPedia</title>
    <description>FF14攻略共有サイト</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>ja</language>
${items}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}
