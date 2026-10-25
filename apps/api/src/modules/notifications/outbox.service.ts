import { Injectable } from '@nestjs/common';
import { Prisma } from '@car-dealer/database';
import type { Db } from '../../database/prisma.service';

@Injectable()
export class OutboxService {
  /** Write inside the same transaction as the state change so an event exists iff the change committed. */
  async enqueue(db: Db, type: string, payload: Prisma.InputJsonValue): Promise<void> {
    await db.outboxEvent.create({ data: { type, payload } });
  }
}
