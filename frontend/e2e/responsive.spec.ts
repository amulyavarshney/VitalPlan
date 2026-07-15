import { test, expect } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  completeProfile,
  openMobileMenu,
  registerViaUi,
  selectGoalAndGenerate,
  uniqueUser,
} from './helpers';

test.describe('Responsive layout', () => {
  test('mobile menu reaches all primary routes without overflow', async ({ page }) => {
    test.setTimeout(120_000);
    const user = uniqueUser('mobile');

    await page.goto('/');
    await expect(page.getByText('VitalPlan').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Desktop nav hidden; hamburger present
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
    await expect(page.locator('nav.hidden.lg\\:flex')).toHaveCount(1);

    await openMobileMenu(page);
    // Mobile drawer uses a button for auth (desktop uses a nav link).
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await assertNoHorizontalOverflow(page);

    await page.goto('/register');
    await page.getByPlaceholder('Your name').fill(user.name);
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('••••••••').fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });
    await assertNoHorizontalOverflow(page);

    await completeProfile(page);
    await selectGoalAndGenerate(page);
    await assertNoHorizontalOverflow(page);

    const routes: Array<{ label: string; path: RegExp; heading: RegExp }> = [
      { label: 'Diet Plans', path: /\/plans/, heading: /personalized diet plan|ready to create your plan|generating your personalized plan/i },
      { label: 'Marketplace', path: /\/marketplace/, heading: /premium health marketplace/i },
      { label: 'Scanner', path: /\/scanner/, heading: /ai food scanner/i },
      { label: 'Orders', path: /\/orders/, heading: /^orders$/i },
      { label: 'Profile', path: /\/profile/, heading: /basic information|your profile|playwright tester/i },
    ];

    for (const route of routes) {
      await openMobileMenu(page);
      await page.getByRole('link', { name: route.label }).click();
      await expect(page).toHaveURL(route.path);
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({
        timeout: 45_000,
      });
      await assertNoHorizontalOverflow(page);
    }

    await openMobileMenu(page);
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await assertNoHorizontalOverflow(page);
  });

  test('auth and home stay usable at tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /start your journey/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const user = uniqueUser('tablet');
    await registerViaUi(page, user);
    await assertNoHorizontalOverflow(page);
  });
});
