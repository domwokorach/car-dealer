import { Module } from '@nestjs/common';
import { TestDrivesController } from './test-drives.controller';
import { TestDrivesService } from './test-drives.service';

@Module({ controllers: [TestDrivesController], providers: [TestDrivesService] })
export class TestDrivesModule {}
