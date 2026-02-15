import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
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

describe('Attachments API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let attachmentRepo: Repository<AttachmentEntity>;
  let postRepo: Repository<PostEntity>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/attachments', () => {
    it('should upload a file and create an attachment record', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const res = await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .field('attachable_type', 'post')
        .field('attachable_id', savedPost.id)
        .field('category', 'gallery')
        .attach('file', Buffer.from('fake image data'), 'photo.jpg')
        .expect(201);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBeDefined();
      expect(body.attachableType).toBe('post');
      expect(body.attachableId).toBe(savedPost.id);
      expect(body.category).toBe('gallery');
      expect(body.fileName).toBe('photo.jpg');
      expect(body.filePath).toBeDefined();
      expect(body.fileSize).toBe(15);
      expect(body.mimeType).toBeDefined();

      const dbRecord = await attachmentRepo.findOne({
        where: { id: body.id as string },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.fileName).toBe('photo.jpg');
    });

    it('should reject upload with missing required fields', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .attach('file', Buffer.from('fake'), 'test.txt')
        .expect(400);
    });

    it('should reject upload with invalid attachable_type', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .field('attachable_type', 'invalid')
        .field('attachable_id', 'some-id')
        .field('category', 'gallery')
        .attach('file', Buffer.from('fake'), 'test.txt')
        .expect(400);
    });

    it('should reject upload with invalid category', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .field('attachable_type', 'post')
        .field('attachable_id', 'some-id')
        .field('category', 'invalid')
        .attach('file', Buffer.from('fake'), 'test.txt')
        .expect(400);
    });
  });

  describe('PUT /api/attachments/:id', () => {
    it('should update attachment ownership', async () => {
      const draft = await dataSource
        .getRepository(DraftEntity)
        .save(
          dataSource
            .getRepository(DraftEntity)
            .create({ content: '{"blocks":[]}' }),
        );

      const uploadRes = await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .field('attachable_type', 'draft')
        .field('attachable_id', draft.id)
        .field('category', 'gallery')
        .attach('file', Buffer.from('image data'), 'photo.jpg')
        .expect(201);

      const uploadBody = uploadRes.body as Record<string, unknown>;
      const attachmentId = uploadBody.id as string;

      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const updateRes = await request(app.getHttpServer() as object)
        .put(`/api/attachments/${attachmentId}`)
        .send({
          attachable_type: 'post',
          attachable_id: savedPost.id,
        })
        .expect(200);

      const body = updateRes.body as Record<string, unknown>;
      expect(body.attachableType).toBe('post');
      expect(body.attachableId).toBe(savedPost.id);

      const dbRecord = await attachmentRepo.findOne({
        where: { id: attachmentId },
      });
      expect(dbRecord!.attachableType).toBe('post');
      expect(dbRecord!.attachableId).toBe(savedPost.id);
    });

    it('should return 404 when updating non-existent attachment', async () => {
      await request(app.getHttpServer() as object)
        .put('/api/attachments/nonexistent')
        .send({
          attachable_type: 'post',
          attachable_id: 'some-id',
        })
        .expect(404);
    });

    it('should reject update with invalid attachable_type', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const uploadRes = await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .field('attachable_type', 'post')
        .field('attachable_id', savedPost.id)
        .field('category', 'gallery')
        .attach('file', Buffer.from('data'), 'file.txt')
        .expect(201);

      const uploadBody = uploadRes.body as Record<string, unknown>;

      await request(app.getHttpServer() as object)
        .put(`/api/attachments/${uploadBody.id as string}`)
        .send({
          attachable_type: 'invalid',
          attachable_id: 'some-id',
        })
        .expect(400);
    });
  });

  describe('DELETE /api/attachments/:id', () => {
    it('should delete an attachment and return 204', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const uploadRes = await request(app.getHttpServer() as object)
        .post('/api/attachments')
        .field('attachable_type', 'post')
        .field('attachable_id', savedPost.id)
        .field('category', 'gallery')
        .attach('file', Buffer.from('data to delete'), 'deleteme.txt')
        .expect(201);

      const uploadBody = uploadRes.body as Record<string, unknown>;
      const attachmentId = uploadBody.id as string;

      await request(app.getHttpServer() as object)
        .delete(`/api/attachments/${attachmentId}`)
        .expect(204);

      const dbRecord = await attachmentRepo.findOne({
        where: { id: attachmentId },
      });
      expect(dbRecord).toBeNull();
    });

    it('should return 404 when deleting non-existent attachment', async () => {
      await request(app.getHttpServer() as object)
        .delete('/api/attachments/nonexistent')
        .expect(404);
    });
  });
});
