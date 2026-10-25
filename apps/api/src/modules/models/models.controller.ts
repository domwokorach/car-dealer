import { Body, Controller, Get, Post } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateModelDto } from './dto/create-model.dto';
import { ModelsService } from './models.service';

@Controller('models')
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  @Get()
  @Public()
  list() {
    return this.models.list();
  }

  @Post()
  @Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
  create(@CurrentUser() actor: SessionUser, @Body(new ZodValidationPipe(CreateModelDto)) dto: CreateModelDto) {
    return this.models.create(actor, dto);
  }
}
