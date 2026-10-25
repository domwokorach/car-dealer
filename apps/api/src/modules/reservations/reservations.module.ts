import { Module } from '@nestjs/common';
import { ReservationExpiryJob } from './reservation-expiry.job';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository, ReservationExpiryJob],
  exports: [ReservationsRepository],
})
export class ReservationsModule {}
