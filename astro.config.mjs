// @ts-check
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			conditions: ['workerd', 'worker', 'browser'],
		},
		ssr: {
			external: ['node:crypto'],
			resolve: {
				conditions: ['workerd', 'worker', 'browser'],
			},
		},
	},
});
