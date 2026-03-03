/// <reference path="../.astro/types.d.ts" />

type Env = {
	DATABASE_URL: string;
	DISCORD_CLIENT_ID: string;
	DISCORD_CLIENT_SECRET: string;
	DISCORD_REDIRECT_URI: string;
	SESSION_SECRET: string;
	R2_BUCKET: R2Bucket;
};

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {
		db: import('./db').Database;
		currentUser: import('./lib/auth').AuthUser | null;
	}
}
