import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { ListingsController } from './listings.controller';
import { ListingsRepository } from './listings.repository';
import { ListingsService } from './listings.service';
import { SavedListingsController } from './saved-listings.controller';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [MediaModule],
  controllers: [VehiclesController, ListingsController, SavedListingsController],
  providers: [ListingsService, ListingsRepository],
})
export class ListingsModule {}
