import { Module } from '@nestjs/common';

import { AttachmentModule } from './attachment/attachment.module';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { SettingModule } from './setting/setting.module';

@Module({
  imports: [AttachmentModule, CoreModule, HealthModule, SettingModule],
})
export class AppModule {}
