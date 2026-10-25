import { describe, expect, it } from 'vitest';
import { ApiError, createApiClient } from './client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('api client', () => {
  it('validates responses against the contract', async () => {
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetch: async () => json({ status: 'ok', database: 'up', uptimeSeconds: 3 }),
    });
    await expect(client.health()).resolves.toMatchObject({ status: 'ok' });
  });

  it('throws when the payload does not match the contract', async () => {
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetch: async () => json({ status: 'weird' }),
    });
    await expect(client.health()).rejects.toThrow();
  });

  it('sends the bearer token and surfaces API errors', async () => {
    let auth: string | null = null;
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getToken: () => 'tok',
      fetch: async (_url, init) => {
        auth = new Headers(init?.headers).get('authorization');
        return json({ message: 'Forbidden' }, 403);
      },
    });
    await expect(client.me()).rejects.toMatchObject({ status: 403, message: 'Forbidden' });
    expect(auth).toBe('Bearer tok');
    expect(new ApiError(1, 'x')).toBeInstanceOf(Error);
  });

  it('refuses authenticated calls without a token', async () => {
    const client = createApiClient({ baseUrl: 'http://api.test', getToken: () => null });
    await expect(client.me()).rejects.toMatchObject({ status: 401 });
  });
});
