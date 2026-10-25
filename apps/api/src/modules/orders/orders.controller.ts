import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Roles('STAFF')
  create(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(CreateOrderDto)) dto: CreateOrderDto) {
    return this.orders.createFromReservation(user, dto);
  }

  @Get()
  @Roles('STAFF')
  list(@CurrentUser() user: SessionUser) {
    return this.orders.listForStaff(user);
  }

  @Get('mine')
  mine(@CurrentUser() user: SessionUser) {
    return this.orders.mine(user);
  }

  @Patch(':id/status')
  @Roles('STAFF')
  updateStatus(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusDto)) dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, id, dto);
  }
}
