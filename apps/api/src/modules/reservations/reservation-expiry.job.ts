import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

const SWEEP_INTERVAL_MS = 60_000;

@Injectable()
export class ReservationExpiryJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservationExpiryJob.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly reservations: ReservationsService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      this.reservations
        .expireAbandoned()
        .then((n) => n && this.logger.log(`released ${n} lapsed reservation(s)`))
        .catch((e) => this.logger.error(e));
    }, SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
