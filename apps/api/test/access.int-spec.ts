import request from 'supertest';
import { bearer, createTestContext, makeProfile, makeStaff, makeWorld, resetDatabase, TestContext } from './helpers';

let ctx: TestContext;
let world: Awaited<ReturnType<typeof makeWorld>>;

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(() => ctx.close());
beforeEach(async () => {
  await resetDatabase(ctx.prisma);
  world = await makeWorld(ctx.prisma);
});

const http = () => request(ctx.app.getHttpServer());

describe('authentication & secure errors', () => {
  it('serves the health check anonymously', async () => {
    const res = await http().get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('rejects missing and malformed tokens with a generic 401', async () => {
    await http().get('/me').expect(401);
    const res = await http().get('/me').set('Authorization', 'Bearer not-a-real-token').expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, message: 'Invalid or expired token' });
    expect(res.body.requestId).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules/);
  });

  it('returns structured 400s for invalid input without leaking internals', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const res = await http().post('/reservations').set('Authorization', bearer(buyer.id)).send({ listingId: 'nope' }).expect(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.issues.length).toBeGreaterThan(0);
  });

  it('never exposes a database error message on conflict', async () => {
    const admin = await makeProfile(ctx.prisma, 'HEAD_OFFICE_ADMIN');
    const body = { code: 'DUP', name: 'Dup', addressLine1: 'x street', city: 'c', postcode: 'AB1 2CD' };
    await http().post('/branches').set('Authorization', bearer(admin.id)).send(body).expect(201);
    const res = await http().post('/branches').set('Authorization', bearer(admin.id)).send(body).expect(409);
    expect(res.body.message).toBe('A conflicting record already exists');
  });
});

describe('role resolution', () => {
  it('provisions a CUSTOMER profile on first sign-in and ignores any client role claims', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const res = await http().get('/me').set('Authorization', bearer(id)).set('X-Role', 'SUPER_ADMIN').expect(200);
    expect(res.body).toMatchObject({ id, role: 'CUSTOMER', branchAccess: [] });
  });

  it('reports branch access from the database', async () => {
    const mgr = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    const res = await http().get('/me').set('Authorization', bearer(mgr.id)).expect(200);
    expect(res.body.branchAccess).toEqual([{ branchId: world.a.id, role: 'BRANCH_MANAGER' }]);
  });

  it('blocks disabled accounts', async () => {
    const p = await makeProfile(ctx.prisma);
    await ctx.prisma.profile.update({ where: { id: p.id }, data: { isActive: false } });
    await http().get('/me').set('Authorization', bearer(p.id)).expect(403);
  });
});

