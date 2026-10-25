import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ListPublicVehiclesDto } from './dto/list-public-vehicles.dto';
import { ListingsService } from './listings.service';

/** Public showroom read API. */
@Controller('vehicles')
@Public()
export class VehiclesController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListPublicVehiclesDto)) query: ListPublicVehiclesDto) {
    return this.listings.listPublic(query);
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.listings.getPublic(slug);
  }
}
