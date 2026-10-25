import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { strictLimit } from '../../config/rate-limit';
import { z } from 'zod';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth, Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { EnquiriesService } from './enquiries.service';

const ListQuery = z.object({ branchId: z.string().uuid().optional() });

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @Public()
  @OptionalAuth()
  @Throttle({ default: { limit: strictLimit, ttl: 60_000 } })
  create(@CurrentUser() user: SessionUser | undefined, @Body(new ZodValidationPipe(CreateEnquiryDto)) dto: CreateEnquiryDto) {
    return this.enquiries.create(user, dto);
  }

  @Get()
  @Roles('STAFF')
  list(@CurrentUser() user: SessionUser, @Query(new ZodValidationPipe(ListQuery)) q: z.infer<typeof ListQuery>) {
    return this.enquiries.list(user, q.branchId);
  }

  @Patch(':id/status')
  @Roles('STAFF')
  updateStatus(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEnquiryStatusDto)) dto: UpdateEnquiryStatusDto,
  ) {
    return this.enquiries.updateStatus(user, id, dto);
  }
}
