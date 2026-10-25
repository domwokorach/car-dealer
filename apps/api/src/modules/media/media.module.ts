import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageGateway, SupabaseStorageGateway } from './storage.gateway';

@Module({
  controllers: [MediaController],
  providers: [MediaService, { provide: StorageGateway, useClass: SupabaseStorageGateway }],
  exports: [StorageGateway],
})
export class MediaModule {}
