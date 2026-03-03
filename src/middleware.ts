import { defineMiddleware } from 'astro:middleware';
import { createDb } from './db';
import { resolveUser } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
	const databaseUrl = context.locals.runtime.env.DATABASE_URL;
	context.locals.db = createDb(databaseUrl);
	context.locals.currentUser = await resolveUser(context.request, context.locals.db);
	return next();
});
