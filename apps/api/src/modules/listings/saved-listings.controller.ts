import { Controller, Delete, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ListingsService } from './listings.service';

/** A signed-in customer's favourites. Always scoped to the caller. */
@Controller('saved-listings')
export class SavedListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.listings.listSaved(user);
  }

  @Put(':listingId')
  save(@CurrentUser() user: SessionUser, @Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.listings.save(user, listingId);
  }

  @Delete(':listingId')
  unsave(@CurrentUser() user: SessionUser, @Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.listings.unsave(user, listingId);
  }
}
