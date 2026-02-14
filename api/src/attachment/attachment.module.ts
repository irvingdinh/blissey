import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { diskStorage } from 'multer';
import { nanoid } from 'nanoid';
import { extname } from 'path';

import { CoreModule } from '../core/core.module';
import { DirectoryService } from '../core/services';
import { controllers } from './controllers';
import { services } from './services';

@Module({
  imports: [
    CoreModule,
    MulterModule.registerAsync({
      imports: [CoreModule],
      useFactory: (directoryService: DirectoryService) => ({
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            const dir = directoryService.ensureDataDir('uploads');
            cb(null, dir);
          },
          filename: (_req, file, cb) => {
            const ext = extname(file.originalname);
            cb(null, `${nanoid()}${ext}`);
          },
        }),
      }),
      inject: [DirectoryService],
    }),
    ServeStaticModule.forRootAsync({
      imports: [CoreModule],
      useFactory: (directoryService: DirectoryService) => [
        {
          rootPath: directoryService.ensureDataDir('uploads'),
          serveRoot: '/uploads',
        },
      ],
      inject: [DirectoryService],
    }),
  ],
  controllers: [...controllers],
  providers: [...services],
  exports: [...services],
})
export class AttachmentModule {}
