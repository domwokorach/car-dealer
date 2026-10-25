/**
 * Development seed: reference data so a fresh checkout shows something in the showroom.
 * Idempotent (upserts on natural keys). Refuses to run in production.
 */
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run the development seed in production.');
}

const prisma = new PrismaClient();

const BRANCHES = [
  { code: 'LDN', name: 'London Mayfair', addressLine1: '1 Park Lane', city: 'London', postcode: 'W1K 1AA' },
  { code: 'MAN', name: 'Manchester Deansgate', addressLine1: '10 Deansgate', city: 'Manchester', postcode: 'M3 2BW' },
  { code: 'EDI', name: 'Edinburgh Waverley', addressLine1: '5 Princes Street', city: 'Edinburgh', postcode: 'EH2 2ER' },
] as const;

const MODELS = [
  { slug: 'aurora', name: 'Aurora', bodyType: 'Saloon', description: 'Executive saloon.' },
  { slug: 'meridian', name: 'Meridian', bodyType: 'SUV', description: 'Large family SUV.' },
] as const;

async function main() {
  const branches = new Map<string, string>();
  for (const b of BRANCHES) {
    const row = await prisma.branch.upsert({ where: { code: b.code }, update: {}, create: b });
    branches.set(b.code, row.id);
  }

  const models = new Map<string, string>();
  for (const m of MODELS) {
    const row = await prisma.vehicleModel.upsert({ where: { slug: m.slug }, update: {}, create: m });
    models.set(m.slug, row.id);
  }

  const variants = [
    { model: 'aurora', name: 'Sport', modelYear: 2025, fuelType: 'PLUG_IN_HYBRID', transmission: 'AUTOMATIC', engine: '2.0L PHEV', listPricePence: 5_295_000 },
    { model: 'meridian', name: 'Executive', modelYear: 2025, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', engine: 'Dual motor', listPricePence: 7_450_000 },
  ] as const;

  const variantIds = new Map<string, string>();
  for (const v of variants) {
    const modelId = models.get(v.model)!;
    const row = await prisma.vehicleVariant.upsert({
      where: { modelId_name_modelYear: { modelId, name: v.name, modelYear: v.modelYear } },
      update: {},
      create: { modelId, name: v.name, modelYear: v.modelYear, fuelType: v.fuelType, transmission: v.transmission, engine: v.engine, listPricePence: v.listPricePence },
    });
    variantIds.set(v.model, row.id);
  }

  const stock = [
    { vin: 'SEED0AURORA000001', branch: 'LDN', model: 'aurora', condition: 'NEW', pricePence: 5_295_000, mileage: 10, year: 2025, colour: 'Obsidian Black', slug: 'aurora-sport-2025-ldn-1', title: 'Aurora Sport PHEV' },
    { vin: 'SEED0AURORA000002', branch: 'MAN', model: 'aurora', condition: 'USED', pricePence: 4_295_000, mileage: 12_500, year: 2023, colour: 'Polar White', slug: 'aurora-sport-2023-man-1', title: 'Aurora Sport PHEV (2023)' },
    { vin: 'SEED0MERIDIAN0001', branch: 'EDI', model: 'meridian', condition: 'NEW', pricePence: 7_450_000, mileage: 5, year: 2025, colour: 'Alpine Grey', slug: 'meridian-executive-2025-edi-1', title: 'Meridian Executive Electric' },
  ] as const;

  for (const s of stock) {
    const vehicle = await prisma.stockVehicle.upsert({
      where: { vin: s.vin },
      update: {},
      create: {
        vin: s.vin,
        branchId: branches.get(s.branch)!,
        variantId: variantIds.get(s.model)!,
        condition: s.condition,
        askingPricePence: s.pricePence,
        mileage: s.mileage,
        registrationYear: s.year,
        colour: s.colour,
      },
    });
    await prisma.listing.upsert({
      where: { stockVehicleId: vehicle.id },
      update: {},
      create: { stockVehicleId: vehicle.id, slug: s.slug, title: s.title, status: 'PUBLISHED', publishedAt: new Date() },
    });
  }
  console.warn(`Seeded ${BRANCHES.length} branches, ${MODELS.length} models, ${stock.length} vehicles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
