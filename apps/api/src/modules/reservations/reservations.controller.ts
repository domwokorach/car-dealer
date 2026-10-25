import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { strictLimit } from '../../config/rate-limit';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  @Throttle({ default: { limit: strictLimit, ttl: 60_000 } })
  create(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(CreateReservationDto)) dto: CreateReservationDto) {
    return this.reservations.reserve(user, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: SessionUser) {
    return this.reservations.mine(user);
  }

  @Get()
  @Roles('STAFF')
  list(@CurrentUser() user: SessionUser) {
    return this.reservations.listForStaff(user);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.reservations.cancel(user, id);
  }
}
