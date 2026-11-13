import { defineConfig } from '@playwright/test';
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start',
    url: `${baseURL}/api/health/ready`,
    env: { PORT: new URL(baseURL).port || '3000', APP_ORIGIN: baseURL },
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
