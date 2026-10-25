import { expect, test } from '@playwright/test';

const API = 'http://localhost:4000';

test.describe('api', () => {
  test('health check is public and reports the database', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok', database: 'up' });
  });

  test('protected routes reject anonymous callers with a request id', async ({ request }) => {
    const res = await request.get(`${API}/inventory`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.requestId).toBeTruthy();
    expect(res.headers()['x-request-id']).toBe(body.requestId);
  });

  test('public vehicle API never exposes VINs', async ({ request }) => {
    const body = await (await request.get(`${API}/vehicles`)).json();
    expect(body.total).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toMatch(/SEED0/);
  });

  test('sets hardened headers and no X-Powered-By', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.headers()['x-powered-by']).toBeUndefined();
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });
});
