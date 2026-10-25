import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { SetGlobalRoleDto } from './dto/set-global-role.dto';
import { StaffService } from './staff.service';

const BranchQuery = z.object({ branchId: z.string().uuid().optional() });

@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @Roles('STAFF')
  list(@CurrentUser() user: SessionUser, @Query(new ZodValidationPipe(BranchQuery)) q: z.infer<typeof BranchQuery>) {
    return this.staff.list(user, q.branchId);
  }

  @Post()
  @Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
  assign(@CurrentUser() actor: SessionUser, @Body(new ZodValidationPipe(AssignStaffDto)) dto: AssignStaffDto) {
    return this.staff.assign(actor, dto);
  }

  @Delete(':id')
  @Roles('HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')
  deactivate(@CurrentUser() actor: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.staff.deactivate(actor, id);
  }

  @Put('profiles/:id/role')
  @Roles('SUPER_ADMIN')
  setRole(
    @CurrentUser() actor: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(SetGlobalRoleDto)) dto: SetGlobalRoleDto,
  ) {
    return this.staff.setGlobalRole(actor, id, dto);
  }
}
