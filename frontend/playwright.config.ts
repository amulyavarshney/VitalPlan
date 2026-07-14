import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const startApi = process.env.E2E_START_API !== '0';
const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(frontendDir, '../backend');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    ...(startApi
      ? [
          {
            command:
              '[ -x .venv/bin/python ] && PY=.venv/bin/python || PY=python3; ' +
              'ENVIRONMENT=development SECRET_KEY=e2e-secret-key-not-for-production ' +
              'DATABASE_URL=sqlite:///./e2e.db ' +
              '$PY -m uvicorn main:app --host 127.0.0.1 --port 8000',
            cwd: backendDir,
            url: 'http://127.0.0.1:8000/api/health',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]
      : []),
    ...(process.env.E2E_BASE_URL
      ? []
      : [
          {
            command: 'npm run dev -- --host 127.0.0.1 --port 5173',
            url: 'http://127.0.0.1:5173',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: {
              ...process.env,
              VITE_API_URL: apiUrl,
            },
          },
        ]),
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
