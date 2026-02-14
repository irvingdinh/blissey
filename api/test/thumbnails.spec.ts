import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { AttachmentModule } from '../src/attachment/attachment.module';
import { CoreModule } from '../src/core/core.module';
import { AttachmentEntity } from '../src/core/entities/attachment.entity';
import { CommentEntity } from '../src/core/entities/comment.entity';
import { DraftEntity } from '../src/core/entities/draft.entity';
import { PostEntity } from '../src/core/entities/post.entity';
import { ReactionEntity } from '../src/core/entities/reaction.entity';
import { SettingEntity } from '../src/core/entities/setting.entity';

describe('Thumbnail Generation (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let attachmentRepo: Repository<AttachmentEntity>;
  let postRepo: Repository<PostEntity>;
  let testImagePath: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AttachmentModule, CoreModule],
    })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .overrideModule(TypeOrmModule.forRootAsync({} as any))
      .useModule(
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            AttachmentEntity,
            CommentEntity,
            DraftEntity,
            PostEntity,
            ReactionEntity,
            SettingEntity,
          ],
          synchronize: true,
        }),
      )
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = module.get(DataSource);
    attachmentRepo = dataSource.getRepository(AttachmentEntity);
    postRepo = dataSource.getRepository(PostEntity);

    // Create a real test image using sharp
    const testDir = join(tmpdir(), 'blissey-test');
    mkdirSync(testDir, { recursive: true });
    testImagePath = join(testDir, 'test-image.png');
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toFile(testImagePath);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate a thumbnail after uploading an image', async () => {
    const post = postRepo.create({ content: '{"blocks":[]}' });
    const savedPost = await postRepo.save(post);

    const res = await request(app.getHttpServer() as object)
      .post('/api/attachments')
      .field('attachable_type', 'post')
      .field('attachable_id', savedPost.id)
      .field('category', 'gallery')
      .attach('file', testImagePath)
      .expect(201);

    const body = res.body as Record<string, unknown>;
    const attachmentId = body.id as string;

    expect(body.mimeType).toBe('image/png');

    // Wait for async thumbnail generation
    await new Promise((r) => setTimeout(r, 500));

    const updated = await attachmentRepo.findOne({
      where: { id: attachmentId },
    });

    expect(updated).not.toBeNull();
    expect(updated!.thumbnailPath).toBeDefined();
    expect(updated!.thumbnailPath).toMatch(/^thumbnails\//);

    // Verify the thumbnail file was created on disk
    const uploadsDir = join(
      process.env.DATA_DIR || join(homedir(), '.blissey'),
      'uploads',
    );
    const thumbnailFullPath = join(uploadsDir, updated!.thumbnailPath!);
    expect(existsSync(thumbnailFullPath)).toBe(true);

    // Verify thumbnail dimensions (should be 400px wide)
    const metadata = await sharp(thumbnailFullPath).metadata();
    expect(metadata.width).toBe(400);
  });

  it('should not generate a thumbnail for non-image files', async () => {
    const post = postRepo.create({ content: '{"blocks":[]}' });
    const savedPost = await postRepo.save(post);

    // Create a temporary text file
    const textFilePath = join(tmpdir(), 'blissey-test', 'test.txt');
    writeFileSync(textFilePath, 'hello world');

    const res = await request(app.getHttpServer() as object)
      .post('/api/attachments')
      .field('attachable_type', 'post')
      .field('attachable_id', savedPost.id)
      .field('category', 'attachment')
      .attach('file', textFilePath)
      .expect(201);

    const body = res.body as Record<string, unknown>;
    const attachmentId = body.id as string;

    // Wait briefly
    await new Promise((r) => setTimeout(r, 300));

    const updated = await attachmentRepo.findOne({
      where: { id: attachmentId },
    });

    expect(updated).not.toBeNull();
    expect(updated!.thumbnailPath).toBeNull();
  });
});
