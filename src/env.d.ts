/// <reference path="../.astro/types.d.ts" />

type Env = {
	DATABASE_URL: string;
	SUPABASE_URL: string;
	SUPABASE_PUBLISHABLE_KEY: string;
	R2_BUCKET: R2Bucket;
};

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {
		db: import('./db').Database;
		supabase: import('@supabase/supabase-js').SupabaseClient;
		currentUser: {
			id: string;
			email: string;
			profile: {
				id: string;
				username: string;
				displayName: string;
				avatarUrl: string | null;
				role: 'user' | 'moderator' | 'admin';
			} | null;
		} | null;
	}
}
