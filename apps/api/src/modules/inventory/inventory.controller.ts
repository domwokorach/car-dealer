import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@Roles('STAFF')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@CurrentUser() user: SessionUser, @Query(new ZodValidationPipe(ListVehiclesDto)) query: ListVehiclesDto) {
    return this.inventory.list(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventory.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(CreateVehicleDto)) dto: CreateVehicleDto) {
    return this.inventory.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateVehicleDto)) dto: UpdateVehicleDto,
  ) {
    return this.inventory.update(user, id, dto);
  }
}
