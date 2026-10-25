import { randomUUID } from 'node:crypto';
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

describe('orders', () => {
  it('carries the reserved price into the order even after the asking price changes', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const sales = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    const res = await http()
      .post('/reservations')
      .set('Authorization', bearer(buyer.id))
      .send({ listingId: world.vehicleA.listing.id, idempotencyKey: randomUUID() })
      .expect(201);

    await ctx.prisma.stockVehicle.update({ where: { id: world.vehicleA.stock.id }, data: { askingPricePence: 5_500_000 } });

    const order = await http().post('/orders').set('Authorization', bearer(sales.id)).send({ reservationId: res.body.id }).expect(201);
    expect(order.body.agreedPricePence).toBe(4_295_000);
    expect((await ctx.prisma.reservation.findUniqueOrThrow({ where: { id: res.body.id } })).status).toBe('CONVERTED');

    await expect(
      ctx.prisma.order.update({ where: { id: order.body.id }, data: { agreedPricePence: 1 } }),
    ).rejects.toThrow(/immutable snapshot/);
  });

  it('refuses orders from staff of a different branch, and a second order for the same reservation', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const salesA = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    const salesB = await makeStaff(ctx.prisma, world.b.id, 'SALES_EXECUTIVE');
    const res = await http()
      .post('/reservations')
      .set('Authorization', bearer(buyer.id))
      .send({ listingId: world.vehicleA.listing.id, idempotencyKey: randomUUID() })
      .expect(201);

    await http().post('/orders').set('Authorization', bearer(salesB.id)).send({ reservationId: res.body.id }).expect(403);
    await http().post('/orders').set('Authorization', bearer(salesA.id)).send({ reservationId: res.body.id }).expect(201);
    await http().post('/orders').set('Authorization', bearer(salesA.id)).send({ reservationId: res.body.id }).expect(409);
  });

  it('completes a sale: vehicle SOLD, listing archived; only managers may complete', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const sales = await makeStaff(ctx.prisma, world.a.id, 'SALES_EXECUTIVE');
    const mgr = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    const res = await http()
      .post('/reservations')
      .set('Authorization', bearer(buyer.id))
      .send({ listingId: world.vehicleA.listing.id, idempotencyKey: randomUUID() })
      .expect(201);
    const order = await http().post('/orders').set('Authorization', bearer(sales.id)).send({ reservationId: res.body.id }).expect(201);

    await http().patch(`/orders/${order.body.id}/status`).set('Authorization', bearer(sales.id)).send({ status: 'CONFIRMED' }).expect(200);
    await http().patch(`/orders/${order.body.id}/status`).set('Authorization', bearer(sales.id)).send({ status: 'COMPLETED' }).expect(403);
    await http().patch(`/orders/${order.body.id}/status`).set('Authorization', bearer(mgr.id)).send({ status: 'COMPLETED' }).expect(200);
    await http().patch(`/orders/${order.body.id}/status`).set('Authorization', bearer(mgr.id)).send({ status: 'CANCELLED' }).expect(409);

    expect((await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: world.vehicleA.stock.id } })).status).toBe('SOLD');
    expect((await ctx.prisma.listing.findUniqueOrThrow({ where: { id: world.vehicleA.listing.id } })).status).toBe('ARCHIVED');
  });
});

describe('inventory transfers', () => {
  it('moves ownership atomically only when the receiving branch confirms', async () => {
    const mgrA = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    const mgrB = await makeStaff(ctx.prisma, world.b.id, 'BRANCH_MANAGER');
    const stockId = world.vehicleA.stock.id;

    const t = await http().post('/transfers').set('Authorization', bearer(mgrA.id)).send({ stockVehicleId: stockId, toBranchId: world.b.id }).expect(201);
    let stock = await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: stockId } });
    expect(stock).toMatchObject({ branchId: world.a.id, status: 'IN_TRANSIT' });

    // The sender cannot complete their own transfer; a different-branch manager can't either.
    await http().post(`/transfers/${t.body.id}/complete`).set('Authorization', bearer(mgrA.id)).expect(403);
    await http().post(`/transfers/${t.body.id}/complete`).set('Authorization', bearer(mgrB.id)).expect(201);

    stock = await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: stockId } });
    expect(stock).toMatchObject({ branchId: world.b.id, status: 'AVAILABLE' });
    expect(await ctx.prisma.auditEvent.count({ where: { action: 'transfer.completed' } })).toBe(1);
    await http().post(`/transfers/${t.body.id}/complete`).set('Authorization', bearer(mgrB.id)).expect(409);
  });

  it('refuses transfers of other branches’ stock, reserved stock, and duplicates', async () => {
    const mgrA = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    await http().post('/transfers').set('Authorization', bearer(mgrA.id)).send({ stockVehicleId: world.vehicleB.stock.id, toBranchId: world.a.id }).expect(403);

    const buyer = await makeProfile(ctx.prisma);
    await http().post('/reservations').set('Authorization', bearer(buyer.id)).send({ listingId: world.vehicleA.listing.id, idempotencyKey: randomUUID() }).expect(201);
    await http().post('/transfers').set('Authorization', bearer(mgrA.id)).send({ stockVehicleId: world.vehicleA.stock.id, toBranchId: world.b.id }).expect(409);
  });

  it('lets the sender cancel a pending transfer, returning the vehicle to sale', async () => {
    const mgrA = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    const t = await http().post('/transfers').set('Authorization', bearer(mgrA.id)).send({ stockVehicleId: world.vehicleA.stock.id, toBranchId: world.b.id }).expect(201);
    await http().post('/transfers').set('Authorization', bearer(mgrA.id)).send({ stockVehicleId: world.vehicleA.stock.id, toBranchId: world.b.id }).expect(409);
    await http().post(`/transfers/${t.body.id}/cancel`).set('Authorization', bearer(mgrA.id)).expect(201);
    expect((await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: world.vehicleA.stock.id } })).status).toBe('AVAILABLE');
  });
});

