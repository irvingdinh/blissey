import { Module } from '@nestjs/common';

import { AttachmentModule } from './attachment/attachment.module';
import { CommentModule } from './comment/comment.module';
import { CoreModule } from './core/core.module';
import { DraftModule } from './draft/draft.module';
import { HealthModule } from './health/health.module';
import { PostModule } from './post/post.module';
import { SettingModule } from './setting/setting.module';

@Module({
  imports: [
    AttachmentModule,
    CommentModule,
    CoreModule,
    DraftModule,
    HealthModule,
    PostModule,
    SettingModule,
  ],
})
export class AppModule {}
