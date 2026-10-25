import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { strictLimit } from '../../config/rate-limit';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateTestDriveDto } from './dto/create-test-drive.dto';
import { UpdateTestDriveStatusDto } from './dto/update-test-drive-status.dto';
import { TestDrivesService } from './test-drives.service';

@Controller('test-drives')
export class TestDrivesController {
  constructor(private readonly testDrives: TestDrivesService) {}

  @Post()
  @Throttle({ default: { limit: strictLimit, ttl: 60_000 } })
  create(@CurrentUser() user: SessionUser, @Body(new ZodValidationPipe(CreateTestDriveDto)) dto: CreateTestDriveDto) {
    return this.testDrives.create(user, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: SessionUser) {
    return this.testDrives.mine(user);
  }

  @Get()
  @Roles('STAFF')
  list(@CurrentUser() user: SessionUser) {
    return this.testDrives.list(user);
  }

  @Patch(':id/status')
  @Roles('STAFF')
  updateStatus(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTestDriveStatusDto)) dto: UpdateTestDriveStatusDto,
  ) {
    return this.testDrives.updateStatus(user, id, dto);
  }
}
