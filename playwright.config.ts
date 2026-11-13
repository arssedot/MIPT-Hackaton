import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000/api/health/ready',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
