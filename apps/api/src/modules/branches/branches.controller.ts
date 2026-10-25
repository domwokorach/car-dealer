import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth, Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  @Public()
  @OptionalAuth()
  list(@CurrentUser() user?: SessionUser) {
    return this.branches.list(user);
  }

  @Post()
  @Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
  create(@CurrentUser() actor: SessionUser, @Body(new ZodValidationPipe(CreateBranchDto)) dto: CreateBranchDto) {
    return this.branches.create(actor, dto);
  }

  @Patch(':id')
  @Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateBranchDto)) dto: UpdateBranchDto,
  ) {
    return this.branches.update(actor, id, dto);
  }
}
