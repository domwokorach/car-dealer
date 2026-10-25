import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, Role, StaffRole } from '@car-dealer/database';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { loadEnv } from '../src/config/env';
import { StorageGateway } from '../src/modules/media/storage.gateway';
import { TokenVerifier } from '../src/modules/auth/token-verifier';

/** Deterministic verifier: the "token" is `test:<user uuid>`. Real JWT verification is covered separately. */
class FakeTokenVerifier extends TokenVerifier {
  async verify(token: string) {
    const match = /^test:([0-9a-f-]{36})$/.exec(token);
    if (!match) throw new (await import('@nestjs/common')).UnauthorizedException('Invalid or expired token');
    return { userId: match[1]!, email: null };
  }
}

export class FakeStorage extends StorageGateway {
  files = new Map<string, Uint8Array>();
  async createSignedUpload(path: string) {
    return { uploadUrl: `https://storage.test/upload/${path}`, token: 'tok' };
  }
  async download(path: string) {
    return this.files.get(path) ?? null;
  }
  async remove(path: string) {
    this.files.delete(path);
  }
  publicUrl(path: string) {
    return `https://storage.test/public/${path}`;
  }
}

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  storage: FakeStorage;
  close: () => Promise<void>;
}

export async function createTestContext(options: { strictRateLimit?: number } = {}): Promise<TestContext> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is required for integration tests (see .env.example)');
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: url,
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_JWKS_URL: 'https://test.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_JWT_ISSUER: 'https://test.supabase.co/auth/v1',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only-not-a-secret',
    RESERVATION_HOLD_MINUTES: '60',
    API_RATE_LIMIT_MAX: '100000',
    API_STRICT_RATE_LIMIT_MAX: String(options.strictRateLimit ?? 100000),
  });

  const storage = new FakeStorage();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(TokenVerifier)
    .useClass(FakeTokenVerifier)
    .overrideProvider(StorageGateway)
    .useValue(storage)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, loadEnv());
  await app.init();

  const prisma = new PrismaClient({ datasourceUrl: url });
  return {
    app,
    prisma,
    storage,
    close: async () => {
      await app.close();
      await prisma.$disconnect();
    },
  };
}

export async function resetDatabase(prisma: PrismaClient) {
  // TRUNCATE does not fire the append-only row triggers on audit_events.
  await prisma.$executeRawUnsafe(
    `TRUNCATE profiles, branches, vehicle_models, outbox_events, audit_events RESTART IDENTITY CASCADE`,
  );
}

export const bearer = (userId: string) => `Bearer test:${userId}`;

export async function makeProfile(prisma: PrismaClient, role: Role = 'CUSTOMER') {
  return prisma.profile.create({ data: { id: randomUUID(), email: `${randomUUID()}@example.test`, role } });
}

export async function makeStaff(prisma: PrismaClient, branchId: string, role: StaffRole) {
  const profile = await makeProfile(prisma);
  await prisma.staffMembership.create({ data: { profileId: profile.id, branchId, role } });
  return profile;
}

/** Two branches, one variant, and one published vehicle at each branch. */
export async function makeWorld(prisma: PrismaClient) {
  const [a, b] = await Promise.all(
    ['A', 'B'].map((code) =>
      prisma.branch.create({
        data: { code: `T-${code}`, name: `Branch ${code}`, addressLine1: '1 Test St', city: `City${code}`, postcode: 'AA1 1AA' },
      }),
    ),
  );
  const model = await prisma.vehicleModel.create({ data: { slug: 'test-model', name: 'Test Model', bodyType: 'SUV' } });
  const variant = await prisma.vehicleVariant.create({
    data: { modelId: model.id, name: 'Base', modelYear: 2025, fuelType: 'PETROL', transmission: 'AUTOMATIC', listPricePence: 4_000_000 },
  });
  const makeVehicle = async (branchId: string, vin: string, slug: string) => {
    const stock = await prisma.stockVehicle.create({
      data: { vin, branchId, variantId: variant.id, condition: 'NEW', askingPricePence: 4_295_000 },
    });
    const listing = await prisma.listing.create({
      data: { stockVehicleId: stock.id, slug, title: slug, status: 'PUBLISHED', publishedAt: new Date() },
    });
    return { stock, listing };
  };
  return {
    a: a!,
    b: b!,
    variant,
    vehicleA: await makeVehicle(a!.id, 'TESTVIN0000000001', 'vehicle-a'),
    vehicleB: await makeVehicle(b!.id, 'TESTVIN0000000002', 'vehicle-b'),
  };
}
