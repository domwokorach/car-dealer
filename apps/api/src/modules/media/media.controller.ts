import { Body, Controller, Post } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { RequestUploadDto } from './dto/request-upload.dto';
import { MediaService } from './media.service';

@Controller('media')
@Roles('STAFF')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  requestUpload(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(RequestUploadDto)) dto: RequestUploadDto) {
    return this.media.requestUpload(user, dto);
  }

  @Post('confirm')
  confirm(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(ConfirmUploadDto)) dto: ConfirmUploadDto) {
    return this.media.confirmUpload(user, dto);
  }
}
