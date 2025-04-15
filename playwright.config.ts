import { defineConfig } from 'playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30 * 1000,  // 30s per test
    use: {
        screenshot: 'only-on-failure',
        baseURL: 'http://localhost:10000', // test on dev
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
});