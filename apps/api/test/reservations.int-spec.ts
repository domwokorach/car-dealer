import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bearer, createTestContext, makeProfile, makeWorld, resetDatabase, TestContext } from './helpers';

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

const reserve = (userId: string, listingId: string, key = randomUUID()) =>
  request(ctx.app.getHttpServer())
    .post('/reservations')
    .set('Authorization', bearer(userId))
    .send({ listingId, idempotencyKey: key });

describe('reservations', () => {
  it('lets exactly one of 20 simultaneous buyers hold the car', async () => {
    const buyers = await Promise.all(Array.from({ length: 20 }, () => makeProfile(ctx.prisma)));
    const results = await Promise.all(buyers.map((b) => reserve(b.id, world.vehicleA.listing.id)));

    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(19);
    expect(await ctx.prisma.reservation.count({ where: { status: 'ACTIVE' } })).toBe(1);
    const stock = await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: world.vehicleA.stock.id } });
    expect(stock.status).toBe('RESERVED');
  });

  it('is idempotent for the same customer and key, even when concurrent', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const key = randomUUID();
    const [x, y] = await Promise.all([reserve(buyer.id, world.vehicleA.listing.id, key), reserve(buyer.id, world.vehicleA.listing.id, key)]);
    expect([x.status, y.status]).toEqual([201, 201]);
    expect(x.body.id).toBe(y.body.id);
    expect(await ctx.prisma.reservation.count()).toBe(1);
  });

  it('rejects reusing another customer’s idempotency key', async () => {
    const [one, two] = await Promise.all([makeProfile(ctx.prisma), makeProfile(ctx.prisma)]);
    const key = randomUUID();
    await reserve(one.id, world.vehicleA.listing.id, key).expect(201);
    await reserve(two.id, world.vehicleA.listing.id, key).expect(409);
  });

  it('snapshots the price: later price changes do not alter the hold, and the database forbids editing it', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const res = await reserve(buyer.id, world.vehicleA.listing.id).expect(201);
    expect(res.body.pricePence).toBe(4_295_000);

    await ctx.prisma.stockVehicle.update({ where: { id: world.vehicleA.stock.id }, data: { askingPricePence: 9_999_000 } });
    const row = await ctx.prisma.reservation.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.pricePence).toBe(4_295_000);

    await expect(
      ctx.prisma.reservation.update({ where: { id: row.id }, data: { pricePence: 1 } }),
    ).rejects.toThrow(/immutable snapshot/);
  });

  it('lets a new buyer reserve after a hold lapses', async () => {
    const [one, two] = await Promise.all([makeProfile(ctx.prisma), makeProfile(ctx.prisma)]);
    const first = await reserve(one.id, world.vehicleA.listing.id).expect(201);
    await ctx.prisma.reservation.update({
      where: { id: first.body.id },
      data: { createdAt: new Date(Date.now() - 2 * 3_600_000), expiresAt: new Date(Date.now() - 60_000) },
    });
    const second = await reserve(two.id, world.vehicleA.listing.id).expect(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect((await ctx.prisma.reservation.findUniqueOrThrow({ where: { id: first.body.id } })).status).toBe('EXPIRED');
  });

  it('the background sweep releases abandoned holds without any new buyer', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const held = await reserve(buyer.id, world.vehicleA.listing.id).expect(201);
    await ctx.prisma.reservation.update({
      where: { id: held.body.id },
      data: { createdAt: new Date(Date.now() - 2 * 3_600_000), expiresAt: new Date(Date.now() - 60_000) },
    });
    const { ReservationsService } = await import('../src/modules/reservations/reservations.service');
    expect(await ctx.app.get(ReservationsService).expireAbandoned()).toBe(1);
    expect((await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: world.vehicleA.stock.id } })).status).toBe('AVAILABLE');
    expect((await ctx.prisma.reservation.findUniqueOrThrow({ where: { id: held.body.id } })).status).toBe('EXPIRED');
  });

  it('releases cancelled holds and refuses unavailable vehicles', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const held = await reserve(buyer.id, world.vehicleA.listing.id).expect(201);
    await request(ctx.app.getHttpServer()).post(`/reservations/${held.body.id}/cancel`).set('Authorization', bearer(buyer.id)).expect(201);
    expect((await ctx.prisma.stockVehicle.findUniqueOrThrow({ where: { id: world.vehicleA.stock.id } })).status).toBe('AVAILABLE');

    await ctx.prisma.stockVehicle.update({ where: { id: world.vehicleA.stock.id }, data: { status: 'SOLD' } });
    await reserve(buyer.id, world.vehicleA.listing.id).expect(409);
  });

  it('writes an audit event and an outbox event in the same transaction', async () => {
    const buyer = await makeProfile(ctx.prisma);
    const res = await reserve(buyer.id, world.vehicleA.listing.id).expect(201);
    expect(await ctx.prisma.auditEvent.count({ where: { entityId: res.body.id, action: 'reservation.created' } })).toBe(1);
    expect(await ctx.prisma.outboxEvent.count({ where: { type: 'reservation.created' } })).toBe(1);
  });

  it('requires authentication', async () => {
    await request(ctx.app.getHttpServer())
      .post('/reservations')
      .send({ listingId: world.vehicleA.listing.id, idempotencyKey: randomUUID() })
      .expect(401);
  });
});
