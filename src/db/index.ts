import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let cachedClient: ReturnType<typeof postgres> | null = null;
let cachedUrl: string | null = null;

function getClient(databaseUrl: string) {
	if (!cachedClient || cachedUrl !== databaseUrl) {
		cachedClient = postgres(databaseUrl, {
			prepare: false,
			max: 5,
		});
		cachedUrl = databaseUrl;
	}
	return cachedClient;
}

export function createDb(databaseUrl: string) {
	const client = getClient(databaseUrl);
	return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
