import { test, expect } from '@playwright/test';

test.describe('VitalPlan smoke', () => {
  test('home page shows brand and get started', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('VitalPlan').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });

  test('login route renders auth form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });
});
