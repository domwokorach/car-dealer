import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateVariantDto } from './dto/create-variant.dto';
import { VariantsService } from './variants.service';

const ListQuery = z.object({ modelId: z.string().uuid().optional() });

@Controller('variants')
export class VariantsController {
  constructor(private readonly variants: VariantsService) {}

  @Get()
  @Roles('STAFF')
  list(@Query(new ZodValidationPipe(ListQuery)) q: z.infer<typeof ListQuery>) {
    return this.variants.list(q.modelId);
  }

  @Post()
  @Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
  create(@CurrentUser() actor: SessionUser, @Body(new ZodValidationPipe(CreateVariantDto)) dto: CreateVariantDto) {
    return this.variants.create(actor, dto);
  }
}
