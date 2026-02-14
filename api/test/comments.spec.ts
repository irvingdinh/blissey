import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { CommentModule } from '../src/comment/comment.module';
import { CoreModule } from '../src/core/core.module';
import { AttachmentEntity } from '../src/core/entities/attachment.entity';
import { CommentEntity } from '../src/core/entities/comment.entity';
import { DraftEntity } from '../src/core/entities/draft.entity';
import { PostEntity } from '../src/core/entities/post.entity';
import { ReactionEntity } from '../src/core/entities/reaction.entity';
import { SettingEntity } from '../src/core/entities/setting.entity';

describe('Comments API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let postRepo: Repository<PostEntity>;
  let commentRepo: Repository<CommentEntity>;
  let reactionRepo: Repository<ReactionEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [CommentModule, CoreModule],
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
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await reactionRepo.clear();
    await commentRepo.clear();
    await postRepo.query('DELETE FROM posts');
  });

  let savedPost: PostEntity;

  beforeEach(async () => {
    const post = postRepo.create({ content: '{"blocks":[]}' });
    savedPost = await postRepo.save(post);
  });

  describe('POST /api/posts/:postId/comments', () => {
    it('should create a comment on a post', async () => {
      const res = await request(app.getHttpServer() as object)
        .post(`/api/posts/${savedPost.id}/comments`)
        .send({
          content:
            '{"blocks":[{"type":"paragraph","data":{"text":"Nice post!"}}]}',
        })
        .expect(201);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBeDefined();
      expect(body.postId).toBe(savedPost.id);
      expect(body.content).toBe(
        '{"blocks":[{"type":"paragraph","data":{"text":"Nice post!"}}]}',
      );
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('should reject empty content', async () => {
      await request(app.getHttpServer() as object)
        .post(`/api/posts/${savedPost.id}/comments`)
        .send({ content: '' })
        .expect(400);
    });

    it('should reject missing content', async () => {
      await request(app.getHttpServer() as object)
        .post(`/api/posts/${savedPost.id}/comments`)
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/posts/nonexistent/comments')
        .send({ content: 'Hello' })
        .expect(404);
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    it('should return comments ordered by oldest first', async () => {
      const now = Date.now();

      const c1 = commentRepo.create({
        postId: savedPost.id,
        content: 'First comment',
      });
      c1.createdAt = new Date(now);
      await commentRepo.save(c1);

      const c2 = commentRepo.create({
        postId: savedPost.id,
        content: 'Second comment',
      });
      c2.createdAt = new Date(now + 1000);
      await commentRepo.save(c2);

      const res = await request(app.getHttpServer() as object)
        .get(`/api/posts/${savedPost.id}/comments`)
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(2);
      expect(body[0].content).toBe('First comment');
      expect(body[1].content).toBe('Second comment');
    });

    it('should include reactions grouped by emoji for each comment', async () => {
      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'A comment',
      });
      const savedComment = await commentRepo.save(comment);

      await reactionRepo.save(
        reactionRepo.create({
          reactableType: 'comment',
          reactableId: savedComment.id,
          emoji: '👍',
        }),
      );
      await reactionRepo.save(
        reactionRepo.create({
          reactableType: 'comment',
          reactableId: savedComment.id,
          emoji: '👍',
        }),
      );
      await reactionRepo.save(
        reactionRepo.create({
          reactableType: 'comment',
          reactableId: savedComment.id,
          emoji: '❤️',
        }),
      );

      const res = await request(app.getHttpServer() as object)
        .get(`/api/posts/${savedPost.id}/comments`)
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(1);
      expect(body[0].reactions).toEqual([
        { emoji: '👍', count: 2 },
        { emoji: '❤️', count: 1 },
      ]);
    });

    it('should return empty array when post has no comments', async () => {
      const res = await request(app.getHttpServer() as object)
        .get(`/api/posts/${savedPost.id}/comments`)
        .expect(200);

      const body = res.body as unknown[];
      expect(body).toHaveLength(0);
    });

    it('should exclude soft-deleted comments', async () => {
      const c1 = commentRepo.create({
        postId: savedPost.id,
        content: 'Active comment',
      });
      await commentRepo.save(c1);

      const c2 = commentRepo.create({
        postId: savedPost.id,
        content: 'Deleted comment',
      });
      const savedC2 = await commentRepo.save(c2);
      await commentRepo.softRemove(savedC2);

      const res = await request(app.getHttpServer() as object)
        .get(`/api/posts/${savedPost.id}/comments`)
        .expect(200);

      const body = res.body as Record<string, unknown>[];
      expect(body).toHaveLength(1);
      expect(body[0].content).toBe('Active comment');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .get('/api/posts/nonexistent/comments')
        .expect(404);
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update an existing comment', async () => {
      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'Original',
      });
      const savedComment = await commentRepo.save(comment);

      const res = await request(app.getHttpServer() as object)
        .put(`/api/comments/${savedComment.id}`)
        .send({ content: 'Updated content' })
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.content).toBe('Updated content');

      const dbComment = await commentRepo.findOne({
        where: { id: savedComment.id },
      });
      expect(dbComment!.content).toBe('Updated content');
    });

    it('should return 404 for non-existent comment', async () => {
      await request(app.getHttpServer() as object)
        .put('/api/comments/nonexistent')
        .send({ content: 'Updated' })
        .expect(404);
    });

    it('should reject empty content', async () => {
      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'Original',
      });
      const savedComment = await commentRepo.save(comment);

      await request(app.getHttpServer() as object)
        .put(`/api/comments/${savedComment.id}`)
        .send({ content: '' })
        .expect(400);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should soft delete a comment and return 204', async () => {
      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'To be deleted',
      });
      const savedComment = await commentRepo.save(comment);

      await request(app.getHttpServer() as object)
        .delete(`/api/comments/${savedComment.id}`)
        .expect(204);

      const dbComment = await commentRepo.findOne({
        where: { id: savedComment.id },
      });
      expect(dbComment).toBeNull();

      const trashedComment = await commentRepo.findOne({
        where: { id: savedComment.id },
        withDeleted: true,
      });
      expect(trashedComment).not.toBeNull();
      expect(trashedComment!.deletedAt).not.toBeNull();
    });

    it('should return 404 for non-existent comment', async () => {
      await request(app.getHttpServer() as object)
        .delete('/api/comments/nonexistent')
        .expect(404);
    });
  });
});
