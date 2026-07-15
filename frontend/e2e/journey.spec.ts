import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  completeProfile,
  registerViaUi,
  selectGoalAndGenerate,
  uniqueUser,
} from './helpers';

const fixturesDir = path.dirname(fileURLToPath(import.meta.url));
const foodFixture = path.join(fixturesDir, 'fixtures', 'food.jpg');

test.describe('Authenticated end-to-end journey', () => {
  test.describe.configure({ mode: 'serial' });

  const user = uniqueUser('journey');

  test('register, onboard, and use core product flows', async ({ page }) => {
    test.setTimeout(180_000);

    // Home → register
    await page.goto('/');
    await expect(page.getByText('VitalPlan').first()).toBeVisible();
    await page.getByRole('button', { name: /start your journey/i }).click();
    await expect(page).toHaveURL(/\/register/);

    await page.getByPlaceholder('Your name').fill(user.name);
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('••••••••').fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });

    // Profile + goals onboarding
    await completeProfile(page);
    await selectGoalAndGenerate(page);

    // Diet plan interactions
    await expect(page.getByText(/total calories/i)).toBeVisible();
    await page.getByRole('button', { name: /add all to cart/i }).click();
    await expect(page.getByText(/item\(s\) added to cart/i)).toBeVisible({ timeout: 10_000 });

    // Marketplace
    await page.getByRole('link', { name: 'Marketplace' }).click();
    await expect(page).toHaveURL(/\/marketplace/);
    await expect(page.getByRole('heading', { name: /premium health marketplace/i })).toBeVisible();
    await expect(page.getByText('Loading products...')).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /^add$/i }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /^add$/i }).first().click();
    await expect(page.getByText(/item\(s\) added to cart/i)).toBeVisible({ timeout: 10_000 });

    // Checkout demo payment
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible();
    await page.getByRole('button', { name: /^cart/i }).click();
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();
    await page.getByPlaceholder('Enter your delivery address...').fill('42 Playwright Lane, Test City');
    await page.getByRole('button', { name: /place order & pay/i }).click();
    await expect(page.getByText(/order placed and paid/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /past orders/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/^Order #\d+/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('paid').first()).toBeVisible();

    // Scanner upload (demo AI)
    await page.getByRole('link', { name: 'Scanner' }).click();
    await expect(page).toHaveURL(/\/scanner/);
    await expect(page.getByRole('heading', { name: /ai food scanner/i })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(foodFixture);
    await expect(page.getByText(/analyzing your food/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /mixed garden salad/i })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole('button', { name: /scan another/i })).toBeVisible();

    // Profile export (onboarding step is 2 after goals → plans)
    await page.getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('button', { name: /save profile/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /download json export/i })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download json export/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/vitalplan-export/i);

    // Logout and login again
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/($|\?)/, { timeout: 10_000 });
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible({ timeout: 10_000 });
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('••••••••').fill(user.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

    await assertNoHorizontalOverflow(page);
  });

  test('login persists access to diet plans and order history', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('••••••••').fill(user.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });

    await page.getByRole('link', { name: 'Diet Plans' }).click();
    await expect(page.getByRole('heading', { name: /your personalized diet plan|ready to create your plan/i })).toBeVisible({
      timeout: 45_000,
    });

    await page.getByRole('link', { name: 'Orders' }).click();
    await page.getByRole('button', { name: 'History', exact: true }).click();
    await expect(page.getByText(/^Order #\d+/)).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Public auth screens', () => {
  test('register then login with same credentials works', async ({ page }) => {
    const user = uniqueUser('auth');
    await registerViaUi(page, user);
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('••••••••').fill(user.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });
    await expect(page.getByText(/basic information|save profile|save & continue/i).first()).toBeVisible();
  });
});
