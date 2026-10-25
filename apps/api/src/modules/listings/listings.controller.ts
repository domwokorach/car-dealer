import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PublishListingDto } from './dto/publish-listing.dto';
import { ListingsService } from './listings.service';

@Controller('listings')
@Roles('STAFF')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Post()
  publish(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(PublishListingDto)) dto: PublishListingDto) {
    return this.listings.publish(user, dto);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.archive(user, id);
  }
}