describe('branch isolation', () => {
  it('customers cannot reach staff endpoints', async () => {
    const c = await makeProfile(ctx.prisma);
    for (const path of ['/inventory', '/orders', '/enquiries', '/transfers', '/staff', '/audit']) {
      await http().get(path).set('Authorization', bearer(c.id)).expect(403);
    }
  });

  it('branch staff list only their own branch inventory', async () => {
    const sales = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    const res = await http().get('/inventory').set('Authorization', bearer(sales.id)).expect(200);
    expect(res.body.items.map((v: { id: string }) => v.id)).toEqual([world.vehicleA.stock.id]);
  });

  it('rejects a client-supplied foreign branchId filter and foreign record ids', async () => {
    const sales = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    await http().get(`/inventory?branchId=${world.b.id}`).set('Authorization', bearer(sales.id)).expect(403);
    await http().get(`/inventory/${world.vehicleB.stock.id}`).set('Authorization', bearer(sales.id)).expect(403);
  });

  it('prevents a branch manager creating or editing stock at another branch', async () => {
    const mgr = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    await http()
      .post('/inventory')
      .set('Authorization', bearer(mgr.id))
      .send({ branchId: world.b.id, variantId: world.variant.id, condition: 'NEW', askingPricePence: 1000 })
      .expect(403);
    await http().patch(`/inventory/${world.vehicleB.stock.id}`).set('Authorization', bearer(mgr.id)).send({ askingPricePence: 1 }).expect(403);
    expect((await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: world.vehicleB.stock.id } })).askingPricePence).toBe(4_295_000);
  });

  it('requires manager rank for stock creation but lets sales executives read', async () => {
    const sales = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    await http()
      .post('/inventory')
      .set('Authorization', bearer(sales.id))
      .send({ branchId: world.a.id, variantId: world.variant.id, condition: 'NEW', askingPricePence: 1000 })
      .expect(403);
  });

  it('lets managers add stock to their own branch, with a VIN uniqueness guarantee and an audit trail', async () => {
    const mgr = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    const body = { branchId: world.a.id, variantId: world.variant.id, condition: 'USED', askingPricePence: 2_000_000, vin: 'NEWV1N00000000001' };
    const created = await http().post('/inventory').set('Authorization', bearer(mgr.id)).send(body).expect(201);
    await http().post('/inventory').set('Authorization', bearer(mgr.id)).send(body).expect(409);
    expect(await ctx.prisma.auditEvent.count({ where: { entityId: created.body.id, action: 'inventory.created' } })).toBe(1);
  });

  it('lets head office see every branch and read the audit log', async () => {
    const head = await makeProfile(ctx.prisma, 'HEAD_OFFICE_ADMIN');
    const inv = await http().get('/inventory').set('Authorization', bearer(head.id)).expect(200);
    expect(inv.body.total).toBe(2);
    await http().get('/audit').set('Authorization', bearer(head.id)).expect(200);
  });

  it('only super admins may change global roles, and not their own', async () => {
    const head = await makeProfile(ctx.prisma, 'HEAD_OFFICE_ADMIN');
    const superAdmin = await makeProfile(ctx.prisma, 'SUPER_ADMIN');
    const target = await makeProfile(ctx.prisma);
    await http().put(`/staff/profiles/${target.id}/role`).set('Authorization', bearer(head.id)).send({ role: 'HEAD_OFFICE_ADMIN' }).expect(403);
    await http().put(`/staff/profiles/${superAdmin.id}/role`).set('Authorization', bearer(superAdmin.id)).send({ role: 'CUSTOMER' }).expect(403);
    await http().put(`/staff/profiles/${target.id}/role`).set('Authorization', bearer(superAdmin.id)).send({ role: 'HEAD_OFFICE_ADMIN' }).expect(200);
  });

  it('shows staff lists to managers (own branch only), never to sales executives', async () => {
    const sales = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    const mgrA = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    await makeStaff(ctx.prisma, world.b.id, 'SALES_EXECUTIVE');

    expect((await http().get('/staff').set('Authorization', bearer(sales.id)).expect(200)).body).toEqual([]);
    await http().get(`/staff?branchId=${world.a.id}`).set('Authorization', bearer(sales.id)).expect(403);

    const own = await http().get('/staff').set('Authorization', bearer(mgrA.id)).expect(200);
    expect(own.body.map((m: { branchId: string }) => m.branchId)).toEqual([world.a.id, world.a.id]);
    await http().get(`/staff?branchId=${world.b.id}`).set('Authorization', bearer(mgrA.id)).expect(403);
  });

  it('keeps branch staff out of admin-only management', async () => {
    const mgr = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    await http().post('/branches').set('Authorization', bearer(mgr.id)).send({}).expect(403);
    await http().post('/staff').set('Authorization', bearer(mgr.id)).send({}).expect(403);
  });
});

describe('public showroom API', () => {
  it('lists published vehicles without leaking internal fields', async () => {
    const res = await http().get('/vehicles').expect(200);
    expect(res.body.total).toBe(2);
    const item = res.body.items[0];
    expect(Object.keys(item)).not.toContain('vin');
    expect(Object.keys(item)).not.toContain('id');
    expect(item).toMatchObject({ condition: 'NEW', pricePence: 4_295_000, available: true });
  });

  it('hides unpublished, sold and withdrawn vehicles, and filters by branch', async () => {
    await ctx.prisma.listing.update({ where: { id: world.vehicleA.listing.id }, data: { status: 'ARCHIVED' } });
    const res = await http().get('/vehicles').expect(200);
    expect(res.body.items.map((i: { slug: string }) => i.slug)).toEqual(['vehicle-b']);
    await http().get('/vehicles/vehicle-a').expect(404);

    await ctx.prisma.stockVehicle.update({ where: { id: world.vehicleB.stock.id }, data: { status: 'SOLD' } });
    expect((await http().get('/vehicles').expect(200)).body.total).toBe(0);
  });

  it('accepts anonymous enquiries and routes them to the vehicle’s branch', async () => {
    const res = await http()
      .post('/enquiries')
      .send({ listingId: world.vehicleB.listing.id, name: 'Sam', email: 'sam@example.test', message: 'Is it available?' })
      .expect(201);
    const row = await ctx.prisma.enquiry.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.branchId).toBe(world.b.id);

    const salesA = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    const seen = await http().get('/enquiries').set('Authorization', bearer(salesA.id)).expect(200);
    expect(seen.body).toHaveLength(0);
    await http().patch(`/enquiries/${row.id}/status`).set('Authorization', bearer(salesA.id)).send({ status: 'CLOSED' }).expect(403);
  });
});

describe('audit log integrity', () => {
  it('is append-only at the database level', async () => {
    const head = await makeProfile(ctx.prisma, 'HEAD_OFFICE_ADMIN');
    await http().post('/branches').set('Authorization', bearer(head.id)).send({ code: 'NEW1', name: 'New', addressLine1: 'x street', city: 'c', postcode: 'AB1 2CD' }).expect(201);
    const event = await ctx.prisma.auditEvent.findFirstOrThrow();
    await expect(ctx.prisma.auditEvent.update({ where: { id: event.id }, data: { action: 'tampered' } })).rejects.toThrow(/append-only/);
    await expect(ctx.prisma.auditEvent.delete({ where: { id: event.id } })).rejects.toThrow(/append-only/);
  });
});
