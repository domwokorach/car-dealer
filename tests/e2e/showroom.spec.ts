import { expect, test } from '@playwright/test';

test.describe('public showroom', () => {
  test('home page lists the latest vehicles from the API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your next car');
    await expect(page.getByRole('heading', { name: 'Latest arrivals' })).toBeVisible();
    await expect(page.getByRole('article').first()).toBeVisible();
  });

  test('new and pre-owned pages show only their own condition', async ({ page }) => {
    await page.goto('/new');
    await expect(page.getByRole('heading', { name: 'New cars' })).toBeVisible();
    await expect(page.getByRole('article').filter({ hasText: 'Aurora Sport PHEV (2023)' })).toHaveCount(0);

    await page.goto('/used');
    await expect(page.getByRole('article').filter({ hasText: 'Aurora Sport PHEV (2023)' })).toHaveCount(1);
  });

  test('price filter narrows results without JavaScript-only behaviour', async ({ page }) => {
    await page.goto('/new?max=50000');
    await expect(page.getByText('No vehicles match your filters')).toBeVisible();
    await page.goto('/new?max=60000');
    await expect(page.getByRole('article').first()).toBeVisible();
  });

  test('a vehicle page shows price, specification and sign-in gated actions', async ({ page }) => {
    await page.goto('/used');
    await page.getByRole('link', { name: /Aurora Sport PHEV \(2023\)/ }).click();
    await expect(page).toHaveURL(/\/cars\/aurora-sport-2023-man-1$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aurora Sport PHEV (2023)');
    await expect(page.getByText('£42,950').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to reserve' })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Send an enquiry' })).toBeVisible();
  });

  test('enquiry form validates before sending', async ({ page }) => {
    await page.goto('/cars/aurora-sport-2023-man-1');
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('unknown vehicles return a friendly 404', async ({ page }) => {
    const response = await page.goto('/cars/does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /couldn’t find that page/ })).toBeVisible();
  });

  test('branches and models pages render', async ({ page }) => {
    await page.goto('/branches');
    await expect(page.getByRole('heading', { name: 'London Mayfair' })).toBeVisible();
    await page.goto('/models');
    await expect(page.getByRole('heading', { name: 'Aurora' })).toBeVisible();
  });

  test('account area requires sign-in', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount/);
  });

  test('sets security headers', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['x-frame-options']).toBe('DENY');
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});
