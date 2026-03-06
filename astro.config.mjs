// @ts-check
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	integrations: [
		react(),
		sentry({
			dsn: process.env.SENTRY_DSN,
			sourceMapsUploadOptions: {
				project: 'xivpedia',
				authToken: process.env.SENTRY_AUTH_TOKEN,
			},
		}),
	],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: import.meta.env.PROD ? { 'react-dom/server': 'react-dom/server.edge' } : {},
		},
		ssr: {
			external: ['node:crypto'],
		},
	},
});
