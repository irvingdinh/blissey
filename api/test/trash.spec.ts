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
import { PostModule } from '../src/post/post.module';

describe('Trash API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let postRepo: Repository<PostEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PostModule, CoreModule],
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
    postRepo = dataSource.getRepository(PostEntity);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await postRepo.query('DELETE FROM posts');
  });

  describe('GET /api/trash', () => {
    it('should return soft-deleted posts ordered by newest deleted first', async () => {
      const now = Date.now();

      const post1 = postRepo.create({ content: 'Deleted first' });
      const saved1 = await postRepo.save(post1);
      await postRepo.softRemove(saved1);

      // Manually set deletedAt to control ordering
      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        new Date(now - 2000).toISOString(),
        saved1.id,
      ]);

      const post2 = postRepo.create({ content: 'Deleted second' });
      const saved2 = await postRepo.save(post2);
      await postRepo.softRemove(saved2);

      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        new Date(now - 1000).toISOString(),
        saved2.id,
      ]);

      const res = await request(app.getHttpServer() as object)
        .get('/api/trash')
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(2);
      expect(body[0].content).toBe('Deleted second');
      expect(body[1].content).toBe('Deleted first');
    });

    it('should include daysRemaining for each trashed post', async () => {
      const post = postRepo.create({ content: 'To trash' });
      const saved = await postRepo.save(post);
      await postRepo.softRemove(saved);

      const res = await request(app.getHttpServer() as object)
        .get('/api/trash')
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(1);
      expect(body[0].daysRemaining).toBeDefined();
      expect(typeof body[0].daysRemaining).toBe('number');
    });

    it('should return empty array when no trashed posts exist', async () => {
      const post = postRepo.create({ content: 'Active post' });
      await postRepo.save(post);

      const res = await request(app.getHttpServer() as object)
        .get('/api/trash')
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(0);
    });

    it('should not include active posts', async () => {
      const activePost = postRepo.create({ content: 'Active' });
      await postRepo.save(activePost);

      const trashedPost = postRepo.create({ content: 'Trashed' });
      const saved = await postRepo.save(trashedPost);
      await postRepo.softRemove(saved);

      const res = await request(app.getHttpServer() as object)
        .get('/api/trash')
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(1);
      expect(body[0].content).toBe('Trashed');
    });
  });

  describe('POST /api/trash/:id/restore', () => {
    it('should restore a soft-deleted post', async () => {
      const post = postRepo.create({ content: 'Restore me' });
      const saved = await postRepo.save(post);
      await postRepo.softRemove(saved);

      // Verify it's soft-deleted
      const deletedPost = await postRepo.findOne({
        where: { id: saved.id },
      });
      expect(deletedPost).toBeNull();

      const res = await request(app.getHttpServer() as object)
        .post(`/api/trash/${saved.id}/restore`)
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBe(saved.id);
      expect(body.content).toBe('Restore me');
      expect(body.deletedAt).toBeNull();

      // Verify it reappears in the regular posts list
      const feedRes = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);

      const feedBody = feedRes.body as Record<string, unknown>;
      const data = feedBody.data as Record<string, unknown>[];
      expect(data).toHaveLength(1);
      expect(data[0].content).toBe('Restore me');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/trash/nonexistent/restore')
        .expect(404);
    });

    it('should return 404 when trying to restore an active post', async () => {
      const post = postRepo.create({ content: 'Active post' });
      const saved = await postRepo.save(post);

      await request(app.getHttpServer() as object)
        .post(`/api/trash/${saved.id}/restore`)
        .expect(404);
    });
  });

  describe('full trash workflow', () => {
    it('should soft-delete a post, list in trash, restore, and verify it reappears in feed', async () => {
      // Create a post
      const createRes = await request(app.getHttpServer() as object)
        .post('/api/posts')
        .send({ content: 'Workflow test post' })
        .expect(201);

      const postId = (createRes.body as Record<string, unknown>).id as string;

      // Verify it appears in feed
      let feedRes = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);
      expect((feedRes.body as Record<string, unknown>).total).toBe(1);

      // Soft delete it
      await request(app.getHttpServer() as object)
        .delete(`/api/posts/${postId}`)
        .expect(204);

      // Verify it's gone from feed
      feedRes = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);
      expect((feedRes.body as Record<string, unknown>).total).toBe(0);

      // Verify it appears in trash
      const trashRes = await request(app.getHttpServer() as object)
        .get('/api/trash')
        .expect(200);
      const trashBody = trashRes.body as Record<string, unknown>[];
      expect(trashBody).toHaveLength(1);
      expect(trashBody[0].id).toBe(postId);

      // Restore it
      await request(app.getHttpServer() as object)
        .post(`/api/trash/${postId}/restore`)
        .expect(200);

      // Verify it reappears in feed
      feedRes = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);
      expect((feedRes.body as Record<string, unknown>).total).toBe(1);

      // Verify trash is now empty
      const trashRes2 = await request(app.getHttpServer() as object)
        .get('/api/trash')
        .expect(200);
      expect(trashRes2.body as Record<string, unknown>[]).toHaveLength(0);
    });
  });
});