describe('test drives', () => {
  it('books a future slot at the vehicle’s branch and rejects past times', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const res = await http().post('/test-drives').set('Authorization', bearer(buyer.id)).send({ listingId: world.vehicleB.listing.id, scheduledAt: future }).expect(201);
    expect(res.body.branchId).toBe(world.b.id);
    await http().post('/test-drives').set('Authorization', bearer(buyer.id)).send({ listingId: world.vehicleB.listing.id, scheduledAt: new Date(Date.now() - 1000).toISOString() }).expect(400);
    expect((await http().get('/test-drives/mine').set('Authorization', bearer(buyer.id)).expect(200)).body).toHaveLength(1);
  });
});

describe('saved listings', () => {
  it('saves, lists and removes favourites for the caller only', async () => {
    const [me, other] = await Promise.all([makeProfile(ctx.prisma), makeProfile(ctx.prisma)]);
    const id = world.vehicleA.listing.id;
    await http().put(`/saved-listings/${id}`).set('Authorization', bearer(me.id)).expect(200);
    await http().put(`/saved-listings/${id}`).set('Authorization', bearer(me.id)).expect(200); // idempotent

    const mine = await http().get('/saved-listings').set('Authorization', bearer(me.id)).expect(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0]).toMatchObject({ listingId: id, slug: 'vehicle-a' });
    expect((await http().get('/saved-listings').set('Authorization', bearer(other.id)).expect(200)).body).toHaveLength(0);

    await http().delete(`/saved-listings/${id}`).set('Authorization', bearer(me.id)).expect(200);
    expect((await http().get('/saved-listings').set('Authorization', bearer(me.id)).expect(200)).body).toHaveLength(0);
    await http().put(`/saved-listings/${randomUUID()}`).set('Authorization', bearer(me.id)).expect(404);
    await http().get('/saved-listings').expect(401);
  });
});

describe('outbox', () => {
  it('drains pending events through the dispatcher', async () => {
    const buyer = await makeProfile(ctx.prisma);
    await http().post('/reservations').set('Authorization', bearer(buyer.id)).send({ listingId: world.vehicleA.listing.id, idempotencyKey: randomUUID() }).expect(201);
    const { OutboxDispatcher } = await import('../src/modules/notifications/outbox.dispatcher');
    const seen: string[] = [];
    const dispatcher = ctx.app.get(OutboxDispatcher);
    dispatcher.register('reservation.created', async (e) => void seen.push(e.type));
    expect(await dispatcher.drain()).toBe(1);
    expect(seen).toEqual(['reservation.created']);
    expect(await ctx.prisma.outboxEvent.count({ where: { processedAt: null } })).toBe(0);
  });
});

describe('media uploads', () => {
  it('issues server-chosen paths and rejects non-image bytes', async () => {
    const mgr = await makeStaff(ctx.prisma, world.a.id, 'BRANCH_MANAGER');
    const other = await makeStaff(ctx.prisma, world.b.id, 'BRANCH_MANAGER');
    const stockVehicleId = world.vehicleA.stock.id;

    await http().post('/media/upload-url').set('Authorization', bearer(other.id)).send({ stockVehicleId, contentType: 'image/png', sizeBytes: 100 }).expect(403);
    await http().post('/media/upload-url').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, contentType: 'image/svg+xml', sizeBytes: 100 }).expect(400);
    await http().post('/media/upload-url').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, contentType: 'image/png', sizeBytes: 50 * 1024 * 1024 }).expect(400);

    const target = await http().post('/media/upload-url').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, contentType: 'image/png', sizeBytes: 100 }).expect(201);
    expect(target.body.storagePath).toMatch(new RegExp(`^vehicles/${stockVehicleId}/[0-9a-f-]{36}\\.png$`));

    // Attacker uploads HTML to the signed URL, then asks to confirm it.
    ctx.storage.files.set(target.body.storagePath, new TextEncoder().encode('<script>alert(1)</script>'));
    await http().post('/media/confirm').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, storagePath: target.body.storagePath }).expect(400);
    expect(ctx.storage.files.has(target.body.storagePath)).toBe(false);

    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    const ok = await http().post('/media/upload-url').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, contentType: 'image/png', sizeBytes: 10 }).expect(201);
    ctx.storage.files.set(ok.body.storagePath, png);
    const confirmed = await http().post('/media/confirm').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, storagePath: ok.body.storagePath, altText: 'Front' }).expect(201);
    expect(confirmed.body.url).toBe(`https://storage.test/public/${ok.body.storagePath}`);

    // Path traversal into another vehicle's folder is refused.
    await http().post('/media/confirm').set('Authorization', bearer(mgr.id)).send({ stockVehicleId, storagePath: `vehicles/${world.vehicleB.stock.id}/x.png` }).expect(400);
  });
});
