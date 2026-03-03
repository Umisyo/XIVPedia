import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDb(databaseUrl: string) {
	const url = new URL(databaseUrl);
	const client = postgres({
		host: url.hostname,
		port: Number(url.port),
		database: url.pathname.slice(1),
		username: url.username,
		password: decodeURIComponent(url.password),
		ssl: 'require',
		prepare: false,
	});
	return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
