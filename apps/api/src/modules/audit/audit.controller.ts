import { Controller, Get, Query } from '@nestjs/common';
import { ListAuditQuery, ListAuditQuerySchema } from '@car-dealer/contracts';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditService } from './audit.service';

@Controller('audit')
@Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListAuditQuerySchema)) query: ListAuditQuery) {
    return this.audit.list(query);
  }
}
