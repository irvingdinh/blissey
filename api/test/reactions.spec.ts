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
import { ReactionModule } from '../src/reaction/reaction.module';

describe('Reactions API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let postRepo: Repository<PostEntity>;
  let commentRepo: Repository<CommentEntity>;
  let reactionRepo: Repository<ReactionEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ReactionModule, CommentModule, CoreModule],
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
  let savedComment: CommentEntity;

  beforeEach(async () => {
    const post = postRepo.create({ content: '{"blocks":[]}' });
    savedPost = await postRepo.save(post);

    const comment = commentRepo.create({
      postId: savedPost.id,
      content: '{"blocks":[]}',
    });
    savedComment = await commentRepo.save(comment);
  });

  describe('POST /api/reactions', () => {
    it('should add a reaction to a post', async () => {
      const res = await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'post',
          reactableId: savedPost.id,
          emoji: '👍',
        })
        .expect(201);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBeDefined();
      expect(body.reactableType).toBe('post');
      expect(body.reactableId).toBe(savedPost.id);
      expect(body.emoji).toBe('👍');
      expect(body.createdAt).toBeDefined();
    });

    it('should add a reaction to a comment', async () => {
      const res = await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'comment',
          reactableId: savedComment.id,
          emoji: '❤️',
        })
        .expect(201);

      const body = res.body as Record<string, unknown>;
      expect(body.id).toBeDefined();
      expect(body.reactableType).toBe('comment');
      expect(body.reactableId).toBe(savedComment.id);
      expect(body.emoji).toBe('❤️');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'post',
          reactableId: 'nonexistent',
          emoji: '👍',
        })
        .expect(404);
    });

    it('should return 404 for non-existent comment', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'comment',
          reactableId: 'nonexistent',
          emoji: '👍',
        })
        .expect(404);
    });

    it('should reject invalid reactable type', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'invalid',
          reactableId: savedPost.id,
          emoji: '👍',
        })
        .expect(400);
    });

    it('should reject missing fields', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({})
        .expect(400);
    });

    it('should reject empty emoji', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'post',
          reactableId: savedPost.id,
          emoji: '',
        })
        .expect(400);
    });

    it('should allow multiple reactions on the same entity', async () => {
      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'post',
          reactableId: savedPost.id,
          emoji: '👍',
        })
        .expect(201);

      await request(app.getHttpServer() as object)
        .post('/api/reactions')
        .send({
          reactableType: 'post',
          reactableId: savedPost.id,
          emoji: '❤️',
        })
        .expect(201);

      const reactions = await reactionRepo.find({
        where: { reactableType: 'post', reactableId: savedPost.id },
      });
      expect(reactions).toHaveLength(2);
    });
  });

  describe('DELETE /api/reactions/:id', () => {
    it('should remove a reaction and return 204', async () => {
      const reaction = reactionRepo.create({
        reactableType: 'post',
        reactableId: savedPost.id,
        emoji: '👍',
      });
      const savedReaction = await reactionRepo.save(reaction);

      await request(app.getHttpServer() as object)
        .delete(`/api/reactions/${savedReaction.id}`)
        .expect(204);

      const dbReaction = await reactionRepo.findOne({
        where: { id: savedReaction.id },
      });
      expect(dbReaction).toBeNull();
    });

    it('should return 404 for non-existent reaction', async () => {
      await request(app.getHttpServer() as object)
        .delete('/api/reactions/nonexistent')
        .expect(404);
    });
  });

  describe('Grouped emoji counts in post/comment responses', () => {
    it('should show grouped reactions in comment list', async () => {
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
        expect.objectContaining({ emoji: '👍', count: 2 }),
        expect.objectContaining({ emoji: '❤️', count: 1 }),
      ]);
    });
  });
});
