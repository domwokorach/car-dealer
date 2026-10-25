import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@car-dealer/database';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

/** A transaction-scoped client, or the root client. Repositories accept either. */
export type Db = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    super({ datasourceUrl: env.DATABASE_URL });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Serialise concurrent writers of one vehicle. Must be called inside a transaction. */
  async lockStockVehicle(tx: Db, id: string): Promise<void> {
    await tx.$queryRaw`SELECT "id" FROM "stock_vehicles" WHERE "id" = ${id}::uuid FOR UPDATE`;
  }
}
