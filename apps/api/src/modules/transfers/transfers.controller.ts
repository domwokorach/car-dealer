import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransfersService } from './transfers.service';

@Controller('transfers')
@Roles('STAFF')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.transfers.list(user);
  }

  @Post()
  request(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(CreateTransferDto)) dto: CreateTransferDto) {
    return this.transfers.request(user, dto);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.transfers.complete(user, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.transfers.cancel(user, id);
  }
}
