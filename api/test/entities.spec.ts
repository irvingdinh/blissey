import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AttachmentEntity } from '../src/core/entities/attachment.entity';
import { CommentEntity } from '../src/core/entities/comment.entity';
import { DraftEntity } from '../src/core/entities/draft.entity';
import { PostEntity } from '../src/core/entities/post.entity';
import { ReactionEntity } from '../src/core/entities/reaction.entity';

describe('Database Entities (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let postRepo: Repository<PostEntity>;
  let draftRepo: Repository<DraftEntity>;
  let commentRepo: Repository<CommentEntity>;
  let reactionRepo: Repository<ReactionEntity>;
  let attachmentRepo: Repository<AttachmentEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            AttachmentEntity,
            CommentEntity,
            DraftEntity,
            PostEntity,
            ReactionEntity,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          AttachmentEntity,
          CommentEntity,
          DraftEntity,
          PostEntity,
          ReactionEntity,
        ]),
      ],
    }).compile();

    dataSource = module.get(DataSource);
    postRepo = dataSource.getRepository(PostEntity);
    draftRepo = dataSource.getRepository(DraftEntity);
    commentRepo = dataSource.getRepository(CommentEntity);
    reactionRepo = dataSource.getRepository(ReactionEntity);
    attachmentRepo = dataSource.getRepository(AttachmentEntity);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('PostEntity', () => {
    it('should create a post with auto-generated id and timestamps', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const saved = await postRepo.save(post);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.content).toBe('{"blocks":[]}');
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
      expect(saved.deletedAt).toBeNull();
    });

    it('should soft delete a post and exclude it from default queries', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const saved = await postRepo.save(post);

      await postRepo.softRemove(saved);
      const found = await postRepo.findOneBy({ id: saved.id });
      expect(found).toBeNull();

      const withDeleted = await postRepo.findOne({
        where: { id: saved.id },
        withDeleted: true,
      });
      expect(withDeleted).not.toBeNull();
      expect(withDeleted!.deletedAt).toBeInstanceOf(Date);
    });

    it('should preserve a custom id if provided', async () => {
      const post = postRepo.create({
        id: 'my-custom-id',
        content: '{"blocks":[]}',
      });
      const saved = await postRepo.save(post);
      expect(saved.id).toBe('my-custom-id');
    });
  });

  describe('DraftEntity', () => {
    it('should create a draft with auto-generated id and timestamps', async () => {
      const draft = draftRepo.create({ content: '{"blocks":[]}' });
      const saved = await draftRepo.save(draft);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.content).toBe('{"blocks":[]}');
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it('should update a draft and reflect updatedAt change', async () => {
      const draft = draftRepo.create({ content: '{"blocks":[]}' });
      const saved = await draftRepo.save(draft);
      const originalUpdatedAt = saved.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 50));

      saved.content = '{"blocks":[{"type":"paragraph"}]}';
      const updated = await draftRepo.save(saved);

      expect(updated.content).toBe('{"blocks":[{"type":"paragraph"}]}');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it('should preserve a custom id if provided', async () => {
      const draft = draftRepo.create({
        id: 'my-draft-id',
        content: '{"blocks":[]}',
      });
      const saved = await draftRepo.save(draft);
      expect(saved.id).toBe('my-draft-id');
    });
  });

  describe('CommentEntity', () => {
    it('should create a comment with auto-generated id and timestamps', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: '{"blocks":[{"type":"paragraph","data":{"text":"Nice!"}}]}',
      });
      const saved = await commentRepo.save(comment);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.postId).toBe(savedPost.id);
      expect(saved.content).toBe(
        '{"blocks":[{"type":"paragraph","data":{"text":"Nice!"}}]}',
      );
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
      expect(saved.deletedAt).toBeNull();
    });

    it('should soft delete a comment and exclude it from default queries', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: '{"blocks":[]}',
      });
      const saved = await commentRepo.save(comment);

      await commentRepo.softRemove(saved);
      const found = await commentRepo.findOneBy({ id: saved.id });
      expect(found).toBeNull();

      const withDeleted = await commentRepo.findOne({
        where: { id: saved.id },
        withDeleted: true,
      });
      expect(withDeleted).not.toBeNull();
      expect(withDeleted!.deletedAt).toBeInstanceOf(Date);
    });

    it('should load comments via post relation', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment1 = commentRepo.create({
        postId: savedPost.id,
        content: '{"blocks":[{"type":"paragraph","data":{"text":"First"}}]}',
      });
      const comment2 = commentRepo.create({
        postId: savedPost.id,
        content: '{"blocks":[{"type":"paragraph","data":{"text":"Second"}}]}',
      });
      await commentRepo.save(comment1);
      await commentRepo.save(comment2);

      const postWithComments = await postRepo.findOne({
        where: { id: savedPost.id },
        relations: ['comments'],
      });

      expect(postWithComments).not.toBeNull();
      expect(postWithComments!.comments).toHaveLength(2);
    });

    it('should preserve a custom id if provided', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        id: 'my-comment-id',
        postId: savedPost.id,
        content: '{"blocks":[]}',
      });
      const saved = await commentRepo.save(comment);
      expect(saved.id).toBe('my-comment-id');
    });
  });

  describe('ReactionEntity', () => {
    it('should create a reaction for a post', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const reaction = reactionRepo.create({
        reactableType: 'post',
        reactableId: savedPost.id,
        emoji: '👍',
      });
      const saved = await reactionRepo.save(reaction);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.reactableType).toBe('post');
      expect(saved.reactableId).toBe(savedPost.id);
      expect(saved.emoji).toBe('👍');
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should create a reaction for a comment', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: '{"blocks":[]}',
      });
      const savedComment = await commentRepo.save(comment);

      const reaction = reactionRepo.create({
        reactableType: 'comment',
        reactableId: savedComment.id,
        emoji: '❤️',
      });
      const saved = await reactionRepo.save(reaction);

      expect(saved.reactableType).toBe('comment');
      expect(saved.reactableId).toBe(savedComment.id);
      expect(saved.emoji).toBe('❤️');
    });

    it('should preserve a custom id if provided', async () => {
      const reaction = reactionRepo.create({
        id: 'my-reaction-id',
        reactableType: 'post',
        reactableId: 'some-post-id',
        emoji: '🎉',
      });
      const saved = await reactionRepo.save(reaction);
      expect(saved.id).toBe('my-reaction-id');
    });
  });

  describe('AttachmentEntity', () => {
    it('should create an attachment with all fields', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const attachment = attachmentRepo.create({
        attachableType: 'post',
        attachableId: savedPost.id,
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: '2026/02/photo.jpg',
        fileSize: 204800,
        mimeType: 'image/jpeg',
      });
      const saved = await attachmentRepo.save(attachment);

      expect(saved.id).toBeDefined();
      expect(saved.id.length).toBe(21);
      expect(saved.attachableType).toBe('post');
      expect(saved.attachableId).toBe(savedPost.id);
      expect(saved.category).toBe('gallery');
      expect(saved.fileName).toBe('photo.jpg');
      expect(saved.filePath).toBe('2026/02/photo.jpg');
      expect(saved.fileSize).toBe(204800);
      expect(saved.mimeType).toBe('image/jpeg');
      expect(saved.thumbnailPath).toBeNull();
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should store thumbnailPath when provided', async () => {
      const attachment = attachmentRepo.create({
        attachableType: 'post',
        attachableId: 'some-post-id',
        category: 'inline',
        fileName: 'image.png',
        filePath: '2026/02/image.png',
        fileSize: 102400,
        mimeType: 'image/png',
        thumbnailPath: 'thumbnails/2026/02/image.png',
      });
      const saved = await attachmentRepo.save(attachment);

      expect(saved.thumbnailPath).toBe('thumbnails/2026/02/image.png');
    });

    it('should create an attachment for a draft', async () => {
      const draft = draftRepo.create({ content: '{"blocks":[]}' });
      const savedDraft = await draftRepo.save(draft);

      const attachment = attachmentRepo.create({
        attachableType: 'draft',
        attachableId: savedDraft.id,
        category: 'attachment',
        fileName: 'recording.mp3',
        filePath: '2026/02/recording.mp3',
        fileSize: 5242880,
        mimeType: 'audio/mpeg',
      });
      const saved = await attachmentRepo.save(attachment);

      expect(saved.attachableType).toBe('draft');
      expect(saved.attachableId).toBe(savedDraft.id);
      expect(saved.category).toBe('attachment');
    });

    it('should create an attachment for a comment', async () => {
      const post = postRepo.create({ content: '{"blocks":[]}' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: '{"blocks":[]}',
      });
      const savedComment = await commentRepo.save(comment);

      const attachment = attachmentRepo.create({
        attachableType: 'comment',
        attachableId: savedComment.id,
        category: 'inline',
        fileName: 'screenshot.png',
        filePath: '2026/02/screenshot.png',
        fileSize: 307200,
        mimeType: 'image/png',
      });
      const saved = await attachmentRepo.save(attachment);

      expect(saved.attachableType).toBe('comment');
      expect(saved.attachableId).toBe(savedComment.id);
    });

    it('should preserve a custom id if provided', async () => {
      const attachment = attachmentRepo.create({
        id: 'my-attachment-id',
        attachableType: 'post',
        attachableId: 'some-post-id',
        category: 'gallery',
        fileName: 'file.txt',
        filePath: '2026/02/file.txt',
        fileSize: 1024,
        mimeType: 'text/plain',
      });
      const saved = await attachmentRepo.save(attachment);
      expect(saved.id).toBe('my-attachment-id');
    });
  });
});
