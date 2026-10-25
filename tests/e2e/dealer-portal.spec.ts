import { expect, test } from '@playwright/test';

const PORTAL = 'http://localhost:3001';

test.describe('dealer portal', () => {
  test('redirects signed-out visitors to the staff sign-in page', async ({ page }) => {
    await page.goto(`${PORTAL}/dashboard`);
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  });

  test('guards every staff and admin route', async ({ page }) => {
    for (const path of ['/inventory', '/orders', '/admin/branches', '/admin/audit']) {
      await page.goto(`${PORTAL}${path}`);
      await expect(page).toHaveURL(/\/sign-in/);
    }
  });

  test('is not indexable', async ({ request }) => {
    const res = await request.get(`${PORTAL}/sign-in`);
    expect(res.headers()['x-robots-tag']).toContain('noindex');
  });
});
