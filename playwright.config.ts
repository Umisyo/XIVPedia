import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e/tests',
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'html',
	use: {
		baseURL: 'http://localhost:8788',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	webServer: {
		command: 'pnpm preview',
		port: 8788,
		reuseExistingServer: !process.env.CI,
	},
});
