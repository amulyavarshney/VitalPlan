import { expect, type Page } from '@playwright/test';

export function uniqueUser(prefix = 'e2e') {
  const stamp = Date.now();
  return {
    name: `E2E User ${stamp}`,
    email: `${prefix}_${stamp}@example.com`,
    password: 'secret12',
  };
}

export async function registerViaUi(page: Page, user = uniqueUser()) {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  await page.getByPlaceholder('Your name').fill(user.name);
  await page.getByPlaceholder('you@example.com').fill(user.email);
  await page.getByPlaceholder('••••••••').fill(user.password);
  await page.getByRole('button', { name: /create account/i }).click();
  // Surface API errors instead of only timing out on URL
  await Promise.race([
    page.waitForURL(/\/profile/, { timeout: 25_000 }),
    page
      .locator('.text-red-600')
      .first()
      .waitFor({ state: 'visible', timeout: 25_000 })
      .then(async () => {
        throw new Error(`Registration failed: ${await page.locator('.text-red-600').first().innerText()}`);
      }),
  ]);
  await expect(page).toHaveURL(/\/profile/);
  return user;
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });
}

export async function completeProfile(page: Page) {
  await expect(page.getByText(/basic information/i)).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder('Enter your full name').fill('Playwright Tester');
  await page.getByPlaceholder('25', { exact: true }).fill('28');
  await page.getByPlaceholder('170', { exact: true }).fill('175');
  await page.getByPlaceholder('70', { exact: true }).fill('72');
  await page.getByRole('button', { name: /save & continue/i }).click();
  await expect(page.getByRole('heading', { name: /choose your wellness goals/i })).toBeVisible({
    timeout: 20_000,
  });
}

export async function selectGoalAndGenerate(page: Page) {
  await page.locator('h3', { hasText: 'Building Muscle' }).click();
  await page.getByRole('button', { name: /generate my diet plan/i }).click();
  await expect(page).toHaveURL(/\/plans/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /your personalized diet plan/i })).toBeVisible({
    timeout: 45_000,
  });
}

export async function openMobileMenu(page: Page) {
  await page.getByRole('button', { name: /open menu/i }).click();
  await expect(page.getByText('Menu', { exact: true })).toBeVisible();
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}
