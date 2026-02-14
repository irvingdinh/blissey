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

describe('Posts API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let postRepo: Repository<PostEntity>;
  let commentRepo: Repository<CommentEntity>;
  let reactionRepo: Repository<ReactionEntity>;
  let attachmentRepo: Repository<AttachmentEntity>;

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
    commentRepo = dataSource.getRepository(CommentEntity);
    reactionRepo = dataSource.getRepository(ReactionEntity);
    attachmentRepo = dataSource.getRepository(AttachmentEntity);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await reactionRepo.clear();
    await commentRepo.clear();
    await attachmentRepo.clear();
    await postRepo.query('DELETE FROM posts');
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app.getHttpServer() as object)
        .post('/api/posts')
        .send({
          content: '{"blocks":[{"type":"paragraph","data":{"text":"Hello"}}]}',
        })
        .expect(201);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBeDefined();
      expect(body.content).toBe(
        '{"blocks":[{"type":"paragraph","data":{"text":"Hello"}}]}',
      );
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('should reject empty content', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/posts')
        .send({ content: '' })
        .expect(400);
    });

    it('should reject missing content', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/posts')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/posts', () => {
    it('should return paginated posts ordered by newest first', async () => {
      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        const post = postRepo.create({ content: `Post ${i}` });
        post.createdAt = new Date(now + i * 1000);
        await postRepo.save(post);
      }

      const res = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.total).toBe(3);
      expect(body.page).toBe(1);
      expect(body.totalPages).toBe(1);
      expect(body.data).toHaveLength(3);

      const data = body.data as Record<string, unknown>[];
      expect(data[0].content).toBe('Post 2');
      expect(data[2].content).toBe('Post 0');
    });

    it('should support pagination with page and limit params', async () => {
      for (let i = 0; i < 5; i++) {
        const post = postRepo.create({ content: `Post ${i}` });
        await postRepo.save(post);
      }

      const res = await request(app.getHttpServer() as object)
        .get('/api/posts?page=2&limit=2')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.total).toBe(5);
      expect(body.page).toBe(2);
      expect(body.totalPages).toBe(3);
      expect(body.data).toHaveLength(2);
    });

    it('should exclude soft-deleted posts', async () => {
      const post1 = postRepo.create({ content: 'Active post' });
      await postRepo.save(post1);

      const post2 = postRepo.create({ content: 'Deleted post' });
      const savedPost2 = await postRepo.save(post2);
      await postRepo.softRemove(savedPost2);

      const res = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.total).toBe(1);
      const data = body.data as Record<string, unknown>[];
      expect(data[0].content).toBe('Active post');
    });

    it('should return empty when no posts exist', async () => {
      const res = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.total).toBe(0);
      expect(body.data).toHaveLength(0);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return a single post with reactions, comment count, and attachments', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'A comment',
      });
      await commentRepo.save(comment);

      const reaction = reactionRepo.create({
        reactableType: 'post',
        reactableId: savedPost.id,
        emoji: '👍',
      });
      await reactionRepo.save(reaction);

      const attachment = attachmentRepo.create({
        attachableType: 'post',
        attachableId: savedPost.id,
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'abc.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(attachment);

      const res = await request(app.getHttpServer() as object)
        .get(`/api/posts/${savedPost.id}`)
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBe(savedPost.id);
      expect(body.commentCount).toBe(1);
      expect(body.reactions).toEqual([{ emoji: '👍', count: 1 }]);
      expect(body.attachments).toHaveLength(1);
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .get('/api/posts/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update an existing post', async () => {
      const post = postRepo.create({ content: 'Original content' });
      const savedPost = await postRepo.save(post);

      const res = await request(app.getHttpServer() as object)
        .put(`/api/posts/${savedPost.id}`)
        .send({ content: 'Updated content' })
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.content).toBe('Updated content');

      const dbPost = await postRepo.findOne({
        where: { id: savedPost.id },
      });
      expect(dbPost!.content).toBe('Updated content');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .put('/api/posts/nonexistent')
        .send({ content: 'Updated' })
        .expect(404);
    });

    it('should reject empty content', async () => {
      const post = postRepo.create({ content: 'Original' });
      const savedPost = await postRepo.save(post);

      await request(app.getHttpServer() as object)
        .put(`/api/posts/${savedPost.id}`)
        .send({ content: '' })
        .expect(400);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should soft delete a post and return 204', async () => {
      const post = postRepo.create({ content: 'To be deleted' });
      const savedPost = await postRepo.save(post);

      await request(app.getHttpServer() as object)
        .delete(`/api/posts/${savedPost.id}`)
        .expect(204);

      const dbPost = await postRepo.findOne({
        where: { id: savedPost.id },
      });
      expect(dbPost).toBeNull();

      const trashedPost = await postRepo.findOne({
        where: { id: savedPost.id },
        withDeleted: true,
      });
      expect(trashedPost).not.toBeNull();
      expect(trashedPost!.deletedAt).not.toBeNull();
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .delete('/api/posts/nonexistent')
        .expect(404);
    });
  });

  describe('pagination edge cases', () => {
    it('should default to page=1 and limit=10', async () => {
      for (let i = 0; i < 12; i++) {
        const post = postRepo.create({ content: `Post ${i}` });
        await postRepo.save(post);
      }

      const res = await request(app.getHttpServer() as object)
        .get('/api/posts')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.page).toBe(1);
      expect(body.totalPages).toBe(2);
      expect(body.data).toHaveLength(10);
    });
  });
});
