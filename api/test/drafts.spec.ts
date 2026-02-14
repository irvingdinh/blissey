import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { CoreModule } from '../src/core/core.module';
import { AttachmentEntity } from '../src/core/entities/attachment.entity';
import { CommentEntity } from '../src/core/entities/comment.entity';
import { DraftEntity } from '../src/core/entities/draft.entity';
import { PostEntity } from '../src/core/entities/post.entity';
import { ReactionEntity } from '../src/core/entities/reaction.entity';
import { SettingEntity } from '../src/core/entities/setting.entity';
import { DraftModule } from '../src/draft/draft.module';

describe('Drafts API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let draftRepo: Repository<DraftEntity>;
  let attachmentRepo: Repository<AttachmentEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DraftModule, CoreModule],
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
    draftRepo = dataSource.getRepository(DraftEntity);
    attachmentRepo = dataSource.getRepository(AttachmentEntity);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await attachmentRepo.clear();
    await draftRepo.clear();
  });

  describe('POST /api/drafts', () => {
    it('should create a new draft', async () => {
      const res = await request(app.getHttpServer() as object)
        .post('/api/drafts')
        .send({
          content: '{"blocks":[{"type":"paragraph","data":{"text":"Draft"}}]}',
        })
        .expect(201);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBeDefined();
      expect(body.content).toBe(
        '{"blocks":[{"type":"paragraph","data":{"text":"Draft"}}]}',
      );
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('should reject empty content', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/drafts')
        .send({ content: '' })
        .expect(400);
    });

    it('should reject missing content', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/drafts')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/drafts', () => {
    it('should return all drafts ordered by newest first', async () => {
      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        const draft = draftRepo.create({ content: `Draft ${i}` });
        draft.createdAt = new Date(now + i * 1000);
        await draftRepo.save(draft);
      }

      const res = await request(app.getHttpServer() as object)
        .get('/api/drafts')
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(3);
      expect(body[0].content).toBe('Draft 2');
      expect(body[2].content).toBe('Draft 0');
    });

    it('should return empty array when no drafts exist', async () => {
      const res = await request(app.getHttpServer() as object)
        .get('/api/drafts')
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(0);
    });
  });

  describe('GET /api/drafts/:id', () => {
    it('should return a single draft with attachments', async () => {
      const draft = draftRepo.create({ content: '{"blocks":[]}' });
      const savedDraft = await draftRepo.save(draft);

      const attachment = attachmentRepo.create({
        attachableType: 'draft',
        attachableId: savedDraft.id,
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'abc.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(attachment);

      const res = await request(app.getHttpServer() as object)
        .get(`/api/drafts/${savedDraft.id}`)
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBe(savedDraft.id);
      expect(body.attachments).toHaveLength(1);
    });

    it('should return 404 for non-existent draft', async () => {
      await request(app.getHttpServer() as object)
        .get('/api/drafts/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/drafts/:id', () => {
    it('should update an existing draft', async () => {
      const draft = draftRepo.create({ content: 'Original content' });
      const savedDraft = await draftRepo.save(draft);

      const res = await request(app.getHttpServer() as object)
        .put(`/api/drafts/${savedDraft.id}`)
        .send({ content: 'Updated content' })
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.content).toBe('Updated content');

      const dbDraft = await draftRepo.findOne({
        where: { id: savedDraft.id },
      });
      expect(dbDraft!.content).toBe('Updated content');
    });

    it('should return 404 for non-existent draft', async () => {
      await request(app.getHttpServer() as object)
        .put('/api/drafts/nonexistent')
        .send({ content: 'Updated' })
        .expect(404);
    });

    it('should reject empty content', async () => {
      const draft = draftRepo.create({ content: 'Original' });
      const savedDraft = await draftRepo.save(draft);

      await request(app.getHttpServer() as object)
        .put(`/api/drafts/${savedDraft.id}`)
        .send({ content: '' })
        .expect(400);
    });
  });

  describe('DELETE /api/drafts/:id', () => {
    it('should delete a draft and return 204', async () => {
      const draft = draftRepo.create({ content: 'To be deleted' });
      const savedDraft = await draftRepo.save(draft);

      await request(app.getHttpServer() as object)
        .delete(`/api/drafts/${savedDraft.id}`)
        .expect(204);

      const dbDraft = await draftRepo.findOne({
        where: { id: savedDraft.id },
      });
      expect(dbDraft).toBeNull();
    });

    it('should return 404 for non-existent draft', async () => {
      await request(app.getHttpServer() as object)
        .delete('/api/drafts/nonexistent')
        .expect(404);
    });
  });

  describe('attachment association', () => {
    it('should return draft attachments and not return other attachments', async () => {
      const draft1 = draftRepo.create({ content: 'Draft 1' });
      const savedDraft1 = await draftRepo.save(draft1);

      const draft2 = draftRepo.create({ content: 'Draft 2' });
      const savedDraft2 = await draftRepo.save(draft2);

      const att1 = attachmentRepo.create({
        attachableType: 'draft',
        attachableId: savedDraft1.id,
        category: 'gallery',
        fileName: 'photo1.jpg',
        filePath: 'abc1.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(att1);

      const att2 = attachmentRepo.create({
        attachableType: 'draft',
        attachableId: savedDraft2.id,
        category: 'gallery',
        fileName: 'photo2.jpg',
        filePath: 'abc2.jpg',
        fileSize: 2048,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(att2);

      const res1 = await request(app.getHttpServer() as object)
        .get(`/api/drafts/${savedDraft1.id}`)
        .expect(200);

      const body1 = res1.body as Record<string, unknown>;
      const attachments1 = body1.attachments as Record<string, unknown>[];
      expect(attachments1).toHaveLength(1);
      expect(attachments1[0].fileName).toBe('photo1.jpg');

      const res2 = await request(app.getHttpServer() as object)
        .get(`/api/drafts/${savedDraft2.id}`)
        .expect(200);

      const body2 = res2.body as Record<string, unknown>;
      const attachments2 = body2.attachments as Record<string, unknown>[];
      expect(attachments2).toHaveLength(1);
      expect(attachments2[0].fileName).toBe('photo2.jpg');
    });
  });
});
