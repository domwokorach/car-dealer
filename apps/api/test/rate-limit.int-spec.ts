import request from 'supertest';
import { createTestContext, TestContext } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext({ strictRateLimit: 3 });
});
afterAll(() => ctx.close());

describe('rate limiting', () => {
  it('throttles abuse-prone endpoints after the strict limit, before touching the database', async () => {
    const body = { branchId: '00000000-0000-4000-8000-000000000000', name: 'x', email: 'x@example.test', message: 'hi' };
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await request(ctx.app.getHttpServer()).post('/enquiries').send(body)).status);
    }
    // 3 allowed through (400: unknown branch), then 429.
    expect(statuses).toEqual([400, 400, 400, 429, 429]);
  });

  it('never throttles the health check', async () => {
    for (let i = 0; i < 10; i++) await request(ctx.app.getHttpServer()).get('/health').expect(200);
  });
});
