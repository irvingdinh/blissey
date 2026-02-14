import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CoreModule } from '../src/core/core.module';
import { AttachmentEntity } from '../src/core/entities/attachment.entity';
import { CommentEntity } from '../src/core/entities/comment.entity';
import { DraftEntity } from '../src/core/entities/draft.entity';
import { PostEntity } from '../src/core/entities/post.entity';
import { ReactionEntity } from '../src/core/entities/reaction.entity';
import { SettingEntity } from '../src/core/entities/setting.entity';
import { CleanupService } from '../src/core/services/cleanup.service';

describe('Cleanup (e2e)', () => {
  let module: TestingModule;
  let cleanupService: CleanupService;
  let dataSource: DataSource;
  let draftRepo: Repository<DraftEntity>;
  let postRepo: Repository<PostEntity>;
  let commentRepo: Repository<CommentEntity>;
  let reactionRepo: Repository<ReactionEntity>;
  let attachmentRepo: Repository<AttachmentEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [CoreModule],
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

    dataSource = module.get(DataSource);
    cleanupService = module.get(CleanupService);
    draftRepo = dataSource.getRepository(DraftEntity);
    postRepo = dataSource.getRepository(PostEntity);
    commentRepo = dataSource.getRepository(CommentEntity);
    reactionRepo = dataSource.getRepository(ReactionEntity);
    attachmentRepo = dataSource.getRepository(AttachmentEntity);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await reactionRepo.clear();
    await attachmentRepo.clear();
    await commentRepo.clear();
    await draftRepo.clear();
    await postRepo.query('DELETE FROM posts');
  });

  describe('cleanupDrafts', () => {
    it('should remove drafts older than 3 days', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const oldDraft = draftRepo.create({ content: 'Old draft' });
      await draftRepo.save(oldDraft);
      await draftRepo.query(`UPDATE drafts SET updatedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        oldDraft.id,
      ]);

      const recentDraft = draftRepo.create({ content: 'Recent draft' });
      await draftRepo.save(recentDraft);

      const result = await cleanupService.cleanupDrafts();

      expect(result).toBe(1);
      const remaining = await draftRepo.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].content).toBe('Recent draft');
    });

    it('should delete attachments linked to old drafts', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const oldDraft = draftRepo.create({ content: 'Old draft' });
      await draftRepo.save(oldDraft);
      await draftRepo.query(`UPDATE drafts SET updatedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        oldDraft.id,
      ]);

      const attachment = attachmentRepo.create({
        attachableType: 'draft',
        attachableId: oldDraft.id,
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'nonexistent.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(attachment);

      await cleanupService.cleanupDrafts();

      const remainingAttachments = await attachmentRepo.find();
      expect(remainingAttachments).toHaveLength(0);
    });

    it('should return 0 when no old drafts exist', async () => {
      const recentDraft = draftRepo.create({ content: 'Recent draft' });
      await draftRepo.save(recentDraft);

      const result = await cleanupService.cleanupDrafts();

      expect(result).toBe(0);
      const remaining = await draftRepo.find();
      expect(remaining).toHaveLength(1);
    });

    it('should not delete attachments linked to recent drafts', async () => {
      const recentDraft = draftRepo.create({ content: 'Recent draft' });
      await draftRepo.save(recentDraft);

      const attachment = attachmentRepo.create({
        attachableType: 'draft',
        attachableId: recentDraft.id,
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'recent.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(attachment);

      await cleanupService.cleanupDrafts();

      const remainingAttachments = await attachmentRepo.find();
      expect(remainingAttachments).toHaveLength(1);
    });
  });

  describe('cleanupTrashedPosts', () => {
    it('should hard delete posts trashed more than 3 days ago', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const oldPost = postRepo.create({ content: 'Old trashed post' });
      const savedOldPost = await postRepo.save(oldPost);
      await postRepo.softRemove(savedOldPost);
      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        savedOldPost.id,
      ]);

      const recentPost = postRepo.create({ content: 'Recently trashed post' });
      const savedRecentPost = await postRepo.save(recentPost);
      await postRepo.softRemove(savedRecentPost);

      const result = await cleanupService.cleanupTrashedPosts();

      expect(result).toBe(1);
      const allPosts = await postRepo.find({ withDeleted: true });
      expect(allPosts).toHaveLength(1);
      expect(allPosts[0].content).toBe('Recently trashed post');
    });

    it('should cascade delete comments of trashed posts', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const post = postRepo.create({ content: 'Trashed post' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'A comment',
      });
      await commentRepo.save(comment);

      await postRepo.softRemove(savedPost);
      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        savedPost.id,
      ]);

      await cleanupService.cleanupTrashedPosts();

      const remainingComments = await commentRepo.find({ withDeleted: true });
      expect(remainingComments).toHaveLength(0);
    });

    it('should cascade delete reactions of trashed posts and their comments', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const post = postRepo.create({ content: 'Trashed post' });
      const savedPost = await postRepo.save(post);

      const comment = commentRepo.create({
        postId: savedPost.id,
        content: 'A comment',
      });
      const savedComment = await commentRepo.save(comment);

      const postReaction = reactionRepo.create({
        reactableType: 'post',
        reactableId: savedPost.id,
        emoji: '👍',
      });
      await reactionRepo.save(postReaction);

      const commentReaction = reactionRepo.create({
        reactableType: 'comment',
        reactableId: savedComment.id,
        emoji: '❤️',
      });
      await reactionRepo.save(commentReaction);

      await postRepo.softRemove(savedPost);
      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        savedPost.id,
      ]);

      await cleanupService.cleanupTrashedPosts();

      const remainingReactions = await reactionRepo.find();
      expect(remainingReactions).toHaveLength(0);
    });

    it('should cascade delete attachments of trashed posts', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const post = postRepo.create({ content: 'Trashed post' });
      const savedPost = await postRepo.save(post);

      const attachment = attachmentRepo.create({
        attachableType: 'post',
        attachableId: savedPost.id,
        category: 'gallery',
        fileName: 'photo.jpg',
        filePath: 'nonexistent.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      await attachmentRepo.save(attachment);

      await postRepo.softRemove(savedPost);
      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        savedPost.id,
      ]);

      await cleanupService.cleanupTrashedPosts();

      const remainingAttachments = await attachmentRepo.find();
      expect(remainingAttachments).toHaveLength(0);
    });

    it('should return 0 when no posts are trashed beyond 3 days', async () => {
      const post = postRepo.create({ content: 'Active post' });
      await postRepo.save(post);

      const result = await cleanupService.cleanupTrashedPosts();

      expect(result).toBe(0);
    });

    it('should not delete recently trashed posts', async () => {
      const recentPost = postRepo.create({
        content: 'Recently trashed post',
      });
      const savedRecentPost = await postRepo.save(recentPost);
      await postRepo.softRemove(savedRecentPost);

      const result = await cleanupService.cleanupTrashedPosts();

      expect(result).toBe(0);
      const allPosts = await postRepo.find({ withDeleted: true });
      expect(allPosts).toHaveLength(1);
    });

    it('should not affect active (non-trashed) posts', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const activePost = postRepo.create({ content: 'Active post' });
      await postRepo.save(activePost);

      const trashedPost = postRepo.create({ content: 'Old trashed post' });
      const savedTrashedPost = await postRepo.save(trashedPost);
      await postRepo.softRemove(savedTrashedPost);
      await postRepo.query(`UPDATE posts SET deletedAt = ? WHERE id = ?`, [
        fourDaysAgo.toISOString(),
        savedTrashedPost.id,
      ]);

      await cleanupService.cleanupTrashedPosts();

      const remaining = await postRepo.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].content).toBe('Active post');
    });
  });
});
