import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type OutboxHandler = (event: { id: string; type: string; payload: unknown }) => Promise<void>;

const BATCH = 25;
const INTERVAL_MS = 10_000;
const MAX_ATTEMPTS = 5;

/**
 * Polls the outbox and hands events to registered handlers. Safe across several API instances
 * (FOR UPDATE SKIP LOCKED). No e-mail/SMS provider is wired yet: with no handler registered, events
 * are logged and marked processed. Register handlers via `register()` when a provider is chosen.
 */
@Injectable()
export class OutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcher.name);
  private readonly handlers = new Map<string, OutboxHandler>();
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  register(type: string, handler: OutboxHandler) {
    this.handlers.set(type, handler);
  }

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.drain().catch((e) => this.logger.error(e)), INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async drain(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<{ id: string; type: string; payload: unknown; attempts: number }[]>`
        SELECT "id", "type", "payload", "attempts" FROM "outbox_events"
        WHERE "processedAt" IS NULL AND "attempts" < ${MAX_ATTEMPTS}
        ORDER BY "createdAt" LIMIT ${BATCH} FOR UPDATE SKIP LOCKED`;
      for (const event of events) {
        try {
          const handler = this.handlers.get(event.type);
          if (handler) await handler(event);
          else this.logger.log(`outbox ${event.type} ${event.id} (no handler registered)`);
          await tx.outboxEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
        } catch (e) {
          this.logger.error(`outbox ${event.id} failed: ${String(e)}`);
          await tx.outboxEvent.update({ where: { id: event.id }, data: { attempts: { increment: 1 } } });
        }
      }
      return events.length;
    });
  }
}
